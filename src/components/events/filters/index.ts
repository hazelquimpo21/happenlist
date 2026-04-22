/**
 * Filter UI barrel — re-exports for the /events filter components.
 *
 * B1 redesign (2026-04-22): the `FilterBar` + `FilterDrawer` were replaced
 * by `PickerBar` (which composes `SegmentedPicker` + `MoreDrawer`). The
 * surviving primitives (FilterChip, FilterSection, EmptyFilterState,
 * NeighborhoodPicker) stay in-place — the new drawer uses them.
 *
 * Cross-file coupling: src/app/events/page.tsx imports from here.
 */

export { PickerBar } from './b1/picker-bar';
export { MoreDrawer } from './b1/more-drawer';
export type { CategoryPopoverItem } from './b1/segments/category-popover';
export type { MoreDrawerMembershipOrg } from './b1/more-drawer';

export { SortSelect } from './sort-select';
export { FilterChip } from './filter-chip';
export { FilterSection } from './filter-section';
export { EmptyFilterState } from './empty-filter-state';
export { NeighborhoodPicker } from './neighborhood-picker';
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
