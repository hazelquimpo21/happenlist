/**
 * =============================================================================
 * CONTROLLED VOCABULARIES — TS MIRROR
 * =============================================================================
 *
 * MIRROR OF: happenlist_scraper/backend/lib/vocabularies.js
 * If you change this, change BOTH. Sync verified manually during phase reviews.
 * Last byte-for-byte verification: 2026-04-14 (tagging expansion Stage 1:
 *   added ACCESSIBILITY_TAGS, SENSORY_TAGS + SENSORY_TAG_PRIORITY, LEAVE_WITH,
 *   SOCIAL_MODES, ENERGY_NEEDED, SLIDER_DIMENSIONS + SLIDER_RUBRICS plus
 *   *_LABELS mirrors, matching scraper migrations 00016–00019) — clean.
 *
 * This file holds the canonical TypeScript vocabularies for the controlled
 * lists the scraper writes into the events table:
 *
 *   - VIBE_TAGS          (atmosphere analyzer → events.vibe_tags TEXT[])
 *   - SUBCULTURES        (atmosphere analyzer → events.subcultures TEXT[])
 *   - NOISE_LEVELS       (atmosphere analyzer → events.noise_level TEXT)
 *   - MUSIC_GENRES       (atmosphere analyzer → events.music_genres TEXT[])
 *   - GOOD_FOR_SLUGS     (event-meta analyzer → events.good_for TEXT[])
 *   - ATTENDANCE_MODES   (event-meta analyzer → events.attendance_mode TEXT)
 *   - ACCESS_TYPES       (pricing analyzer → events.access_type TEXT)
 *   - VENUE_TYPES        (location analyzer → locations.venue_type TEXT)
 *   - ACCESSIBILITY_TAGS (accessibility analyzer → events.accessibility_tags TEXT[])
 *   - SENSORY_TAGS       (sensory analyzer → events.sensory_tags TEXT[])
 *   - LEAVE_WITH         (basic-info analyzer → events.leave_with TEXT[])
 *   - SOCIAL_MODES       (vibe-sliders analyzer → events.social_mode TEXT)
 *   - ENERGY_NEEDED      (vibe-sliders analyzer → events.energy_needed TEXT)
 *   - SLIDER_DIMENSIONS  (vibe-sliders analyzer → events.inferred_signals.sliders)
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
  'comedy',
] as const;

export type Subculture = (typeof SUBCULTURES)[number];

// -----------------------------------------------------------------------------
// NOISE LEVELS (atmosphere analyzer)
// -----------------------------------------------------------------------------
// Single-value enum describing how loud the room will be.
export const NOISE_LEVELS = ['quiet', 'conversational', 'loud', 'deafening'] as const;

export type NoiseLevel = (typeof NOISE_LEVELS)[number];

// -----------------------------------------------------------------------------
// MUSIC GENRES (atmosphere analyzer → events.music_genres)
// -----------------------------------------------------------------------------
// Broad musical-style tags for events where music IS the content (concerts,
// DJ sets, music festivals). Empty array for non-music events and for events
// where music is incidental.
//
// Kept coarse on purpose — sub-genres (deep house, post-punk, etc.) belong on
// the performer record, not the event. Source of truth:
// happenlist_scraper/backend/lib/vocabularies.js (MUSIC_GENRES).
// Migration 00024 adds events.music_genres TEXT[] with a GIN index.
export const MUSIC_GENRES = [
  'rock',
  'indie',
  'jazz',
  'hip_hop',
  'electronic',
  'country',
  'folk',
  'classical',
  'metal',
  'pop',
  'r_and_b',
  'latin',
  'world_global',
  'punk',
  'blues',
  'experimental',
] as const;

export type MusicGenre = (typeof MUSIC_GENRES)[number];

export const MUSIC_GENRE_LABELS: Record<MusicGenre, string> = {
  rock: 'Rock',
  indie: 'Indie',
  jazz: 'Jazz',
  hip_hop: 'Hip-hop',
  electronic: 'Electronic',
  country: 'Country',
  folk: 'Folk',
  classical: 'Classical',
  metal: 'Metal',
  pop: 'Pop',
  r_and_b: 'R&B / Soul',
  latin: 'Latin',
  world_global: 'Global',
  punk: 'Punk',
  blues: 'Blues',
  experimental: 'Experimental',
};

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
  'first_date',
  'families_young_kids',
  'families_older_kids',
  'pet_friendly',
  'foodies',
  'girls_night',
  'guys_night',
  'occasion_worthy',
  'solo_friendly',
  'meet_people',
  'group_outing',
  'outdoorsy',
  'creatives',
  'music_lovers',
  'curious_minds',
  'tourist_friendly',
  'rainy_day',
  'budget_friendly',
  'after_work',
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
// PRICE TYPES (pricing analyzer → events.price_type)
// -----------------------------------------------------------------------------
// What kind of price the event charges. Matches the events.price_type CHECK
// constraint. Drives card price badges and the price-tier filter.
export const PRICE_TYPES = [
  'free',
  'fixed',
  'range',
  'varies',
  'donation',
  'per_session',
] as const;

export type PriceType = (typeof PRICE_TYPES)[number];

// -----------------------------------------------------------------------------
// IMAGE TYPES (image analyzer → events.image_type)
// -----------------------------------------------------------------------------
// What the hero image IS. Matches the events_image_type_check constraint
// (widened from flyer|thumbnail|logo|unknown → flyer|photo|logo|unknown in
// migration 20260414_1708_image_type_allow_photo.sql).
//
// The scraper's analyzer can also emit 'unusable' — it's coalesced to
// 'unknown' at save time. See backend/lib/image-types.js.
export const IMAGE_TYPES = ['flyer', 'photo', 'logo', 'unknown'] as const;
export type ImageType = (typeof IMAGE_TYPES)[number];

export const IMAGE_TYPES_ANALYZER = ['flyer', 'photo', 'logo', 'unusable', 'unknown'] as const;
export type ImageTypeAnalyzer = (typeof IMAGE_TYPES_ANALYZER)[number];

// -----------------------------------------------------------------------------
// ACCESSIBILITY TAGS (accessibility analyzer)
// -----------------------------------------------------------------------------
// EXPLICIT-ONLY accessibility features. Tag only appears if the page SAYS IT.
// Never inferred from venue type, category, or organizer. Over-claiming
// accessibility is worse than missing it — a wheelchair user showing up to a
// venue we tagged `step_free` and finding stairs has been actively harmed.
//
// Stored in events.accessibility_tags TEXT[] (flat surface for fast filter)
// AND in events.inferred_signals.accessibility.evidence (per-tag quoted
// fragment from the page, so reviewers can audit).
//
// This is the only closed-vocab field in the new signals set that is
// never-inferred. Surface at the TOP of filter drawer (above Vibe).
export const ACCESSIBILITY_TAGS = [
  'step_free',                    // Step-free entrance / wheelchair accessible / ramp access
  'asl_interpreted',              // ASL interpretation provided (at least for part of the event)
  'captioned',                    // Open captions, live captioning, or CART mentioned
  'audio_description',            // Audio description for blind/low-vision attendees
  'sensory_friendly_session',     // Designated sensory-friendly performance or quiet room
  'service_dog_welcome',          // Service animals explicitly welcomed
  'gender_neutral_restroom',      // Gender-neutral or all-gender restrooms on-site
  'large_print_materials',        // Large-print programs/menus/materials available
  'reserved_accessible_seating',  // Accessible seating can be reserved in advance
  'childcare_on_site',            // Childcare provided during the event
  'nursing_friendly',             // Dedicated nursing/lactation space mentioned
  'scent_free_policy',            // Fragrance-free or low-scent policy stated
] as const;

export type AccessibilityTag = (typeof ACCESSIBILITY_TAGS)[number];

// Human-readable labels for UI. Keep snake_case values stable; label is display only.
// Mirrors ACCESSIBILITY_TAG_LABELS in scraper's backend/lib/vocabularies.js.
export const ACCESSIBILITY_TAG_LABELS: Record<AccessibilityTag, string> = {
  step_free: 'Step-free entrance',
  asl_interpreted: 'ASL interpretation',
  captioned: 'Captioned',
  audio_description: 'Audio description',
  sensory_friendly_session: 'Sensory-friendly session',
  service_dog_welcome: 'Service animals welcome',
  gender_neutral_restroom: 'Gender-neutral restrooms',
  large_print_materials: 'Large-print materials',
  reserved_accessible_seating: 'Reserved accessible seating',
  childcare_on_site: 'Childcare on-site',
  nursing_friendly: 'Nursing/lactation space',
  scent_free_policy: 'Scent-free policy',
};

// -----------------------------------------------------------------------------
// SENSORY TAGS (sensory analyzer)
// -----------------------------------------------------------------------------
// How the room will feel to the nervous system. Critical for neurodivergent
// folks, anyone with light/sound sensitivities, migraine sufferers, PTSD,
// or anyone deciding whether they have the bandwidth tonight.
//
// Stored in events.sensory_tags TEXT[] + events.inferred_signals.sensory.
// Inferable from event type when the page doesn't spell it out — every
// inferred tag must say "(inferred from event type: …)" in its evidence
// string and gets lower confidence.
export const SENSORY_TAGS = [
  'loud_music',           // Amplified music at a level that interferes with conversation
  'live_amplified',       // Live band or PA with high peak volume
  'strong_scents',        // Incense, essential oils, heavy perfume norms, strong food aromas
  'strobe_lights',        // Strobes, flashing lights, fast LEDs. SEIZURE-RELEVANT.
  'low_light',            // Dim or candlelit room — reading text is hard
  'dark_room',            // Effectively lights-out (film, immersive)
  'crowded',              // Bodies-within-arms-reach for most of the event
  'standing_room',        // No seats guaranteed; on your feet
  'seated_throughout',    // Seating assigned/guaranteed; no long standing
  'loud_crowd',           // Loud talking/cheering crowd, separate from music
  'quiet_expected',       // Library rules — silence/whispers expected
  'unpredictable_volume', // Volume varies widely (kids events, festivals, open mic)
] as const;

export type SensoryTag = (typeof SENSORY_TAGS)[number];

export const SENSORY_TAG_LABELS: Record<SensoryTag, string> = {
  loud_music: 'Loud music',
  live_amplified: 'Live amplified sound',
  strong_scents: 'Strong scents',
  strobe_lights: 'Strobe lights',
  low_light: 'Low light',
  dark_room: 'Dark room',
  crowded: 'Crowded',
  standing_room: 'Standing room',
  seated_throughout: 'Seated throughout',
  loud_crowd: 'Loud crowd',
  quiet_expected: 'Quiet expected',
  unpredictable_volume: 'Unpredictable volume',
};

// Priority order for "which sensory tag to surface first on a card" — higher
// items in the list win the limited card real-estate. strobe_lights wins
// because it's the most decision-critical (seizure risk); volume signals
// come next; comfort signals last. Byte-synced with scraper.
export const SENSORY_TAG_PRIORITY: readonly SensoryTag[] = [
  'strobe_lights',
  'loud_music',
  'live_amplified',
  'loud_crowd',
  'crowded',
  'standing_room',
  'strong_scents',
  'unpredictable_volume',
  'low_light',
  'dark_room',
  'quiet_expected',
  'seated_throughout',
] as const;

// -----------------------------------------------------------------------------
// LEAVE-WITH (basic-info analyzer)
// -----------------------------------------------------------------------------
// What does an attendee LEAVE this event with? Structural question, not a
// feelings question. The format produces a thing, a skill, a connection, a
// full belly, a memory, a shifted mood, or just the experience itself.
//
// Pick 1–3. `just_an_experience` is its own answer — do NOT combine with
// other tags (the basic-info analyzer's prompt + validator enforces this).
//
// Stored in events.leave_with TEXT[] + events.inferred_signals.leave_with.
export const LEAVE_WITH = [
  'a_thing_you_made',     // You walk out holding/wearing something YOU produced
  'a_new_skill',          // You can do something at the end you couldn't at the start
  'a_new_connection',     // The format puts you in contact with people you didn't come with
  'a_full_belly',         // The food IS the event or a substantial part of it
  'a_photo_or_memory',    // Spectacle-driven — you came for the sight or moment
  'a_shifted_mood',       // You came stressed, you leave regulated
  'just_an_experience',   // The point is the thing itself; nothing else goes home with you
] as const;

export type LeaveWith = (typeof LEAVE_WITH)[number];

export const LEAVE_WITH_LABELS: Record<LeaveWith, string> = {
  a_thing_you_made: 'A thing you made',
  a_new_skill: 'A new skill',
  a_new_connection: 'A new connection',
  a_full_belly: 'A full belly',
  a_photo_or_memory: 'A memory',
  a_shifted_mood: 'A shifted mood',
  just_an_experience: 'Just the experience',
};

// -----------------------------------------------------------------------------
// SOCIAL MODES (vibe-sliders analyzer → events.social_mode)
// -----------------------------------------------------------------------------
// How the room is SHAPED for who shows up — answers "can I come alone and
// not feel weird?" Single-value enum. `solo_welcoming` is about the ROOM,
// not your personal comfort: a mixer is NOT solo_welcoming even if you
// personally enjoy going alone — it's mingling_required.
export const SOCIAL_MODES = [
  'solo_welcoming',     // Alone feels normal (classes, lectures, drop-in craft, most shows)
  'pair_friendly',      // Works great with one other person (date spots, dinners)
  'small_group',        // 3–6 sweet spot (trivia, escape rooms, dinner parties)
  'large_group',        // 6+ shines (festivals, parties, group outings)
  'mingling_required',  // Meeting strangers IS the point (networking, mixers, speed friending)
  'parallel_play',      // In a room with others doing your own thing (open studio, body-doubling)
  'observational',      // Audience-shaped (concerts, films, talks) — no peer interaction expected
] as const;

export type SocialMode = (typeof SOCIAL_MODES)[number];

export const SOCIAL_MODE_LABELS: Record<SocialMode, string> = {
  solo_welcoming: 'Comfortable solo',
  pair_friendly: 'Good for two',
  small_group: 'Small group (3–6)',
  large_group: 'Group of 6+',
  mingling_required: 'Meet strangers',
  parallel_play: 'Parallel play',
  observational: 'Audience-style',
};

// -----------------------------------------------------------------------------
// ENERGY NEEDED (vibe-sliders analyzer → events.energy_needed)
// -----------------------------------------------------------------------------
// What the body and brain have to GIVE. Single-value enum. Pick the single
// DOMINANT mode of output required. If torn between two modes, pick
// whichever is more load-bearing for the decision to attend.
export const ENERGY_NEEDED = [
  'receptive',              // Show up, sit/stand, let it happen. (Concert, film, sound bath.)
  'light_participation',    // Clap, sing along, answer trivia, chat with a neighbor.
  'participatory',          // You're doing the thing — dancing, making, speaking, moving.
  'physically_demanding',   // Sweat, soreness, fitness baseline expected.
  'emotionally_demanding',  // Grief, vulnerability, conflict, heavy material. Pace yourself.
  'mentally_demanding',     // Sustained focus, complex material, long-form learning.
] as const;

export type EnergyNeeded = (typeof ENERGY_NEEDED)[number];

export const ENERGY_NEEDED_LABELS: Record<EnergyNeeded, string> = {
  receptive: 'Sit back and receive',
  light_participation: 'Light participation',
  participatory: 'Fully participatory',
  physically_demanding: 'Physically demanding',
  emotionally_demanding: 'Emotionally demanding',
  mentally_demanding: 'Mentally demanding',
};

// -----------------------------------------------------------------------------
// VIBE SLIDERS (vibe-sliders analyzer → events.inferred_signals.sliders)
// -----------------------------------------------------------------------------
// Four sliders, each 1–5 with confidence + evidence. NOT promoted to flat
// columns — slider queries are range-based and JSONB path access is fine at
// current scale. ADMIN-ONLY in v1 — the rubrics need human calibration audit
// before we expose slider filters publicly (see Stage 4 of TAGGING_UI_PROMPT).
//
// The rubrics live here as a structured dict so the admin review UI and
// scraper prompts share a single source of truth.
export const SLIDER_DIMENSIONS = [
  'social_intensity',
  'structure',
  'commitment',
  'spend_level',
] as const;

export type SliderDimension = (typeof SLIDER_DIMENSIONS)[number];

export interface SliderRubric {
  label: string;
  description: string;
  points: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
  };
}

export const SLIDER_RUBRICS: Record<SliderDimension, SliderRubric> = {
  social_intensity: {
    label: 'Social intensity',
    description: 'How much interaction with strangers is expected.',
    points: {
      1: 'Solo parallel — reading at a café, yoga class, museum visit. Can leave without speaking.',
      2: 'Ambient social — concert, film, lecture. In a room with people, not required to talk.',
      3: 'Light social — trivia with friends, group class, open mic. Talk with your group, nod at neighbors.',
      4: 'Active social — mixers, dinner parties, small workshops. Sustained conversation.',
      5: 'Mingling-required — speed dating, networking, icebreaker-heavy. Not talking to strangers = failing the event.',
    },
  },
  structure: {
    label: 'Structure',
    description: 'How scheduled or rigid the format is.',
    points: {
      1: 'Unstructured — drop-in open studio, hangout, happy hour. Come and go, do your thing.',
      2: 'Loose shape — market, festival grounds, gallery opening. Schedule exists; you set your path.',
      3: 'Semi-structured — brewery tour, guided tasting, trivia. A host leads with slack.',
      4: 'Structured — class, lecture, performance with set times. Follow the leader.',
      5: 'Highly structured — multi-session curriculum, ceremony, formal dinner with program. Every minute scheduled.',
    },
  },
  commitment: {
    label: 'Commitment',
    description: "How much you're locked in once you say yes.",
    points: {
      1: 'Drop-in, pay at door, walk up whenever. Zero commitment.',
      2: 'Ticketed single event, 1–3 hours. Buy it, show up, leave.',
      3: 'Half-day or full-day single event (festival day, retreat day, long workshop).',
      4: 'Multi-session series, camp, or multi-day event with connected content.',
      5: 'Long-term cohort (6+ weeks, fellowship, residency, training program).',
    },
  },
  spend_level: {
    label: 'Spend level',
    description: 'The HONEST cost of attending, including extras beyond the ticket.',
    points: {
      1: 'Free or donation-based. Maybe tip the performer.',
      2: 'Under $20 total. Cheap show, $5 cover, cheap drinks.',
      3: '$20–60 per person. Mid-range tickets, class fees, dinner out.',
      4: '$60–150 per person. Nicer dinner, premium ticket, workshop with supplies.',
      5: '$150+ per person. Gala, VIP, long retreat, weekend pass.',
    },
  },
};

// -----------------------------------------------------------------------------
// PRO TIP PERSONAS (pro-tips analyzer → events.pro_tips JSONB)
// -----------------------------------------------------------------------------
// Closed vocab of attendee personas the analyzer may speak TO when producing
// insider tips. Each event gets 0–2 tips; each tip is scoped to exactly one
// persona. Most events return [] — the analyzer is prompted to skip unless
// something genuinely decision-relevant applies.
//
// Stored in events.pro_tips JSONB as:
//   [{ persona, tip, confidence, source }]
export const PRO_TIP_PERSONAS = [
  'parent',
  'driver',
  'transit_rider',
  'concert_goer',
  'club_goer',
  'dancer',
  'dater',
  'foodie',
  'solo_goer',
  'first_timer',
  'budget_conscious',
  'pet_owner',
] as const;

export type ProTipPersona = (typeof PRO_TIP_PERSONAS)[number];

export const PRO_TIP_PERSONA_LABELS: Record<ProTipPersona, string> = {
  parent: 'Parents',
  driver: 'Driving / parking',
  transit_rider: 'Transit & bike',
  concert_goer: 'Concert-goers',
  club_goer: 'Club-goers',
  dancer: 'Dancers',
  dater: 'Date night',
  foodie: 'Foodies',
  solo_goer: 'Going solo',
  first_timer: 'First-timers',
  budget_conscious: 'Budget',
  pet_owner: 'Bringing a dog',
};

export interface ProTip {
  persona: ProTipPersona;
  tip: string;
  confidence: 'high' | 'medium';
  source: 'page' | 'general';
}

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
const PRICE_TYPE_SET = new Set<string>(PRICE_TYPES);
const IMAGE_TYPE_SET = new Set<string>(IMAGE_TYPES);
const SERIES_TYPE_SET = new Set<string>(SERIES_TYPES);
const RECURRENCE_FREQUENCY_SET = new Set<string>(RECURRENCE_FREQUENCIES);
const RECURRENCE_END_TYPE_SET = new Set<string>(RECURRENCE_END_TYPES);
const ACCESSIBILITY_TAG_SET = new Set<string>(ACCESSIBILITY_TAGS);
const SENSORY_TAG_SET = new Set<string>(SENSORY_TAGS);
const LEAVE_WITH_SET = new Set<string>(LEAVE_WITH);
const SOCIAL_MODE_SET = new Set<string>(SOCIAL_MODES);
const ENERGY_NEEDED_SET = new Set<string>(ENERGY_NEEDED);
const SLIDER_DIMENSION_SET = new Set<string>(SLIDER_DIMENSIONS);
const PRO_TIP_PERSONA_SET = new Set<string>(PRO_TIP_PERSONAS);

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

export function isPriceType(value: string): value is PriceType {
  return PRICE_TYPE_SET.has(value);
}

export function isImageType(value: string): value is ImageType {
  return IMAGE_TYPE_SET.has(value);
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

export function isAccessibilityTag(value: string): value is AccessibilityTag {
  return ACCESSIBILITY_TAG_SET.has(value);
}

export function isSensoryTag(value: string): value is SensoryTag {
  return SENSORY_TAG_SET.has(value);
}

export function isLeaveWith(value: string): value is LeaveWith {
  return LEAVE_WITH_SET.has(value);
}

export function isSocialMode(value: string): value is SocialMode {
  return SOCIAL_MODE_SET.has(value);
}

export function isEnergyNeeded(value: string): value is EnergyNeeded {
  return ENERGY_NEEDED_SET.has(value);
}

export function isSliderDimension(value: string): value is SliderDimension {
  return SLIDER_DIMENSION_SET.has(value);
}

export function isProTipPersona(value: string): value is ProTipPersona {
  return PRO_TIP_PERSONA_SET.has(value);
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
