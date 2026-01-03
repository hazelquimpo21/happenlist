/**
 * TYPES INDEX
 * ===========
 * Central export for all type definitions.
 */

// Event types
export type {
  EventRow,
  LocationRow,
  OrganizerRow,
  CategoryRow,
  EventWithDetails,
  EventCard,
} from './event';

// Entity types
export type { Venue, VenueCard, VenueWithCount } from './venue';
export type { Organizer, OrganizerCard, SocialLinks } from './organizer';
export type { Category, CategoryWithCount } from './category';

// Series types (Phase 2)
export type {
  SeriesRow,
  SeriesWithDetails,
  SeriesCard,
  SeriesEvent,
  SeriesQueryParams,
  SeriesSortOption,
  SeriesQueryResult,
  SeriesTypeInfo,
} from './series';

export {
  SERIES_TYPE_INFO,
  RECURRENCE_LABELS,
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_SHORT,
  getSeriesTypeInfo,
  formatRecurrence,
} from './series';

// Filter types
export type {
  DateRange,
  PriceRange,
  EventFilters,
  PaginationParams,
  SortOption,
  EventQueryParams,
} from './filters';
