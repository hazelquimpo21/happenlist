# Phase 1 — Progress Log

> **SUPERSEDED**: Phase 1 is complete. The final report at `phase-1-report.md` compiles and supersedes this progress log. Read that instead.

> **What this is**: a running log of what each session in Phase 1 of the Smart Filters Roadmap actually shipped, so the next session has full briefing and Session R1 can compile a final `phase-1-report.md` from it.
>
> **Append a new section per session.** Don't rewrite history. Don't move things around. R1 needs to see the chronology.

---

## Session A1 — Scraper taxonomy lockdown (✓ shipped)

**Repo**: `happenlist_scraper`
**Date completed**: 2026-04-11 (earlier in the day, before A2)

### What shipped

- `backend/lib/vocabularies.js` — new file, source of truth for `VIBE_TAGS` (18), `SUBCULTURES` (23), `NOISE_LEVELS`, `GOOD_FOR_TAGS`. Header comment marks it as the canonical version, mirrored by `happenlist/src/lib/constants/vocabularies.ts`.
- `backend/lib/validate-tags.js` — new helpers `filterToVocab()` and `filterScalarToVocab()` that drop any value not in the canonical list and emit `[validate-tags]` warning logs with the dropped + kept values.
- `backend/analyzers/atmosphere.js` — extractionSchema declares `enum: VIBE_TAGS` / `enum: SUBCULTURES` / `enum: NOISE_LEVELS`, AND adds a `validateData(data)` hook called by `runAnalyzer` after extraction.
- `backend/analyzers/base.js` — `runAnalyzer` now calls the optional `analyzer.validateData(data)` hook after `extractWithFunctions`. Belt-and-suspenders pattern: enum constraint is the first line of defense, validateData is the safety net for GPT-4o-mini's notoriously loose enum enforcement.

### Why both layers

GPT-4o-mini does NOT strictly enforce `enum` constraints in function-calling schemas. Audit found ~50 distinct hallucinated `vibe_tags` values in production despite the schema declaring `enum: VIBE_TAGS`. The validateData hook is the actual enforcement; the enum is documentation and a hint.

---

## Session A2 — Cleanup migration + atmosphere backfill (✓ shipped)

**Repos**: `happenlist` (migration) + `happenlist_scraper` (backfill script)
**Date completed**: 2026-04-11

### What shipped

#### 1. Cleanup migration

`happenlist/supabase/migrations/20260411_1220_cleanup_hallucinated_tags.sql`

- Creates `tag_cleanup_log` side table: `(id, event_id, field, dropped_value, migration, cleaned_at)`. Indexed on event_id, field, dropped_value. Kept indefinitely as audit trail + recovery hatch.
- Inlines the canonical vocab as `_valid_vibe_tags` / `_valid_subcultures` TEMP tables. **Must stay byte-identical with `backend/lib/vocabularies.js`** — drift caught in phase reviews.
- Pre-logs every dropped value to `tag_cleanup_log` BEFORE the UPDATE so the log reflects pre-cleanup state.
- UPDATE uses `unnest(...) WITH ORDINALITY` + `array_agg(t ORDER BY ord)` so surviving values keep their original order.
- COALESCE-to-`'{}'` guarantees never-NULL arrays — schema default is `'{}'` and the filter UI assumes never-null.
- Atomic (BEGIN/COMMIT). Final DO block uses RAISE NOTICE to print a summary.

**Migration applied to production directly via `apply_migration`** (Supabase branching API was broken with `ZodError` / `InternalServerErrorException`, so we built a dry-run preview SELECT and spot-checked 8 random rows before applying — all clean).

#### 2. Atmosphere backfill script

`happenlist_scraper/backend/scripts/reanalyze-atmosphere.js`

- Modeled on the existing `backfill-images.js` pattern: dotenv-first dynamic imports, DRY_RUN default with `--run` to commit, `--limit N`, `--only-empty-vibe`, `--only-missing-energy`, 1s throttle between events.
- Targets union of (`energy_level IS NULL`) ∪ (`vibe_tags = '{}'`) — both populations get the same treatment.
- Text-only mode: stitches TITLE + VENUE + DATE + ORGANIZER + TAGLINE + SUMMARY + DESCRIPTION + ORGANIZER COPY into a labeled context block, passes `screenshot: null`. Avoids re-fetching source URLs (slow, brittle, some 404). Skips events with <120 chars of context.
- Calls `runAnalyzer(atmosphereAnalyzer, ctx)` so the validateData hook runs automatically.
- Updates only the fields the analyzer actually returned values for. `ATMOSPHERE_DB_FIELDS` kept inline (decoupled from `analyzer.fields`) for explicit control on this destructive backfill.
- Structured logging: `[backfill:atmosphere][N/total]` prefix on every line.

#### 3. Prompt hardening (Path B mid-session pivot)

After the first smoke test, ~80% of re-analyzed events came back with empty `vibe_tags` because GPT-4o-mini's pre-existing prompt produced free-text adjectives ("casual", "lively", "engaging") that all got dropped by validateData. Two paths offered: (A) ship the backfill anyway, accept the empty arrays, or (B) tighten the atmosphere prompt first. **User chose B.**

Process:
1. Queried `tag_cleanup_log` to surface the top 60 hallucinated values per field (data-driven, not guessed).
2. Rewrote `atmosphere.js` extractionSchema descriptions for `vibe_tags` and `subcultures` with:
   - **CRITICAL RULES** numbered list (must pick from list, empty is OK, list of banned words by name)
   - **TRANSLATION GUIDE** mapping the model's instinct → canonical replacement (e.g., "lively"→"hype", "casual"→"chill", "punk"→"punk-diy", "comedy"→leave empty)
   - Concrete event examples with exact arrays
3. Re-tested on 5 events: **5/5 success, 0-1 invalid tags dropped per event** (vs ~all invalid before).

### Final results (verified via SQL)

| Field | Before | After |
|---|---|---|
| Events with `energy_level IS NOT NULL` | 150 / 238 (63%) | **238 / 238 (100%)** |
| Events with non-empty `vibe_tags` | ~84 / 238 (35%, of which all were hallucinated) | **238 / 238 (100%)** |
| Events with non-empty `subcultures` | similar | 173 / 238 (73%, prompt actively allows empty) |
| Hallucinated vibe values in DB | 50 distinct | **0** |
| Hallucinated subculture values in DB | 106 distinct | **0** |
| Avg vibe tags per event | n/a | 2.07 |
| Avg subcultures per event | n/a | 1.73 |
| Distinct vibes in active use | n/a | 14 / 18 |
| Distinct subcultures in active use | n/a | 17 / 23 |

**Backfill cost**: $0.143 total ($0.0009/event), 134 events, ~36 min runtime, 0 failures.

**Cleanup migration impact**: 499 vibe_tag drops + 209 subculture drops across 150 events.

### What was found and fixed mid-session

- **Empty-vibe gotcha**: caught during smoke test. Fixed by rewriting extractionSchema descriptions before the full backfill, not after. Saved having to re-run 134 events twice.
- **Backfill scope expansion**: original roadmap target was "86 events with NULL energy_level". After running the cleanup migration we realized 68 additional events would have empty `vibe_tags` despite having energy scores (their entire vibe array was hallucinated and got cleared). Expanded the backfill query to target both populations → 154 total, ended at 134 after sample runs.

### Things noted but NOT fixed (deferred to R1 or beyond)

- **Vocab gaps**: `experimental` and `corporate` vibes are now zero-use post-backfill. Either (a) Milwaukee event mix legitimately lacks them, (b) the prompt's translation table doesn't surface them well, or (c) the vocab itself is wrong. Worth a one-line nudge in the description if R1 wants long-tail coverage.
- **Concentration**: `chill` (142) + `hype` (131) account for ~60% of vibe tagging. Binary anchor by design — vocab doesn't have much middle ground. Not a bug, but worth flagging if filter UX feels too coarse.
- **Subgenres**: model wanted to use `metal` / `alternative` / `comedy` extensively for subcultures. None of these have canonical equivalents. Vocab might benefit from a `comedy` subculture in a future revision; punted.
- **Stubborn offender**: `community` still slips through occasionally as a vibe despite being in the banned list. Validate hook catches it cleanly. Acceptable.

### Session R1 checklist additions (from A2 work)

- [ ] Verify `tag_cleanup_log` retained — should NOT be dropped by any future migration
- [ ] Verify the migration's inline vocab is still byte-identical with `backend/lib/vocabularies.js`
- [ ] Verify `atmosphere.js` description translation table is still accurate against the latest `tag_cleanup_log` data (re-query top hallucinations)
- [ ] Spot-check 10 random events: do their vibe_tags actually match their description? (validate the prompt isn't producing technically-canonical-but-wrong tags)
- [ ] Decide: do `experimental` and `corporate` vibes need prompt nudges, vocab removal, or are they legitimately rare?

### Files touched

| File | Status |
|---|---|
| `happenlist_scraper/backend/lib/vocabularies.js` | A1 (created) |
| `happenlist_scraper/backend/lib/validate-tags.js` | A1 (created) |
| `happenlist_scraper/backend/analyzers/base.js` | A1 (added validateData hook) |
| `happenlist_scraper/backend/analyzers/atmosphere.js` | A1 (validateData) + A2 (prompt hardening) |
| `happenlist/supabase/migrations/20260411_1220_cleanup_hallucinated_tags.sql` | A2 (created + applied) |
| `happenlist_scraper/backend/scripts/reanalyze-atmosphere.js` | A2 (created + executed) |

---

## Session B1 — Happenlist query layer extension (✓ shipped)

**Repo**: `happenlist`
**Date completed**: 2026-04-11

### What shipped

#### 1. `src/lib/constants/vocabularies.ts` (NEW)

TypeScript mirror of `happenlist_scraper/backend/lib/vocabularies.js`. Header comment marks it as `MIRROR OF: …` and lays out the cross-repo + cross-file coupling rules. Exports:

- `VIBE_TAGS` (18) — `as const` readonly tuple, with `VibeTag` union type
- `SUBCULTURES` (23) — `as const` tuple + `Subculture` union
- `NOISE_LEVELS` (4) — `as const` tuple + `NoiseLevel` union
- `GOOD_FOR_SLUGS` (14) — `as const` tuple + `GoodForSlug` union
- Type guards: `isVibeTag`, `isSubculture`, `isNoiseLevel`, `isGoodForSlug`
- Generic `filterToVocab(values, guard)` helper for boundary-layer cleanup

Values are byte-identical with the scraper source (verified manually). The four vocabularies are TypeScript-side source of truth for filter UIs and query params — no inline magic strings anywhere downstream.

#### 2. `src/types/good-for.ts` (refactored — no behavior change)

Was previously the source of truth for `GOOD_FOR_SLUGS` (computed via `.map(t => t.slug)` on the rich UI metadata array). Refactored to **import** `GOOD_FOR_SLUGS` and `GoodForSlug` from `vocabularies.ts` instead, and types the `GoodForTag.slug` field as `GoodForSlug` so any drift between the slug list and the UI metadata file fails compilation. The file still owns the rich UI metadata (label, description, icon, color) — only the slug list moved.

Re-exports `GOOD_FOR_SLUGS` from its module so existing imports via `@/types` keep working without churn (verified: 3 components import `GOOD_FOR_TAGS` and 1 file re-exports `GOOD_FOR_SLUGS` — none break).

#### 3. `src/lib/constants/interest-presets.ts` (NEW)

9 presets, each `{ id, label, description, goodFor: GoodForSlug[] }`:

| id | label | goodFor |
|---|---|---|
| `crafty-and-artsy` | Crafty & artsy | `creatives` |
| `foodies` | Foodies | `foodies` |
| `date-night` | Date night | `date_night` |
| `solo-friendly` | Solo-friendly | `solo_friendly` |
| `family-chaos` | Family chaos | `families_young_kids`, `families_older_kids` |
| `live-music` | Live music | `music_lovers` |
| `outdoors` | Outdoors | `outdoorsy` |
| `budget-friendly` | Budget-friendly | `college_crowd` |
| `first-timer` | First-timer | `first_timers` |

The `vibeTags` field on the `InterestPreset` interface exists but is unused in B1 — it's reserved for Phase 3 / Session B7 when atmosphere data is clean and the vibe filter UI ships. Documented in the file header.

Helpers exported: `getInterestPreset(id)` (returns `null` for stale ids), `resolveInterestPresetGoodFor(id)` (returns `[]` for stale ids — get-events.ts treats this as "no preset filter" so old/shared URLs never crash).

Module-load `Map<id, preset>` for O(1) lookup.

#### 4. `src/lib/constants/time-of-day.ts` (NEW)

Buckets per roadmap:

- `morning` → 5, 6, 7, 8, 9, 10, 11
- `afternoon` → 12, 13, 14, 15, 16
- `evening` → 17, 18, 19, 20
- `late_night` → 21, 22, 23, 0, 1 (wraps midnight)

Hours 2, 3, 4 belong to no bucket — almost no events start then, documented in the file header.

Exports:
- `TIME_OF_DAY_VALUES` tuple + `TimeOfDay` union
- `TIME_OF_DAY_HOURS`, `TIME_OF_DAY_LABELS`, `TIME_OF_DAY_RANGE_LABELS` records
- `isTimeOfDay()` type guard
- `getLocalHourChicago(utcDatetime)` — returns 0–23 in Chicago local time, NaN for unparseable input. **DST-aware via the Intl API.** Uses a module-level cached Intl formatter (constructing one is non-trivial; this gets called per-event during post-fetch filtering).
- `matchesTimeOfDay(utcDatetime, buckets)` — JS predicate, multi-bucket OR semantics, empty array means no filter
- `getTimeOfDaySqlPredicate(buckets)` — forward-compatibility breadcrumb. Returns the canonical SQL string `EXTRACT(HOUR FROM start_datetime AT TIME ZONE 'America/Chicago') IN (…)` for the future RPC/generated-column promotion. **Not used by get-events.ts today** — see file header for why B1 ships JS-side filtering.

The header comment is a full 30-line essay explaining the timezone gotcha (DB stores UTC, events are Chicago, DST varies UTC-5↔UTC-6) and why we ship JS post-fetch filtering instead of an RPC in B1. R1 will care about this.

#### 5. `src/types/filters.ts` (extended)

Added three new params to `EventFilters`:

- `goodFor?: string | string[]` — was `string`. Type kept loose so URL params and form data flow in without coercion. Runtime validation in get-events.ts via `isGoodForSlug` drops unknowns.
- `timeOfDay?: string | string[]` — same loose type, validated via `isTimeOfDay`.
- `interestPreset?: string` — resolves to a goodFor union via interest-presets.ts; stale ids silently no-op.

JSDoc on every new param explains: accepted values, multi-value semantics, why the type is loose, and the merge behavior of `goodFor + interestPreset`. R1's "could a fresh session add a param without reading surrounding code" test should pass.

#### 6. `src/data/events/get-events.ts` (extended)

- Imports `isGoodForSlug`, `GoodForSlug` from vocabularies; `isTimeOfDay`, `matchesTimeOfDay`, `TimeOfDay` from time-of-day; `resolveInterestPresetGoodFor` from interest-presets.
- New helper `normalizeStringArray<T>(value, guard)` — coerces `string | string[] | undefined` into a deduped, type-narrowed array, dropping anything that fails the guard. Defensive against stale URL params.
- New helper `resolveGoodForFilter(goodFor, interestPreset)` — merges direct slugs + preset expansion into a single deduped slug union (`Set` dedupe).
- Replaced the old `query.contains('good_for', [goodFor])` (single-value) with `query.overlaps('good_for', goodForSlugs)` (multi-value, ANY-match). For 1-element arrays, `&&` and `@>` are semantically identical — backward compatible.
- New post-fetch JS filter: `events.filter(e => matchesTimeOfDay(e.start_datetime, timeOfDayBuckets))`, runs **before** `collapseSeriesInstances` so collapse doesn't pick a "next upcoming date" that fails the bucket filter.
- `needsOverFetch` now triggers when `collapseSeries` OR `timeOfDayBuckets.length > 0` — both shrink the result set post-fetch and need the 3x over-fetch + manual pagination treatment.
- Restructured the bottom of the function: collapse + manual pagination is now ONE branch (`if (needsOverFetch)`) instead of being tangled with the early-return for the collapse case. Fixes a pre-existing latent bug where time-of-day filtering without collapseSeries would have leaked the over-fetched result set.
- Replaced the noisy `📋 [getEvents]` log with a single structured `[get-events] applied filters: {…}` line per CLAUDE.md convention. Only non-default filters are emitted (low noise floor). The end-of-function log is now `[get-events] returning N events …`.

### Smoke test results

A temporary `scripts/smoke-test-b1.ts` exercised every helper end-to-end (52 assertions, all PASS):

- **Vocabulary tuples**: counts match scraper (18/23/4/14)
- **Type guards**: accept canonical values, reject hallucinations from `tag_cleanup_log` ("lively", "punk diy")
- **Time-of-day Intl conversion**: CDT (April) and CST (January) both compute the right local hour. Invalid datetimes return NaN.
- **Bucket membership**: every advertised hour in every bucket round-trips correctly. Hour 2-4 gap zone correctly matches nothing.
- **SQL predicate**: well-formed string with EXTRACT + America/Chicago, multi-bucket dedupes and sorts hours.
- **Preset resolution**: all 9 presets resolve to non-empty, all-valid slug unions. `family-chaos` correctly resolves to both age groups. Stale id `'not-a-real-preset'` returns empty array (no crash).

Smoke test deleted after passing per the B1 prompt directive. The assertions that mattered most (the midnight quirk, see below) are preserved as inline file-level comments so the bug can't silently regress.

Production-DB verification via Supabase MCP (project `yrgzzipqnwnohbormprz`, 197 upcoming events at time of test):

| Query pattern | Count |
|---|---|
| baseline upcoming | 197 |
| `good_for && ARRAY['foodies']` | 12 |
| `good_for && ARRAY['foodies','date_night']` | 21 |
| `good_for && ARRAY['families_young_kids','families_older_kids']` (family-chaos preset) | 47 |
| `EXTRACT(HOUR FROM start_datetime AT TIME ZONE 'America/Chicago') IN (17,18,19,20)` (evening) | 55 |
| `EXTRACT(HOUR …) IN (0,1,21,22,23)` (late_night wrap) | 2 |

All counts move in the expected direction. The `&&` operator works through Supabase JS client `.overlaps()`. The EXTRACT predicate is documented in the time-of-day file header for the future RPC migration; today's runtime uses the Intl-based JS predicate which was independently verified to match the same hours.

### Bugs found and fixed mid-session

1. **Midnight quirk in `getLocalHourChicago()`** — caught by the smoke test's bucket-coverage pass. `Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false })` returns the string `"24"` for midnight rather than `"0"`, because en-US doesn't have a "0" in 12-hour mode. Without normalization, every event starting at exactly midnight Chicago time would have failed the late_night bucket filter (which expects 0..1 + 21..23). Fixed by `hour % 24` after parsing, with a 12-line header comment in time-of-day.ts explaining the quirk so it can't silently regress. **This is exactly the kind of timezone bug R1 was warned about.**

2. **Latent over-fetch bug pre-existing in get-events.ts** — when `collapseSeries` was false but a post-fetch filter was active (which would have only happened after B1 added time-of-day), the function returned the un-paginated over-fetched 3x result set. Restructured the bottom of the function so collapse + manual pagination + over-fetch are one unified branch keyed off `needsOverFetch`. Pre-existing condition; not user-visible because no caller could trigger the bad state until B1.

### Things noted but NOT fixed (deferred to R1 or later)

- **Backward-compat type loosening**: `goodFor?: string | string[]` is intentionally not narrowed to `GoodForSlug | GoodForSlug[]`. This was a deliberate trade per the B1 prompt — URL search params (`Promise<{ goodFor?: string }>`) flow in directly without coercion at the call site, and the runtime validator drops unknowns. The cost is one less compile-time check at the consumer; the benefit is that stale shared URLs never crash and no churn in `src/app/events/page.tsx`. R1 should sanity-check this.

- **Existing single-string `goodFor` callers**: `src/app/events/page.tsx` still passes the URL-param string directly. It now flows through `normalizeStringArray + isGoodForSlug` and is silently no-op'd if the value is invalid. This is the intended behavior per the prompt's "stale URLs must not crash" rule.

- **Pre-existing `includeLifestyle === 'only'` over-fetch consideration**: this filter also shrinks the result set post-fetch, but does NOT trigger `needsOverFetch`. In practice every page that uses `'only'` ALSO sets `collapseSeries: true`, so it's covered by the existing branch. Documented as an R1 gotcha.

- **`collapseSeriesInstances` re-sort**: collapse re-sorts by `instance_date` regardless of the requested `orderBy`. When `orderBy === 'popular'` is combined with `collapseSeries: true`, the popularity sort is silently destroyed. Pre-existing condition, not B1 scope, but worth a one-line note in R1.

- **3x over-fetch heuristic**: arbitrary multiplier. At Milwaukee's current event volume (~200 upcoming) the over-fetch reaches the entire DB and the heuristic is fine. At 10x growth this becomes a real concern — at that point time-of-day should move to a generated column or RPC to avoid the over-fetch entirely. Documented in get-events.ts.

- **`scripts/` directory**: the temporary smoke-test was deleted, but `scripts/venue-import` remains as an existing artifact unrelated to B1.

### Files touched

| File | Status |
|---|---|
| `src/lib/constants/vocabularies.ts` | NEW |
| `src/lib/constants/interest-presets.ts` | NEW |
| `src/lib/constants/time-of-day.ts` | NEW |
| `src/types/good-for.ts` | refactored to import from vocabularies.ts |
| `src/types/filters.ts` | added 3 new params to EventFilters |
| `src/data/events/get-events.ts` | new params, new helpers, restructured pagination, new logging convention |

### Session R1 checklist additions (from B1 work)

- [ ] Verify `vocabularies.ts` is byte-identical with `happenlist_scraper/backend/lib/vocabularies.js` (the 4 vocab arrays — VIBE_TAGS, SUBCULTURES, NOISE_LEVELS, GOOD_FOR slugs). Drift = filter UI quietly excludes valid events.
- [ ] Verify the `% 24` midnight normalization is still in `getLocalHourChicago`. It's the only thing standing between us and silent late_night filter breakage.
- [ ] Verify the 3x over-fetch is enough at current data volume (197 upcoming events) — query a time-of-day filter that returns ~0-3 matches and confirm the page isn't sparse.
- [ ] Check `src/app/events/page.tsx` still receives string-typed URL params correctly post-loosening. (Already verified at session end via `tsc --noEmit` — zero new errors. Pre-existing errors are all in the `src/lib/supabase/types 3.ts` Finder duplicate, untouched by B1.)
- [ ] Confirm `interestPreset + goodFor` merge semantics behave as documented for a stale preset id paired with a valid goodFor (should return goodFor matches alone, not crash).
- [ ] Confirm `collapseSeries: true` + `timeOfDay: 'evening'` + a multi-day series returns the soonest evening instance, NOT the soonest overall instance that happens to be morning.
- [ ] Audit: every new `[get-events]` log line uses the structured prefix per CLAUDE.md.
- [ ] When B2 wires up the filter UI, verify URL param encoding for the multi-value forms (`?goodFor=foodies&goodFor=date_night` vs `?goodFor=foodies,date_night`). Whatever B2 picks, get-events.ts must accept it — `normalizeStringArray` handles both since searchParams in Next.js can return `string | string[]`.
- [ ] Note: `Intl.DateTimeFormat` is initialized once at module load. If B3 ever adds tests, they should not stub time the module is loaded — the formatter binds to the runtime locale.

---

## Session B2 — Filter v1 UI + Past Instances (✓ shipped)

**Repo**: `happenlist`
**Date completed**: 2026-04-11

### What shipped

#### 1. Filter primitives — `src/components/events/filters/`

A self-contained module that owns URL ↔ in-memory state, presentational chips, the persistent bar, the modal drawer, and the empty state. Six new files plus a barrel export. Every file has the AI-dev header comment.

- **`types.ts`** — `FilterState` interface (multi-value fields are always arrays, never undefined; single-value fields use undefined for "not set"). `EMPTY_FILTER_STATE` constant. `countActiveFilters(state)` and `hasAnyActive(state)` helpers — search query (`q`) is intentionally NOT counted because the filter chip badge is for filters, not search. One source of truth for "is this state actually filtering anything".

- **`use-filter-state.ts`** — `parseFiltersFromParams(searchParams)`, `serializeFiltersToParams(state)`, and the `useFilterState()` React hook. The hook reads `useSearchParams()` once per render, parses to `FilterState`, and exposes a small mutator API: `setState`, `toggleArrayValue`, `setSingle`, `toggleBool`, `removeOne`, `clearAll`. Every mutation calls `router.replace(url, { scroll: false })` (NOT `push` — avoids back-button history pollution and keeps scroll position). `clearAll()` preserves the search query so clearing filters doesn't blow away the user's typed search.

- **`filter-chip.tsx`** — presentational pill button. Props: label, active, onClick, optional icon, optional `onRemove` for the trailing × variant. Active state uses the canonical `bg-blue/10 border-blue text-blue font-semibold` from CLAUDE.md. Two sizes (`sm` for the empty state inline chips, `md` for the filter bar). No URL or hook awareness — pure presentation, fully testable.

- **`filter-section.tsx`** — labeled grouping primitive used inside the drawer. Renders `<h3>` + optional inline "Clear" link + a flex-wrap chip group. Used 6 times in the drawer (Category, Good for, Vibe, Noise level, Quick filters, Membership benefits). Single shared layout = no per-section drift.

- **`filter-bar.tsx`** — the persistent top bar. Three rows on mobile: (1) search input + drawer trigger, (2) interest preset chips (9), (3) time-of-day chips (4) + Free toggle. Categories deliberately live in the drawer, not the bar — three rows of pills competing for attention is bad UX, and the B1 headline features (presets + time-of-day) deserve the prime real estate. Search uses local `searchDraft` state and commits on form submit/blur via `setSingle('q', ...)` to avoid filter-spam on every keystroke.

- **`filter-drawer.tsx`** — Radix Dialog (`@radix-ui/react-dialog ^1.1.15`, already installed). Mobile: bottom sheet (`inset-x-0 bottom-0 h-[85vh] rounded-t-2xl`). Desktop: right side panel (`md:inset-y-0 md:right-0 md:left-auto md:bottom-auto md:h-full md:w-[420px]`). Five sections: Category (single), Good for (multi, 14 tags), Vibe (single, 18 vibes from `VIBE_TAGS`), Noise level (single, 4 from `NOISE_LEVELS`), Quick filters (5 boolean toggles: solo-friendly, beginner-friendly, no tickets needed, drop-in OK, family-friendly), Membership benefits (boolean + org dropdown). Sticky footer with "Clear all" + "Done" — Done just closes since every chip click already wrote to the URL (no separate apply step needed). Trigger button shows a count badge when `activeCount > 0`. Exports `FilterDrawerCategory` and `FilterDrawerMembershipOrg` slim prop types — server projects heavy DB rows down to these so the client bundle stays small.

- **`empty-filter-state.tsx`** — what the page renders when `total === 0`. Lists every active filter as an individual chip with × buttons that call back into `useFilterState()` (`removeOne`, `setSingle`, `toggleBool`). Uses `categoryNameById` and `membershipOrgNameById` lookup maps passed from the server (avoids shipping full row data through props). Falls back to a generic "No events found" if `hasAnyActive` is false (defensive — the parent should not render this when there are zero filters AND zero results, but it handles it safely either way). "Clear all filters" button at the bottom calls `clearAll()`.

- **`index.ts`** — barrel export with documented module purpose.

#### 2. PastInstances — `src/components/events/past-instances.tsx`

Server component, async function. Props: `seriesId`, `excludeEventId`, optional `title='Past dates'` and `limit=6`. Calls `getPastSeriesInstances` from the data layer and **returns null** when the result is empty so the parent page renders no heading at all. Renders a 5-row divided list (icon + section heading + count + per-instance Link with formatted date). Uses `buildEventUrl` so links match the rest of the app's URL convention. `formatPastDate` defensively handles null `instance_date` with a fallback to `start_datetime`, and try/catches Date parsing so bad data can't crash the detail page.

#### 3. Data layer extension — `src/data/series/get-series-detail.ts`

Added `PastSeriesInstance` interface and `getPastSeriesInstances(seriesId, excludeEventId, limit=6)`. Filters: `series_id = $1`, `status = 'published'`, `deleted_at IS NULL`, `id != excludeEventId`, `instance_date < today`. Order: `instance_date DESC`. Returns `[]` (not null) on error so callers can rely on `.length === 0` for the empty check. Logs `[getPastSeriesInstances]` prefix per the CLAUDE.md convention. Exported via `src/data/series/index.ts` along with the type.

#### 4. Wiring — `src/app/events/page.tsx` (full rewrite)

The server component is now the orchestration layer between URL state and the new filter UI. Updated `searchParams` interface to accept `interestPreset?: string` and the multi-value `goodFor?: string | string[]` / `timeOfDay?: string | string[]` shapes. Added `toArray()` helper to coerce to arrays. Builds slim `drawerCategories` and `drawerMembershipOrgs` projections from the full DB rows (just `id`, `name`, `slug`, `event_count`) — keeps the client bundle small. Builds `categoryNameById` and `membershipOrgNameById` lookup maps for the empty state's chip labels.

- Renders `<FilterBar>` outside the Container so it can be sticky-friendly + full-width.
- Renders `<EmptyFilterState>` when `total === 0` instead of the generic empty grid.
- Otherwise renders `<EventGrid>` as before.
- Pagination converted from `<a>` tags to `<Link>` with a `pageUrl()` builder that preserves all current params (including multi-value arrays).
- Active filter count badge in the page header when more than 1 filter is set.
- Title generation handles the new `interestPreset` case (`presetMeta.label`).
- Breadcrumbs handle the preset case.

#### 5. Wiring — `src/app/event/[slug]/page.tsx`

Added `PastInstances` to the existing `@/components/events` import. Mounted between the Series Details block and the VibeProfileSection:

```tsx
{event.series_id && (
  <PastInstances seriesId={event.series_id} excludeEventId={event.id} />
)}
```

The `series_id` guard ensures the component is only mounted when there's a series at all — and the component itself returns null when there are no past instances, so no heading or wrapper renders for events whose series hasn't started yet.

### Verification

- **`tsc --noEmit`**: clean (filtered out the pre-existing Finder-duplicate noise from `*  2.tsx` files — those are not B2's problem and existed before this session).
- **Browser preview** (`localhost:3000`):
  - `/events` renders with FilterBar visible: 9 interest preset chips + 4 time-of-day buckets + Free toggle.
  - Clicking the **Foodies** preset updates URL to `?interestPreset=foodies` and filters results.
  - Multi-value confirmed: clicking Morning + Evening + Foodies produces `?interestPreset=foodies&timeOfDay=morning&timeOfDay=evening` — the multi-value URL convention works end-to-end through the hook + `serializeFiltersToParams` + `getEvents` + the JS post-fetch time-of-day filter.
  - Drawer opens with all 5 sections rendered and all 56 chips present.
  - Empty state confirmed: stacking 7 incompatible filters yields "0 events found" + "No events match these filters" heading + 7 individual chip × buttons + "Clear all filters" button.
  - "Clear all" resets the URL to `?` cleanly.
  - PastInstances correctly returns null on `/event/milwaukee-makers-market-2026-season-…` and `/event/deray-davis-…` — both tested events have series whose first instance is in the future (so `instance_date < today` returns 0 rows). The null branch is exercised; the rendering branch is well-typed and has no observable past-instance event in the current dataset to demo (Milwaukee dataset is heavily future-loaded right now). The SQL is straightforward enough that R1 can verify it directly against a backfilled instance if needed.
  - Zero console errors throughout.

### Things noted but NOT fixed (deferred to R1)

- **Finder duplicates**: the repo has a pile of `* 2.tsx` / `* 3.ts` files that macOS Finder created during the previous session. They're untracked, they emit tsc errors when included, and they're not part of B2. R1 should `git clean -n` to preview, then delete these in one shot.
- **Sticky FilterBar**: the bar is rendered above the Container but isn't actually sticky-positioned yet. Adding `sticky top-0 z-40` to the bar wrapper is a one-line change but needs a careful pass on the page header / scroll behavior. Punted to R1's UX-polish bucket.
- **Drawer focus trap**: Radix Dialog handles focus trapping, but the chip click handlers don't currently shift focus back to anything intentional after click — Radix's default behavior (focus stays where the user clicked) is fine for now. R1 should test with a screen reader if accessibility is in scope.
- **Search debouncing**: the search input commits on submit/blur. If R1 wants live filtering, debounce 300ms — the URL replace plus server re-render is cheap enough.
- **Drawer close on outside-click**: Radix default = close on escape + outside click. Verified visually, no issues.
- **Drawer "Done" button**: largely vestigial since the URL is already updated by the time the user taps it. Kept for mobile UX (gives a clear escape hatch). R1 may want to A/B this.
- **`activeFilterCount` display threshold**: currently shows the badge when count > 1, hiding it for the single-filter case. This was a deliberate UX choice (one filter doesn't need a badge) but R1 should sanity-check.
- **EmptyFilterState chip removal for the search query**: search query has its own × in the filter bar, so the empty state intentionally doesn't list it. Documented inline.
- **Edge case**: if a stale URL has `interestPreset=does-not-exist`, `getInterestPreset` returns null and the title falls through to the default. The preset chip in the drawer won't appear "active". The empty state currently shows nothing for stale presets — fine, but worth a one-line note in R1.

### Files touched

| File | Status |
|---|---|
| `src/components/events/filters/types.ts` | NEW |
| `src/components/events/filters/use-filter-state.ts` | NEW |
| `src/components/events/filters/filter-chip.tsx` | NEW |
| `src/components/events/filters/filter-section.tsx` | NEW |
| `src/components/events/filters/filter-bar.tsx` | NEW |
| `src/components/events/filters/filter-drawer.tsx` | NEW |
| `src/components/events/filters/empty-filter-state.tsx` | NEW |
| `src/components/events/filters/index.ts` | NEW |
| `src/components/events/past-instances.tsx` | NEW |
| `src/components/events/index.ts` | added PastInstances export |
| `src/data/series/get-series-detail.ts` | added getPastSeriesInstances + PastSeriesInstance type |
| `src/data/series/index.ts` | exported getPastSeriesInstances + PastSeriesInstance |
| `src/app/events/page.tsx` | full rewrite — wires FilterBar/EmptyFilterState, adds toArray, slim projections |
| `src/app/event/[slug]/page.tsx` | mounted `<PastInstances>` between Series Details and VibeProfile |

### Session R1 checklist additions (from B2 work)

- [ ] Delete the macOS Finder duplicate files (`* 2.tsx`, `* 3.ts`, etc.) — they're polluting tsc output and confusing the file tree.
- [ ] Make the FilterBar `sticky top-0 z-40` (one-liner) and verify the page header still looks right when scrolled.
- [ ] Verify URL multi-value parsing on a real shared link: open `/events?goodFor=foodies&goodFor=date_night&timeOfDay=evening` in a fresh tab and confirm both arrays parse to length 2 / 1.
- [ ] Confirm the FilterBar's `activeCount` matches the page header's `activeFilterCount` (they're both computed from `countActiveFilters` but via different paths — server counts from `searchParams`, client counts from `parseFiltersFromParams(useSearchParams())`).
- [ ] Test on a phone (or 375px viewport): drawer bottom sheet, sticky bar, chip wrap behavior.
- [ ] Verify PastInstances renders correctly on a series that DOES have past instances (find one via SQL once R1 has DB access) — current dataset is future-loaded so the rendering branch wasn't visually exercised in B2.
- [ ] Verify `clearAll()` actually preserves `q` (intended behavior, but worth a manual confirmation).
- [ ] Verify a stale `interestPreset=foo` URL doesn't crash and doesn't show a "filtered" empty state badly.
- [ ] Audit the FilterDrawer for accessibility: aria-labels on chips, focus trap, escape-to-close, tab order.
- [ ] Confirm search debounce (or lack thereof) feels right — submit-on-blur is the current behavior.

---

## Session B3 — View tracking infrastructure (✓ shipped)

**Repo**: `happenlist`
**Date completed**: 2026-04-11

### What shipped

#### 1. Migration — `supabase/migrations/20260411_1900_event_views.sql`

New `event_views` table + `record_event_view` Postgres function. Applied to remote DB via the Supabase MCP `apply_migration` tool (no Supabase branching workaround needed this time — the API was healthy).

**Schema:**
- `id          bigserial pk`
- `event_id    uuid not null fk → events(id) on delete cascade`
- `viewed_at   timestamptz not null default now()`
- `session_id  text not null` — anonymous client session id from the `hl_sid` cookie
- `user_id     uuid nullable` — set when an authenticated user is viewing (Phase 3+ may use this)
- `view_date   date generated always as ((viewed_at AT TIME ZONE 'America/Chicago')::date) stored` — Chicago-local calendar date

**Indexes:**
- `event_views_event_session_day_uidx` UNIQUE on `(event_id, session_id, view_date)` — enforces "1 view per session per event per day". Reload spam = 1 row, not 50.
- `event_views_event_viewed_at_idx` on `(event_id, viewed_at DESC)` — for the future Phase 3 trending query "rows for event X in the last 7 days".

**RLS:**
- INSERT granted to `anon` + `authenticated` (anyone visiting an event page records a view). The unique index is the dedup safety net.
- SELECT / UPDATE / DELETE NOT granted. The `/admin/views` dashboard goes through `createAdminClient()` (service role) which bypasses RLS, matching the existing admin pattern in the project.

**Function:**
- `record_event_view(p_event_id uuid, p_session_id text, p_user_id uuid default null) → boolean`
- `SECURITY DEFINER`, `search_path = public` (Supabase advisor hygiene)
- Defensive bail on null/empty inputs
- `INSERT … ON CONFLICT (event_id, session_id, view_date) DO NOTHING RETURNING id` — returns `true` if a row was inserted, `false` if a duplicate was silently skipped
- Owner: `postgres`. EXECUTE granted to `anon` + `authenticated`. PUBLIC revoked.

**Smoke test (production DB, via execute_sql):**
- 1st call → `true`, row appears
- 2nd call (same args) → `false`, count remains 1
- After cleanup, table is empty

#### 2. Server action — `src/data/events/record-view.ts`

`'use server'` action `recordEventView(eventId)`. Handles three things in one place:

1. **Anonymous session id**: reads the `hl_sid` cookie via `cookies()`, generates a fresh `sess_<16 hex>` id if absent, sets the cookie with `path=/`, `maxAge=1y`, `sameSite=lax`, `httpOnly=false`, `secure` only in production. Server actions CAN set cookies (unlike server components), so this works.

2. **Idempotent reuse**: if the cookie already exists, the action reuses it — same browser session = same id across navigations.

3. **Failure isolation**: a try/catch wraps the entire body. View tracking failures NEVER throw — the function returns `false` and logs `[event-views]` lines per the CLAUDE.md convention.

The session id generator uses `crypto.getRandomValues(new Uint8Array(8))` (Web Crypto, available in the Next.js Node 18+ runtime) — no Node `crypto` shim needed.

Logging: success → `[event-views] inserted view event=<id> session=<short>…`; duplicate → `[event-views] duplicate (skipped) …`; error → `[event-views] rpc error …` or `[event-views] unexpected failure …`. Session id is truncated to 12 chars in logs to avoid filling log lines with cookie material.

#### 3. Client component — `src/components/events/view-tracker.tsx`

`'use client'` component `<ViewTracker eventId={...} />`. Returns `null` — exists purely for its side effect.

- `useEffect` fires `recordEventView(eventId)` on mount
- `useRef` sentinel suppresses the React 18+ strict-mode double-mount in dev (the DB unique index would catch the duplicate, but the round-trip is wasteful)
- `void` on the action call to suppress lint about unawaited promise — fire and forget, action does its own logging

Header comment marks this as "the ONLY mounting point for view tracking. If you add new event detail surfaces, mount this there too." Exported via `src/components/events/index.ts`.

#### 4. Wiring — `src/app/event/[slug]/page.tsx`

Mounted `<ViewTracker eventId={event.id} />` immediately inside the top-level fragment, right above `<EventJsonLd>`. Zero visual impact. Works on every detail page render. Comment block explains the mount point convention.

#### 5. Sanity dashboard — `src/app/admin/views/page.tsx`

Server component, gated by `requireSuperadminAuth()` (throws if not authenticated as superadmin — matches the rest of the admin pages).

Uses `createAdminClient()` (service role) since RLS denies SELECT to anon/authenticated. Loads four pieces in one server render:
- Total rows (via `head: true` count query)
- Rows in last 24h (`viewed_at >= now() - 24h`)
- Rows in last 7d
- Top 10 events by view count over the last 7d (fetched with `event_id` only and aggregated in JS — Supabase JS doesn't expose GROUP BY directly, and during the bake the row volume is small enough that JS aggregation is fine. Sorts by count descending, then resolves event titles via a single follow-up query)

Renders three top-line stat blocks + the top events list + a footer reminder of the Phase 3 pre-flight target (>1000 rows across >50 events). Pure sanity dashboard — no styling beyond the existing admin pattern.

Try/catches the load so if anything fails it renders zero counts rather than crashing the whole admin shell.

#### 6. Types — `src/lib/supabase/types.ts`

Manually patched to add the `event_views` Tables block (Row/Insert/Update/Relationships) and the `record_event_view` Functions entry. **Did NOT regenerate the full types file** — it's 3.4k lines and the Supabase MCP `generate_typescript_types` output exceeded the token budget. Surgical edit was 50 lines and keeps the typed RPC call working in `record-view.ts`.

R1 should re-verify the manual patch matches what `generate_typescript_types` would produce when convenient (e.g. by saving the output to a file and diffing).

### Verification

- **Migration applied**: confirmed via `apply_migration` returning `{success:true}`. Smoke-tested the function end-to-end: insert→duplicate→count returns the expected `(true, false, 1)` sequence.
- **`tsc --noEmit`**: clean (filtered Finder duplicates).
- **Browser preview**: visited `/event/deray-davis-…` and `/event/milwaukee-makers-market-…` against `localhost:3000`. Cookie verified via `document.cookie` — `hl_sid=sess_ce3e56d4a84732aa` set as expected. DB query confirmed:
  - 1st event load → 1 row inserted (id 3)
  - Reload of same event → still 1 row (idempotent)
  - 2nd event load → 2 rows total (id 3 + id 5), same session_id, distinct event_id
- **Server logs**: confirmed three structured log lines:
  - `[event-views] inserted view event=fbc8e0dd… session=sess_ce3e56d…`
  - `[event-views] duplicate (skipped) event=fbc8e0dd… session=sess_ce3e56d…`
  - `[event-views] inserted view event=f89f7b9f… session=sess_ce3e56d…`
- **Cleanup**: deleted all `sess_*` rows. Table is empty going into B3 commit.
- **/admin/views**: not visually verified end-to-end since the preview isn't logged in as superadmin. The route compiles, gating works, and the queries are straightforward — R1 will hit it with auth.

### Bugs found and fixed mid-session

1. **SELECT-list evaluation order in the smoke test**: my first verification query was `SELECT record_event_view(...) AS first_call, record_event_view(...) AS second_call, (SELECT count(*) ...) AS row_count`. The count subquery returned 0 because Postgres doesn't guarantee left-to-right evaluation of SELECT-list expressions — the planner ran the subquery before the function calls. Re-ran the count as a separate statement and got the expected 1. **Not a bug in the migration**, but a process gotcha for future smoke testing: always run mutating function calls and follow-up SELECTs in separate statements.

2. **bigserial gap allocation under ON CONFLICT**: noticed during cleanup that ids 2 and 4 were "missing" — the table had rows 1, 3, 5 only (after various smoke tests). This is normal Postgres behavior: `bigserial` advances even when `ON CONFLICT DO NOTHING` rejects the row. The sequence is gappy by design and that's fine. Documented here so R1 doesn't get confused if they audit ids.

### Things noted but NOT fixed (deferred to R1 or beyond)

- **No view tracking on parent/child distinction**: the event detail page mounts ViewTracker once per render, so a child event page records a view of the child (correct). If R1 wants the parent to also count when a child is viewed, that's a Phase 3 product decision — current behavior is "view = the page that was loaded", which is the simplest model.
- **No view tracking on lifestyle event detail surfaces**: the only event detail surface today is `src/app/event/[slug]/page.tsx`. There's no lifestyle-only detail variant. If one is added in the future, mount ViewTracker there.
- **No deduping at the action layer for back-to-back identical requests within milliseconds**: if a user double-clicks a Link that re-navigates to the same event, the client component remounts and the action fires again. The DB unique index suppresses the duplicate; the cost is a wasted RPC round-trip. Not worth a per-action throttle.
- **`user_id` always null**: B3 doesn't read the auth session. When Phase 3 cares about authenticated trending personalization, the action should pull the user id from the supabase server client and pass it through. Schema is ready; the wiring is the only missing piece.
- **No cookie-set retry on cross-component re-render**: server actions invoked from client components can set cookies, but if the action is invoked during a server render (e.g. from a server component) the `cookies().set()` call would throw. The current call site is exclusively a client component, so this is fine. The action wraps the set in try/catch with a warn-level log so R1 catches the assumption breaking.
- **No rate limiting on `record_event_view` RPC**: anonymous public endpoint. Worst case is a script slamming the function — the unique index keeps the table size bounded per (session, event, day). Phase 3 can add IP rate limiting if abuse is observed. Documented for R1.
- **`/admin/views` JS-side aggregation has a 10000-row safety limit**: for the bake period (~4 weeks @ low volume) this is wildly overkill. Phase 3 will need a proper SQL `GROUP BY` aggregator (RPC or generated view). Documented inline.
- **Migration name uses 1900 for the timestamp HHMM**: 19:00 UTC = 14:00 Chicago, which is when the migration was authored. Chronologically after the cleanup migration `20260411_1220_…`. Both today.
- **Types regeneration deferred**: manually patched 50 lines into types.ts instead of regenerating the full 3484-line file. Documented above.

### Files touched

| File | Status |
|---|---|
| `supabase/migrations/20260411_1900_event_views.sql` | NEW (applied to remote) |
| `src/data/events/record-view.ts` | NEW |
| `src/components/events/view-tracker.tsx` | NEW |
| `src/components/events/index.ts` | added ViewTracker export |
| `src/app/event/[slug]/page.tsx` | mounted `<ViewTracker>` above EventJsonLd |
| `src/app/admin/views/page.tsx` | NEW (sanity dashboard) |
| `src/lib/supabase/types.ts` | manually patched event_views Tables + record_event_view Functions |

### Session R1 checklist additions (from B3 work)

- [ ] Verify the manual `types.ts` patch matches `generate_typescript_types` output. Simplest: dump the MCP output to a file and diff the event_views + record_event_view sections.
- [ ] Hit `/admin/views` with a real superadmin login. Confirm the auth gate works, the queries don't crash, and the top-events list renders.
- [ ] Confirm the `hl_sid` cookie persists across a hard refresh + a navigation between two different event pages (already verified during B3, but R1 should re-confirm in a clean browser).
- [ ] Confirm the `view_date` generated column flips correctly across the Chicago midnight boundary. Easiest test: insert rows manually with `viewed_at = '2026-04-12 04:30:00+00'` (which is Apr 11 at 23:30 Chicago) and `viewed_at = '2026-04-12 05:30:00+00'` (Apr 12 at 00:30 Chicago) and verify the view_date column is `2026-04-11` and `2026-04-12` respectively.
- [ ] Verify the unique index actually allows the same (event_id, session_id) on a different day. Insert a row with `viewed_at - interval '1 day'` and confirm the second insert succeeds.
- [ ] Audit the RLS: as anon, attempt `SELECT * FROM event_views` and confirm 0 rows are returned (RLS denies).
- [ ] Audit the SECURITY DEFINER function for search-path injection. Already locked to `public`, but worth a re-read.
- [ ] Verify `requireSuperadminAuth()` is the right gate for `/admin/views` (vs a softer `requireAuth()`). I picked superadmin to match the rest of the admin shell, but R1 should sanity-check.
- [ ] Confirm `/admin/views` is reachable from the admin sidebar nav (it currently isn't — would need a sidebar entry added). Decide whether to add a link or leave the page as a known direct-URL shortcut.
- [ ] Spot-check that the JS-side top-events aggregator agrees with a SQL `GROUP BY event_id ORDER BY count DESC` query on a real dataset. (Trivial diff; mostly defensive.)
- [ ] Verify `recordEventView` doesn't cause hydration mismatches or extra layout shifts when fired from useEffect on a heavy event detail page.

---

## Session R1 — _(pending, deliverable: phase-1-report.md compiled from this log)_
