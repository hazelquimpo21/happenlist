/**
 * =============================================================================
 * CATEGORY DISPLAY ORDER — canonical visual order for the 15 categories
 * =============================================================================
 *
 * The design system (B1 redesign) specifies a locked visual order for the 15
 * event categories. Used wherever a category list needs deterministic ordering:
 *   - Homepage "Events by Category" section
 *   - Category popover inside the segmented picker
 *   - CategoryStrip horizontal scroll
 *
 * Matches the DB `categories.slug` column. Short-form aliases (e.g. 'food',
 * 'arts') are NOT listed here — those live in category-colors.ts for
 * backwards-compat only. New call sites must use the DB slug.
 *
 * Cross-file coupling:
 *   - src/lib/constants/category-colors.ts — color map (keyed by same slug)
 *   - src/lib/filters/b1-segments.ts — segment config consumes this order
 *   - src/data/categories/get-categories.ts — server-side category fetch
 *     is sorted by this order before rendering
 * =============================================================================
 */

/**
 * The 15 DB category slugs in canonical visual order.
 * Stable — changing order changes every UI that renders categories.
 */
export const CATEGORY_DISPLAY_ORDER: readonly string[] = [
  'music',
  'arts-culture',
  'food-drink',
  'family',
  'sports-fitness',
  'nightlife',
  'community',
  'classes-workshops',
  'festivals',
  'theater-film',
  'markets-shopping',
  'talks-lectures',
  'outdoors-nature',
  'charity-fundraising',
  'holiday-seasonal',
] as const;

// O(1) lookup for sort comparator. Built once at module load.
const ORDER_INDEX = new Map<string, number>(
  CATEGORY_DISPLAY_ORDER.map((slug, i) => [slug, i])
);

/**
 * Sort an array of category-like objects by the canonical display order.
 * Unknown slugs sort to the end (preserving their relative input order).
 *
 * Generic over T so callers can sort rows of any shape — just pass the
 * getter that extracts the slug.
 */
export function sortCategoriesByDisplayOrder<T>(
  items: readonly T[],
  getSlug: (item: T) => string | null | undefined
): T[] {
  const END = CATEGORY_DISPLAY_ORDER.length;
  return [...items].sort((a, b) => {
    const aSlug = getSlug(a) ?? '';
    const bSlug = getSlug(b) ?? '';
    const aIdx = ORDER_INDEX.get(aSlug) ?? END;
    const bIdx = ORDER_INDEX.get(bSlug) ?? END;
    return aIdx - bIdx;
  });
}
