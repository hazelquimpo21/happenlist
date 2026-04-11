/**
 * Filter UI barrel — re-exports for the /events filter components.
 *
 * Cross-file coupling: src/app/events/page.tsx imports from here.
 */

export { FilterBar } from './filter-bar';
export { FilterDrawer } from './filter-drawer';
export { FilterChip } from './filter-chip';
export { FilterSection } from './filter-section';
export { EmptyFilterState } from './empty-filter-state';
export { useFilterState } from './use-filter-state';
// IMPORTANT: parseFiltersFromParams + serializeFiltersToParams come from
// `./types`, NOT `./use-filter-state`. Re-exporting them through the
// 'use client' module would taint them as client references and break the
// server-side import in /events/page.tsx — see types.ts header for the
// full reasoning.
export type { FilterState, SearchParamsLike } from './types';
export {
  EMPTY_FILTER_STATE,
  countActiveFilters,
  hasAnyActive,
  parseFiltersFromParams,
  serializeFiltersToParams,
} from './types';
export type { FilterDrawerCategory, FilterDrawerMembershipOrg } from './filter-drawer';
