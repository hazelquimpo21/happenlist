/**
 * =============================================================================
 * FILTER STATE TYPES + PURE PARSERS — shared shape for the /events filter UI
 * =============================================================================
 *
 * One source of truth for what a "filter selection" looks like in memory,
 * AND the pure URL <-> FilterState parsers used by both sides of the
 * server/client boundary.
 *
 * IMPORTANT: This file MUST remain free of `'use client'` and any imports
 * from React or `next/navigation` runtime code. Both the server (via
 * /events/page.tsx) and the client (via use-filter-state.ts) import from
 * this module — adding a 'use client' boundary here would break the
 * server-side import with "Attempted to call X from the server but X is
 * on the client". The parsers therefore use a structural `SearchParamsLike`
 * type that both `URLSearchParams` and Next's `ReadonlyURLSearchParams`
 * satisfy.
 *
 * Cross-file coupling:
 *   - src/components/events/filters/use-filter-state.ts — wraps the parser
 *     in a React hook, owns router.replace
 *   - src/components/events/filters/filter-bar.tsx — top sticky bar
 *   - src/components/events/filters/filter-drawer.tsx — advanced drawer
 *   - src/components/events/filters/empty-filter-state.tsx — shown when 0 results
 *   - src/app/events/page.tsx — server-side import (count badge); MUST go
 *     through this file, NOT use-filter-state.ts
 *
 * If you add a new filter:
 *   1. Add the field to FilterState
 *   2. Update parseFiltersFromParams + serializeFiltersToParams (this file)
 *   3. Update countActiveFilters / hasAnyActive
 *   4. Wire it into either FilterBar (high-frequency) or FilterDrawer
 *      (long tail), and add a chip to EmptyFilterState
 *   5. Make sure src/app/events/page.tsx forwards the URL param to getEvents
 * =============================================================================
 */

/**
 * Structural type that both `URLSearchParams` and Next's
 * `ReadonlyURLSearchParams` satisfy. Avoids importing from `next/navigation`
 * here (which would risk pulling client-only code into the server bundle).
 */
export interface SearchParamsLike {
  get(key: string): string | null;
  getAll(key: string): string[];
}

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

  // Date range — ISO date strings (YYYY-MM-DD) or empty. Owned by the B1
  // picker's "When" segment. Shorthand labels like "This weekend" are computed
  // into concrete dates at selection time so the server query stays pure.
  // Added 2026-04-22 during B1 redesign (previously read directly off URL
  // params in /events/page.tsx, not tracked in FilterState).
  dateFrom?: string;
  dateTo?: string;

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
  curiousMinds: boolean;
  noTicketsNeeded: boolean;
  dropInOk: boolean;
  familyFriendly: boolean;

  // Membership
  hasMemberBenefits: boolean;
  membershipOrgId?: string;

  // Price tier + age group (Phase 2 B5) — multi-value, ANY-match
  priceTier: string[];
  ageGroup: string[];

  // Geo / distance (Phase 2 B4)
  neighborhood?: string;   // neighborhood slug from milwaukee-neighborhoods.ts, or 'my-location'
  nearLat?: number;        // anchor latitude (from neighborhood or browser geolocation)
  nearLng?: number;        // anchor longitude
  radiusMiles?: number;    // search radius (defaults to 5 in get-events.ts)

  // Tagging expansion (Stage 1) — multi-value arrays + two single-value enums.
  // Slider filters intentionally omitted (admin-only in v1).
  accessibility: string[];
  sensory: string[];
  leaveWith: string[];
  socialMode?: string;
  energyNeeded?: string;
}

/** Empty / default filter state — used as the URL-cleared baseline. */
export const EMPTY_FILTER_STATE: FilterState = {
  goodFor: [],
  timeOfDay: [],
  priceTier: [],
  ageGroup: [],
  accessibility: [],
  sensory: [],
  leaveWith: [],
  isFree: false,
  soloFriendly: false,
  curiousMinds: false,
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
  // Date range counts as one active filter regardless of whether one or both
  // edges are set — matches the "When" segment's behavior in the B1 picker.
  if (state.dateFrom || state.dateTo) n++;
  if (state.interestPreset) n++;
  n += state.goodFor.length;
  n += state.timeOfDay.length;
  if (state.isFree) n++;
  if (state.vibeTag) n++;
  if (state.noiseLevel) n++;
  if (state.accessType) n++;
  if (state.soloFriendly) n++;
  if (state.curiousMinds) n++;
  if (state.noTicketsNeeded) n++;
  if (state.dropInOk) n++;
  if (state.familyFriendly) n++;
  n += state.priceTier.length;
  n += state.ageGroup.length;
  n += state.accessibility.length;
  n += state.sensory.length;
  n += state.leaveWith.length;
  if (state.socialMode) n++;
  if (state.energyNeeded) n++;
  if (state.hasMemberBenefits) n++;
  if (state.membershipOrgId) n++;
  // Geo counts as a single filter (neighborhood or custom location)
  if (state.neighborhood || (state.nearLat != null && state.nearLng != null)) n++;
  return n;
}

/** True if ANY filter is active (excludes search query). */
export function hasAnyActive(state: FilterState): boolean {
  return countActiveFilters(state) > 0;
}

// -----------------------------------------------------------------------------
// PURE URL <-> FilterState parsers
// -----------------------------------------------------------------------------
//
// These live here (not in use-filter-state.ts) so the server component
// /events/page.tsx can import them without crossing a 'use client' boundary.
// See the file header for why this matters.

/** Parse a URL param as float, returning undefined for null/empty/NaN. */
function safeParseFloat(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = parseFloat(value);
  return isNaN(n) ? undefined : n;
}

/** Parse a URL param as int, returning undefined for null/empty/NaN. */
function safeParseInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = parseInt(value, 10);
  return isNaN(n) ? undefined : n;
}

/**
 * Parse URL search params into a typed FilterState. Unknown keys are ignored,
 * multi-value keys use getAll(). Defensive — never throws; stale or unknown
 * params yield empty defaults rather than crashing.
 */
export function parseFiltersFromParams(params: SearchParamsLike): FilterState {
  return {
    q: params.get('q') ?? undefined,
    category: params.get('category') ?? undefined,
    dateFrom: params.get('from') ?? undefined,
    dateTo: params.get('to') ?? undefined,
    interestPreset: params.get('interestPreset') ?? undefined,
    goodFor: params.getAll('goodFor'),
    timeOfDay: params.getAll('timeOfDay'),
    priceTier: params.getAll('priceTier'),
    ageGroup: params.getAll('ageGroup'),
    accessibility: params.getAll('accessibility'),
    sensory: params.getAll('sensory'),
    leaveWith: params.getAll('leaveWith'),
    socialMode: params.get('socialMode') ?? undefined,
    energyNeeded: params.get('energyNeeded') ?? undefined,
    isFree: params.get('free') === 'true',
    vibeTag: params.get('vibeTag') ?? undefined,
    noiseLevel: params.get('noiseLevel') ?? undefined,
    accessType: params.get('accessType') ?? undefined,
    soloFriendly: params.get('soloFriendly') === 'true',
    curiousMinds: params.get('curiousMinds') === 'true',
    noTicketsNeeded: params.get('noTicketsNeeded') === 'true',
    dropInOk: params.get('dropInOk') === 'true',
    familyFriendly: params.get('familyFriendly') === 'true',
    hasMemberBenefits: params.get('memberBenefits') === 'true',
    membershipOrgId: params.get('membershipOrg') ?? undefined,
    neighborhood: params.get('neighborhood') ?? undefined,
    nearLat: safeParseFloat(params.get('nearLat')),
    nearLng: safeParseFloat(params.get('nearLng')),
    radiusMiles: safeParseInt(params.get('radius')),
  };
}

/**
 * Build a fresh URLSearchParams from a FilterState. Resets pagination
 * implicitly (the caller never forwards `page`). `extras` lets the caller
 * preserve unrelated keys like `sort` while still rewriting the filter set.
 */
export function serializeFiltersToParams(
  state: FilterState,
  extras?: Record<string, string | null>,
): URLSearchParams {
  const params = new URLSearchParams();

  if (state.q) params.set('q', state.q);
  if (state.category) params.set('category', state.category);
  if (state.dateFrom) params.set('from', state.dateFrom);
  if (state.dateTo) params.set('to', state.dateTo);
  if (state.interestPreset) params.set('interestPreset', state.interestPreset);
  for (const slug of state.goodFor) params.append('goodFor', slug);
  for (const bucket of state.timeOfDay) params.append('timeOfDay', bucket);
  for (const slug of state.priceTier) params.append('priceTier', slug);
  for (const slug of state.ageGroup) params.append('ageGroup', slug);
  for (const tag of state.accessibility) params.append('accessibility', tag);
  for (const tag of state.sensory) params.append('sensory', tag);
  for (const slug of state.leaveWith) params.append('leaveWith', slug);
  if (state.socialMode) params.set('socialMode', state.socialMode);
  if (state.energyNeeded) params.set('energyNeeded', state.energyNeeded);
  if (state.isFree) params.set('free', 'true');
  if (state.vibeTag) params.set('vibeTag', state.vibeTag);
  if (state.noiseLevel) params.set('noiseLevel', state.noiseLevel);
  if (state.accessType) params.set('accessType', state.accessType);
  if (state.soloFriendly) params.set('soloFriendly', 'true');
  if (state.curiousMinds) params.set('curiousMinds', 'true');
  if (state.noTicketsNeeded) params.set('noTicketsNeeded', 'true');
  if (state.dropInOk) params.set('dropInOk', 'true');
  if (state.familyFriendly) params.set('familyFriendly', 'true');
  if (state.hasMemberBenefits) params.set('memberBenefits', 'true');
  if (state.membershipOrgId) params.set('membershipOrg', state.membershipOrgId);
  if (state.neighborhood) params.set('neighborhood', state.neighborhood);
  if (state.nearLat != null) params.set('nearLat', String(state.nearLat));
  if (state.nearLng != null) params.set('nearLng', String(state.nearLng));
  if (state.radiusMiles != null) params.set('radius', String(state.radiusMiles));

  if (extras) {
    for (const [k, v] of Object.entries(extras)) {
      if (v === null) params.delete(k);
      else params.set(k, v);
    }
  }

  return params;
}
