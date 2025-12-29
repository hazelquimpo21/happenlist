/**
 * SLUG UTILITIES
 * ==============
 * Functions for generating and handling URL slugs.
 */

import slugify from 'slugify';

/**
 * Generates a URL-safe slug from text.
 *
 * @example
 * generateSlug('Jazz at the Lake!')
 * // => 'jazz-at-the-lake'
 *
 * generateSlug('The Pabst Theater')
 * // => 'the-pabst-theater'
 */
export function generateSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
}

/**
 * Converts a slug back to title case.
 *
 * @example
 * slugToTitle('jazz-at-the-lake')
 * // => 'Jazz At The Lake'
 */
export function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
