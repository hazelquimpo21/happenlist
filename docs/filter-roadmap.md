# Smart Filters Roadmap

**Status**: Phase 1 complete. Phase 2 complete (B4, B5, B6, R2 all shipped 2026-04-13). A4 deferred. Phase 3 waiting on view-tracking data bake (~4 weeks from 2026-04-13).
**Last updated**: 2026-04-13
**Owner**: Hazel
**Related**: `CLAUDE.md` Engineering Standards section, `docs/phase-reports/phase-1-report.md`, `docs/phase-reports/phase-2-progress.md`

This is the canonical reference for the filter/sort/lifecycle work happening across `happenlist` and `happenlist_scraper`. It's organized as three phases with concrete sessions. Future AI sessions should read this top-to-bottom before starting work.

---

## Why this exists

The data audit on 2026-04-11 surfaced that Happenlist's schema is rich and forward-looking, but the actual data has significant gaps and quality issues. Building filters on top of bad data ships broken filters. This roadmap fixes the data and builds the filter/sort UI in a coordinated way, so each phase ships something real.

## Data audit findings (2026-04-11)

Run against the production Happenlist Supabase project (`yrgzzipqnwnohbormprz`). Snapshot of 288 published events / 238 not-deleted.

### Healthy fields (filter-ready today)
| Field | Coverage |
|---|---|
| `is_free` / `price_type` | 100% |
| `good_for[]` (clean controlled vocab) | 90% |
| `is_family_friendly` | 59% |
| `latitude` / `longitude` on locations | 99% (3,463 / 3,483) |
| Title, description, dates, category | ~100% |

### Sparse but usable
| Field | Coverage |
|---|---|
| `age_low` | 68% |
| `age_restriction` (text) | 90% |
| `energy_level`, `formality`, `noise_level`, `accessibility_score` | 64% (all-or-nothing per event) |
| `access_type` | 64% |

### Broken or empty (blocks filters until fixed)
| Field | Coverage | Issue |
|---|---|---|
| `age_high` | 1% (3 events) | Effectively unusable. Filter on `age_low` only. |
| `vibe_tags[]` | populated but **hallucinated** | 80+ free-text values vs. 18-value controlled vocab. Top tags: `casual` (133), `inclusive` (91), `lively` (68) — none of which are in the official list. |
| `subcultures[]` | populated but **hallucinated** | 100+ unique values, with duplicates like `young-adults` and `young adults`. |
| `price_low`, `price_high` | 21% / 18% | Cost-tier filter would silently exclude 80% of events. |
| `attendance_mode` | 9% | Drop-in filter is dead. |
| `membership_required` / `event_membership_benefits` | 0 | Membership feature unused. |
| `hearts` | 5 total rows | Popularity/trending = noise. |
| `view_count` | 0 across the board | View tracking never implemented. |
| `locations.venue_type='outdoor'` | 1.3% | Almost certainly under-classified for Milwaukee. |

### Storage
- `events` table: 17 MB total for 288 rows (640 KB heap, 1.2 MB indexes, ~15 MB TOAST overhead)
- Per-row content: descriptions ~158 KB, flyer text ~87 KB, image classifications ~319 KB across all 288 events combined
- `scraped_data` JSONB is empty across the board

**Conclusion**: storage is not a current concern. Even at 100× growth (~28k events), the events table would be ~1.7 GB. Past-event handling should use partial indexes for query speed, not deletion.

---

## Locked-in architectural decisions

These were debated and settled during planning. Don't relitigate without good reason.

### 1. Controlled vocabularies — source of truth + mirror
- **Source**: `happenlist_scraper/backend/lib/vocabularies.js` (CommonJS export)
- **Mirror**: `happenlist/src/lib/constants/vocabularies.ts` (TypeScript)
- Mirror file gets a header comment marking it as a manual mirror
- Sync verified during phase review sessions
- **Why**: each repo stays self-contained, no monorepo coupling, types work correctly in TS

### 2. Logging convention
Structured prefix format: `[<scope>:<action>]`
- `[scraper:atmosphere]`, `[scraper:audience]`, etc.
- `[backfill:atmosphere]`, `[backfill:pricing]`
- `[get-events]`, `[event-views]`
- `[migration:cleanup-vibe-tags]`

### 3. Migration naming
`YYYYMMDD_HHMM_short_description.sql` from now on. Existing numbered migrations stay.

### 4. Phase reports
Stored at `docs/phase-reports/phase-N-report.md`, committed to the repo, linked from CLAUDE.md.

### 5. Trending half-life
**7 days**, exponential decay. Matches a weekly browsing rhythm — calmer than 3-day, more responsive than 14-day.

### 6. Cleanup migration aggressiveness
**Drop hallucinated tags immediately**, log dropped values to a side table for spot-checking. The atmosphere backfill (Session A2) re-populates with clean tags. Recoverable as long as source URLs still work.

### 7. Filter v1 layout
**Persistent top filter bar + expandable drawer for advanced.** Best of both: discoverability + screen real estate for cards. Mobile uses bottom sheet.

### 8. Past Instances UI
**Built in Phase 1 Session B2** — small win, no dependencies, useful immediately.

### 9. Logging destination
**Console only** for now (visible in Render deploy logs). A `app_logs` Postgres table can come later if logs need to be queryable.

### 10. Phase reports as commits
**Plain commits, not PRs.** Faster, and the phase report itself is the review artifact. PR workflow can come later if we add collaborators.

### 11. Past events: never auto-delete
Keep indefinitely. Use partial indexes (`WHERE instance_date >= CURRENT_DATE - INTERVAL '7 days'`) for the hot path. Past events stay accessible by direct URL, indexed by search engines, and visible from "past instances" links.

### 12. Annual recurring events
New `'annual'` value added to `series_type` enum. Each year = a new `events` row linked to the parent series. Preserves SEO, hearts/views per year, historical accuracy.

---

## Phase 1 — Foundation: clean data + shippable filter v1

**Goal**: ship a smarter `/events` page using fields that are clean today, while fixing the scraper so Phase 3 has clean data waiting. Start view tracking so trending has runway.

### Sessions

#### Session A1 — Scraper taxonomy lockdown
**Repo**: `happenlist_scraper`
**Files**:
- `backend/analyzers/atmosphere.js` — convert `vibe_tags`/`subcultures` to strict enum via OpenAI function calling
- `backend/analyzers/event-meta.js` — same for `good_for` (preventive)
- `backend/lib/vocabularies.js` (NEW) — exported constants, source of truth

**Tasks**:
1. Define `VIBE_TAGS`, `SUBCULTURES`, `GOOD_FOR_TAGS` arrays in `vocabularies.js` with header comment marking it as source-of-truth
2. Update analyzers to use strict `enum` in their function-calling JSON schemas (not just prose lists)
3. Add post-validation: drop any tag not in vocabulary, log it
4. Ensure `[scraper:<analyzer>]` logging on every drop
5. Quick smoke test on 3 sample event URLs

#### Session A2 — Cleanup migration + atmosphere backfill
**Repos**: both
**Files**:
- `happenlist/supabase/migrations/YYYYMMDD_HHMM_cleanup_hallucinated_tags.sql`
- `happenlist_scraper/scripts/reanalyze-atmosphere.js` (NEW)

**Tasks**:
1. Migration: scan `vibe_tags` and `subcultures` arrays, drop any value not in the new allowlist. Log removed tags to a side table `tag_cleanup_log` for spot-checking. Run in transaction.
2. Manual spot-check the side table — sanity test before committing
3. Backfill script: re-run atmosphere analyzer on the 86 events where `energy_level IS NULL`. Throttle to API limits. Log every event with success/failure + values set. `[backfill:atmosphere]` prefix.
4. Run backfill against staging if available, else carefully against prod

#### Session B1 — Happenlist query layer extension
**Repo**: `happenlist`
**Files**:
- `src/data/events/get-events.ts` — extend `EventQueryParams`
- `src/lib/constants/interest-presets.ts` (NEW) — UI labels → tag unions
- `src/lib/constants/time-of-day.ts` (NEW) — time bucket definitions
- `src/lib/constants/vocabularies.ts` (NEW, mirror of scraper)

**Tasks**:
1. Mirror the scraper vocabularies into `vocabularies.ts` with sync header comment
2. Define interest presets — start with the goodFor-only versions (vibe data not clean yet). Examples: "Crafty & artsy" → `goodFor: ['creatives']`, "Foodies" → `goodFor: ['foodies']`, "Date night" → `goodFor: ['date_night']`, "Solo-friendly" → `goodFor: ['solo_friendly']`
3. Define time-of-day buckets: morning (5–11), afternoon (12–16), evening (17–20), late night (21–25)
4. Extend `EventQueryParams`:
   - `goodFor: string[]` (was single string — keep backward compat with `string | string[]`)
   - `timeOfDay: TimeOfDay | TimeOfDay[]`
   - `interestPreset?: string` (resolves to a goodFor union)
   - JSDoc on every param
5. Implement query predicates in `get-events.ts`. Use `EXTRACT(HOUR FROM start_datetime AT TIME ZONE 'America/Chicago')` for time-of-day — DB stores UTC.
6. Logging: `[get-events] applied filters: ...` on each call

#### Session B2 — Filter v1 UI + Past Instances
**Repo**: `happenlist`
**Files**:
- `src/components/events/filters/FilterBar.tsx` (NEW)
- `src/components/events/filters/FilterDrawer.tsx` (NEW)
- `src/components/events/filters/FilterChip.tsx` (NEW)
- `src/components/events/filters/FilterSection.tsx` (NEW)
- `src/components/events/filters/EmptyFilterState.tsx` (NEW)
- `src/components/series/PastInstances.tsx` (NEW)
- `src/app/events/page.tsx` — wire up filters
- `src/app/event/[slug]/page.tsx` — add PastInstances when `series_id` is set

**Tasks**:
1. Build the filter components — small, composable, single-responsibility each
2. URL state via Next.js searchParams — filters are shareable, back button works
3. Mobile: bottom sheet drawer with sticky "Apply" button
4. Empty filter state with "remove this filter" suggestions
5. Past Instances component: queries siblings of the current series with `instance_date < CURRENT_DATE`, shows up to 5 most recent with link to each
6. Keep all components <200 lines, factor anything bigger

#### Session B3 — View tracking
**Repo**: `happenlist`
**Files**:
- `supabase/migrations/YYYYMMDD_HHMM_event_views.sql` (NEW)
- `src/data/events/record-view.ts` (NEW)
- `src/components/events/ViewTracker.tsx` (NEW client component)
- `src/app/event/[slug]/page.tsx` — mount ViewTracker
- `src/app/admin/views/page.tsx` (NEW, minimal) — row count display

**Tasks**:
1. Migration: `event_views` table with `event_id`, `viewed_at TIMESTAMPTZ DEFAULT NOW()`, `session_id TEXT`, `user_id UUID NULLABLE`, generated `view_date DATE` column. Unique index on `(event_id, session_id, view_date)`. Index on `(event_id, viewed_at DESC)`.
2. Postgres function `record_event_view(p_event_id UUID, p_session_id TEXT)` doing `INSERT ... ON CONFLICT DO NOTHING`
3. Server action wrapping the function call with logging
4. Client component mounted on event detail pages — generates session ID from cookie if missing, fires view on mount
5. Admin page at `/admin/views` shows total row count, rows last 24h, rows last 7d. No real UI, just sanity-check.
6. **Important**: this ships unused for ~4 weeks. Document in code header that it's accumulating data for Phase 3 trending sort.

#### Session R1 — Phase 1 Review & Harden
**Repos**: both
**Deliverable**: `docs/phase-reports/phase-1-report.md`

**Checklist**:
- [ ] Bug hunt across all changed files
- [ ] Verify cleanup migration didn't drop legitimate tags (spot-check `tag_cleanup_log`)
- [ ] Verify scraper vocabularies and Happenlist mirror are byte-identical (modulo TS syntax)
- [ ] Verify view tracking fires from every code path that renders an event detail page
- [ ] Test filter v1 on mobile + desktop, all filter combos, empty results, conflicting filters
- [ ] Test each interest preset returns sensible results
- [ ] Verify EventQueryParams JSDoc is complete enough that a fresh session could add a param
- [ ] Verify all new files have header comments + AI-dev comments on non-obvious choices
- [ ] Verify all new code paths have `[scope:action]` logging
- [ ] **Gotcha brainstorm**:
  - Time-of-day timezone (DB is UTC, events are America/Chicago — am I extracting correctly?)
  - URL encoding of multi-value params with commas
  - Server-component caching staleness when filters change
  - Invalid filter values in saved URLs (must not crash)
  - View tracking on direct URL vs modal vs embedded card (all paths covered?)
  - Sessions across page navigations (cookie persistence)
  - Past instances for series with 1 event (shouldn't show)
  - Past instances cross-year boundary
- [ ] Update `CLAUDE.md` with what shipped
- [ ] Write phase report with: shipped, found+fixed, deferred, gotchas surfaced
- [ ] Verify migrations applied to remote DB

---

## Phase 2 — Distance, depth, lifecycle

**Goal**: add spatially-aware filters, cost/age depth, and formalize past-event lifecycle.

### Sessions

#### Session A3 — Pricing + access aggressiveness
**Repo**: `happenlist_scraper`
**Files**:
- `backend/analyzers/pricing.js` — push for `price_low`/`price_high` extraction
- `backend/analyzers/timing.js` (or new `access.js`) — push `attendance_mode`
- `scripts/backfill-pricing.js` (NEW)
- `scripts/backfill-access.js` (NEW)

**Tasks**:
1. Tighten pricing prompt: always attempt numeric extraction when any number appears, `varies` only as last resort
2. Default reasonable for `attendance_mode`: ticketed event with `ticket_url` → `registered`; free park hangout → `drop_in`
3. Backfills with `[backfill:pricing]` and `[backfill:access]` logging
4. Audit results — sample 10 backfilled events, verify accuracy

#### Session A4 — Outdoor venue audit — DEFERRED
**Repo**: `happenlist_scraper`
**Deferred**: not blocking any Phase 2 work. Will revisit in a future session when outdoor/indoor filtering becomes a priority.

**Original tasks** (preserved for future reference):
1. Push prompt to recognize parks, beer gardens, rooftops, beaches, festival grounds, athletic fields
2. Backfill against existing 3,483 locations using cached name+address (no re-scrape)
3. Spot-check ~20 reclassified locations

#### Session B4 — Distance ✓ SHIPPED (2026-04-13)
**Repo**: `happenlist`
**Files**:
- `supabase/migrations/YYYYMMDD_HHMM_enable_geo_extensions.sql` (NEW)
- `supabase/migrations/YYYYMMDD_HHMM_events_within_radius.sql` (NEW)
- `src/lib/constants/milwaukee-neighborhoods.ts` (NEW)
- `src/components/events/filters/NeighborhoodPicker.tsx` (NEW)
- `src/components/events/DistanceBadge.tsx` (NEW)
- `src/data/events/get-events.ts` — add geo params

**Tasks**:
1. Enable `cube` and `earthdistance` extensions
2. Function `events_within_radius(lat, lng, miles)` returning event IDs (or distances)
3. GiST index on the cube representation of `(latitude, longitude)` — verify with `EXPLAIN ANALYZE`
4. Neighborhood constants: ~15 Milwaukee neighborhoods with center lat/lng (Bay View, Riverwest, East Side, Walker's Point, Brewers Hill, Third Ward, Wauwatosa, Bronzeville, Sherman Park, etc.)
5. NeighborhoodPicker dropdown + "Use my location" button
6. Distance badge on cards when anchor is set
7. New `EventQueryParams`: `nearLat`, `nearLng`, `radiusMiles`, sort `'distance-asc'`

#### Session B5 — Cost tiers + age groups ✓ SHIPPED (2026-04-13)
**Repo**: `happenlist`
**Files**:
- `src/lib/constants/price-tiers.ts` (NEW)
- `src/lib/constants/age-groups.ts` (NEW)
- `src/data/events/get-events.ts` — add `priceTier`, `ageGroup` params
- Filter components — add tier/group sections

**Tasks**:
1. Price tiers: `free` / `under_10` / `10_to_25` / `25_to_50` / `over_50` / `donation`. Predicates use `price_low`/`price_high`.
2. Age groups: `all_ages` / `families_young_kids` (≤5) / `elementary` (6–11) / `teens` (12–17) / `college` (18–25 or `college_crowd` in good_for) / `21_plus` (≥21)
3. Each constant file exports both the enum AND the predicate-builder function. Single source of truth.
4. UI: chip group in advanced drawer

#### Session B6 — Lifecycle + past events ✓ SHIPPED (2026-04-13)
**Repo**: `happenlist`
**Files**:
- `supabase/migrations/YYYYMMDD_HHMM_partial_indexes.sql` (NEW)
- `supabase/migrations/YYYYMMDD_HHMM_annual_series_type.sql` (NEW)
- `src/components/events/PastEventBanner.tsx` (NEW)
- `src/app/events/archive/page.tsx` — polish

**Tasks**:
1. Partial indexes:
   - `events_browse_active` — covers the 60-day-forward window for hot path
   - Audit existing indexes, drop redundant ones
2. Add `'annual'` value to `series_type` CHECK constraint
3. PastEventBanner on event detail when `instance_date < today`: "This event has passed. [See upcoming from this organizer]"
4. Archive page: indexable by year, clear labeling

#### Session R2 — Phase 2 Review & Harden ✓ SHIPPED (2026-04-13)
**Deliverable**: `docs/phase-reports/phase-2-report.md`

**Checklist**:
- [ ] Bug hunt
- [ ] Distance: GiST index actually used? `EXPLAIN ANALYZE` a sample query.
- [ ] Distance: behavior when no anchor selected (must not crash)
- [ ] Distance: huge `radiusMiles` (1000+) doesn't degrade
- [ ] Cost tiers: `varies` and `donation` filtered correctly under each tier
- [ ] Cost tiers: "Under $10" inclusive of free
- [ ] Age groups: boundary cases (age exactly 5, college 18 with/without `college_crowd`)
- [ ] Partial indexes: query speed before/after with `EXPLAIN ANALYZE`
- [ ] Partial indexes: redundant old indexes dropped
- [ ] Past events banner appears on all past detail pages
- [ ] Past instances handles 1 / 100 / cross-year / mixed past+future
- [ ] Annual series_type accepted by Supabase types regen
- [ ] **Gotcha brainstorm**:
  - Distance with NULL coords on a location (skip vs error?)
  - Neighborhood picker on mobile (dropdown UX)
  - Partial index breaking when an event date is updated to past then back
  - Annual series with year-spanning events (NYE)
  - Backfilled venue types not reflected in cached pages — cache invalidation needed?
  - Daylight savings transitions in time-of-day filtering
- [ ] Update CLAUDE.md
- [ ] Write phase report
- [ ] **Then wait ~4 weeks for view-tracking data to bake before Phase 3**

---

## Phase 3 — Vibe, trending, polish

**Goal**: ship the differentiated features that needed clean data + accumulated user signal.

**Pre-flight check**: re-run the Phase 1 audit queries. Confirm:
- `vibe_tags` taxonomy is now clean (every value in vocab)
- `attendance_mode` coverage is up
- `event_views` has meaningful row count (target: >1,000 rows across >50 events)

If pre-flight fails, do NOT proceed. Address gaps first.

### Sessions

#### Session A5 — Quality regression sweep
**Repo**: `happenlist_scraper`
**Tasks**:
1. Spot-check 20 random recent scrapes — tag quality, pricing, attendance_mode, age
2. Add automated quality assertions to scraper output — vocab membership, confidence thresholds, age_low not null
3. Tighten any drifted prompts

#### Session B7 — Vibe filters
**Repo**: `happenlist`
**Files**:
- Filter components — add vibe tag, subculture, atmosphere slider sections
- `src/lib/constants/interest-presets.ts` — fill in `vibeTags` arrays now that data is clean
- `src/components/events/filters/AtmosphereSliders.tsx` (NEW)

**Tasks**:
1. Multi-select vibe tags using mirrored vocabulary
2. Multi-select subcultures (collapsed/searchable — long list)
3. Atmosphere sliders behind "Advanced" — energy 1–5, formality 1–5, noise level enum
4. Update interest presets with clean vibe arrays

#### Session B8 — Trending + popularity sorts
**Repo**: `happenlist`
**Files**:
- `src/data/events/get-events.ts` — add trending sort
- `src/components/homepage/TrendingStrip.tsx` (NEW or update existing strip)

**Tasks**:
1. `trending` sort using 7-day exponential decay against `event_views` + `hearts`:
   ```sql
   ORDER BY (
     COALESCE((SELECT SUM(EXP(-EXTRACT(EPOCH FROM (NOW() - viewed_at))/86400/7))
               FROM event_views WHERE event_id = events.id), 0)
     + COALESCE((SELECT SUM(EXP(-EXTRACT(EPOCH FROM (NOW() - created_at))/86400/7)) * 5
                 FROM hearts WHERE event_id = events.id), 0)
   ) DESC
   ```
2. Refine `popular` sort with 30-day decay
3. New "Trending" homepage strip

#### Session B9 — Drop-in/ticketed, membership, indoor/outdoor
**Repo**: `happenlist`
**Tasks**:
1. Drop-in vs ticketed filter (uses `attendance_mode`, now backfilled)
2. Membership filters (only if `event_membership_benefits` has data — defer otherwise)
3. Indoor/outdoor filter — based on Phase 2 venue audit. If outdoor coverage now reasonable (>5%), ship using `locations.venue_type`. Otherwise add `events.setting` enum + small scraper field.

#### Session R3 — Phase 3 Review & Final
**Deliverable**: `docs/phase-reports/phase-3-report.md` — also serves as v1.0 launch notes

**Checklist**:
- [ ] Trending: query performance at current data volume (`EXPLAIN ANALYZE`)
- [ ] If trending query >100ms, materialize scores into `events.trending_score` updated by cron every 15 min
- [ ] Vibe filters: every filter option returns at least some results (no dead options)
- [ ] Full regression: every filter combo on `/events`, every sort, mobile + desktop
- [ ] **Gotcha brainstorm**:
  - Trending strip on cold start with no views (graceful fallback to popular)
  - Vibe filter UX for users with no preferences (don't gate behind selection)
  - 5+ compound filters + distance + trending sort — does it choke?
  - Filter analytics on what users actually use (cheap insert into a `filter_usage` table)
- [ ] Add `filter_usage` logging — every `getEvents` call writes which filters were active
- [ ] Final CLAUDE.md pass: full filter taxonomy, controlled vocabs, lifecycle rules, sort algorithms, "common gotchas learned" section
- [ ] Phase report becomes launch notes

---

## Risks to watch

1. **Phase 1 cleanup migration could over-delete** — run on branch DB first, manual inspect, then commit. Atmosphere backfill recovers as long as source URLs work.
2. **View tracking write volume** — at scale, every page view = a DB write. If traffic grows fast, batch via queue. Monitor `event_views` write QPS in Phase 2.
3. **Distance query performance** — `cube`/`earthdistance` need GiST index. Don't skip in Phase 2.
4. **Trending query cost** — exponential decay subqueries are expensive. If `event_views` exceeds 100K rows, materialize trending scores into a column updated by cron every 15 min.
5. **Vocabulary drift between repos** — manual mirror requires discipline. Phase reviews must include byte-identical check.

---

## Deferred (not in scope)

- Annual event handling automation — manual via `series_type='annual'` is enough
- Image storage cleanup — current footprint trivial
- Hard-deletion of any past events — never
- PostHog / external analytics — `filter_usage` table is enough to start
- Real-time updates — server components + cache invalidation are fine
