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
    age_restriction: row.age_restriction as string | null ?? null,
    is_family_friendly: row.is_family_friendly as boolean | null ?? null,
    short_description: row.short_description as string | null ?? null,
    tagline: row.tagline as string | null ?? null,
    talent_name: row.talent_name as string | null ?? null,
    access_type: row.access_type as string | null ?? null,
    noise_level: row.noise_level as string | null ?? null,
    vibe_tags: (row.vibe_tags as string[] | null) ?? [],
    organizer_name: row.organizer_name as string | null ?? null,
    organizer_is_venue: (row.organizer_is_venue as boolean | null) ?? false,
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
      short_description, tagline, talent_name,
      access_type, noise_level, vibe_tags,
      organizer_name, organizer_is_venue,
      age_restriction, is_family_friendly,
      category:categories(name, slug),
      location:locations(name, slug)
    `
    )
    .eq('status', 'published')
    .is('deleted_at', null)
    .is('parent_event_id', null) // Children should not appear in featured
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
