/**
 * URL UTILITIES
 * =============
 * Functions for building URLs throughout the app.
 */

/**
 * Builds an event detail URL.
 * Format: /event/{slug}-{YYYY-MM-DD}
 *
 * @example
 * buildEventUrl({ slug: 'jazz-at-the-lake', instance_date: '2025-02-14' })
 * // => '/event/jazz-at-the-lake-2025-02-14'
 */
export function buildEventUrl(event: {
  slug: string;
  instance_date: string;
}): string {
  return `/event/${event.slug}-${event.instance_date}`;
}

/**
 * Parses an event URL slug back into slug and date.
 *
 * @example
 * parseEventSlug('jazz-at-the-lake-2025-02-14')
 * // => { slug: 'jazz-at-the-lake', date: '2025-02-14' }
 */
export function parseEventSlug(
  fullSlug: string
): { slug: string; date: string } | null {
  // Match YYYY-MM-DD at the end of the slug
  const dateMatch = fullSlug.match(/-(\d{4}-\d{2}-\d{2})$/);

  if (!dateMatch) {
    return null;
  }

  const date = dateMatch[1];
  const slug = fullSlug.replace(`-${date}`, '');

  return { slug, date };
}

/**
 * Builds a venue detail URL.
 *
 * @example
 * buildVenueUrl({ slug: 'pabst-theater' })
 * // => '/venue/pabst-theater'
 */
export function buildVenueUrl(venue: { slug: string }): string {
  return `/venue/${venue.slug}`;
}

/**
 * Builds an organizer detail URL.
 *
 * @example
 * buildOrganizerUrl({ slug: 'milwaukee-jazz-collective' })
 * // => '/organizer/milwaukee-jazz-collective'
 */
export function buildOrganizerUrl(organizer: { slug: string }): string {
  return `/organizer/${organizer.slug}`;
}

/**
 * Builds a category events URL.
 *
 * @example
 * buildCategoryUrl({ slug: 'music' })
 * // => '/events/music'
 */
export function buildCategoryUrl(category: { slug: string }): string {
  return `/events/${category.slug}`;
}

/**
 * Builds a search results URL.
 *
 * @example
 * buildSearchUrl('jazz concerts')
 * // => '/search?q=jazz%20concerts'
 */
export function buildSearchUrl(query: string): string {
  return `/search?q=${encodeURIComponent(query)}`;
}

/**
 * Builds events URL with filters.
 */
export function buildEventsUrl(filters?: {
  category?: string;
  from?: string;
  to?: string;
  free?: boolean;
}): string {
  if (!filters) return '/events';

  const params = new URLSearchParams();

  if (filters.category) params.set('category', filters.category);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.free) params.set('free', 'true');

  const queryString = params.toString();
  return queryString ? `/events?${queryString}` : '/events';
}
