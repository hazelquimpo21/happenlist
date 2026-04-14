/**
 * =============================================================================
 * CONTROLLED VOCABULARIES — TS MIRROR
 * =============================================================================
 *
 * MIRROR OF: happenlist_scraper/backend/lib/vocabularies.js
 * If you change this, change BOTH. Sync verified manually during phase reviews.
 * Last byte-for-byte verification: 2026-04-14 (scraper series session: added
 *   SERIES_TYPES, RECURRENCE_FREQUENCIES, RECURRENCE_END_TYPES, and day/week/dom
 *   bounds for the series rhythm UI) — clean.
 *
 * This file holds the canonical TypeScript vocabularies for the four
 * controlled lists the scraper writes into the events table:
 *
 *   - VIBE_TAGS        (atmosphere analyzer → events.vibe_tags TEXT[])
 *   - SUBCULTURES      (atmosphere analyzer → events.subcultures TEXT[])
 *   - NOISE_LEVELS     (atmosphere analyzer → events.noise_level TEXT)
 *   - GOOD_FOR_SLUGS   (event-meta analyzer → events.good_for TEXT[])
 *   - ATTENDANCE_MODES  (event-meta analyzer → events.attendance_mode TEXT)
 *   - ACCESS_TYPES     (pricing analyzer → events.access_type TEXT)
 *   - VENUE_TYPES      (location analyzer → locations.venue_type TEXT)
 *
 * Why a separate TS file at all?
 *   - The scraper repo is JS/CommonJS. TypeScript needs proper `as const`
 *     readonly tuples to derive union types for filter UIs and query params.
 *   - Centralizing here means filter components, query builders, validators,
 *     and type guards all import from one place — never inline a magic string.
 *
 * Why post-validation in addition to OpenAI function-calling enums?
 *   - GPT-4o-mini does not strictly enforce `enum` constraints. Prior audit
 *     (2026-04-11) found 80+ free-text vibe values despite the schema using
 *     `enum: VIBE_TAGS`. Phase 1 / Sessions A1+A2 fixed the scraper and
 *     cleaned the existing data — see docs/phase-reports/phase-1-progress.md.
 *
 * Cross-file coupling notes:
 *   - src/types/good-for.ts imports `GOOD_FOR_SLUGS` and `GoodForSlug` from
 *     here so the slug list has a single source of truth. The rich UI metadata
 *     (label, icon, color) lives in good-for.ts, but the slug list is here.
 *   - src/lib/constants/interest-presets.ts imports `GoodForSlug` to type its
 *     preset → tag mappings.
 *   - src/data/events/get-events.ts imports the union types for filter param
 *     validation in EventQueryParams.
 *
 * If you add or remove a value:
 *   1. Update happenlist_scraper/backend/lib/vocabularies.js (the source).
 *   2. Update this file to match byte-for-byte.
 *   3. Update tag_cleanup_log expectations if removing a value that's in the
 *      DB — a migration may be needed to drop or remap existing rows.
 *   4. Run the type-checker — interest-presets.ts and any consumer using
 *      union types will fail loudly if a slug is removed.
 * =============================================================================
 */

// -----------------------------------------------------------------------------
// VIBE TAGS (atmosphere analyzer)
// -----------------------------------------------------------------------------
// Short adjectives that capture the social/emotional flavor of an event.
// Pick 1–4 per event. Used by the "vibe" filter in Happenlist.
export const VIBE_TAGS = [
  'cozy',
  'rowdy',
  'artsy',
  'underground',
  'bougie',
  'family-chaos',
  'chill',
  'hype',
  'intimate',
  'festival-energy',
  'nerdy',
  'spiritual',
  'competitive',
  'romantic',
  'diy',
  'corporate',
  'nostalgic',
  'experimental',
] as const;

export type VibeTag = (typeof VIBE_TAGS)[number];

// -----------------------------------------------------------------------------
// SUBCULTURES (atmosphere analyzer)
// -----------------------------------------------------------------------------
// Cultural affiliations / scenes the event speaks to. Pick 0–3 per event.
// Used by the "interest" filter in Happenlist (e.g. "crafty artsy folks").
export const SUBCULTURES = [
  'indie-music',
  'hip-hop',
  'edm',
  'punk-diy',
  'jazz',
  'country',
  'craft-beer',
  'wine',
  'foodie',
  'fitness',
  'yoga-wellness',
  'tech',
  'startup',
  'queer',
  'latinx',
  'art-scene',
  'theater-kids',
  'outdoorsy',
  'gaming',
  'sneakerhead',
  'vintage',
  'academia',
  'maker',
] as const;

export type Subculture = (typeof SUBCULTURES)[number];

// -----------------------------------------------------------------------------
// NOISE LEVELS (atmosphere analyzer)
// -----------------------------------------------------------------------------
// Single-value enum describing how loud the room will be.
export const NOISE_LEVELS = ['quiet', 'conversational', 'loud', 'deafening'] as const;

export type NoiseLevel = (typeof NOISE_LEVELS)[number];

// -----------------------------------------------------------------------------
// GOOD FOR SLUGS (event-meta analyzer)
// -----------------------------------------------------------------------------
// Audience-fit slugs. Stored in events.good_for TEXT[].
//
// The rich UI metadata (label, icon, color, description) for each slug lives
// in src/types/good-for.ts — that file imports the union type from here so
// the slug field stays type-safe and any drift between this list and the UI
// metadata file fails compilation.
export const GOOD_FOR_SLUGS = [
  'date_night',
  'families_young_kids',
  'families_older_kids',
  'pet_friendly',
  'foodies',
  'girls_night',
  'guys_night',
  'solo_friendly',
  'outdoorsy',
  'creatives',
  'music_lovers',
  'active_seniors',
  'college_crowd',
  'first_timers',
  'bridal_shower',
  'bachelor_party',
  'first_date',
  'meet_people',
  'tourist_friendly',
  'rainy_day',
  'budget_friendly',
  'after_work',
  'group_outing',
  'quiet_hangout',
] as const;

export type GoodForSlug = (typeof GOOD_FOR_SLUGS)[number];

// -----------------------------------------------------------------------------
// ATTENDANCE MODES (event-meta analyzer)
// -----------------------------------------------------------------------------
// How participants attend. Applies to ALL events, not just series.
// Used by the "drop-in / ticketed" filter in Happenlist (Phase 3, Session B9).
export const ATTENDANCE_MODES = ['drop_in', 'registered', 'hybrid'] as const;

export type AttendanceMode = (typeof ATTENDANCE_MODES)[number];

// -----------------------------------------------------------------------------
// ACCESS TYPES (pricing analyzer)
// -----------------------------------------------------------------------------
// What someone needs to do to get into the event. Separate from price.
export const ACCESS_TYPES = [
  'open',
  'ticketed',
  'rsvp',
  'pay_at_door',
  'registration',
  'membership',
  'invite_only',
] as const;

export type AccessType = (typeof ACCESS_TYPES)[number];

// -----------------------------------------------------------------------------
// VENUE TYPES (location analyzer)
// -----------------------------------------------------------------------------
// Physical setting classification. Stored in locations.venue_type.
// Used by the indoor/outdoor filter in Happenlist (Phase 3, Session B9).
export const VENUE_TYPES = [
  'venue',     // Indoor space (bar, theater, gallery, restaurant, club, hall, museum)
  'outdoor',   // Parks, beaches, lakefront, athletic fields, festival grounds, streets
  'hybrid',    // Indoor/outdoor mix: beer gardens, rooftop bars, covered pavilions, patios
  'online',    // Virtual events (Zoom, YouTube, etc.)
  'various',   // Multiple locations or traveling event
  'tbd',       // Location not yet announced
] as const;

export type VenueType = (typeof VENUE_TYPES)[number];

// -----------------------------------------------------------------------------
// SERIES TYPES (event-meta analyzer → series.series_type)
// -----------------------------------------------------------------------------
// Classification of what KIND of multi-event grouping this is. Drives UI
// behavior in get-events.ts (COLLAPSIBLE_SERIES_TYPES, LIFESTYLE_SERIES_TYPES)
// and series-context-block.tsx (rhythm line, count unit, headline copy).
//
// If you add/remove a value:
//   - Mirror in happenlist_scraper/backend/lib/vocabularies.js
//   - Ensure happenlist/src/types/series.ts SERIES_TYPE_INFO has an entry
//   - Check the DB CHECK constraint on series.series_type
//   - Revisit COLLAPSIBLE_SERIES_TYPES / LIFESTYLE_SERIES_TYPES in get-events.ts
export const SERIES_TYPES = [
  'class',
  'workshop',
  'camp',
  'recurring',
  'lifestyle',
  'ongoing',
  'exhibit',
  'festival',
  'season',
  'annual',
] as const;

export type SeriesType = (typeof SERIES_TYPES)[number];

// -----------------------------------------------------------------------------
// RECURRENCE RULE ENUMS (event-meta analyzer → series.recurrence_rule JSONB)
// -----------------------------------------------------------------------------
// Strict enums for series.recurrence_rule. Consumed by:
//   - src/data/events/get-events.ts → buildRecurrenceLabel()
//   - src/components/series/series-context-block.tsx → buildRhythmLine()
// The JSONB itself is assembled + validated in the scraper by
// backend/lib/recurrence-rule.js before being written.
export const RECURRENCE_FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'] as const;
export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

export const RECURRENCE_END_TYPES = ['date', 'count', 'never'] as const;
export type RecurrenceEndType = (typeof RECURRENCE_END_TYPES)[number];

// Bounds for recurrence_rule numeric fields. Kept as constants so the
// scraper validator and any UI / query-layer validation use identical ranges.
export const RECURRENCE_DAY_OF_WEEK_MIN = 0;
export const RECURRENCE_DAY_OF_WEEK_MAX = 6;
export const RECURRENCE_DAY_OF_MONTH_MIN = 1;
export const RECURRENCE_DAY_OF_MONTH_MAX = 31;
export const RECURRENCE_WEEK_OF_MONTH_VALUES = [1, 2, 3, 4, -1] as const;

// -----------------------------------------------------------------------------
// VALIDATION HELPERS
// -----------------------------------------------------------------------------
// Use these at system boundaries (URL params, form input, API payloads) to
// drop unknown values defensively. Internal code that already has a typed
// union doesn't need them.

const VIBE_TAG_SET = new Set<string>(VIBE_TAGS);
const SUBCULTURE_SET = new Set<string>(SUBCULTURES);
const NOISE_LEVEL_SET = new Set<string>(NOISE_LEVELS);
const GOOD_FOR_SLUG_SET = new Set<string>(GOOD_FOR_SLUGS);
const ATTENDANCE_MODE_SET = new Set<string>(ATTENDANCE_MODES);
const ACCESS_TYPE_SET = new Set<string>(ACCESS_TYPES);
const VENUE_TYPE_SET = new Set<string>(VENUE_TYPES);
const SERIES_TYPE_SET = new Set<string>(SERIES_TYPES);
const RECURRENCE_FREQUENCY_SET = new Set<string>(RECURRENCE_FREQUENCIES);
const RECURRENCE_END_TYPE_SET = new Set<string>(RECURRENCE_END_TYPES);

export function isVibeTag(value: string): value is VibeTag {
  return VIBE_TAG_SET.has(value);
}

export function isSubculture(value: string): value is Subculture {
  return SUBCULTURE_SET.has(value);
}

export function isNoiseLevel(value: string): value is NoiseLevel {
  return NOISE_LEVEL_SET.has(value);
}

export function isGoodForSlug(value: string): value is GoodForSlug {
  return GOOD_FOR_SLUG_SET.has(value);
}

export function isAttendanceMode(value: string): value is AttendanceMode {
  return ATTENDANCE_MODE_SET.has(value);
}

export function isAccessType(value: string): value is AccessType {
  return ACCESS_TYPE_SET.has(value);
}

export function isVenueType(value: string): value is VenueType {
  return VENUE_TYPE_SET.has(value);
}

export function isSeriesType(value: string): value is SeriesType {
  return SERIES_TYPE_SET.has(value);
}

export function isRecurrenceFrequency(value: string): value is RecurrenceFrequency {
  return RECURRENCE_FREQUENCY_SET.has(value);
}

export function isRecurrenceEndType(value: string): value is RecurrenceEndType {
  return RECURRENCE_END_TYPE_SET.has(value);
}

/**
 * Filter an array of free-text values down to those that match a vocabulary.
 * Used to defensively clean URL params or external data before querying.
 */
export function filterToVocab<T extends string>(
  values: readonly string[],
  guard: (v: string) => v is T
): T[] {
  return values.filter(guard);
}
