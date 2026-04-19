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
 * Phase 1 ships goodFor-only presets. Phase 3 / B7 will fill in vibeTags
 * once the atmosphere data is clean and the vibe filter UI ships.
 */
export const INTEREST_PRESETS = [
  {
    id: 'crafty-and-artsy',
    label: 'Crafty & artsy',
    description: 'Workshops, open mics, maker meetups, gallery nights',
    goodFor: ['creatives'],
  },
  {
    id: 'foodies',
    label: 'Foodies',
    description: 'Tastings, pop-ups, food tours, culinary classes',
    goodFor: ['foodies'],
  },
  {
    id: 'date-night',
    label: 'Date night',
    description: 'Romantic, intimate, couple-friendly outings',
    goodFor: ['date_night'],
  },
  {
    id: 'solo-friendly',
    label: 'Solo-friendly',
    description: 'Easy to attend alone — meetups, drop-ins, classes',
    goodFor: ['solo_friendly'],
  },
  {
    id: 'family-chaos',
    label: 'Family chaos',
    description: 'Kid-friendly mayhem, all ages, both age brackets',
    goodFor: ['families_young_kids', 'families_older_kids'],
  },
  {
    id: 'live-music',
    label: 'Live music',
    description: 'Concerts, DJ sets, open jams, music-forward events',
    goodFor: ['music_lovers'],
  },
  {
    id: 'outdoors',
    label: 'Outdoors',
    description: 'Parks, gardens, hikes, outdoor markets',
    goodFor: ['outdoorsy'],
  },
  {
    id: 'budget-friendly',
    label: 'Budget-friendly',
    description: 'Free or cheap — easy on the wallet',
    goodFor: ['budget_friendly', 'college_crowd'],
  },
  {
    id: 'first-timer',
    label: 'First-timer',
    description: 'Beginner-friendly, low barrier, welcoming newcomers',
    goodFor: ['first_timers'],
  },
  // ── Subculture-driven pills (2026-04) ───────────────────────────────────────
  // These match on `subcultures[]` instead of good_for. The signal lives in the
  // scene/identity tag, not the audience tag. Audit on the live dataset showed
  // queer (44/188), theater-kids (6/188), and comedy (added to vocab same ship)
  // were the strongest non-music clusters with no pill exposure.
  {
    id: 'comedy',
    label: 'Comedy',
    description: 'Stand-up, improv, comedy clubs, open mic comedy',
    goodFor: [],
    subcultures: ['comedy'],
  },
  {
    id: 'queer',
    label: 'Queer',
    description: 'LGBTQ+ events, drag, queer-centered programming',
    goodFor: [],
    subcultures: ['queer'],
  },
  {
    id: 'theater',
    label: 'Theater',
    description: 'Plays, musicals, performances for theater lovers',
    goodFor: [],
    subcultures: ['theater-kids'],
  },
] as const satisfies readonly InterestPreset[];

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
