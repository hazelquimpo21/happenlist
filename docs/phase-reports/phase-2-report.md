# Phase 2 — Smart Filters Roadmap — Final Report

**Phase**: 2 of 3 (Distance, depth, lifecycle)
**Sessions**: B4, B5, B6, R2 (happenlist repo). A3 done separately (scraper repo). A4 deferred.
**Duration**: single calendar day (2026-04-13)
**Status**: ✓ Complete
**Author**: Hazel + Claude (Opus 4.6)
**Companion docs**:
- `docs/filter-roadmap.md` — three-phase plan
- `docs/phase-reports/phase-2-progress.md` — chronological per-session log
- `docs/phase-reports/phase-1-report.md` — Phase 1 final report

---

## TL;DR

Phase 2 added distance-based filtering with Milwaukee neighborhoods, cost tier and age group filters, past-event lifecycle with archive pages, and the `annual` series type. R2 caught one critical bug (archive pages couldn't show past events due to a hardcoded future-only filter in `getEvents()`), one type-safety issue (price/age type guards weren't proper type predicates), and verified all migrations, indexes, and filter combos via EXPLAIN ANALYZE against the production database. Every bug found was fixed in-pass.

---

## What shipped

### B4 — Distance / Geo Filtering

- **Postgres extensions**: `cube` + `earthdistance` enabled
- **`events_within_radius(lat, lng, miles, limit)` RPC**: SECURITY DEFINER, GiST-indexed, returns `(event_id, distance_miles)`. Verified at ~11ms for 50 events within 5mi of downtown Milwaukee.
- **15 Milwaukee neighborhoods** in `milwaukee-neighborhoods.ts` with center lat/lng
- **NeighborhoodPicker**: native `<select>` + "Use my location" browser geolocation + radius selector
- **DistanceBadge**: pill on EventCard when geo anchor is active
- **Query layer**: `nearLat`, `nearLng`, `radiusMiles` params; geo pre-filter via RPC → `.in('id', geoIds)`; `distance-asc` sort post-collapse
- **7 bugs found and fixed during QA**: stale closures (2), past-event leak in RPC, NaN from parseFloat, distance-asc sort destroyed by collapseSeries, negative radius, unsafe `!isNaN(nearLat!)`

### B5 — Cost Tiers + Age Groups

- **6 price tiers**: free, under_10, 10_to_25, 25_to_50, over_50, donation
- **6 age groups**: all_ages, families_young_kids, elementary, teens, college, twenty_one_plus
- **Query layer**: multi-select OR via `.or()` with per-tier/group predicates. Price uses `is_free`/`price_low`/`price_type`. Age uses `age_low` only (age_high empty in DB). College also checks `good_for @> {college_crowd}`.
- **FilterDrawer**: two new sections (Price, Ages) with multi-select chips
- **EmptyFilterState**: removable chips for active price tiers and age groups

### B6 — Lifecycle + Past Events

- **`idx_events_browse_active` partial index**: covers the hot-path browse query. 3 redundant indexes dropped (net -2).
- **`series_type` CHECK expanded**: 10 types now (added `lifestyle`, `ongoing`, `exhibit`, `annual`)
- **`annual` series type wired end-to-end**: types, SERIES_TYPE_INFO, SERIES_LIMITS, NOT in COLLAPSIBLE_SERIES_TYPES
- **PastEventBanner**: shown on event detail when `instance_date` has passed. Links to organizer page or main events.
- **Year archive page**: `/events/archive/[year]` with month grid + event list
- **Month archive page polished**: updated breadcrumbs (Events → Archive → Year → Month)

### R2 — Review & Harden (this report)

See findings below.

---

## R2 Findings

### Pass 1 — Bug hunt

**BUG 1 — CRITICAL: Archive pages can't show past events** (severity: high)
- `getEvents()` had a hardcoded `.gte('instance_date', today)` at line 469
- The year and month archive pages called `getEvents()` with date ranges, but the future-only filter overrode them — past events were silently excluded
- **Fix**: Added `includePast?: boolean` to `EventQueryParams`. When true, the future-only filter is skipped. Both archive pages now pass `includePast: true`.
- **Root cause**: B6 added archive pages but didn't account for the default temporal filter in the shared query function
- **Impact**: the archive pages were returning 0 past events; 52 past events for 2026 now display correctly

**BUG 2 — Type guards not proper type predicates** (severity: low)
- `isPriceTierSlug()` and `isAgeGroupSlug()` returned `boolean` instead of type predicates (`value is PriceTierSlug`)
- `normalizeStringArray<T>()` expects `(v: string) => v is T`, requiring unsafe `as` casts
- **Fix**: Added `PriceTierSlug` and `AgeGroupSlug` type unions. Changed return types to proper type predicates. Removed `as` casts from `get-events.ts`.
- **Verified**: `npx tsc --noEmit` passes clean

**GOTCHA — Archive page sort order** (severity: cosmetic)
- Archive pages didn't specify `orderBy`, defaulting to `date-asc`. Made it explicit for clarity.

### Pass 2 — Connection audit

| Check | Result |
|---|---|
| All Phase 2 migrations applied to remote DB | ✓ 4 migrations confirmed via `list_migrations` |
| `series_type` CHECK has all 10 types | ✓ including `annual` |
| `idx_events_browse_active` exists | ✓ — planner prefers `idx_events_not_deleted` at current volume (288 events), which is expected; browse_active will win at scale |
| 3 redundant indexes dropped | ✓ 46 total indexes on events |
| Geo RPC performance | ✓ ~11ms for 50 events within 5mi |
| Geo with NULL coords (20 locations) | ✓ silently skipped by RPC WHERE clause |
| Geo with 50mi radius | ✓ 181 events, no degradation |
| Geo with zero results (Alaska coords) | ✓ 0 events, clean empty result |
| PastEventBanner mounts on event detail | ✓ conditional on `isPastEvent` |
| DistanceBadge mounts on EventCard | ✓ conditional on `distance_miles` |
| Price/age filters wired URL → query → UI → empty state | ✓ |
| `annual` not collapsed in browse feeds | ✓ not in `COLLAPSIBLE_SERIES_TYPES` |

### Pass 3 — Conflict check

| Check | Result |
|---|---|
| `countActiveFilters` single source of truth | ✓ defined in `types.ts`, used by server + client |
| `isFree` + `priceTier: ['free']` overlap | Not a bug — AND together, counted separately. Documented in B5. |
| `filter-drawer.tsx` line count | 374 (guideline 200). B6 didn't push it further. All sections follow same pattern — splitting would be churn. |
| `EventFilters` vs `FilterState` type drift | ✓ all Phase 2 fields in both. `neighborhood` correctly FilterState-only. `includePast` correctly EventFilters-only. |

### Pass 4 — Targeted verification (from B4/B5/B6 checklists)

| Checklist item | Result |
|---|---|
| `EXPLAIN ANALYZE` on `events_within_radius` | ✓ Function Scan, 10.7ms |
| NULL coords silently skipped | ✓ 20 null-coord locations, 0 errors |
| Huge radius (50mi) doesn't degrade | ✓ 181 results |
| Zero results renders empty state | ✓ short-circuits in get-events.ts |
| `annual` series type insertable | ✓ test insert+delete succeeded |
| PostgREST `and()` nested in `.or()` | ✓ produces correct SQL (verified via QA in B5) |
| `?priceTier=bogus` silently ignored | ✓ `normalizeStringArray` with `isPriceTierSlug` guard drops it |
| "Under $10" includes free events | ✓ predicate includes `is_free.eq.true` |
| College matches via both age_low AND good_for | ✓ Matt Rife (age_low=18, college_crowd), Two Cents Tuesday (age_low=21, college_crowd) |
| 21+ returns results | ✓ 45 events |
| Past events count for archive | ✓ 52 past events in 2026 (now visible with includePast fix) |
| event_views bake status | 5 rows / 4 events — far from Phase 3 target |

### Pass 5 — Gotcha brainstorm

| Category | Assessment |
|---|---|
| **Timezones** | Time-of-day (JS post-fetch) + geo (SQL pre-filter) are independent. No conflict. DST handled by `Intl.DateTimeFormat`. ✓ |
| **Mobile** | NeighborhoodPicker uses native `<select>` (mobile-optimized). FilterDrawer has `overflow-y-auto`. DistanceBadge `text-[11px]` won't truncate. ✓ |
| **Pagination + geo** | Geo RPC returns up to 500 IDs. Page 2 re-runs same RPC (deterministic). At current scale (181 in 50mi), 500 limit is generous. Document as Phase 3 concern at >500 events per radius. |
| **Caching** | All pages `force-dynamic`. No staleness. ✓ |
| **Empty states** | Geo zero-results → short-circuit. Price/age zero-results → PostgREST empty → EmptyFilterState with removable chips. ✓ |
| **URL length** | Worst case ~20 params. Well under browser limits. ✓ |
| **Back button** | `router.replace` (not push) for all filter changes. Back goes to pre-filter state. ✓ |
| **Invalid neighborhood slug** | `?neighborhood=bogus` without lat/lng → geo filter doesn't activate (both must be non-null). Clean degradation. ✓ |
| **Partial index vs planner** | `idx_events_browse_active` not chosen at current volume. Expected — `idx_events_not_deleted` is cheaper for 288 rows. At scale with thousands of past events, browse_active will win because it excludes them. Not a bug. |

### Pass 6 — Documentation update

- `CLAUDE.md`: Phase 2 marked complete, all sessions listed, deferred items noted, event_views bake status updated
- `docs/filter-roadmap.md`: status line updated, B6 + R2 marked shipped
- `docs/phase-reports/phase-2-progress.md`: status marked complete with pointer to this report
- `price-tiers.ts` / `age-groups.ts`: type guard signatures updated with proper type predicates + slug union types

---

## Files touched by R2

| File | Change |
|---|---|
| `src/types/filters.ts` | Added `includePast` param to EventFilters |
| `src/data/events/get-events.ts` | `includePast` skips future-only filter; removed unsafe `as` casts on type guards; added logging |
| `src/app/events/archive/[year]/page.tsx` | Added `includePast: true`, explicit `orderBy: 'date-asc'` |
| `src/app/events/archive/[year]/[month]/page.tsx` | Added `includePast: true`, explicit `orderBy: 'date-asc'` |
| `src/lib/constants/price-tiers.ts` | Added `PriceTierSlug` type union, fixed `isPriceTierSlug` to proper type predicate |
| `src/lib/constants/age-groups.ts` | Added `AgeGroupSlug` type union, fixed `isAgeGroupSlug` to proper type predicate |
| `CLAUDE.md` | Phase 2 marked complete |
| `docs/filter-roadmap.md` | Status updated, B6 + R2 marked shipped |
| `docs/phase-reports/phase-2-progress.md` | Status marked complete |
| `docs/phase-reports/phase-2-report.md` | (this file, NEW) |

---

## Deferred — and why each is legitimate

| Item | Reason |
|---|---|
| A4 — outdoor venue audit | Not blocking any Phase 2 or 3 work. Revisit when indoor/outdoor filtering becomes a priority. |
| Sort dropdown UI for distance-asc | FilterBar doesn't have a sort control yet. Phase 3 will add sorts (trending, popular). |
| Geolocation persistence across sessions | Cookie-based persistence can come later. Current flow re-prompts per session. Fine for MVP. |
| Distance badge on CompactEventCard / HomepageEventCard | Only EventCard gets it. Other variants are for homepage sections where distance isn't contextual. |
| `isFree` + `priceTier: ['free']` badge double-counting | Documented as not-a-bug. Different UI controls, counted separately. Redundant but correct. |
| Pre-existing macOS Finder duplicate files (`* 2.tsx`, `* 3.ts`) | Same as Phase 1: untracked, predates Phase 2. Deletion is destructive and warrants user authorization. |
| `idx_events_browse_active` not preferred by planner | At current data volume (288 events), `idx_events_not_deleted` is cheaper. The browse_active index will win at scale when past events outnumber future events. Not a bug. |

---

## Hand-off to Phase 3

**Phase 3 pre-flight check** (documented in `docs/filter-roadmap.md`):
1. `event_views` has >1000 rows across >50 events — check `/admin/views`
2. `vibe_tags` taxonomy is still clean (every value in vocab)
3. `attendance_mode` coverage is up (from A3 backfill)

**Current event_views status** (2026-04-13): 5 rows / 4 events. Target: >1000 / >50. **Estimated ready: mid-May 2026** assuming normal traffic patterns on the deployed site.

**What Phase 3 can now use**:
- Distance filtering is end-to-end — Phase 3 can build distance + trending compound sorts
- Cost and age filters are live — Phase 3's vibe filters follow the same pattern
- `annual` series type works — future annual events (Summerfest, etc.) can be created
- Archive pages work correctly with the `includePast` fix
- `countActiveFilters` single source of truth — adding new filters is a 5-step recipe (documented in `types.ts` header)

**Things Phase 3 should verify before starting**:
- Vocabulary mirror byte-identicality between repos (quick diff)
- `event_views` row volume meets pre-flight target
- Whether the macOS Finder duplicate files should finally be cleaned up

**Cross-file gotcha brainstorm Phase 3 should NOT skip**:
- New filter URL params need to flow through `serializeFiltersToParams`
- New filter chips need to be counted in `countActiveFilters`
- Any post-fetch filter needs `needsOverFetch` (currently only time-of-day + collapseSeries trigger it)
- Any new event detail surface MUST mount `<ViewTracker>`
- Geo RPC's 500-row limit may need bumping if trending sort + geo creates dense result sets
- `filter-drawer.tsx` is 374 lines — Phase 3 adds vibe + atmosphere sliders, which will push past 400. Plan to split before adding.

---

## R2 score card

| Pass | Outcome |
|---|---|
| 1 — Bug hunt | 2 fixes (archive includePast, type guard predicates) + 1 cosmetic (explicit archive sort) |
| 2 — Connection audit | 0 broken wires, all 4 migrations applied, RPC verified |
| 3 — Conflict check | 0 real conflicts, 1 documented non-issue (isFree/priceTier overlap) |
| 4 — Targeted verification | 12+ checklist items verified via SQL and code review |
| 5 — Gotcha brainstorm | 0 net-new issues; 9 categories proactively verified |
| 6 — Documentation update | CLAUDE.md, roadmap, progress log, type guard headers |
| 7 — Compile this report | ✓ |

**Phase 2 status**: ✓ Complete. Phase 3 starts after view-tracking data bake (~4 weeks).
