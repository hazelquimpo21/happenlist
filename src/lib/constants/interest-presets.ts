/**
 * =============================================================================
 * INTEREST PRESETS — one-tap filter shortcuts
 * =============================================================================
 *
 * An interest preset is a curated label that resolves to a union of `good_for`
 * tags. The user picks one preset (e.g. "Date night") and the filter UI
 * applies the underlying tag set to the events query.
 *
 * Why presets instead of exposing raw tags?
 *   - The good_for taxonomy has 24 slugs — too many to surface as top-level
 *     pills without overwhelming the browse-first UX (Jamie, our primary
 *     persona, is in discovery mode and won't tap a 14-pill grid).
 *   - Some real-world intents map to MULTIPLE slugs ("Family chaos" needs
 *     both kid age groups). Presets let us bundle those.
 *   - Down the line (Phase 3 / Session B7) presets will ALSO bundle vibe_tags
 *     and subcultures once that data is clean. For now, B1 ships goodFor-only
 *     presets — vibeTags arrays are reserved for B7.
 *
 * Where this is consumed:
 *   - src/data/events/get-events.ts — `interestPreset` query param resolves
 *     into a goodFor union before building the SQL filter.
 *   - src/components/events/filters/* (B2) — preset chips render from the
 *     INTEREST_PRESETS array, in order.
 *
 * If you add a preset:
 *   - Pick an `id` that's URL-safe (lowercase, hyphenated). It becomes the
 *     query-param value, so changing it later breaks shared links.
 *   - Keep the `label` short (≤16 chars) — it's a chip label.
 *   - The `goodFor` array is type-checked against the canonical slug union
 *     in vocabularies.ts. A typo will fail compilation.
 *   - Order in the array IS the display order in the UI.
 * =============================================================================
 */

import type { GoodForSlug, Subculture } from './vocabularies';

/**
 * A single interest preset definition.
 *
 * @property id          URL-safe identifier, used as the `interestPreset`
 *                       query-param value. Stable — changing it breaks links.
 * @property label       Human-readable label rendered on the chip in the UI.
 * @property description One-line explanation, used for tooltips and a11y.
 * @property goodFor     Union of `good_for` slugs this preset expands into.
 *                       The query layer ORs these together (any-match).
 *                       Can be empty if the preset is subculture-driven.
 * @property subcultures Optional union of `subcultures` slugs. Events whose
 *                       `subcultures` column overlaps this set pass the
 *                       filter. Used for scene-based pills (Comedy, Queer,
 *                       Theater) where the signal lives in subcultures, not
 *                       good_for. Merged into the user's direct subculture
 *                       selection at query time.
 * @property vibeTags    Reserved for Phase 3 (Session B7). Currently unused —
 *                       see file header. Type kept open so adding presets
 *                       later is a one-line change, not a refactor.
 */
export interface InterestPreset {
  id: string;
  label: string;
  description: string;
  goodFor: readonly GoodForSlug[];
  subcultures?: readonly Subculture[];
  vibeTags?: readonly string[];
}

/**
 * All interest presets, in display order.
 *
 * 2026-04-22 — reshaped as the "Good for" row. Rationale:
 *   - Occasion-framed (Date night, Girls' night, After work, Rainy day)
 *     beats topic-framed (Live music, Theater, Comedy) because topics
 *     overlap the Category row and create "which one do I pick?" confusion.
 *   - Topic-framed presets removed: crafty-and-artsy → Arts/Workshops categories;
 *     live-music → Music category; outdoors → Outdoors category;
 *     comedy → Nightlife category; theater → Arts category; budget-friendly →
 *     dedicated Budget row. Queer is an identity filter — moved to the drawer.
 *   - family-chaos replaced by `with-kids`, which triggers a progressive
 *     disclosure for age-bucket chips + a "remember for next visit" toggle
 *     (see with-kids-expander.tsx + use-kid-ages.ts).
 *
 * Stale URLs from the old presets fail open (getInterestPreset returns null,
 * no filter applied) rather than crashing.
 *
 * Phase 1 shipped goodFor-only presets. Phase 3 / B7 will fill in vibeTags
 * once the atmosphere data is clean and the vibe filter UI ships.
 */
export const INTEREST_PRESETS = [
  {
    id: 'date-night',
    label: 'Date night',
    description: 'Romantic, intimate, couple-friendly outings',
    goodFor: ['date_night'],
  },
  {
    id: 'solo-friendly',
    label: 'Solo',
    description: 'Easy to attend alone — meetups, drop-ins, classes',
    goodFor: ['solo_friendly'],
  },
  {
    id: 'with-kids',
    label: 'With kids',
    description: 'Kid-friendly events — pick ages for a finer fit',
    goodFor: ['families_young_kids', 'families_older_kids'],
  },
  {
    id: 'after-work',
    label: 'After work',
    description: 'Happy hours, weeknight drop-ins, post-5pm',
    goodFor: ['after_work'],
  },
  {
    id: 'girls-night',
    label: "Girls' night",
    description: 'Paint nights, drag brunches, group-friendly fun',
    goodFor: ['girls_night'],
  },
  {
    id: 'foodies',
    label: 'Foodies',
    description: 'Tastings, pop-ups, food tours, culinary experiences',
    goodFor: ['foodies'],
  },
  {
    id: 'rainy-day',
    label: 'Rainy day',
    description: 'Indoor activities perfect for bad weather',
    goodFor: ['rainy_day'],
  },
  {
    id: 'occasion-worthy',
    label: 'Occasion',
    description: "Birthdays, anniversaries, bachelorette — when it's a big deal",
    goodFor: ['occasion_worthy'],
  },
  {
    id: 'game-night',
    label: 'Game night',
    description: 'Board games, D&D, trivia, tabletop nights',
    goodFor: ['game_night'],
  },
  {
    id: 'meet-people',
    label: 'Meet people',
    description: 'Mixers, meetups, networking, community events',
    goodFor: ['meet_people'],
  },
] as const satisfies readonly InterestPreset[];

/**
 * The preset id that triggers the "With kids" progressive disclosure
 * (age-bucket sub-row + "remember my kids" toggle). Centralized as a constant
 * so the FilterBar and the Expander never drift.
 */
export const WITH_KIDS_PRESET_ID = 'with-kids';

export type InterestPresetId = (typeof INTEREST_PRESETS)[number]['id'];

// Build a lookup map at module load — O(1) access by id.
const PRESET_BY_ID = new Map<string, InterestPreset>(
  INTEREST_PRESETS.map((p) => [p.id, p])
);

/**
 * Look up a preset by id. Returns null for unknown ids — callers MUST handle
 * the null case (e.g. URL params from saved/shared links may be stale).
 */
export function getInterestPreset(id: string): InterestPreset | null {
  return PRESET_BY_ID.get(id) ?? null;
}

/**
 * Resolve a preset id to its underlying goodFor union.
 * Returns an empty array for unknown ids — query layer treats this as "no
 * preset filter" rather than crashing on stale links.
 */
export function resolveInterestPresetGoodFor(id: string): GoodForSlug[] {
  const preset = PRESET_BY_ID.get(id);
  return preset ? [...preset.goodFor] : [];
}

/**
 * Resolve a preset id to its underlying subcultures union.
 * Returns an empty array when the preset has no subcultures (the goodFor-only
 * pills) OR when the id is unknown. Callers merge with any direct subculture
 * filter at query time.
 */
export function resolveInterestPresetSubcultures(id: string): Subculture[] {
  const preset = PRESET_BY_ID.get(id);
  return preset?.subcultures ? [...preset.subcultures] : [];
}
