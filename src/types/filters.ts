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
  /** Quick toggle: solo-friendly (good_for contains solo_friendly). */
  soloFriendly?: boolean;
  /** Quick toggle: talks/lectures/learning events (good_for contains curious_minds). */
  curiousMinds?: boolean;
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
   * Include past events in results. By default, getEvents() only returns
   * events with instance_date >= today. Set to true for archive pages and
   * other contexts that need historical events.
   *
   * When true, the hardcoded future-only filter is skipped. You should
   * typically pair this with a dateRange to avoid returning the entire
   * event history.
   */
  includePast?: boolean;

  /**
   * Include lifestyle/ongoing/exhibit series events in results.
   * These low-urgency recurring events (yoga, trivia, happy hour, exhibits)
   * are excluded from the main feed by default to prevent clutter.
   * Set to true to include them, or 'only' to show ONLY lifestyle events.
   */
  includeLifestyle?: boolean | 'only';

  // ── Price tier filter (Phase 2 B5) ────────────────────────────────
  /**
   * Filter by price tier slug(s) — e.g. "free", "under_10", "10_to_25".
   * Multi-value semantics: ANY-match (event passes if it matches any
   * selected tier). See src/lib/constants/price-tiers.ts for tier
   * definitions and predicate logic.
   *
   * Loose `string | string[]` type lets URL params flow in directly;
   * get-events.ts validates each value via `isPriceTierSlug` and drops
   * unknowns.
   */
  priceTier?: string | string[];

  /**
   * Filter by age group slug(s) — e.g. "all_ages", "teens", "twenty_one_plus".
   * Multi-value semantics: ANY-match. See src/lib/constants/age-groups.ts.
   *
   * IMPORTANT: age_high is empty in the DB. All predicates use age_low only.
   */
  ageGroup?: string | string[];

  // ── Geo / distance filters (Phase 2 B4) ──────────────────────────
  /**
   * Anchor latitude for distance filtering. Must be set together with
   * nearLng. When set, only events within radiusMiles of this point
   * are returned, and each EventCard gets a `distance_miles` field.
   *
   * Typically comes from a neighborhood center (milwaukee-neighborhoods.ts)
   * or the browser Geolocation API.
   */
  nearLat?: number;

  /**
   * Anchor longitude for distance filtering. Must be set with nearLat.
   */
  nearLng?: number;

  /**
   * Radius in miles from the anchor point. Defaults to 5 miles.
   * Max 50 miles (enforced in get-events.ts).
   */
  radiusMiles?: number;

  // ── Tagging expansion filters (Stage 1) ──────────────────────────
  /**
   * Filter by accessibility tag(s) — e.g. "step_free", "asl_interpreted".
   * Multi-value semantics: ANY-match (event passes if its accessibility_tags
   * overlaps the requested set). Uses PG `&&` / PostgREST `.overlaps()`.
   *
   * These tags are EXPLICIT-ONLY — the scraper only sets them when the page
   * literally says so, never inferred. They're the most trustworthy signal
   * in the new set.
   *
   * Loose `string | string[]` type so URL params flow in directly;
   * get-events.ts validates each value via `isAccessibilityTag` and drops
   * unknowns.
   */
  accessibility?: string | string[];

  /**
   * Filter by sensory tag(s) — e.g. "loud_music", "strobe_lights".
   * Multi-value semantics: ANY-match. Sensory tags can be inferred from
   * event type (not just explicit), so the evidence string in
   * inferred_signals.sensory.evidence may say "(inferred from event type: …)".
   */
  sensory?: string | string[];

  /**
   * Filter by leave_with tag(s) — "a_thing_you_made", "a_new_skill", etc.
   * Multi-value semantics: ANY-match. `just_an_experience` does not stack
   * with other leave_with tags (enforced at scrape time).
   */
  leaveWith?: string | string[];

  /**
   * Filter by social mode (single-value enum) — "solo_welcoming",
   * "mingling_required", etc. See SOCIAL_MODES in vocabularies.ts.
   */
  socialMode?: string;

  /**
   * Filter by energy-needed mode (single-value enum) — "receptive",
   * "physically_demanding", etc. See ENERGY_NEEDED in vocabularies.ts.
   */
  energyNeeded?: string;

  // NOTE: No slider filters in the public filter set. Sliders
  // (social_intensity, structure, commitment, spend_level) are stored in
  // events.inferred_signals.sliders and are ADMIN-ONLY in v1 — they need
  // human calibration audit before we expose them. See Stage 4 of
  // TAGGING_UI_PROMPT.md for the admin review surface plan.
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
export type SortOption = 'date-asc' | 'date-desc' | 'name-asc' | 'popular' | 'distance-asc' | 'newest';

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
