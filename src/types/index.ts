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
  ATTENDANCE_MODE_INFO,
  SKILL_LEVEL_INFO,
  RECURRENCE_LABELS,
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_SHORT,
  getSeriesTypeInfo,
  getAttendanceModeLabel,
  getSkillLevelLabel,
  formatAgeRange,
  formatTimeDisplay,
  formatRecurrence,
} from './series';

// Good For audience tags
export type { GoodForTag } from './good-for';
export {
  GOOD_FOR_TAGS,
  GOOD_FOR_SLUGS,
  getGoodForTag,
  getGoodForTags,
} from './good-for';

// Filter types
export type {
  DateRange,
  PriceRange,
  EventFilters,
  PaginationParams,
  SortOption,
  EventQueryParams,
} from './filters';

// User & Auth types
export type {
  UserRole,
  UserSession,
  AuthContextValue,
  Profile,
  ProfileUpdateData,
  LoginFormState,
  AuthCallbackResult,
  AuthCheckResult,
  Heart,
  HeartedEvent,
  ClaimStatus,
  OrganizerWithClaim,
  ClaimOrganizerRequest,
} from './user';
