/**
 * GET EVENTS
 * ==========
 * Fetches a list of events with filtering and pagination.
 */

import { createClient } from '@/lib/supabase/server';
import type { EventCard, EventQueryParams } from '@/types';

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
 * Fetches events with optional filtering and pagination.
 *
 * @example
 * const { events, total } = await getEvents({ limit: 24 });
 *
 * @example
 * const { events } = await getEvents({
 *   categorySlug: 'music',
 *   dateRange: { start: '2025-02-14' },
 *   isFree: true,
 * });
 */
export async function getEvents(
  params: EventQueryParams = {}
): Promise<{ events: EventCard[]; total: number }> {
  const {
    search,
    categorySlug,
    dateRange,
    isFree,
    locationId,
    organizerId,
    excludeEventId,
    orderBy = 'date-asc',
    page = 1,
    limit = 24,
  } = params;

  console.log('📋 [getEvents] Fetching events with params:', {
    search,
    categorySlug,
    dateRange,
    isFree,
    page,
    limit,
  });

  const supabase = await createClient();
  const offset = (page - 1) * limit;

  // Build query
  let query = supabase
    .from('events')
    .select(
      `
      id, title, slug, start_datetime, instance_date,
      image_url, thumbnail_url, price_type, price_low, price_high,
      is_free, heart_count,
      category:categories(name, slug),
      location:locations(name, slug)
    `,
      { count: 'exact' }
    )
    .eq('status', 'published')
    .gte('instance_date', new Date().toISOString().split('T')[0]);

  // Apply filters
  if (search) {
    query = query.textSearch('title', search, { type: 'websearch' });
  }

  if (dateRange?.start) {
    query = query.gte('instance_date', dateRange.start);
  }

  if (dateRange?.end) {
    query = query.lte('instance_date', dateRange.end);
  }

  if (isFree) {
    query = query.eq('is_free', true);
  }

  if (locationId) {
    query = query.eq('location_id', locationId);
  }

  if (organizerId) {
    query = query.eq('organizer_id', organizerId);
  }

  if (excludeEventId) {
    query = query.neq('id', excludeEventId);
  }

  // Apply sorting
  switch (orderBy) {
    case 'date-asc':
      query = query
        .order('instance_date', { ascending: true })
        .order('start_datetime', { ascending: true });
      break;
    case 'date-desc':
      query = query.order('instance_date', { ascending: false });
      break;
    case 'name-asc':
      query = query.order('title', { ascending: true });
      break;
    case 'popular':
      query = query.order('heart_count', { ascending: false });
      break;
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('❌ [getEvents] Error fetching events:', error);
    throw error;
  }

  const events = (data || []).map(transformToEventCard);

  console.log(`✅ [getEvents] Found ${events.length} events (total: ${count})`);

  return {
    events,
    total: count || 0,
  };
}
