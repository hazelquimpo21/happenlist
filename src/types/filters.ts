/**
 * FILTER TYPES
 * ============
 * Type definitions for filtering and pagination.
 */

/**
 * Date range for filtering events.
 */
export interface DateRange {
  start: string; // YYYY-MM-DD format
  end?: string;  // YYYY-MM-DD format
}

/**
 * Price range for filtering events.
 */
export interface PriceRange {
  min?: number;
  max?: number;
}

/**
 * Event filter parameters.
 */
export interface EventFilters {
  search?: string;
  categorySlug?: string;
  categoryIds?: string[];
  dateRange?: DateRange;
  isFree?: boolean;
  priceRange?: PriceRange;
  venueTypes?: string[];
  organizerId?: string;
  locationId?: string;
  excludeEventId?: string;
  /** Filter by "Good For" audience tag slug (e.g., "date_night"). */
  goodFor?: string;
  /** Filter by vibe tag (e.g., "cozy", "hype"). Uses GIN array containment. */
  vibeTag?: string;
  /** Filter by subculture tag (e.g., "jazz", "craft-beer"). */
  subculture?: string;
  /** Filter by noise level: "quiet", "conversational", "loud", "deafening". */
  noiseLevel?: string;
  /** Filter by access type: "open", "ticketed", "rsvp", etc. */
  accessType?: string;
  /** Exclude members-only events. */
  excludeMembership?: boolean;
  /** Max energy level (1-5). */
  energyMax?: number;
  /** Min energy level (1-5). */
  energyMin?: number;
  /** Max formality (1-5). */
  formalityMax?: number;
  /** Quick toggle: solo-friendly (social_pressure <= 2). */
  soloFriendly?: boolean;
  /** Quick toggle: beginner-friendly (accessibility_score >= 4). */
  beginnerFriendly?: boolean;
  /** Quick toggle: no tickets needed. */
  noTicketsNeeded?: boolean;
  /** Quick toggle: drop-in OK. */
  dropInOk?: boolean;
  /** Filter by family-friendly events. */
  familyFriendly?: boolean;
  /** Filter to only events with any membership benefits. */
  hasMemberBenefits?: boolean;
  /** Filter to events with benefits from a specific membership org. */
  membershipOrgId?: string;
}

/**
 * Pagination parameters.
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Sort options for events.
 */
export type SortOption = 'date-asc' | 'date-desc' | 'name-asc' | 'popular';

/**
 * Combined query parameters for events.
 */
export interface EventQueryParams extends EventFilters, PaginationParams {
  orderBy?: SortOption;
  /**
   * Collapse recurring series instances to show only the next upcoming date.
   * When true, events belonging to a recurring or class series are grouped —
   * only the soonest instance is returned, with `recurrence_label` and
   * `upcoming_count` populated on the resulting EventCard.
   *
   * Festivals and seasons are NOT collapsed (each date is distinct content).
   * Use false for contexts like "This Weekend" where day-specific listing matters.
   */
  collapseSeries?: boolean;
}
