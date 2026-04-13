# Phase 1 — Queued Session Prompts

> **OBSOLETE**: Phase 1 is complete. All prompts below were consumed. See `phase-1-report.md` for the final report.

> **What this is**: ready-to-paste prompts for the remaining Phase 1 sessions, written so you can start a fresh Claude session and give it everything it needs in one shot.
>
> **Why**: each session starts with zero conversation context. The prompt below tells Claude exactly which roadmap section to read, which progress notes to check, what to build, and what _not_ to touch.
>
> **Order**: B1 → B2 → B3 → R1. Don't skip ahead. R1 is the gate before Phase 2.
>
> **Before you paste a prompt**, confirm the previous session's checkmark in `phase-1-progress.md` is filled in. If it isn't, the previous session didn't actually finish — go back to it.

---

## B1 — Happenlist query layer extension

**Repo to start in**: `/Users/hazelquimpo/Documents/Apps/happenlist`

```
Starting Session B1 of the Smart Filters Roadmap (Phase 1).

Before doing anything else, read these in order:
1. CLAUDE.md (the Engineering Standards section especially — modular, centralized data, AI-dev comments, [scope:action] logging)
2. docs/filter-roadmap.md — find the "Session B1 — Happenlist query layer extension" section, that's the spec
3. docs/phase-reports/phase-1-progress.md — A1 and A2 are done, this is the briefing for what already shipped

Goal: extend the data layer so the filter UI in B2 has predicates ready to wire up. NO UI WORK in this session — that's B2.

Concrete deliverables:
1. NEW: src/lib/constants/vocabularies.ts
   - Mirror of happenlist_scraper/backend/lib/vocabularies.js (TypeScript export)
   - Header comment must say: "MIRROR OF: happenlist_scraper/backend/lib/vocabularies.js — if you change this, change BOTH"
   - Export VIBE_TAGS, SUBCULTURES, NOISE_LEVELS, GOOD_FOR_TAGS as readonly tuples + their union types
   - Read the source file first to get exact byte-identical values

2. NEW: src/lib/constants/interest-presets.ts
   - Per the roadmap: presets are LABEL → goodFor union (vibe data is now clean too — see A2 progress note — but B1 starts with goodFor only per the roadmap, vibe presets land in B7/Phase 3)
   - Examples to ship: "Crafty & artsy" → ['creatives'], "Foodies" → ['foodies'], "Date night" → ['date_night'], "Solo-friendly" → ['solo_friendly'], "Family chaos" → ['families', 'kids']
   - Each preset is { id, label, description, goodFor: GoodForTag[] }
   - Document what each preset is for in JSDoc — the next session will render these

3. NEW: src/lib/constants/time-of-day.ts
   - Buckets per roadmap: morning (5–11), afternoon (12–16), evening (17–20), late_night (21–25 wrapping)
   - Export both the TimeOfDay enum AND a helper that returns the SQL hour-range predicate string
   - IMPORTANT: events.start_datetime is stored UTC. Use EXTRACT(HOUR FROM start_datetime AT TIME ZONE 'America/Chicago'). Document this in a comment — it is the #1 timezone gotcha and R1 will check for it.

4. EXTEND: src/data/events/get-events.ts
   - Read the existing file FIRST. Note the current EventQueryParams shape, current filter ordering, current logging, current pagination. Don't break what works.
   - Add new params:
     • goodFor: string | string[]      (was just string — keep backward compat — single string still works)
     • timeOfDay: TimeOfDay | TimeOfDay[]
     • interestPreset?: string         (resolves to a goodFor union via interest-presets.ts before query build)
   - Implement the predicates. Multi-value params use ARRAY-overlap operators on Postgres arrays / IN clauses on scalars. Coordinate with how existing params are built.
   - JSDoc on EVERY param in the type. R1 checks that a fresh session could add a param without reading the surrounding code.
   - Logging: at the top of getEvents, after params are normalized, emit a SINGLE structured log line: `[get-events] applied filters: {...}`. Include only filters that are non-default, not the entire params blob.

What NOT to do in B1:
- No filter UI components. Zero. That's B2.
- Don't touch any page/route file. Predicates only.
- Don't add view tracking — that's B3.
- Don't add distance/cost/age filters — those are Phase 2.
- Don't refactor the existing get-events code beyond what's needed to slot in the new params.

Process:
- Use TodoWrite to break the work into the 4 deliverables above + a final "smoke test the new params with a sample query"
- After every file, re-read it to verify it actually compiles in your head (no missing imports, no typos in tuple values)
- Run `npx tsc --noEmit` (or whatever this repo uses — check package.json) before declaring done
- Smoke-test by writing a temporary script or query that calls getEvents with each new param combo and logs the result count. Delete the script when done.

When everything works:
- Append a "Session B1 — shipped" section to docs/phase-reports/phase-1-progress.md following the same structure as A1/A2
- List files touched, what was found and fixed, what was deferred, R1 checklist additions

Constraints I want enforced no matter what:
- Every new file gets an AI-dev header comment
- Centralize EVERYTHING in constants files — never inline a magic string or magic number
- If you're tempted to write the same thing in two files, stop and centralize it first
- Logs use [scope:action] prefix
- Files stay under 200 lines

Go.
```

---

## B2 — Filter v1 UI + Past Instances

**Repo to start in**: `/Users/hazelquimpo/Documents/Apps/happenlist`

```
Starting Session B2 of the Smart Filters Roadmap (Phase 1).

Read in order before doing anything:
1. CLAUDE.md — Engineering Standards + Design System sections (this session is UI-heavy, design tokens matter)
2. docs/filter-roadmap.md — "Session B2 — Filter v1 UI + Past Instances"
3. docs/phase-reports/phase-1-progress.md — confirm A1, A2, and B1 are all marked shipped. If B1 isn't done, STOP and tell me.
4. The existing src/data/events/get-events.ts (B1 added the query params you'll be wiring up — read carefully so the UI matches)
5. src/components/events/event-card.tsx and any other existing events components — match the design language exactly, don't invent new patterns

Goal: ship the Filter v1 UI on /events using the predicates B1 built. ALL UI / ZERO new query work.

Concrete deliverables (per roadmap):
1. src/components/events/filters/FilterBar.tsx (NEW) — persistent top bar
2. src/components/events/filters/FilterDrawer.tsx (NEW) — expandable advanced drawer; bottom sheet on mobile
3. src/components/events/filters/FilterChip.tsx (NEW) — single chip primitive, used by both bar and drawer
4. src/components/events/filters/FilterSection.tsx (NEW) — labeled grouping inside the drawer
5. src/components/events/filters/EmptyFilterState.tsx (NEW) — shown when filters return zero events, with "remove this filter" suggestions
6. src/components/series/PastInstances.tsx (NEW) — queries past siblings of current series
7. src/app/events/page.tsx — wire FilterBar + FilterDrawer in, hand off URL state to getEvents
8. src/app/event/[slug]/page.tsx — mount PastInstances when series_id is set

Hard requirements:
- URL state via Next.js searchParams. Filters must be shareable via URL, back button must work, refresh must preserve state.
- Mobile = bottom sheet drawer with sticky Apply button. Desktop = side drawer or inline expand.
- EVERY component <200 lines. If one is bigger, split it.
- Use the design tokens from CLAUDE.md — blue for selected, mist for borders, ink for text, etc. Do NOT introduce new colors.
- Plus Jakarta Sans only (font-body class — already wired up globally).
- Every filter state change updates the URL via router.replace (not router.push — don't pollute history).
- Loading state while filters are being applied — don't flash an empty list.
- Empty state when filters return 0 results: list which filters are active and offer to remove each one individually.

What NOT to do:
- Don't add new query params to getEvents — only use what B1 shipped (goodFor, timeOfDay, interestPreset, plus existing ones)
- Don't add distance / cost tier / age group / vibe tag filters — those are Phase 2 and 3
- Don't add view tracking — B3

Past Instances (the smaller half of B2):
- Reads from `series` table, finds events with same series_id and instance_date < CURRENT_DATE
- Shows up to 5 most recent, each linkable
- Hidden if there are zero past instances OR if the series only has 1 event total
- Lives below the description on event detail pages
- Read CLAUDE.md "Recurring Event Collapsing (Series)" section — past instances is the inverse of that feature (showing the collapsed history instead of the next upcoming)

Process:
- TodoWrite: one todo per component file + one for wiring + one for past instances + one for verification
- After EVERY edit to a previewable file, follow the verification workflow per the system instructions (preview_start, take a snapshot, test interactions, screenshot the result)
- Test mobile via preview_resize at 375px
- Test the empty state by applying filters that return zero results
- Test the back button after applying filters
- Test URL share by copying the URL with filters applied and re-opening it

When done:
- Append "Session B2 — shipped" to docs/phase-reports/phase-1-progress.md
- Include screenshots-described (since you can't paste images into markdown easily, describe what each looks like)
- R1 checklist additions

Go.
```

---

## B3 — View tracking

**Repo to start in**: `/Users/hazelquimpo/Documents/Apps/happenlist`

```
Starting Session B3 of the Smart Filters Roadmap (Phase 1).

Read in order:
1. CLAUDE.md — Engineering Standards
2. docs/filter-roadmap.md — "Session B3 — View tracking"
3. docs/phase-reports/phase-1-progress.md — confirm A1, A2, B1, B2 are all shipped. If any aren't, STOP and tell me.
4. Existing supabase migrations under supabase/migrations/ — match the naming convention (timestamp prefix per CLAUDE.md)

Goal: ship view tracking infrastructure so Phase 3's trending sort has data when it lands. The feature ships UNUSED for ~4 weeks. Document that loud and clear.

Concrete deliverables (per roadmap):
1. NEW migration: supabase/migrations/YYYYMMDD_HHMM_event_views.sql
   - Table: event_views (id bigserial pk, event_id uuid fk → events on delete cascade, viewed_at timestamptz default now(), session_id text not null, user_id uuid nullable, view_date date generated always as ((viewed_at AT TIME ZONE 'America/Chicago')::date) stored)
   - Unique index: (event_id, session_id, view_date) — one view per session per event per day, idempotent
   - Index: (event_id, viewed_at DESC)
   - Header comment explaining the table is for Phase 3 trending sort, accumulating data unused for ~4 weeks
   - RLS: insert allowed for everyone (public app), select restricted to admin role
   - Postgres function: record_event_view(p_event_id uuid, p_session_id text, p_user_id uuid default null) — does the INSERT ... ON CONFLICT DO NOTHING — returns boolean (true if inserted, false if duplicate)

2. NEW: src/data/events/record-view.ts
   - Server action wrapping the function call
   - Logs: [event-views] inserted view event=<id> session=<short> OR [event-views] duplicate (skipped)
   - Catches and logs errors but never throws — view tracking failure must NEVER break the page

3. NEW: src/components/events/ViewTracker.tsx
   - Client component, no visible output
   - On mount: read or generate session_id from a cookie (httpOnly false, sameSite lax, 1 year expiry, name 'hl_sid')
   - Call recordView server action with event_id + session_id
   - Mounts once per event detail page render
   - Header comment: this component is the ONLY place view tracking happens; if you add new event detail surfaces, mount this there too

4. EXTEND: src/app/event/[slug]/page.tsx
   - Mount <ViewTracker eventId={...} /> at the top of the page (or wherever — doesn't matter, it's invisible)
   - Make sure it mounts on BOTH the parent and child event variants if they're different code paths

5. NEW: src/app/admin/views/page.tsx
   - Server component, admin-only (use existing admin auth pattern — read src/app/admin/page.tsx first)
   - Shows: total event_views row count, rows in last 24h, rows in last 7d, top 10 event ids by view count last 7d
   - No styling beyond existing admin pattern. This is a sanity dashboard, not a feature.

Hard requirements:
- Migration applied to remote DB at end of session via the supabase mcp tool. NEVER ship a migration that isn't applied — that's a R1 gotcha and I will check.
- View tracking must be IDEMPOTENT per (event, session, day). If a user refreshes 50 times in a day, that's 1 view, not 50. The unique index enforces this; the function relies on it.
- View tracking must NEVER block render. If the server action errors, log it and move on.
- session_id format: 'sess_' + 16 random hex chars from crypto.randomUUID() compressed
- Cookie persistence verified across page navigations during testing

What NOT to do:
- No trending sort yet — that's Phase 3 / Session B8. View tracking accumulates data; it doesn't yet read it.
- No analytics dashboard beyond the bare /admin/views row count
- No popularity boost in get-events.ts yet
- No feature flag — just ship it

Process:
- TodoWrite for the 5 deliverables + verification step
- Verify the migration applies cleanly (use a dry run via execute_sql against a SELECT before apply_migration)
- After applying, INSERT a test row manually via execute_sql, then SELECT to confirm the row landed and the unique index works (try to insert a duplicate, confirm it's silently skipped)
- Verify ViewTracker actually fires by loading an event page in preview, then querying event_views and seeing the row appear
- Verify duplicate suppression by reloading the same page and seeing no new row

When done:
- Append "Session B3 — shipped" to docs/phase-reports/phase-1-progress.md
- Note the data-baking timeline: "View tracking is now collecting. Re-check row count at start of Phase 3 — pre-flight target is >1000 rows across >50 events."
- R1 additions

Go.
```

---

## R1 — Phase 1 Review & Harden

**Repos**: both
**Deliverable**: `docs/phase-reports/phase-1-report.md` (NEW, compiled from `phase-1-progress.md`)

```
Starting Session R1 of the Smart Filters Roadmap — Phase 1 Review & Harden.

Read in order:
1. CLAUDE.md — the "Phase review ritual" section is your job description for this session
2. docs/filter-roadmap.md — "Session R1 — Phase 1 Review & Harden" has the full checklist
3. docs/phase-reports/phase-1-progress.md — read this END TO END. It's the audit trail for everything that shipped in A1, A2, B1, B2, B3. Each session also added items to "Session R1 checklist additions" — those are the gotchas you specifically need to verify.

Goal: harden everything Phase 1 shipped, find what's broken, fix it, and produce docs/phase-reports/phase-1-report.md as the final review artifact + briefing for Phase 2.

This session is NOT for shipping new features. It's for making the existing ones not embarrassing.

Process — work through these passes in order, do not skip:

PASS 1 — Bug hunt
Re-read every file changed in A1, A2, B1, B2, B3 (the progress log lists them). For each file, look for:
- Type errors, NULL handling gaps, off-by-ones
- Wrong defaults, broken imports, mismatched signatures
- Dead branches, race conditions
- Tests/build status (run `npx tsc --noEmit` and the project's lint command)

PASS 2 — Connection audit
Verify everything new is wired end-to-end:
- New constants imported where needed?
- New EventQueryParams reaching the UI?
- Filter URL params parsing back into the data layer?
- ViewTracker mounted on every event detail surface (parent, child, lifestyle, etc.)?
- Migrations applied to remote DB? (use list_migrations via supabase mcp)
- vocabularies.js and vocabularies.ts byte-identical (modulo TS syntax)?

PASS 3 — Conflict check
- Duplicate utilities, two sources of truth, conflicting Tailwind classes
- Type drift between scraper and Happenlist
- Inconsistent naming (good_for vs goodFor vs goodForTags)

PASS 4 — Gotcha brainstorm
Walk through every item in the roadmap's R1 checklist + every "Session R1 checklist additions" entry across the progress log. Test each one. The roadmap lists these explicitly:
- Time-of-day timezone (DB UTC, events Chicago)
- URL encoding of multi-value params with commas
- Server-component caching staleness when filters change
- Invalid filter values in saved URLs (must not crash)
- View tracking on direct URL vs modal vs embedded card (all paths)
- Sessions across page navigations (cookie persistence)
- Past instances for series with 1 event (shouldn't show)
- Past instances cross-year boundary

PASS 5 — Spot checks for A2 specifically
- Re-query tag_cleanup_log for top hallucinations — has the prompt drift returned?
- Pick 10 random events post-backfill and verify their vibe_tags actually match the description (not just technically-canonical-but-semantically-wrong)
- Decide on the vocab gaps from A2: experimental, corporate vibes underused — fix prompt? remove from vocab? leave?
- Verify byte-identity of inline vocab in cleanup migration vs backend/lib/vocabularies.js
- Verify tag_cleanup_log table is still there and intact

PASS 6 — Test on real surfaces
- Mobile + desktop, all filter combos, empty results, conflicting filters
- Each interest preset returns sensible results
- View tracking fires on every event detail variant
- Past instances UI handles 0 / 1 / 5 / 50+ siblings correctly

PASS 7 — Documentation update
- Update CLAUDE.md with what shipped: filter taxonomy, controlled vocabs, time-of-day timezone rule, view tracking pattern, past instances component
- Update docs/filter-roadmap.md status line at the top
- Update src/lib/constants/vocabularies.ts header if needed

PASS 8 — Compile phase-1-report.md
Read phase-1-progress.md end-to-end and produce docs/phase-reports/phase-1-report.md as the final compilation. Structure:
- Phase 1 summary (what was the goal, did we achieve it)
- Per-session: shipped, found+fixed in review, deferred
- Aggregate metrics: data coverage before/after, scraper hallucination rate before/after, lines of code added, files touched
- Gotchas surfaced — list with severity
- What's now possible that wasn't before
- Phase 2 briefing: what's blocked on what, what's safe to start

ANY bug found gets fixed, not deferred. The only acceptable deferral is something that legitimately belongs in Phase 2 or 3.

Use TodoWrite for the 8 passes. Mark each as completed only after you've actually done the pass — not partially.

When done, the next session can be a fresh Phase 2 start with confidence that Phase 1 is solid.

Go.
```

---

## Cheatsheet for me (Hazel)

- **B1**: data layer only, no UI — small session, quick win
- **B2**: filter UI + past instances — biggest UI session in Phase 1, expect it to be longest
- **B3**: view tracking infra — small but has a migration, careful with the unique index
- **R1**: review-only, no new features — produces phase-1-report.md and unblocks Phase 2

After R1: **wait ~4 weeks** before starting Phase 2 if you want trending data to bake. The roadmap actually puts trending in Phase 3, so you can start Phase 2 (distance, cost, age, lifecycle) immediately — the wait is only before Phase 3.
