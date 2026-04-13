# Phase 2 — Session Prompts (B6, R2)

> **What this is**: ready-to-paste prompts for the remaining Phase 2 sessions.
>
> **Why**: each session starts with zero conversation context. The prompt tells Claude exactly what to read, build, and avoid.
>
> **Order**: B6 → R2. R2 is the gate before Phase 3.
>
> A4 (outdoor venue audit) is **deferred** — not blocking anything.

---

## B6 — Lifecycle + past events

**Repo to start in**: `/Users/hazelquimpo/Documents/Apps/happenlist`

```
Starting Session B6 of the Smart Filters Roadmap (Phase 2).

Before doing anything else, read these in order:
1. CLAUDE.md — Engineering Standards section (modular, centralized data, AI-dev comments, [scope:action] logging) AND the Lifecycle / Ongoing Events section
2. docs/filter-roadmap.md — find "Session B6 — Lifecycle + past events", that's the spec
3. docs/phase-reports/phase-2-progress.md — B4 and B5 are shipped, this briefs you on what already landed
4. supabase/migrations/20260210_schema_cleanup.sql — find the series_series_type_check constraint (line ~84). The current CHECK is: class, camp, workshop, recurring, festival, season. The app code (src/lib/constants/series-limits.ts) already uses lifestyle, ongoing, exhibit, but the DB constraint was never updated. You need to add annual AND align the constraint with what the app already uses.
5. src/app/event/[slug]/page.tsx — this is where PastEventBanner will mount
6. src/app/events/archive/[year]/[month]/page.tsx — existing archive page, see what's there before polishing

Goal: formalize event lifecycle — partial indexes for query performance, expand the series_type constraint, ship a past-event banner on detail pages, and polish the archive page.

Concrete deliverables:

1. NEW migration: supabase/migrations/YYYYMMDD_HHMM_partial_indexes.sql
   - Create partial index `idx_events_browse_active` covering the hot-path browse query:
     WHERE status = 'published' AND instance_date >= CURRENT_DATE - INTERVAL '7 days'
     ON (instance_date ASC, id)
   - Also consider indexing for the common filter columns (category_id, is_free) if not already indexed
   - AUDIT existing indexes on the events table first. List them, identify any redundant ones. Drop redundant indexes in the same migration (with comments explaining why).
   - DO NOT drop indexes that are actively used — verify with EXPLAIN ANALYZE on the main getEvents query path before dropping anything
   - Apply to remote DB via the supabase MCP tool

2. NEW migration: supabase/migrations/YYYYMMDD_HHMM_expand_series_type.sql
   - DROP the existing series_series_type_check constraint
   - ADD new CHECK with the full list: class, camp, workshop, recurring, festival, season, lifestyle, ongoing, exhibit, annual
   - This aligns the DB with src/lib/constants/series-limits.ts which already defines lifestyle/ongoing/exhibit, and adds annual per the roadmap
   - Apply to remote DB

3. NEW: src/components/events/past-event-banner.tsx
   - Shows on event detail pages when instance_date < today
   - Message: "This event has passed." with a link: "See upcoming events from [organizer name]" → /organizer/[slug]
   - If no organizer, just "Browse upcoming events" → /events
   - Subtle design: bg-cloud border border-mist rounded-lg, not alarming
   - Placed at the top of the event detail content area, above the title/header
   - AI-dev header comment

4. MOUNT PastEventBanner in src/app/event/[slug]/page.tsx
   - Conditionally render when the event's instance_date (or start_datetime) is in the past
   - Pass the organizer name and slug as props
   - Must work for both parent and child events

5. POLISH: src/app/events/archive/[year]/[month]/page.tsx
   - Review the existing page. Make it indexable by year (not just year/month).
   - Consider adding a year-level archive page at /events/archive/[year]/page.tsx if one doesn't exist
   - Clear labeling: "Past Events — April 2026"
   - Ensure breadcrumbs work: Events → Archive → 2026 → April
   - The archive page should NOT use collapseSeries (past events should show individually)

What NOT to do:
- Don't touch the filter system (B4/B5 work). No new filter params.
- Don't add trending sort — that's Phase 3 B8.
- Don't delete any past events. Events are kept indefinitely per architectural decision #11 in the roadmap.
- Don't create any new query params on getEvents — the partial index is for the existing hot path.
- Don't regenerate the full supabase types file. If you need to update types for the new series_type values, do a targeted manual patch like B3 did.

Process:
- Read the existing indexes on the events table FIRST (query pg_indexes or information_schema.table_constraints via the supabase MCP execute_sql tool)
- Plan the partial index based on what you find
- Build PastEventBanner as a small standalone component, then mount it
- Test: load a past event detail page and verify the banner appears with the correct organizer link
- Test: load a future event and verify no banner
- Run npx tsc --noEmit to verify no type errors

When done:
- Append a "Session B6 — shipped" section to docs/phase-reports/phase-2-progress.md
- List files touched, bugs found and fixed, R2 checklist additions
- Note which indexes were audited and whether any were dropped

Go.
```

---

## R2 — Phase 2 Review & Harden

**Repo**: `happenlist`
**Deliverable**: `docs/phase-reports/phase-2-report.md`

```
Starting Session R2 of the Smart Filters Roadmap — Phase 2 Review & Harden.

Read in order:
1. CLAUDE.md — the "Phase review ritual" section is your job description for this session
2. docs/filter-roadmap.md — "Session R2 — Phase 2 Review & Harden" has the checklist, PLUS the "Locked-in architectural decisions" section for context
3. docs/phase-reports/phase-2-progress.md — read END TO END. It covers B4, B5, and B6. Each session added R2 checklist items — those are the gotchas you specifically need to verify.
4. docs/phase-reports/phase-1-report.md — skim for the patterns R1 followed (8-pass review, how it caught the server/client boundary bug, etc.)

Goal: harden everything Phase 2 shipped (B4 distance/geo, B5 cost tiers + age groups, B6 lifecycle + past events). Find what's broken, fix it, produce docs/phase-reports/phase-2-report.md.

This session is NOT for shipping new features. It's for making Phase 2 solid.

Process — work through these passes in order:

PASS 1 — Bug hunt
Re-read every file changed in B4, B5, B6 (the progress log lists them all). For each file:
- Type errors, NULL handling, off-by-ones, wrong defaults
- Broken imports, mismatched signatures, dead branches
- Race conditions (especially in NeighborhoodPicker geolocation callback — B4 found stale closures there)
- Run npx tsc --noEmit

PASS 2 — Connection audit
Verify everything is wired end-to-end:
- All new migrations applied to remote DB? (use list_migrations via supabase MCP)
- series_type CHECK constraint includes lifestyle, ongoing, exhibit, annual?
- Partial indexes exist and are used? Run EXPLAIN ANALYZE on the main getEvents query path via execute_sql
- PastEventBanner renders on past event detail pages?
- DistanceBadge renders when geo anchor is set?
- Price tier and age group filters work in the URL → query → UI → empty state full loop?
- NeighborhoodPicker "Use my location" → geo params → getEvents → distance-sorted results?
- New constants (price-tiers.ts, age-groups.ts, milwaukee-neighborhoods.ts) imported everywhere needed?

PASS 3 — Conflict check
- Filter count badge: does countActiveFilters still count correctly with geo + price + age added?
- isFree toggle + priceTier: ['free'] overlap — documented as not-a-bug in B5, but verify they AND together without double-counting in the badge
- filter-drawer.tsx line count — B5 noted it was 375 lines (guideline 200). If B6 pushed it further, consider splitting.
- Type drift: EventFilters in src/types/filters.ts vs FilterState in filters/types.ts — all new fields represented in both?

PASS 4 — Targeted verification (from B4/B5/B6 R2 checklists)

Distance (B4):
- [ ] EXPLAIN ANALYZE on events_within_radius(43.0389, -87.9065, 5.0, 50) — is the GiST index used?
- [ ] Test with NULL coords on a location (should be silently skipped by the RPC)
- [ ] Test with huge radius (50mi) — does it degrade?
- [ ] Test with zero results (lat/lng far from Milwaukee) — does empty state render?
- [ ] Test URL with stale/invalid neighborhood slug — should degrade gracefully
- [ ] Test back button after applying neighborhood filter
- [ ] Verify geo filter combines correctly with other filters (category + geo, timeOfDay + geo)

Cost tiers (B5):
- [ ] EXPLAIN on a priceTier query to verify PostgREST and() nested in .or() produces correct SQL
- [ ] Test ?priceTier=bogus — should silently ignore
- [ ] Test "Clear all" resets priceTier and ageGroup arrays
- [ ] Test empty state chip × removal for price tier and age group
- [ ] Verify "Under $10" (under_10) is inclusive of free events

Age groups (B5):
- [ ] Test boundary: event with age_low=5 — does it match families_young_kids (≤5)?
- [ ] Test college: event with age_low=18 + good_for including college_crowd — matches via both paths?
- [ ] Test college: event with age_low=20 but NO college_crowd tag — still matches?
- [ ] Monitor age group filter utility — if elementary/teens return 0 results, note in report

Lifecycle (B6):
- [ ] PastEventBanner appears on a past event detail page with correct organizer link
- [ ] PastEventBanner does NOT appear on a future event
- [ ] Partial index is used by EXPLAIN ANALYZE on the default getEvents browse query
- [ ] Annual series_type is accepted (try inserting a test row if needed, then delete)
- [ ] Archive page renders past events correctly, breadcrumbs work

PASS 5 — Gotcha brainstorm
Walk through these categories proactively:
- Timezones: distance has no TZ concern, but time-of-day + geo combo — does post-fetch TZ filter still work when combined with geo pre-filter?
- Mobile: NeighborhoodPicker dropdown, FilterDrawer with 7+ sections (scrollable?), distance badge truncation on narrow cards
- Pagination: geo filter + pagination — does page 2 still use the same geo anchor?
- Caching: force-dynamic on /events — no staleness issues, but verify archive pages also don't cache stale past-event counts
- Empty states: geo filter with no results + price filter with no results — are both covered by EmptyFilterState?
- URL length: many filters active at once — could the URL get unreasonably long?

PASS 6 — Documentation update
- Update CLAUDE.md: Phase 2 marked complete, all sessions listed
- Update docs/filter-roadmap.md: status line, R2 marked shipped
- Verify all AI-dev header comments on new files are accurate and current

PASS 7 — Compile phase-2-report.md
Produce docs/phase-reports/phase-2-report.md. Structure:
- Phase 2 summary (goal vs outcome)
- Per-session shipped summary (B4, B5, B6)
- R2 findings: bugs found + fixed, things verified clean
- Deferred items with justification
- Gotchas surfaced
- Phase 3 briefing: what's now possible, what to verify before starting (view tracking bake target), estimated timeline

ANY bug found gets fixed, not deferred. The only acceptable deferral is something that legitimately belongs in Phase 3.

When done, Phase 2 is complete. Phase 3 can start after ~4 weeks of view tracking data bake (target: >1000 rows across >50 events — check /admin/views).

Go.
```

---

## Cheatsheet

- **B6**: lifecycle — migrations (partial indexes + series_type expansion), PastEventBanner component, archive polish. Medium session.
- **R2**: review-only, no new features — produces phase-2-report.md and gates Phase 3. Heaviest session due to accumulated B4+B5+B6 surface area.

After R2: **wait ~4 weeks** for view tracking data to bake before starting Phase 3 (vibe filters, trending sort).
