/**
 * =============================================================================
 * AGE GROUPS — age-based filter buckets for event discovery
 * =============================================================================
 *
 * Defines the age group filter options used in the FilterDrawer and query
 * layer. Each group maps to a predicate against the `age_low` column (and
 * sometimes `good_for`) in the events table.
 *
 * IMPORTANT DATA CONSTRAINT:
 *   `age_high` is effectively empty in the database (3 of 238+ events as of
 *   2026-04-11). ALL age-group filtering MUST use `age_low` only. Do NOT
 *   reference age_high in predicates — it will silently exclude almost
 *   everything. This constraint is documented in the filter roadmap and
 *   the Phase 1 data audit.
 *
 * Key design decisions:
 *   - "all_ages" matches events where age_low IS NULL OR age_low = 0
 *     (NULL = organizer didn't specify = assumed all-ages).
 *   - "families_young_kids" matches age_low <= 5 OR age_low IS NULL
 *     (unspecified events are presumed accessible to families).
 *   - "college" matches age_low 18–25 (age range only).
 *   - Events with NULL age_low are NOT excluded from browse — they just
 *     won't match age-restricted tier filters (teens, 21+).
 *
 * Cross-file coupling:
 *   - src/data/events/get-events.ts — builds Supabase predicates per group
 *   - src/components/events/filters/filter-drawer.tsx — renders chip UI
 *   - src/components/events/filters/empty-filter-state.tsx — label lookup
 *   - src/components/events/filters/types.ts — FilterState.ageGroup field
 *   - src/types/filters.ts — EventQueryParams.ageGroup field
 *
 * If you add a group:
 *   1. Add it to AGE_GROUPS below
 *   2. Add the predicate case in get-events.ts
 *   3. The UI picks it up automatically from the array
 * =============================================================================
 */

/**
 * A single age group definition.
 *
 * @property slug        URL-safe identifier, used as the `ageGroup` query-param value.
 * @property label       Human-readable label rendered on the chip.
 * @property description Tooltip / a11y text.
 * @property icon        Lucide icon name.
 * @property ageFloor    Minimum age_low for this group (inclusive). Undefined = no floor.
 * @property ageCeiling  Maximum age_low for this group (inclusive). Undefined = no ceiling.
 */
export interface AgeGroup {
  slug: string;
  label: string;
  description: string;
  icon: string;
  ageFloor?: number;
  ageCeiling?: number;
}

/**
 * All age groups, in display order.
 *
 * Order: broadest → youngest → oldest. This mirrors how users think about
 * age suitability — "can my kid go?" before "is this 21+?"
 */
export const AGE_GROUPS: AgeGroup[] = [
  {
    slug: 'all_ages',
    label: 'All Ages',
    description: 'No age restriction',
    icon: 'Users',
  },
  {
    slug: 'families_young_kids',
    label: 'Young Kids (5 & under)',
    description: 'Suitable for toddlers and preschoolers',
    icon: 'Baby',
    ageCeiling: 5,
  },
  {
    slug: 'elementary',
    label: 'Kids (6–11)',
    description: 'Elementary-age activities',
    icon: 'Backpack',
    ageFloor: 6,
    ageCeiling: 11,
  },
  {
    slug: 'teens',
    label: 'Teens (12–17)',
    description: 'Teen-friendly events',
    icon: 'Headphones',
    ageFloor: 12,
    ageCeiling: 17,
  },
  {
    slug: 'college',
    label: 'College (18–25)',
    description: 'College-age events and student-priced',
    icon: 'GraduationCap',
    ageFloor: 18,
    ageCeiling: 25,
  },
  {
    slug: 'twenty_one_plus',
    label: '21+',
    description: 'Events requiring attendees to be 21 or older',
    icon: 'Wine',
    ageFloor: 21,
  },
];

/** Union of valid age group slugs. Keep in sync with AGE_GROUPS above. */
export type AgeGroupSlug = 'all_ages' | 'families_young_kids' | 'elementary' | 'teens' | 'college' | 'twenty_one_plus';

/** Set of valid group slugs for runtime validation. */
const VALID_SLUGS = new Set(AGE_GROUPS.map((g) => g.slug));

/** Type guard: is this string a valid age group slug? */
export function isAgeGroupSlug(value: string): value is AgeGroupSlug {
  return VALID_SLUGS.has(value);
}

/** Look up a single group by slug. Returns undefined for unknown slugs. */
export function getAgeGroup(slug: string): AgeGroup | undefined {
  return AGE_GROUPS.find((g) => g.slug === slug);
}

/**
 * Look up multiple groups by slug array.
 * Returns groups in canonical display order (matching AGE_GROUPS order).
 */
export function getAgeGroups(slugs: string[]): AgeGroup[] {
  return AGE_GROUPS.filter((g) => slugs.includes(g.slug));
}
