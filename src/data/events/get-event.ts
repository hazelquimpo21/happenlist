/**
 * GET EVENT (SINGLE)
 * ==================
 * Fetches a single event by slug and date.
 */

import { createClient } from '@/lib/supabase/server';
import type { EventWithDetails } from '@/types';

interface GetEventParams {
  /** Event slug */
  slug: string;
  /** Instance date (YYYY-MM-DD) */
  instanceDate: string;
}

/**
 * Fetches a single event with full details.
 *
 * @example
 * const event = await getEvent({
 *   slug: 'jazz-at-the-lake',
 *   instanceDate: '2025-02-14'
 * });
 */
export async function getEvent(
  params: GetEventParams
): Promise<EventWithDetails | null> {
  const { slug, instanceDate } = params;

  console.log('📋 [getEvent] Fetching event:', { slug, instanceDate });

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select(
      `
      *,
      category:categories(id, name, slug, icon),
      location:locations(
        id, name, slug, city, state, address_line, address_line_2,
        postal_code, latitude, longitude, venue_type, website_url
      ),
      organizer:organizers(id, name, slug, logo_url, description, website_url),
      series(id, title, slug, series_type)
    `
    )
    .eq('slug', slug)
    .eq('instance_date', instanceDate)
    .eq('status', 'published')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('⚠️ [getEvent] Event not found');
      return null;
    }
    console.error('❌ [getEvent] Error fetching event:', error);
    throw error;
  }

  console.log('✅ [getEvent] Found event:', (data as EventWithDetails)?.title);

  return data as EventWithDetails;
}
