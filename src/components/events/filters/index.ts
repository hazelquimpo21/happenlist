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
export { useFilterState, parseFiltersFromParams, serializeFiltersToParams } from './use-filter-state';
export type { FilterState } from './types';
export { EMPTY_FILTER_STATE, countActiveFilters, hasAnyActive } from './types';
export type { FilterDrawerCategory, FilterDrawerMembershipOrg } from './filter-drawer';
