/**
 * GET SIMILAR EVENTS
 * ==================
 * Finds events similar to a given event using vibe profile,
 * category, and metadata for similarity scoring.
 *
 * Uses a Supabase RPC call with a scoring algorithm based on:
 * - Vibe tag overlap (highest weight)
 * - Subculture overlap
 * - Atmosphere dimension proximity
 * - Same category bonus
 * - Same access type bonus
 */

import { createClient } from '@/lib/supabase/server';
import type { EventCard } from '@/types';

interface SimilarEventParams {
  eventId: string;
  categoryId: string | null;
  vibeTags: string[];
  subcultures: string[];
  energyLevel: number | null;
  formality: number | null;
  crowdedness: number | null;
  accessType: string | null;
  limit?: number;
}

/**
 * Fetches events similar to the given event based on vibe profile.
 * Falls back to category + date sorting when no vibe data exists.
 */
export async function getSimilarEvents(
  params: SimilarEventParams
): Promise<EventCard[]> {
  const {
    eventId,
    categoryId,
    vibeTags,
    subcultures,
    energyLevel,
    formality,
    crowdedness,
    accessType,
    limit = 6,
  } = params;

  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  // If we have vibe data, use a scoring approach via raw SQL
  const hasVibeData = vibeTags.length > 0 || subcultures.length > 0 ||
    energyLevel != null || formality != null;

  if (!hasVibeData) {
    // Fallback: same category, upcoming, ordered by date
    let query = supabase
      .from('events')
      .select(`
        id, title, slug, start_datetime, instance_date,
        image_url, thumbnail_url, price_type, price_low, price_high,
        is_free, heart_count,
        short_description, tagline, talent_name,
        access_type, noise_level, vibe_tags,
        organizer_name, organizer_is_venue,
        age_restriction, is_family_friendly,
        category:categories(name, slug),
        location:locations(name, slug)
      `)
      .eq('status', 'published')
      .is('deleted_at', null)
      .neq('id', eventId)
      .gte('instance_date', today)
      .order('instance_date', { ascending: true })
      .limit(limit);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data } = await query;
    return (data || []).map(transformRow);
  }

  // Use RPC for scored similarity (cast needed until types are regenerated)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('get_similar_events', {
    p_event_id: eventId,
    p_category_id: categoryId,
    p_vibe_tags: vibeTags,
    p_subcultures: subcultures,
    p_energy: energyLevel ?? 3,
    p_formality: formality ?? 3,
    p_crowdedness: crowdedness ?? 3,
    p_access_type: accessType,
    p_limit: limit,
  });

  if (error) {
    console.warn('⚠️ [getSimilarEvents] RPC failed, falling back:', error.message);
    // Fallback to simple query
    const { data: fallback } = await supabase
      .from('events')
      .select(`
        id, title, slug, start_datetime, instance_date,
        image_url, thumbnail_url, price_type, price_low, price_high,
        is_free, heart_count,
        short_description, tagline, talent_name,
        access_type, noise_level, vibe_tags,
        organizer_name, organizer_is_venue,
        age_restriction, is_family_friendly,
        category:categories(name, slug),
        location:locations(name, slug)
      `)
      .eq('status', 'published')
      .is('deleted_at', null)
      .neq('id', eventId)
      .gte('instance_date', today)
      .order('instance_date', { ascending: true })
      .limit(limit);

    return (fallback || []).map(transformRow);
  }

  return ((data as Record<string, unknown>[]) || []).map(transformRow);
}

function transformRow(row: Record<string, unknown>): EventCard {
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
    category_name: (category?.name as string | null) ?? null,
    category_slug: (category?.slug as string | null) ?? null,
    location_name: (location?.name as string | null) ?? null,
    location_slug: (location?.slug as string | null) ?? null,
    age_restriction: (row.age_restriction as string | null) ?? null,
    is_family_friendly: (row.is_family_friendly as boolean | null) ?? null,
    short_description: (row.short_description as string | null) ?? null,
    tagline: (row.tagline as string | null) ?? null,
    talent_name: (row.talent_name as string | null) ?? null,
    access_type: (row.access_type as string | null) ?? null,
    noise_level: (row.noise_level as string | null) ?? null,
    vibe_tags: (row.vibe_tags as string[] | null) ?? [],
    organizer_name: (row.organizer_name as string | null) ?? null,
    organizer_is_venue: (row.organizer_is_venue as boolean | null) ?? false,
  };
}
