# Phase 2 — Smart Filters Roadmap — Progress Log

**Phase**: 2 of 3 (Distance, depth, lifecycle)
**Sessions**: A3, A4, B4, B5, B6, R2
**Status**: ✓ Complete — see `docs/phase-reports/phase-2-report.md` for the final review report
**Companion docs**:
- `docs/filter-roadmap.md` — three-phase plan
- `docs/phase-reports/phase-1-report.md` — Phase 1 final report

---

## Session B4 — Distance / Geo Filtering — shipped (2026-04-13)

### What shipped

#### 1. Migration: `20260413_1400_geo_distance.sql` — applied to remote DB

- Enabled `cube` + `earthdistance` Postgres extensions
- Created `events_within_radius(p_lat, p_lng, p_radius_miles, p_limit)` SQL function
  - SECURITY DEFINER, `search_path = public`
  - Returns `(event_id, distance_miles)` ordered by distance ASC
  - Converts earthdistance meters → miles (/ 1609.344)
  - Skips events with NULL coords on their location
  - Granted to `anon` + `authenticated`
- Created GiST index `idx_locations_geo` on `ll_to_earth(latitude, longitude)` with partial WHERE for non-null coords
- **Verified**: RPC returns correct results from downtown Milwaukee (43.0389, -87.9065) — 10 events within 5mi, distances ranging 0.27–0.70 mi

#### 2. Constants: `src/lib/constants/milwaukee-neighborhoods.ts` (NEW)

- 15 Milwaukee neighborhoods with center lat/lng coordinates
- Ordered roughly north-to-south for natural browsing
- Exports: `NEIGHBORHOODS`, `DEFAULT_RADIUS_MILES` (5), `MAX_RADIUS_MILES` (50), `getNeighborhood()`, `isNeighborhoodId()`
- AI-dev header comment with cross-file coupling notes

#### 3. Query layer: `src/data/events/get-events.ts` (EXTENDED)

- New `EventQueryParams` fields: `nearLat`, `nearLng`, `radiusMiles` (in `src/types/filters.ts`)
- New `SortOption`: `'distance-asc'`
- Geo flow:
  1. When `nearLat`+`nearLng` are set, calls `events_within_radius` RPC pre-query
  2. Builds a `distanceMap: Map<string, number>` from the RPC results
  3. Filters main query with `.in('id', geoEventIds)`
  4. Post-transform: attaches `distance_miles` to each EventCard from the map
  5. If `orderBy === 'distance-asc'`, re-sorts events by distance post-fetch
- Radius clamped to `MAX_RADIUS_MILES` (50)
- Short-circuits to `{ events: [], total: 0 }` when geo returns 0 results
- Geo RPC errors are non-fatal — logged and skipped (page renders without geo filter)
- Logging: `[get-events:geo] N events within Xmi`

#### 4. EventCard type: `src/types/event.ts` (EXTENDED)

- Added `distance_miles?: number | null` to `EventCard` interface

#### 5. DistanceBadge: `src/components/events/distance-badge.tsx` (NEW)

- Small pill with Navigation icon + formatted distance
- Format rules: <0.1mi → "Nearby", <10mi → "2.4 mi", ≥10mi → "12 mi"
- Mounted in EventCard below the location/organizer lines when `distance_miles` is set
- Matches visual weight of the recurrence label row (text-[11px] text-zinc)

#### 6. NeighborhoodPicker: `src/components/events/filters/neighborhood-picker.tsx` (NEW)

- Native `<select>` dropdown of 15 neighborhoods — mobile-friendly
- "Use my location" button using browser Geolocation API
- Radius selector (1/2/3/5/10/15/25 mi) shown when a geo anchor is active
- Error handling: denied permission, unsupported browser, timeout
- Mounted at the top of FilterDrawer (location is a primary filter)

#### 7. Filter state wiring

- `FilterState` extended with: `neighborhood`, `nearLat`, `nearLng`, `radiusMiles`
- URL params: `?neighborhood=bay-view&nearLat=43.007&nearLng=-87.896&radius=5`
- `countActiveFilters` counts geo as 1 filter (not 3 fields)
- `parseFiltersFromParams` / `serializeFiltersToParams` handle number serialization
- `removeOne` has geo-aware cleanup: removing neighborhood clears all 4 geo fields
- `EmptyFilterState` renders a "Near Bay View" chip with × for removal
- Events page passes geo params to `getEvents()`

### Files touched

| File | Change |
|---|---|
| `supabase/migrations/20260413_1400_geo_distance.sql` | NEW — extensions + RPC + index |
| `src/lib/constants/milwaukee-neighborhoods.ts` | NEW — 15 neighborhoods + helpers |
| `src/types/filters.ts` | Added `nearLat`, `nearLng`, `radiusMiles` to EventFilters; `'distance-asc'` to SortOption |
| `src/types/event.ts` | Added `distance_miles` to EventCard |
| `src/data/events/get-events.ts` | Geo pre-filter RPC, distance map, distance-asc sort |
| `src/components/events/distance-badge.tsx` | NEW — distance display pill |
| `src/components/events/event-card.tsx` | Mounts DistanceBadge when distance_miles set |
| `src/components/events/filters/types.ts` | Added geo fields to FilterState + parsers + counter |
| `src/components/events/filters/use-filter-state.ts` | Geo-aware removeOne |
| `src/components/events/filters/neighborhood-picker.tsx` | NEW — dropdown + geolocation + radius |
| `src/components/events/filters/filter-drawer.tsx` | Mounts NeighborhoodPicker at top |
| `src/components/events/filters/empty-filter-state.tsx` | Geo chip in empty state |
| `src/components/events/filters/index.ts` | Barrel export for NeighborhoodPicker |
| `src/app/events/page.tsx` | Passes geo params to getEvents |

### QA pass — bugs found and fixed

| Bug | Severity | Fix |
|---|---|---|
| **Stale closure in NeighborhoodPicker**: `setSingle` called 3x hit stale-closure — only last write survived | High | Batched all geo updates into single `setState` call |
| **Stale closure in geolocation callback**: `state` captured at `useCallback` creation, stale by the time `getCurrentPosition` resolves | Medium | Added `useRef(state)` pattern — callback reads `stateRef.current` |
| **distance-asc sort destroyed by collapseSeries**: `collapseSeriesInstances` re-sorts by `instance_date`, overwriting distance order | Medium | Moved distance-asc sort to AFTER collapse |
| **RPC returned past events**: `events_within_radius` didn't filter by `instance_date >= CURRENT_DATE`, wasting `p_limit` budget on past events | Medium | Added `AND e.instance_date >= CURRENT_DATE` to RPC WHERE clause |
| **NaN from parseFloat leaked into FilterState**: `?nearLat=abc` → `parseFloat('abc')` → `NaN` stored in state → broken RPC call | Medium | Added `safeParseFloat`/`safeParseInt` helpers with NaN guard |
| **No lower-bound clamp on radius**: `?radius=-5` → negative radius passed to RPC | Low | Added `Math.max(0.1, ...)` clamp |
| **Unsafe `!isNaN(nearLat!)`**: non-null assertion on potentially `undefined` value (worked by accident) | Low | Changed to `nearLat != null && !isNaN(nearLat)` |

### Deferred

| Item | Reason |
|---|---|
| `EXPLAIN ANALYZE` on geo query with GiST index | R2 checklist — need real traffic patterns to test |
| Distance badge on CompactEventCard / HomepageEventCard | Only EventCard mounted; other variants are for specific homepage sections where distance isn't contextual |
| Sort dropdown UI for distance-asc | FilterBar doesn't have a sort control yet — that's a B6 or R2 item |
| Geolocation "Use my location" persistence across sessions | Cookie-based persistence can come later; current flow re-prompts per session which is fine for MVP |

---

## Session B5 — Cost Tiers + Age Groups — shipped (2026-04-13)

### What shipped

#### 1. Constants: `src/lib/constants/price-tiers.ts` (NEW)

- 6 tiers: `free`, `under_10`, `10_to_25`, `25_to_50`, `over_50`, `donation`
- Each with slug, label, description, icon (Lucide name), range
- `free` uses `is_free = true` (not `price_low = 0`)
- `under_10` is **inclusive** of free events
- `donation` matches `price_type = 'donation'`
- Exports: `PRICE_TIERS` array, `isPriceTierSlug()`, `getPriceTier()`, `getPriceTiers()`

#### 2. Constants: `src/lib/constants/age-groups.ts` (NEW)

- 6 groups: `all_ages`, `families_young_kids`, `elementary`, `teens`, `college`, `twenty_one_plus`
- Each with slug, label, description, icon, ageFloor/ageCeiling
- **Key constraint**: `age_high` is empty in the DB — all predicates use `age_low` only
- `all_ages` matches NULL or 0 age_low
- `families_young_kids` includes NULL (unspecified = presumed accessible)
- `college` also checks `good_for @> {college_crowd}` as OR condition
- Exports: `AGE_GROUPS` array, `isAgeGroupSlug()`, `getAgeGroup()`, `getAgeGroups()`

#### 3. Query layer: `src/data/events/get-events.ts` (EXTENDED)

- New `EventQueryParams` fields: `priceTier`, `ageGroup` (both `string | string[]`)
- Normalization via `normalizeStringArray` with `isPriceTierSlug`/`isAgeGroupSlug` guards
- Price tier predicates built as a single `.or()` clause:
  - `free` → `is_free.eq.true`
  - `under_10` → `is_free.eq.true,price_low.lte.10`
  - `10_to_25` → `and(price_low.gte.10,price_low.lte.25)`
  - `25_to_50` → `and(price_low.gte.25,price_low.lte.50)`
  - `over_50` → `price_low.gt.50`
  - `donation` → `price_type.eq.donation`
- Age group predicates built as a single `.or()` clause:
  - `all_ages` → `age_low.is.null,age_low.eq.0`
  - `families_young_kids` → `age_low.lte.5,age_low.is.null`
  - `elementary` → `and(age_low.gte.6,age_low.lte.11)`
  - `teens` → `and(age_low.gte.12,age_low.lte.17)`
  - `college` → `and(age_low.gte.18,age_low.lte.25),good_for.cs.{college_crowd}`
  - `twenty_one_plus` → `age_low.gte.21`
- Multi-select = OR (any tier/group matches)
- Dedupe of clauses when overlapping tiers are selected (e.g. free + under_10)
- Both logged in `[get-events]` filter line

#### 4. Filter state: `src/components/events/filters/types.ts` (EXTENDED)

- Added `priceTier: string[]` and `ageGroup: string[]` to `FilterState`
- Both are multi-value arrays (same pattern as `goodFor`, `timeOfDay`)
- Updated: `EMPTY_FILTER_STATE`, `countActiveFilters`, `parseFiltersFromParams`, `serializeFiltersToParams`
- URL params: `?priceTier=free&priceTier=under_10&ageGroup=twenty_one_plus`
- Each selected tier/group counts individually in the badge

#### 5. Filter UI: `src/components/events/filters/filter-drawer.tsx` (EXTENDED)

- Two new `FilterSection` blocks: "Price" and "Ages"
- Placed after "Good for", before "Vibe" (natural information hierarchy)
- Multi-select via `toggleArrayValue('priceTier', slug)` / `toggleArrayValue('ageGroup', slug)`
- Section "Clear" button resets to empty array
- Hint text explains multi-select semantics

#### 6. Hook: `src/components/events/filters/use-filter-state.ts` (EXTENDED)

- `toggleArrayValue` union type expanded to include `'priceTier' | 'ageGroup'`

#### 7. Empty state: `src/components/events/filters/empty-filter-state.tsx` (EXTENDED)

- Removable chips for active price tiers and age groups
- Label lookup via `getPriceTier()` / `getAgeGroup()`

#### 8. Events page: `src/app/events/page.tsx` (EXTENDED)

- Parses `priceTier` and `ageGroup` from searchParams via `toArray()`
- Forwards to `getEvents()` (empty arrays become undefined)

### Files touched

| File | Change |
|---|---|
| `src/lib/constants/price-tiers.ts` | NEW — 6 tiers + helpers |
| `src/lib/constants/age-groups.ts` | NEW — 6 groups + helpers |
| `src/types/filters.ts` | Added `priceTier`, `ageGroup` to EventFilters |
| `src/data/events/get-events.ts` | Price/age predicates, normalization, logging |
| `src/components/events/filters/types.ts` | FilterState + parsers + counter |
| `src/components/events/filters/use-filter-state.ts` | toggleArrayValue union |
| `src/components/events/filters/filter-drawer.tsx` | Price + Ages sections |
| `src/components/events/filters/empty-filter-state.tsx` | Price/age chips |
| `src/app/events/page.tsx` | Parses + forwards priceTier, ageGroup |

### QA pass — verified in browser

| Test | Result |
|---|---|
| `?priceTier=free` | 67 events (down from 71 unfiltered) |
| `?priceTier=10_to_25` | 29 events (PostgREST `and()` syntax works) |
| `?priceTier=free&priceTier=donation` | 67 events (multi-select OR) |
| `?ageGroup=college` | 85 events (`good_for.cs.{college_crowd}` pulling in tagged events) |
| `?priceTier=free&ageGroup=twenty_one_plus` | 36 events (cross-filter AND) |
| `?ageGroup=elementary` | 0 events (expected — age_low data is sparse) |
| Badge shows "2 filters" for combined price+age | Correct |
| Drawer shows Price + Ages sections with correct chips | Correct |
| No console errors, no server errors | Clean |

### Gotchas surfaced

| Gotcha | Assessment |
|---|---|
| `isFree` toggle + `priceTier: ['free']` overlap | Not a bug — they AND together (redundant but correct). Two different UI controls, counted separately. |
| `filter-drawer.tsx` now 375 lines (guideline is 200) | Was already 335 pre-B5. All sections follow same inline pattern. Splitting would be churn — flag for R2. |
| `age_low` data sparsity | Elementary/teens filters return very few or zero results. Expected per data audit. Will improve as A3 backfill enriches age data. |
| `under_10` includes events with `price_low = 0` but `is_free = false` | By design — $0 events should show as budget-friendly. |

### R2 checklist additions

- [ ] Verify PostgREST `and()` nested in `.or()` produces correct SQL via `EXPLAIN`
- [ ] Test stale URL with invalid tier slug (e.g. `?priceTier=bogus`) — should silently ignore
- [ ] Test "Clear all" properly resets priceTier and ageGroup arrays
- [ ] Test empty state chip × removal for each filter type
- [ ] Consider splitting filter-drawer.tsx if it grows past 400 lines
- [ ] Monitor age group filter utility — if data remains too sparse, consider hiding low-match groups

---

---

## Session B6 — Lifecycle + Past Events — shipped (2026-04-13)

### What shipped

#### 1. Migration: `20260413_1800_partial_indexes.sql` — applied to remote DB

- **New index**: `idx_events_browse_active` — `(instance_date ASC, id) WHERE status = 'published' AND deleted_at IS NULL AND parent_event_id IS NULL`
  - Covers the hot-path browse query (`getEvents()` main feed, category feeds, search, organizer/venue pages)
  - `CURRENT_DATE` can't appear in a partial index predicate (not immutable), so temporal filter is applied at query time; the btree ordering on `instance_date` makes range scans fast
- **Index audit** — 48 indexes audited on the `events` table. 3 redundant indexes dropped:
  - `idx_events_series_id` — bare `(series_id)`, redundant with `idx_events_series` `(series_id) WHERE series_id IS NOT NULL`
  - `idx_events_status_date` — `(status, instance_date) WHERE status = 'published'`, leading column always 'published' = wasted; `idx_events_published` already covers `(instance_date, category_id) WHERE status = 'published'`
  - `idx_events_age_range` — `(age_low, age_high) WHERE deleted_at IS NULL`, `age_high` empty on 99% of events; `idx_events_age_low` is sufficient
- **Net result**: +1 new, -3 dropped = 46 total indexes on events

#### 2. Migration: `20260413_1810_expand_series_type.sql` — applied to remote DB

- Dropped old `series_series_type_check` constraint (6 types)
- Added expanded constraint with 10 types: `class`, `camp`, `workshop`, `recurring`, `festival`, `season`, `lifestyle`, `ongoing`, `exhibit`, `annual`
- Aligns DB with app code that already uses `lifestyle`/`ongoing`/`exhibit` in `src/lib/constants/series-limits.ts`
- `annual` is new per architectural decision #12 (annual recurring events)

#### 3. App code: `annual` series type wired end-to-end

- `src/lib/supabase/types.ts` — added `'annual'` to `SeriesType` union
- `src/types/series.ts` — added `annual` entry to `SERIES_TYPE_INFO` (label "Annual", icon CalendarDays, badge orange)
- `src/lib/constants/series-limits.ts` — added `annual` config (1 session max, manual date selection, registered attendance)
- `annual` is NOT in `COLLAPSIBLE_SERIES_TYPES` — each year's instance is distinct content (correct behavior, same as `festival`/`season`)

#### 4. PastEventBanner: `src/components/events/past-event-banner.tsx` (NEW)

- Subtle banner: `bg-cloud border border-mist rounded-lg`, CalendarX icon
- Message: "This event has passed." with contextual link:
  - If organizer exists: "See upcoming events from [organizer name]" → `/organizer/[slug]`
  - If no organizer: "Browse upcoming events" → `/events`
- AI-dev header comment with cross-file coupling notes

#### 5. PastEventBanner mounted in `src/app/event/[slug]/page.tsx`

- `isPastEvent` computed from `instance_date + 'T23:59:59' < now` — event is "past" after its calendar day ends
- Banner renders after breadcrumbs, before hero section
- Passes `organizerName` and `organizerSlug` from the event data
- Works for both parent and child events (both have organizer data available)

#### 6. Year-level archive page: `src/app/events/archive/[year]/page.tsx` (NEW)

- URL: `/events/archive/2026`
- Fetches all events for the year (up to 500, archive pages are low-traffic)
- Month summary grid: 12 cards showing event count per month, clickable to month page
- Empty months shown as disabled (greyed out)
- Year navigation arrows (prev/next year)
- Breadcrumbs: Events → Archive → 2026
- Does NOT use collapseSeries (past events shown individually)
- AI-dev header comment

#### 7. Month archive page polished: `src/app/events/archive/[year]/[month]/page.tsx`

- Updated breadcrumbs: Events → Archive → 2026 → April (was: Events → April 2026)
- Updated heading: "Past Events — April 2026" (was: "April 2026")
- Updated metadata title to match
- Added AI-dev header comment with cross-file coupling notes

#### 8. Routes: `src/lib/constants/routes.ts`

- Added `eventsYear: (year: number) => /events/archive/${year}`

### Files touched

| File | Change |
|---|---|
| `supabase/migrations/20260413_1800_partial_indexes.sql` | NEW — browse index + redundancy cleanup |
| `supabase/migrations/20260413_1810_expand_series_type.sql` | NEW — expand series_type CHECK to 10 values |
| `src/lib/supabase/types.ts` | Added `'annual'` to SeriesType union |
| `src/types/series.ts` | Added `annual` to SERIES_TYPE_INFO |
| `src/lib/constants/series-limits.ts` | Added `annual` config to SERIES_LIMITS |
| `src/lib/constants/routes.ts` | Added `eventsYear` route helper |
| `src/components/events/past-event-banner.tsx` | NEW — past event banner component |
| `src/components/events/index.ts` | Barrel export for PastEventBanner |
| `src/app/event/[slug]/page.tsx` | Mount PastEventBanner, add isPastEvent logic |
| `src/app/events/archive/[year]/page.tsx` | NEW — year-level archive page |
| `src/app/events/archive/[year]/[month]/page.tsx` | Polished breadcrumbs, heading, metadata |

### R2 checklist additions (B6)

- [ ] Verify `idx_events_browse_active` is used by main getEvents query: `EXPLAIN ANALYZE` on the hot path
- [ ] Test PastEventBanner on past event with organizer — link goes to organizer page
- [ ] Test PastEventBanner on past event without organizer — link goes to /events
- [ ] Test PastEventBanner on future event — banner should NOT appear
- [ ] Test PastEventBanner on event happening today — banner should NOT appear (isPastEvent uses end-of-day)
- [ ] Test year archive page with year that has events — month grid shows counts
- [ ] Test year archive page with year that has no events — empty state renders
- [ ] Test month archive breadcrumbs link back to year page correctly
- [ ] Verify `annual` series type can be inserted via Supabase — constraint allows it
- [ ] Verify `annual` is NOT collapsed in browse feeds
- [ ] Check that the 3 dropped indexes don't break any existing query paths

---

### R2 checklist additions (B4)

- [ ] Verify GiST index is used: `EXPLAIN ANALYZE SELECT * FROM events_within_radius(43.0389, -87.9065, 5.0, 50)`
- [ ] Test with NULL coords on a location (should be silently skipped)
- [ ] Test with huge radius (50mi) — performance + result count
- [ ] Test with zero results (obscure lat/lng outside Milwaukee) — empty state renders
- [ ] Test "Use my location" on mobile (permission dialog)
- [ ] Test URL with stale/invalid neighborhood slug — should degrade gracefully
- [ ] Test back button after applying neighborhood filter
- [ ] Verify distance badge renders on event cards when geo anchor is set
- [ ] Verify geo filter + other filters (category, time-of-day, goodFor) combine correctly
