/**
 * CHILD EVENTS
 * ============
 * Fetches child events for a parent event (festival screenings,
 * concert acts, conference sessions, etc.)
 */

import { createClient } from '@/lib/supabase/server';
import type { EventCard } from '@/types';

interface GetChildEventsParams {
  parentEventId: string;
  /** Filter to a specific parent_group (e.g. venue name within a festival) */
  parentGroup?: string;
}

interface ChildEventsResult {
  events: EventCard[];
  /** Distinct parent_group values for filter pills */
  groups: string[];
}

/**
 * Lightweight parent info for breadcrumbs on child pages.
 */
export interface ParentEventInfo {
  id: string;
  title: string;
  slug: string;
  instance_date: string;
  start_datetime: string;
  end_datetime: string | null;
  image_url: string | null;
  category_slug: string | null;
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
    parent_event_id: (row.parent_event_id as string | null) ?? null,
    parent_group: (row.parent_group as string | null) ?? null,
  };
}

/**
 * Fetches all published children of a parent event, ordered chronologically.
 * Also returns the distinct parent_group values for filter pills.
 */
export async function getChildEvents(
  params: GetChildEventsParams
): Promise<ChildEventsResult> {
  const { parentEventId, parentGroup } = params;

  console.log('👶 [getChildEvents] Fetching children for parent:', parentEventId);

  const supabase = await createClient();

  let query = supabase
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
      parent_event_id, parent_group,
      category:categories(name, slug),
      location:locations(name, slug)
    `
    )
    .eq('parent_event_id', parentEventId)
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('start_datetime', { ascending: true });

  if (parentGroup) {
    query = query.eq('parent_group', parentGroup);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ [getChildEvents] Error:', error);
    throw error;
  }

  const events = (data || []).map(transformToEventCard);

  // Extract distinct parent_group values for filter pills
  const groupSet = new Set<string>();
  for (const row of data || []) {
    const group = (row as Record<string, unknown>).parent_group as string | null;
    if (group) groupSet.add(group);
  }
  const groups = Array.from(groupSet).sort();

  console.log(`✅ [getChildEvents] Found ${events.length} children, ${groups.length} groups`);

  return { events, groups };
}

/**
 * Lightweight fetch for parent event info (breadcrumbs, badges on child pages).
 */
export async function getParentEventInfo(
  parentEventId: string
): Promise<ParentEventInfo | null> {
  console.log('🔗 [getParentEventInfo] Fetching parent:', parentEventId);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select(
      `
      id, title, slug, instance_date, start_datetime, end_datetime,
      image_url,
      category:categories(slug)
    `
    )
    .eq('id', parentEventId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('❌ [getParentEventInfo] Error:', error);
    throw error;
  }

  // Cast needed: parent_event_id column not yet in generated Supabase types
  const row = data as Record<string, unknown>;
  const category = row.category as Record<string, unknown> | null;

  return {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    instance_date: row.instance_date as string,
    start_datetime: row.start_datetime as string,
    end_datetime: row.end_datetime as string | null,
    image_url: row.image_url as string | null,
    category_slug: (category?.slug as string | null) ?? null,
  };
}

/**
 * Quick count of published children for a parent event.
 * Used when we just need the count without full event data.
 */
export async function getChildEventCount(
  parentEventId: string
): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('parent_event_id', parentEventId)
    .eq('status', 'published')
    .is('deleted_at', null);

  if (error) {
    console.error('❌ [getChildEventCount] Error:', error);
    return 0;
  }

  return count || 0;
}
