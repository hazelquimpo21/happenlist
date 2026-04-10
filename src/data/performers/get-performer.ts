/**
 * GET PERFORMER (SINGLE)
 * ======================
 * Fetches a single performer by slug with their events.
 */

import { createClient } from '@/lib/supabase/server';
import type { Performer, EventCard } from '@/types';

/**
 * Fetches a single performer by slug.
 */
export async function getPerformer(
  params: { slug: string }
): Promise<Performer | null> {
  console.log('🎤 [getPerformer] Fetching performer:', params.slug);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('performers')
    .select('id, name, slug, bio, genre, image_url, website_url')
    .eq('slug', params.slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('⚠️ [getPerformer] Performer not found');
      return null;
    }
    console.error('❌ [getPerformer] Error:', error);
    throw error;
  }

  console.log('✅ [getPerformer] Found performer:', (data as Record<string, unknown>)?.name);

  return data as unknown as Performer;
}

/**
 * Fetches events for a performer, split into upcoming and past.
 */
export async function getPerformerEvents(
  performerId: string
): Promise<{ upcoming: EventCard[]; past: EventCard[] }> {
  console.log('🎤 [getPerformerEvents] Fetching events for performer:', performerId);

  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  // Get event_performers with full event data
  const { data, error } = await supabase
    .from('event_performers')
    .select(`
      role, billing_order,
      event:events!inner(
        id, title, slug, start_datetime, instance_date,
        image_url, thumbnail_url, price_type, price_low, price_high,
        is_free, heart_count, short_description, tagline, talent_name,
        access_type, noise_level, vibe_tags,
        organizer_name, organizer_is_venue,
        age_restriction, is_family_friendly,
        parent_event_id, status, deleted_at,
        category:categories(name, slug),
        location:locations(name, slug)
      )
    `)
    .eq('performer_id', performerId)
    .eq('event.status', 'published')
    .is('event.deleted_at', null)
    .order('billing_order', { ascending: true });

  if (error) {
    console.error('❌ [getPerformerEvents] Error:', error);
    throw error;
  }

  const upcoming: EventCard[] = [];
  const past: EventCard[] = [];

  for (const row of (data || []) as Record<string, unknown>[]) {
    const e = row.event as Record<string, unknown>;
    if (!e) continue;

    const category = e.category as Record<string, unknown> | null;
    const location = e.location as Record<string, unknown> | null;

    const card: EventCard = {
      id: e.id as string,
      title: e.title as string,
      slug: e.slug as string,
      start_datetime: e.start_datetime as string,
      instance_date: e.instance_date as string,
      image_url: e.image_url as string | null,
      thumbnail_url: e.thumbnail_url as string | null,
      price_type: e.price_type as string,
      price_low: e.price_low as number | null,
      price_high: e.price_high as number | null,
      is_free: e.is_free as boolean,
      heart_count: e.heart_count as number,
      category_name: (category?.name as string) ?? null,
      category_slug: (category?.slug as string) ?? null,
      location_name: (location?.name as string) ?? null,
      location_slug: (location?.slug as string) ?? null,
      short_description: e.short_description as string | null,
      talent_name: e.talent_name as string | null,
      access_type: e.access_type as string | null,
      noise_level: e.noise_level as string | null,
      vibe_tags: (e.vibe_tags as string[]) ?? [],
      organizer_name: e.organizer_name as string | null,
      organizer_is_venue: (e.organizer_is_venue as boolean) ?? false,
      age_restriction: e.age_restriction as string | null,
      is_family_friendly: e.is_family_friendly as boolean | null,
      parent_event_id: e.parent_event_id as string | null,
    };

    if ((e.instance_date as string) >= today) {
      upcoming.push(card);
    } else {
      past.push(card);
    }
  }

  // Sort upcoming ascending, past descending
  upcoming.sort((a, b) => a.start_datetime.localeCompare(b.start_datetime));
  past.sort((a, b) => b.start_datetime.localeCompare(a.start_datetime));

  console.log(`✅ [getPerformerEvents] Found ${upcoming.length} upcoming, ${past.length} past`);

  return { upcoming, past };
}
