/**
 * =============================================================================
 * useFilterState — URL <-> FilterState binding for /events filter UI
 * =============================================================================
 *
 * The /events page is a server component that re-runs whenever URL search
 * params change. This hook is the one place that:
 *   1. Reads the current URL into a typed FilterState (via useSearchParams)
 *   2. Writes back to the URL via router.replace (NOT push — see below)
 *   3. Provides imperative helpers (toggleArrayValue, setSingle, clearAll,
 *      removeOne) so callers don't have to think about query string syntax
 *
 * router.replace, not router.push:
 *   Pushing every filter change pollutes the back button — five chip taps =
 *   five history entries the user has to claw back through. Replace keeps the
 *   single "/events" entry and lets the back button do what users expect.
 *
 * URL conventions:
 *   - Multi-value fields use repeated keys: ?goodFor=foodies&goodFor=date_night
 *   - Booleans are present-when-true: ?free=true (omitted when false)
 *   - Empty arrays / falsy values are omitted entirely (clean URLs)
 *
 * scroll: false on replace — toggling a chip should NOT scroll to the top of
 * the page. The user wants to see the change in-place.
 *
 * Cross-file coupling:
 *   - types.ts — FilterState shape
 *   - filter-bar.tsx, filter-drawer.tsx, empty-filter-state.tsx — consumers
 *   - src/app/events/page.tsx — reads the same URL params on the server side;
 *     keep param names in sync
 * =============================================================================
 */

'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams, type ReadonlyURLSearchParams } from 'next/navigation';
import { EMPTY_FILTER_STATE, type FilterState } from './types';

// -----------------------------------------------------------------------------
// PARSE — URL search params -> FilterState
// -----------------------------------------------------------------------------

/**
 * Parse a ReadonlyURLSearchParams (or URLSearchParams) into a typed
 * FilterState. Unknown keys are ignored. Multi-value keys use getAll().
 *
 * Defensive: never throws. URL params from older app versions or shared
 * links may be stale — return the empty defaults rather than crashing.
 */
export function parseFiltersFromParams(
  params: ReadonlyURLSearchParams | URLSearchParams
): FilterState {
  return {
    q: params.get('q') ?? undefined,
    category: params.get('category') ?? undefined,
    interestPreset: params.get('interestPreset') ?? undefined,
    goodFor: params.getAll('goodFor'),
    timeOfDay: params.getAll('timeOfDay'),
    isFree: params.get('free') === 'true',
    vibeTag: params.get('vibeTag') ?? undefined,
    noiseLevel: params.get('noiseLevel') ?? undefined,
    accessType: params.get('accessType') ?? undefined,
    soloFriendly: params.get('soloFriendly') === 'true',
    beginnerFriendly: params.get('beginnerFriendly') === 'true',
    noTicketsNeeded: params.get('noTicketsNeeded') === 'true',
    dropInOk: params.get('dropInOk') === 'true',
    familyFriendly: params.get('familyFriendly') === 'true',
    hasMemberBenefits: params.get('memberBenefits') === 'true',
    membershipOrgId: params.get('membershipOrg') ?? undefined,
  };
}

// -----------------------------------------------------------------------------
// SERIALIZE — FilterState -> URLSearchParams
// -----------------------------------------------------------------------------

/**
 * Build a fresh URLSearchParams from a FilterState.
 *
 * Resets pagination (`page`) automatically — when filters change the user is
 * back on page 1. Pre-existing non-filter params (other than `page`) are
 * preserved by the caller via `extras`.
 */
export function serializeFiltersToParams(
  state: FilterState,
  extras?: Record<string, string | null>
): URLSearchParams {
  const params = new URLSearchParams();

  if (state.q) params.set('q', state.q);
  if (state.category) params.set('category', state.category);
  if (state.interestPreset) params.set('interestPreset', state.interestPreset);
  for (const slug of state.goodFor) params.append('goodFor', slug);
  for (const bucket of state.timeOfDay) params.append('timeOfDay', bucket);
  if (state.isFree) params.set('free', 'true');
  if (state.vibeTag) params.set('vibeTag', state.vibeTag);
  if (state.noiseLevel) params.set('noiseLevel', state.noiseLevel);
  if (state.accessType) params.set('accessType', state.accessType);
  if (state.soloFriendly) params.set('soloFriendly', 'true');
  if (state.beginnerFriendly) params.set('beginnerFriendly', 'true');
  if (state.noTicketsNeeded) params.set('noTicketsNeeded', 'true');
  if (state.dropInOk) params.set('dropInOk', 'true');
  if (state.familyFriendly) params.set('familyFriendly', 'true');
  if (state.hasMemberBenefits) params.set('memberBenefits', 'true');
  if (state.membershipOrgId) params.set('membershipOrg', state.membershipOrgId);

  // Forward / strip extras (used to preserve unrelated keys, never `page`)
  if (extras) {
    for (const [k, v] of Object.entries(extras)) {
      if (v === null) params.delete(k);
      else params.set(k, v);
    }
  }

  return params;
}

// -----------------------------------------------------------------------------
// HOOK
// -----------------------------------------------------------------------------

interface UseFilterStateApi {
  /** Current state, parsed from the URL. Recomputed when search params change. */
  state: FilterState;

  /** Replace the entire state. Used by "Apply" buttons and clear-all. */
  setState: (next: FilterState) => void;

  /** Toggle a single string in a multi-value field (goodFor / timeOfDay). */
  toggleArrayValue: (field: 'goodFor' | 'timeOfDay', value: string) => void;

  /** Set or clear a single-value field. Pass undefined to clear. */
  setSingle: <K extends keyof FilterState>(field: K, value: FilterState[K]) => void;

  /** Toggle a boolean filter. */
  toggleBool: (field: keyof FilterState) => void;

  /** Remove ONE value (used by EmptyFilterState's per-chip remove buttons). */
  removeOne: (key: keyof FilterState, value?: string) => void;

  /** Clear all filters. Search query (q) is preserved. */
  clearAll: () => void;
}

export function useFilterState(): UseFilterStateApi {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state = useMemo(() => parseFiltersFromParams(searchParams), [searchParams]);

  const replaceUrl = useCallback(
    (nextState: FilterState) => {
      const params = serializeFiltersToParams(nextState);
      const qs = params.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      // scroll: false — toggling chips should NOT jump to the top of the page
      router.replace(url, { scroll: false });
    },
    [pathname, router]
  );

  const setState = useCallback(
    (next: FilterState) => replaceUrl(next),
    [replaceUrl]
  );

  const toggleArrayValue = useCallback(
    (field: 'goodFor' | 'timeOfDay', value: string) => {
      const current = state[field];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      replaceUrl({ ...state, [field]: next });
    },
    [state, replaceUrl]
  );

  const setSingle = useCallback(
    <K extends keyof FilterState>(field: K, value: FilterState[K]) => {
      replaceUrl({ ...state, [field]: value });
    },
    [state, replaceUrl]
  );

  const toggleBool = useCallback(
    (field: keyof FilterState) => {
      replaceUrl({ ...state, [field]: !state[field] } as FilterState);
    },
    [state, replaceUrl]
  );

  const removeOne = useCallback(
    (key: keyof FilterState, value?: string) => {
      const current = state[key];
      if (Array.isArray(current) && value !== undefined) {
        replaceUrl({ ...state, [key]: current.filter((v) => v !== value) } as FilterState);
        return;
      }
      // Single-value: clear it
      const cleared: Partial<FilterState> = { [key]: typeof current === 'boolean' ? false : undefined };
      replaceUrl({ ...state, ...cleared });
    },
    [state, replaceUrl]
  );

  const clearAll = useCallback(() => {
    // Preserve only the search query — that's a different input
    replaceUrl({ ...EMPTY_FILTER_STATE, q: state.q });
  }, [state.q, replaceUrl]);

  return { state, setState, toggleArrayValue, setSingle, toggleBool, removeOne, clearAll };
}
