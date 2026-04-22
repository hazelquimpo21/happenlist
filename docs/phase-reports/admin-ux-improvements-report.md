# Admin UX Improvements — 7-Ship Report

**Scope**: Seven targeted UX/UX improvements on top of the scraper-integration work, aimed at reducing friction on scraper-imported events, catching near-duplicates, and giving the superadmin data-quality visibility.
**Date**: 2026-04-22
**Status**: ✓ Complete

---

## TL;DR

The `/admin/import` preview is now inline-editable (fix scraper mistakes without leaving the page). Data-quality worklists surface 6 classes of cleanup targets on the dashboard. Fuzzy duplicate detection catches cross-host dupes at preview time. Series editor can regenerate instance dates from pasted text with a diff/apply flow. Suspicious fields on the event editor get inline "needs verification" flags. The events list got a bulk "assign category" action. The import preview auto-parses natural-language recurrence into a structured rule for visual verification.

---

## Ships

### 1. Inline edit in import preview

- `src/app/admin/import/import-form.tsx` — each preview card is a live editable form (title, start datetime, category, venue, ticket URL, price tier/low/high). Edits are captured into a per-index map and merged over the scraper payload only at save time — the raw `analyzed` array never mutates, so "Reset to scraped" is trivial.
- Top banner shows total edited count; per-card pill lists the specific fields changed.
- DST-aware datetime parsing (`getTimezoneOffsetMinutes` via Intl) preserves Chicago offset when the admin's browser is in a different zone.
- `src/app/admin/import/page.tsx` now fetches categories server-side and passes them as props so the category `<select>` can render with proper labels.

### 2. Worklists dashboard tile + pages

- `src/data/admin/get-worklists.ts` — single source of truth for the taxonomy (`WORKLISTS`). Each entry owns: slug, title, description, predicate descriptor. Counts and per-list queries both read from it — no drift.
- 6 predicates: missing image · missing short description (null OR empty) · missing category · missing venue · stale upcoming (60+ days since update) · non-free with missing `price_low`.
- Dashboard tile (`WorklistsTile`) — chip-per-slug, amber when count > 0.
- `/admin/worklists` — overview with predicate descriptors shown.
- `/admin/worklists/[slug]` — per-slug event list with `generateStaticParams` over `WORKLISTS` (5-ish pages pre-rendered, safer than arbitrary-string input).
- Sidebar link added under "Reports".
- Initial run: 246 events missing hero images, 290 non-free events missing `price_low`.

### 3. Fuzzy dedupe detective

- Postgres RPC `find_duplicate_events(title, start_datetime, venue_name, result_limit)` — pg_trgm `similarity()` on title within a same-calendar-day window, weighted 70/30 with venue-name similarity. Min title threshold 0.3. Returns top 5.
- `src/lib/scraper/save-event.ts::findDuplicates()` — typed wrapper. Silent on error (dedupe is advisory, never fatal to save).
- `POST /api/superadmin/import/check-duplicates` — batch endpoint; parallel RPC calls for all candidates in one preview batch.
- ImportForm fires it after analyze, decorates each card with an amber warning showing up to 3 possible matches + similarity score. Each match deep-links to its admin event page (new tab) for verification.
- Spot-tested: 53% title similarity matched `"Mural Tour"` vs existing `"Guided Tour of Mural and Heritage"` on the same day.

### 4. Series "regenerate dates" from text

- `POST /api/superadmin/series/[id]/regenerate-dates` with `action='preview'` or `action='apply'`. Preview never writes; apply is explicit.
- Uses the existing scraper `/analyze/text` to parse dates (enumerated lists OR recurrence phrases both work — the scraper already tuned for both).
- Diffs by `instance_date` (YYYY-MM-DD) against current series instances. Returns `{ keep, add, drop }`.
- Apply step clones the first active instance as a template for each new date (category, location, organizer, pricing, links, timezone, good_for, age fields, source). New events land as `pending_review`. Dropped events go to `status='cancelled'` (soft-delete). Duration is preserved by shifting the template's `end_datetime` by the same delta as `start_datetime`.
- Single audit-log row per apply captures added/cancelled/kept counts + original description.
- Rejects series with zero instances — admin must add at least one first to serve as template.
- UI: `RegenerateDatesPanel` component, three-column diff view (keep/add/drop with color tints).

### 5. Low-confidence field heuristic flags

- `src/lib/admin/field-heuristics.ts` — pure-function heuristic rules, client-safe.
- Rules: title (empty/short/ALL CAPS/relative time), short_description (empty/short/relative time), category (null), organizer (name matches venue but `organizer_is_venue !== true`), price (non-free + missing low, free + has ticket URL, `high < low`), image (missing, AI-generated).
- Severity: `'low'` = informational (yellow), `'high'` = probably wrong (red).
- `FieldHeuristicFlag` component — tiny amber/red pill with `title` tooltip explaining the issue.
- Wired into `event-edit-form.tsx`: Title, Short Description, Price Type, Category each get a flag when the heuristic trips. Recomputed from `formState` so flags clear as soon as the operator fixes the field.
- Swap to real per-field scraper confidence when the scraper ships it on `/analyze/text` / `/analyze/url` — for now, heuristics.

### 6. Bulk "assign category" on events list

- `AdminEventList` already had bulk approve / reject / delete / change-status. Adds a Category dropdown (superadmin-only) in the floating action bar.
- Dropdown: "Clear category" option at top, separator, then each category.
- `superadminBulkChangeCategory()` — single Postgres UPDATE over all selected IDs + one audit-log row for the batch (lightweight — bulk capped at 100). Validates `categoryId` exists up-front.
- `POST /api/admin/events/bulk` extended: `change_category` action, carries `categoryId` in body.
- `/admin/events` fetches categories alongside events and passes them to the list. Pending page deliberately omits the picker — admins approve there, then use `/admin/events` for categorization.

### 7. Recurrence preview in import

- When the scraper flags `is_series=true` with a `recurrence_description`, ImportForm fires the existing `/api/superadmin/parse-recurrence` proxy in the background for each such event.
- Each flagged card shows an indigo banner with BOTH the scraper's raw natural-language description AND the parsed structured rule ("Every other Tuesday at 7pm"). Lets the operator spot AI misreads before saving.
- Informational only — the card still saves as a single event. Series + instances are built post-save via the series editor (phase 3's NL input + phase 4's regenerate-dates panel).

---

## Architecture notes

**Single source of truth for vocab.** The worklists taxonomy (`WORKLISTS`), the good_for tags (`GOOD_FOR_TAGS` + `FAMILY_GOOD_FOR_TAGS`), and the scraper-integration field types all pull from one constants file each. Adding a new worklist is a one-line addition in `get-worklists.ts`; adding a good_for tag is one line in `vocabularies.ts` + one entry in `types/good-for.ts`.

**One writer for events.** `src/lib/scraper/save-event.ts` is still the single writer path for any scraper-derived event (Chrome extension → `/api/scraper/events` + admin import → `/api/superadmin/import/save`). The new `findDuplicates()` lives in the same file so callers can run it before save if desired.

**Advisory vs. blocking.** Dedupe hints, low-confidence flags, and recurrence parsing are ALL advisory — they decorate the UI but never block a save. This keeps the admin in control and avoids false-positive friction.

**Audit trail coverage.** Bulk category changes, regenerate-dates applies, and all superadmin operations write a `admin_audit_log` row. Batch operations use a single row capturing the list of affected IDs rather than one-row-per-event, trading fine-grained granularity for volume manageability.

---

## Data-quality baseline (as of ship day)

- 246 events missing `image_url`
- 290 non-free events missing `price_low`
- 0 events with `short_description = ''` (clean)
- 0 events with no category (clean)
- 0 events with no venue (clean)

Next steps to clean: work the Worklists page top-down, starting with missing images (affects card rendering most visibly) and missing price (affects filter behavior).
