/**
 * =============================================================================
 * CATEGORY → CHAPTER II VARIANT MAP
 * =============================================================================
 *
 * Picks the <Chapter variant> for Part II (the people / performers / leaders)
 * on the event detail page based on the event's category.
 *
 * Why per-category?
 *   - "Dark concert-bill" treatment nails a music show or art opening but
 *     feels wrong for a kids camp (too moody) or a farmers market (too
 *     edgy). The ARCHITECTURE of having a Part II is fine universally;
 *     the visual treatment needs to warm up for gentle categories.
 *
 * Two buckets:
 *   - 'dark'  → edgy / performance / creative events
 *   - 'cream' → warm / family / community / utilitarian events
 *
 * If a category isn't in the map, the default is 'cream' — fails toward
 * warmer / safer. Add new categories explicitly as they're created.
 *
 * Cross-file coupling:
 *   - src/app/event/[slug]/_sections/chapter.tsx — consumes the variant
 *   - src/app/event/[slug]/page.tsx — calls getChapterVariant() when
 *     rendering Part II
 *   - src/lib/constants/category-colors.ts — the canonical category list;
 *     any new category added there should be added here too
 * =============================================================================
 */

export type ChapterVariant = 'default' | 'cream' | 'dark';

const CATEGORY_CHAPTER_VARIANTS: Record<string, ChapterVariant> = {
  // Edgy / performance-coded — dark concert-bill works
  music: 'dark',
  nightlife: 'dark',
  arts: 'dark',
  festivals: 'dark',

  // Learning + doing — dark reads focused/studious
  workshops: 'dark',
  classes: 'dark',

  // Warm / family / community / utilitarian — cream reads friendly
  family: 'cream',
  markets: 'cream',
  outdoors: 'cream',
  community: 'cream',
  sports: 'cream',
  charity: 'cream',
  holiday: 'cream',
  food: 'cream',
  talks: 'cream',
};

/**
 * Returns the Part II chapter variant for a given category slug.
 * Unknown / null categories default to 'cream'.
 */
export function getChapterVariant(slug: string | null | undefined): ChapterVariant {
  if (!slug) return 'cream';
  return CATEGORY_CHAPTER_VARIANTS[slug] ?? 'cream';
}
