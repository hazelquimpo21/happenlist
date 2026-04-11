/**
 * =============================================================================
 * FILTER STATE TYPES — shared shape for the /events filter UI
 * =============================================================================
 *
 * One source of truth for what a "filter selection" looks like in memory.
 * Used by `use-filter-state.ts` (URL <-> object), the FilterBar/FilterDrawer
 * components, and EmptyFilterState (which renders chips for each active key).
 *
 * NB: This is intentionally an in-memory shape — string arrays, booleans,
 * undefined-when-absent. Conversion to/from URLSearchParams happens in the
 * hook. The events page server component reads URL search params directly
 * and passes them to getEvents() — these types are NOT consumed by the
 * server, only by the client filter UI.
 *
 * Cross-file coupling:
 *   - src/components/events/filters/use-filter-state.ts — parses URL into
 *     FilterState and writes FilterState back to URL via router.replace
 *   - src/components/events/filters/filter-bar.tsx — top sticky bar
 *   - src/components/events/filters/filter-drawer.tsx — advanced drawer
 *   - src/components/events/filters/empty-filter-state.tsx — shown when 0 results
 *   - src/app/events/page.tsx — passes initial state via props
 *
 * If you add a new filter:
 *   1. Add the field here
 *   2. Update parseFiltersFromParams + serializeFiltersToParams in
 *      use-filter-state.ts
 *   3. Update countActiveFilters / hasAnyActive
 *   4. Wire it into either FilterBar (high-frequency) or FilterDrawer
 *      (long tail), and add a chip to EmptyFilterState
 *   5. Make sure src/app/events/page.tsx forwards the URL param to getEvents
 * =============================================================================
 */

/**
 * In-memory filter state. All optional/empty by default.
 *
 * Multi-value fields (goodFor, timeOfDay) are always arrays — never undefined,
 * never `string | string[]`. Single-value fields use undefined for "not set".
 */
export interface FilterState {
  // Search
  q?: string;

  // Category (single)
  category?: string;

  // Interest preset — one preset at a time, expands server-side via B1
  interestPreset?: string;

  // Audience tags — multi-value, ANY-match (B1)
  goodFor: string[];

  // Time-of-day buckets — multi-value, ANY-match (B1, post-fetch JS filter)
  timeOfDay: string[];

  // Price
  isFree: boolean;

  // Vibes / noise / access (single each, legacy)
  vibeTag?: string;
  noiseLevel?: string;
  accessType?: string;

  // Quick toggles
  soloFriendly: boolean;
  beginnerFriendly: boolean;
  noTicketsNeeded: boolean;
  dropInOk: boolean;
  familyFriendly: boolean;

  // Membership
  hasMemberBenefits: boolean;
  membershipOrgId?: string;
}

/** Empty / default filter state — used as the URL-cleared baseline. */
export const EMPTY_FILTER_STATE: FilterState = {
  goodFor: [],
  timeOfDay: [],
  isFree: false,
  soloFriendly: false,
  beginnerFriendly: false,
  noTicketsNeeded: false,
  dropInOk: false,
  familyFriendly: false,
  hasMemberBenefits: false,
};

/**
 * Count active filters for the badge in the FilterBar.
 *
 * Counts each chip individually — `goodFor: ['foodies', 'date_night']` is 2,
 * not 1. Search query (`q`) is intentionally NOT counted (it's a separate
 * input, not a chip).
 */
export function countActiveFilters(state: FilterState): number {
  let n = 0;
  if (state.category) n++;
  if (state.interestPreset) n++;
  n += state.goodFor.length;
  n += state.timeOfDay.length;
  if (state.isFree) n++;
  if (state.vibeTag) n++;
  if (state.noiseLevel) n++;
  if (state.accessType) n++;
  if (state.soloFriendly) n++;
  if (state.beginnerFriendly) n++;
  if (state.noTicketsNeeded) n++;
  if (state.dropInOk) n++;
  if (state.familyFriendly) n++;
  if (state.hasMemberBenefits) n++;
  if (state.membershipOrgId) n++;
  return n;
}

/** True if ANY filter is active (excludes search query). */
export function hasAnyActive(state: FilterState): boolean {
  return countActiveFilters(state) > 0;
}
