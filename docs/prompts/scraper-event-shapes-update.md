# Claude Code Prompt — Scraper Event-Shapes Update

**Target repo:** `happenlist_scraper`
**Context doc (read first):** `happenlist/docs/phase-reports/event-shapes-cleanup-plan.md` and `happenlist/CLAUDE.md` "Event Shapes — Canonical Model" section.

Paste the prompt below into Claude Code when you're cd'd into the `happenlist_scraper` repo.

---

## Prompt to paste

```
We've overhauled the event shape model on the Happenlist side. The scraper needs
to match. Before writing code, read these in full:

1. /Users/hazelquimpo/HQ Files/Apps/happenlist/CLAUDE.md — the "Event Shapes —
   Canonical Model" section
2. /Users/hazelquimpo/HQ Files/Apps/happenlist/docs/event-shapes-onepager.md
3. /Users/hazelquimpo/HQ Files/Apps/happenlist/docs/phase-reports/event-shapes-cleanup-plan.md

THE NEW MODEL IN ONE PARAGRAPH
==============================
Events are one of three shapes: Single, Recurring, Collection. "Ongoing" is NOT
a separate shape — it's a Single with a wide date range plus a weekly `hours`
JSONB field. `series_type` is no longer a structural switch; it's a display
label only, and we're narrowing the enum to just `recurring`, `class`,
`workshop`. Everything that was `lifestyle` / `ongoing` / `exhibit` / `camp` /
`season` / `annual` / `festival` gets reclassified.

WHAT TO CHANGE IN THIS REPO
===========================

1. backend/lib/vocabularies.js
   - Narrow any `series_type` / `event_type` vocab that currently allows
     'lifestyle', 'ongoing', 'exhibit', 'camp', 'season', 'annual', 'festival'.
     Drop those values. Keep only: 'recurring', 'class', 'workshop'.
   - Add a new `hours` shape documented in a comment: weekly JSONB of the form
     { mon: [[open,close], ...], tue: [[open,close]], ... } with 24-hour HH:MM
     times.
   - Header comment: "MIRROR OF: happenlist/src/lib/constants/vocabularies.ts —
     keep byte-synced."

2. backend/services/text-extraction.js
   - The analyze prompt should emit a `shape` field: 'single' | 'recurring' |
     'collection'.
   - When it detects always-on semantics (exhibit, happy hour, daily specials,
     "open Tue–Sat 5–7pm" language), emit shape='single' with an `hours` JSONB
     and a wide `end_date`, NOT shape='recurring' with multiple instances.
   - When it detects a festival umbrella with a program of distinct sub-events,
     emit shape='collection' with a `children` array; each child is its own
     event payload with its own date/venue/title.
   - Default shape='single'.

3. backend/routes/analyze-text.js, analyze-url.js, recheck.js
   - Thread the `shape`, `hours`, and `children` fields through the response
     JSON. Don't drop them.

4. backend/routes/parse-recurrence.js
   - Unchanged in output shape (still emits recurrence_rule JSONB), but the
     documented return contract should note this rule only makes sense when
     the event's shape is 'recurring'.

5. Any post-processing that auto-assigns series_type:
   - Only assign series_type when shape='recurring'. For shape='single', leave
     series_type null. For shape='collection', leave series_type null on both
     parent and children (the parent/child linkage IS the structural signal,
     not series_type).

6. Write a short README note in backend/ explaining the three shapes + the
   mirror rule. Link back to the Happenlist CLAUDE.md section by file path.

CODE QUALITY CONSTRAINTS
========================
- One source of truth. Add a `backend/lib/event-shapes.js` module exporting
  the shape constants, the hours schema validator, and a `classifyShape(payload)`
  helper. Everything else imports from there — don't inline strings.
- Per-file cap: 200 lines. If text-extraction.js is near that, split now.
- File headers: purpose + cross-file coupling notes + "mirror rule" link where
  relevant.
- No silent failures. Log with the existing [scope:action] convention:
  [shape-classify:detected] shape=single hours-keys=5
  [shape-classify:fallback] no signals, defaulting to single
- Don't add hours parsing regex sprawl. Put one parser in event-shapes.js and
  reuse it.

DO NOT CHANGE
=============
- The actual scrape / fetch pipeline (puppeteer, url-context, etc.)
- The auth / API-secret flow
- The Supabase writer (still used by the Chrome extension save path)
- The OpenAI model or prompt structure beyond the shape-emission addition

VALIDATION
==========
After changes:
- Run any existing tests.
- Smoke test /analyze/text with three sample inputs:
  (a) one-off concert description → expect shape=single, no hours
  (b) "Open Tue–Fri 5–7pm through December" → expect shape=single + hours +
      wide end_date
  (c) a festival page with an embedded schedule of acts → expect
      shape=collection + children[] array
- Curl examples should go in the README note.

DELIVERABLE
===========
- The code changes above
- A short migration note at the top of backend/CHANGES.md or similar: "Event
  shapes v2 — effective <today's date>. Callers (happenlist) already expect
  new schema."
- Before committing, review every changed file against the constraints above.
  No TODO comments; no half-finished work.

Don't ask clarifying questions unless something in the Happenlist docs is
ambiguous. If ambiguous, flag it, make a decision, note the decision in your
response.
```

---

## Notes for Hazel

- **Run this only after** the Happenlist-side migration (Phase B+C) has landed. The scraper emits the new schema; if Happenlist isn't ready to consume it, saves will fail validation.
- **The vocabularies.js ↔ vocabularies.ts mirror** is critical. If you diff them after both sides run, they should be byte-identical (minus the comment headers).
- **If the scraper tests a collection** and the happenlist save-event.ts hasn't been updated to handle the `children` array yet, that save will fail. Sequence: Happenlist Phase D first, scraper second.
