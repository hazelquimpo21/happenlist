/**
 * GET FEATURED EVENTS
 * ===================
 * Fetches featured events for the homepage.
 */

import { createClient } from '@/lib/supabase/server';
import type { EventCard } from '@/types';

interface GetFeaturedEventsParams {
  /** Maximum number of events */
  limit?: number;
}

/**
 * Transform raw database row to EventCard format.
 */
function transformToEventCard(row: Record<string, unknown>): EventCard {
  const category = row.category as Record<string, unknown> | null;
  const location = row.location as Record<string, unknown> | null;

  return {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    start_datetime: row.start_datetime as string,
    instance_date: row.instance_date as string,
    image_url: row.image_url as string | null,
    thumbnail_url: row.thumbnail_url as string | null,
    price_type: row.price_type as string,
    price_low: row.price_low as number | null,
    price_high: row.price_high as number | null,
    is_free: row.is_free as boolean,
    heart_count: row.heart_count as number,
    category_name: category?.name as string | null ?? null,
    category_slug: category?.slug as string | null ?? null,
    location_name: location?.name as string | null ?? null,
    location_slug: location?.slug as string | null ?? null,
  };
}

/**
 * Fetches featured events for the homepage.
 *
 * @example
 * const events = await getFeaturedEvents({ limit: 6 });
 */
export async function getFeaturedEvents(
  params: GetFeaturedEventsParams = {}
): Promise<EventCard[]> {
  const { limit = 6 } = params;

  console.log('⭐ [getFeaturedEvents] Fetching featured events:', { limit });

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select(
      `
      id, title, slug, start_datetime, instance_date,
      image_url, thumbnail_url, price_type, price_low, price_high,
      is_free, heart_count,
      category:categories(name, slug),
      location:locations(name, slug)
    `
    )
    .eq('status', 'published')
    .eq('is_featured', true)
    .gte('instance_date', new Date().toISOString().split('T')[0])
    .order('featured_order', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('❌ [getFeaturedEvents] Error:', error);
    throw error;
  }

  const events = (data || []).map(transformToEventCard);

  console.log(`✅ [getFeaturedEvents] Found ${events.length} featured events`);

  return events;
}
