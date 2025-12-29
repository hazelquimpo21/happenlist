// ============================================================================
// 🔗 HAPPENLIST - Slug Utility
// ============================================================================
// Converts strings into URL-friendly slugs.
// Used for creating clean URLs like /events/summer-music-festival
// ============================================================================

/**
 * Converts a string into a URL-friendly slug.
 *
 * Transformation rules:
 *   1. Convert to lowercase
 *   2. Replace spaces and underscores with hyphens
 *   3. Remove special characters (keep only letters, numbers, hyphens)
 *   4. Replace multiple consecutive hyphens with single hyphen
 *   5. Remove leading/trailing hyphens
 *
 * @example
 * slugify('Summer Music Festival 2024')
 * // => 'summer-music-festival-2024'
 *
 * @example
 * slugify("Milwaukee's Best Events!")
 * // => 'milwaukees-best-events'
 *
 * @example
 * slugify('Food & Drink')
 * // => 'food-drink'
 *
 * @param text - The text to convert to a slug
 * @returns URL-friendly slug string
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove special characters except hyphens and alphanumeric
    .replace(/[^\w\-]+/g, '')
    // Replace multiple hyphens with single hyphen
    .replace(/\-\-+/g, '-')
    // Remove leading hyphens
    .replace(/^-+/, '')
    // Remove trailing hyphens
    .replace(/-+$/, '')
}

/**
 * Generates a unique slug by appending a number if needed.
 * Checks against existing slugs to avoid duplicates.
 *
 * @example
 * const existing = ['summer-fest', 'summer-fest-2']
 * generateUniqueSlug('Summer Fest', existing)
 * // => 'summer-fest-3'
 *
 * @param text - The text to convert to a slug
 * @param existingSlugs - Array of slugs that already exist
 * @returns Unique slug string
 */
export function generateUniqueSlug(
  text: string,
  existingSlugs: string[]
): string {
  const baseSlug = slugify(text)
  let slug = baseSlug
  let counter = 2

  // Keep incrementing counter until we find a unique slug
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}
