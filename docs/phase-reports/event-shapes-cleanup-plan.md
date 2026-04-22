# Event Shapes — Cleanup & Implementation Plan

**Date:** 2026-04-22
**Status:** Plan. Awaiting approval before applying migrations.
**Related:** [CLAUDE.md "Event Shapes — Canonical Model"](../../CLAUDE.md), [docs/event-shapes-onepager.md](../event-shapes-onepager.md)

---

## Audit findings (2026-04-22)

Ran against the live `happenlist` Supabase project.

### Headline numbers

- **721 events total** (CLAUDE.md said 288 — stale)
- **96 series rows**
- **0 events have `parent_event_id` set.** The entire parent/child mechanism is code-only — never used in production data.
- **No `festival`, `ongoing`, or `exhibit` `series_type` rows exist.** The types are declared but nobody has used them.

### `series_type` distribution

| `series_type` | series | events | with_rule | with_start | with_end | with_total_sessions |
|---|---|---|---|---|---|---|
| `lifestyle` | 42 | 101 | 0 | 101 | 80 | 0 |
| `season` | 27 | 135 | 7 | 135 | 130 | 23 |
| `class` | 7 | 12 | 0 | 12 | 7 | 0 |
| `annual` | 7 | 7 | 0 | 7 | 0 | 0 |
| `recurring` | 6 | 5 | 1 | 6 | 2 | 1 |
| `camp` | 5 | 10 | 0 | 10 | 7 | 0 |
| `workshop` | 2 | 7 | 0 | 8 | 7 | 7 |

### Key insights from real data

1. **`season` is a dumping ground for multi-session classes and theatrical runs.** Top rows: "Four Week Wheel Throwing" (12 events), "Tony N' Tina's Wedding" (9), "Bluey's Big Play" (5), "Teen Wheel Throwing Camp" (9). None of these are sports seasons. All are actually recurring or class-style.
2. **`lifestyle` has 4.2 events per series avg.** It's being used for recurring events with a "drop in" vibe (Queer Karaoke, Sky High Night, Swing Jazz Wednesdays). Also materializes instances — not truly "always-on."
3. **`annual` has exactly 1 event per series, zero children.** Meant to be festival parents but nobody attached children. Currently functioning as "this happens yearly" tags.
4. **`recurring` itself is underused** (6 series, 5 events). The actual recurring events hid inside `lifestyle` and `season`.
5. **`recurrence_rule` is populated on only 8 of 96 series.** The "rule" machinery is mostly unused.
6. **`total_sessions` is set on 31 rows.** Not zero. Mostly `season` + `workshop`. But never read in queries (verified during exploration).
7. **2 orphan series** (zero events): "The Jesus Generation Tour", "The Pie Sessions".

### What this tells us

The current `series_type` enum is **categorization theater**. Admins pick `lifestyle` vs `season` vs `class` based on vibes; the DB stores the value; query code ignores most of it (only `collapseSeries` + `includeLifestyle` branch on it). The distinctions have no structural meaning — they're display labels at best, and frequently wrong.

**The real shape of an event is determined by three orthogonal properties, not a single enum:**

1. Does it repeat? → `series_id` + `recurrence_rule`
2. Does it have sub-events? → children via `parent_event_id`
3. Is it always-on? → wide date range + `hours` JSONB

---

## Revised canonical model (v5) — three shapes, no Ongoing

Per user direction (2026-04-22): **Ongoing is not a separate shape.** It's a Single event with a wide date range and an `hours` field. We accept the migration cost (delete ~60 redundant lifestyle rows, URL churn) in exchange for simpler mental model and simpler code.

| Shape | DB signal | Feed behavior |
|---|---|---|
| **Single** | `series_id IS NULL` AND `parent_event_id IS NULL` | Main feed |
| **Recurring** | `series_id IS NOT NULL` | Main feed, collapsed to next date |
| **Collection** | has children via `parent_event_id` OR `parent_event_id IS NOT NULL` (parent OR child) | Parent in feed; children hidden |

"Ongoing" events (exhibits, happy hour, always-open things) = **Single with wide date range + `hours`**. No special feed filter needed. Hours display alongside date range.

The `series_type` column becomes a **display label**, not a structural switch. Query code stops branching on it.

---

## Implementation plan

Six phases. Mix of doc, schema, data, code, admin UX, scraper. Each is one session unless noted.

### Phase A — Docs (DONE this session)

- ✅ `CLAUDE.md` canonical section rewritten
- ✅ `docs/event-shapes-onepager.md` admin-facing one-pager
- ✅ This plan doc
- ⬜ Revise both above to collapse Ongoing into Single-with-hours (next step this session)

### Phase B — Schema (1 session)

**Migration**: `YYYYMMDD_HHMM_event_shapes_cleanup.sql`

1. Add `events.hours` JSONB nullable — weekly hours pattern
   ```json
   { "mon": [["17:00","19:00"]], "tue": [["17:00","19:00"]], ... }
   ```
2. Add `events.prior_edition_event_id` UUID FK (self-ref, nullable) — replaces `annual` linkage semantics
3. Drop `series.total_sessions` column (unused)
4. Keep `series.series_type` enum — **narrow to display labels only**, not a structural switch. Document this.
5. Add Zod schema for `series.recurrence_rule` in [src/lib/recurrence/schema.ts](src/lib/recurrence/schema.ts) (new file)
6. Index `events(parent_event_id)` if not already (for child queries)
7. Delete 2 orphan series ("The Jesus Generation Tour", "The Pie Sessions")

### Phase C — Data reclassification (1 session)

Rules applied in a single SQL migration:

1. **Lifestyle → Recurring.** All 42 `lifestyle` series become `recurring`. The "always-on" flavor lives on individual events via `hours` + wide date range, not on the series. UPDATE: `UPDATE series SET series_type = 'recurring' WHERE series_type = 'lifestyle'`.
2. **Season → Recurring.** All 27 `season` series are multi-session classes/runs. Convert to `recurring` (or `class` if we want to preserve the "class-style" label — decide).
3. **Camp → delete the series; convert each event to Single-with-date-range.** For each camp series: find the earliest event's start date and the latest event's end date, set that range on one canonical event, delete the others. 5 series, 10 events → 5 events.
4. **Annual → delete the series row; keep the event.** These are single events that happen yearly. Use `prior_edition_event_id` on next year's event when it's added. Loses no data since each annual series has only 1 event.
5. **Class & Workshop → leave alone.** They're being used correctly (multi-session classes).
6. **The 2 orphan series** → already deleted in Phase B.

**Post-migration `series_type` distribution should be:**
- `recurring` (was: lifestyle + season + recurring) → ~75 series
- `class` → 7 series
- `workshop` → 2 series
- (annual, camp, lifestyle, festival, ongoing, exhibit — not in use)

Optionally: drop `series_type` CHECK constraint values we're not using, so future admins can't pick them.

### Phase D — Code cleanup (1 session)

In [src/data/events/get-events.ts](src/data/events/get-events.ts):

1. Replace `COLLAPSIBLE_SERIES_TYPES` check with simply "has `series_id`." All series are collapsible now.
2. Remove `LIFESTYLE_SERIES_TYPES` and `includeLifestyle` param entirely. Ongoing events are Singles and flow through normal filters.
3. Add `hasHours` filter (exclude events with `hours` populated from main feed by default, or flip it — TBD during implementation).
4. Update `buildRecurrenceLabel()` to validate against Zod schema before building.
5. Update `EventCard` to render `hours` if present (display like "Open Tue–Fri 5–7pm").

In [src/types/event.ts](src/types/event.ts):
- Remove `series_type` from `EventCard` if no longer consumed; keep on `EventWithDetails` as display label.

In [src/types/series.ts](src/types/series.ts):
- Narrow `SeriesType` enum
- Document that `series_type` is a display label, not a structural switch

### Phase E — Admin UX (2 sessions)

1. **"New event" wizard step 0** — pick a shape (Single / Recurring / Collection). See CLAUDE.md known debt.
2. **Collection builder** — `/admin/collections/new` with parent + inline-add children. Exposes `parent_event_id` in the UI for the first time.
3. **Hours editor** on event form — weekly hours JSONB builder (Mon–Sun × time ranges)
4. **Import preview shape badge** — "Detected: Recurring" / "Detected: Collection with 12 children" with override dropdown
5. **Kill the occurrence scope radio buttons** — replace with "edit series" vs "edit instance" as separate URLs/contexts
6. **Worklist bulk actions** — "reclassify selected to X", "add to series Y"

### Phase F — Scraper (1 session, separate repo)

In `happenlist_scraper`:

1. Emit `shape`: `'single' | 'recurring' | 'collection'` in analyze response
2. For single events with weekly-hours signal ("Open Tue–Sat 10–5"), emit `hours` JSONB
3. Stop emitting `lifestyle` / `ongoing` / `exhibit` / `camp` / `annual` / `season` series_type values — collapse to `recurring` or none
4. Mirror the types update in both `vocabularies.js` and `happenlist/src/lib/constants/vocabularies.ts`

---

## Risks and decisions

1. **URL churn from collapsing lifestyle multi-row events.** ~60 events deleted, their detail URLs 404. User accepts this; can re-add from source.
2. **`series_type` as display label is ambiguous.** Some admins may want to distinguish "weekly class" from "happy hour" visually. Recommendation: keep the label, but derive it from `hours` + `recurrence_rule` on read, not as a required admin choice.
3. **`prior_edition_event_id` vs series-based annual linkage.** Simpler to use a direct FK than repurpose series. Downside: no history navigation beyond one hop. Acceptable for now.
4. **Hours JSONB schema.** Keep loose (array of `[open, close]` per day) or go strict (Zod-validated, exclusion dates, holidays)? Recommendation: loose to start, validate at read time, tighten when admin UI lands.

---

## Centralization + modularity rules (non-negotiable during this cleanup)

Per engineering standards in CLAUDE.md + user direction:

1. **One source of truth per concept.**
   - Shape detection lives in **one** function: `getEventShape(event)` in `src/lib/events/shape.ts` (new). Everything else imports it — main feed filter, admin UI, card rendering, scraper-payload-to-event mapping.
   - `series_type` display labels live in `src/types/series.ts` as `SERIES_TYPE_LABELS` — one map, imported everywhere labels are shown.
   - Recurrence rule Zod schema lives in `src/lib/recurrence/schema.ts` (new). Parser and builder and validator all import from here.
   - Hours JSONB Zod schema lives in `src/lib/events/hours-schema.ts` (new). Editor, display, scraper mapping all import.
   - Collapsing logic stays in `src/data/events/get-events.ts` — but move pure helpers (`buildRecurrenceLabel`, `collapseSeriesInstances`) to `src/lib/events/collapse.ts` so they're testable and reusable.

2. **No scattered constants.**
   - Delete `COLLAPSIBLE_SERIES_TYPES` and `LIFESTYLE_SERIES_TYPES` — replaced by "has `series_id`" check.
   - Any surviving enum constant gets a home in `src/lib/constants/` or a domain-tied type file.

3. **Per-file size cap: 200 lines.** If `get-events.ts` or `event-card.tsx` is already at the cap, split them in this cleanup while we're touching them.

4. **Every new file gets a header comment.**
   ```ts
   // Shape detection for events — Single / Recurring / Collection.
   // Used by: get-events.ts (feed filter), EventCard (badge), admin shape wizard.
   // If you change the shape definitions, update docs/event-shapes-onepager.md.
   ```

5. **One writer for event inserts.** `src/lib/scraper/save-event.ts` remains the single writer. Phase F scraper changes MUST flow through this — do not duplicate insert logic.

6. **Cross-repo mirror discipline.** `src/lib/constants/vocabularies.ts` mirrors `happenlist_scraper/backend/lib/vocabularies.js`. Keep byte-synced. New shape enums added in both files in the same PR.

---

## Execution sequencing

Proposed order:
1. ✅ This plan (landed)
2. Revise CLAUDE.md + one-pager to 3-shape model
3. **PAUSE — get approval on Phase C reclassification rules before running migration**
4. Phase B schema migration
5. Phase C data migration
6. Phase D code cleanup
7. Ship a working commit; verify main feed, detail pages, admin edit form, import flow
8. Phase E admin UX (separate sessions)
9. Phase F scraper updates (separate session, separate repo)

---

## Gating question before execution

Before running Phase C, confirm reclassification rule:

> **"All `lifestyle` and `season` rows become `recurring`. All `camp` and `annual` series are dissolved — their events survive as Singles (with date range for camp, with `prior_edition_event_id` linkage TBD for annual)."**

If yes → proceed. If the `class`/`workshop`/`recurring` display-label distinction matters for admins, we can preserve it by classifying based on title keywords (contains "class"/"workshop"/"camp" → keep label; otherwise `recurring`). But I'd argue it's not worth the code complexity.
