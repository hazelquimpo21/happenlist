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
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  EMPTY_FILTER_STATE,
  parseFiltersFromParams,
  serializeFiltersToParams,
  type FilterState,
} from './types';

// Re-export the pure parsers so existing imports from this module keep
// working. The canonical definitions live in `./types` (a non-client module
// the server component /events/page.tsx can also import) — see the header
// comment in types.ts for why.
export { parseFiltersFromParams, serializeFiltersToParams };

// -----------------------------------------------------------------------------
// HOOK
// -----------------------------------------------------------------------------

interface UseFilterStateApi {
  /** Current state, parsed from the URL. Recomputed when search params change. */
  state: FilterState;

  /** Replace the entire state. Used by "Apply" buttons and clear-all. */
  setState: (next: FilterState) => void;

  /** Toggle a single string in a multi-value field (goodFor / timeOfDay / priceTier / ageGroup). */
  toggleArrayValue: (field: 'goodFor' | 'timeOfDay' | 'priceTier' | 'ageGroup', value: string) => void;

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
    (field: 'goodFor' | 'timeOfDay' | 'priceTier' | 'ageGroup', value: string) => {
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
      // Geo fields are coupled — clearing neighborhood also clears lat/lng/radius
      if (key === 'neighborhood' || key === 'nearLat' || key === 'nearLng') {
        replaceUrl({
          ...state,
          neighborhood: undefined,
          nearLat: undefined,
          nearLng: undefined,
          radiusMiles: undefined,
        });
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
