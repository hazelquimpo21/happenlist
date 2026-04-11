/**
 * FILTER TYPES
 * ============
 * Type definitions for filtering and pagination.
 *
 * Cross-file coupling:
 *   - src/data/events/get-events.ts consumes EventQueryParams.
 *   - src/lib/constants/vocabularies.ts owns the GoodForSlug union.
 *   - src/lib/constants/time-of-day.ts owns the TimeOfDay union.
 *   - src/lib/constants/interest-presets.ts owns the InterestPresetId union.
 *
 * If you add a new filter param, update get-events.ts AND any UI surface
 * that builds query params (URL search params on /events, search forms).
 */

// Note: GoodForSlug / TimeOfDay union types intentionally NOT imported here.
// These params accept loose `string | string[]` so URL search params and form
// data flow in without coercion. Runtime validation against the canonical
// vocabularies happens in src/data/events/get-events.ts via the
// `isGoodForSlug` / `isTimeOfDay` type guards from
// src/lib/constants/{vocabularies,time-of-day}.ts.

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
  /**
   * Filter by "Good For" audience tag slug(s) — e.g. "date_night".
   *
   * Accepts a single slug (backward compat with original API) or an array
   * of slugs. Multi-value semantics: ANY-match (an event passes if its
   * good_for column overlaps the requested set).
   *
   * Type is intentionally `string | string[]` (not the GoodForSlug union)
   * so URL search params and form data can flow in without coercion at
   * the call site. get-events.ts validates against the canonical slug
   * list at runtime via `isGoodForSlug` and silently drops unknowns —
   * stale shared URLs from older deploys must not crash the page.
   *
   * Use either raw slugs OR `interestPreset` (which expands to a slug
   * union). If both are set, they are MERGED into a single ANY-match.
   */
  goodFor?: string | string[];

  /**
   * Filter by time-of-day bucket(s). Each bucket is a hour range in
   * America/Chicago local time — see src/lib/constants/time-of-day.ts.
   *
   * Multi-value semantics: ANY-match. Implemented as a post-fetch JS
   * filter in B1 because PostgREST cannot filter on a computed expression
   * without an RPC. May move to a generated column in a later phase.
   *
   * Loose `string | string[]` type lets URL params flow in directly;
   * get-events.ts validates each value via `isTimeOfDay` and drops
   * unknowns. Valid values are 'morning' | 'afternoon' | 'evening' |
   * 'late_night'.
   */
  timeOfDay?: string | string[];

  /**
   * Apply a predefined interest preset by id (e.g. "date-night",
   * "family-chaos"). Resolves to a goodFor union via
   * src/lib/constants/interest-presets.ts before query build.
   *
   * Stale or unknown ids are silently ignored — saved/shared URLs from
   * older versions of the app must not crash the page.
   */
  interestPreset?: string;
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
  /**
   * Include lifestyle/ongoing/exhibit series events in results.
   * These low-urgency recurring events (yoga, trivia, happy hour, exhibits)
   * are excluded from the main feed by default to prevent clutter.
   * Set to true to include them, or 'only' to show ONLY lifestyle events.
   */
  includeLifestyle?: boolean | 'only';
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
