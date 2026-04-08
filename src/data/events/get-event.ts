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
      organizer:organizers(id, name, slug, logo_url, description, website_url)
    `
    )
    .eq('slug', slug)
    .eq('instance_date', instanceDate)
    .eq('status', 'published')
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('⚠️ [getEvent] Event not found');
      return null;
    }
    console.error('❌ [getEvent] Error fetching event:', error);
    throw error;
  }

  const event = data as EventWithDetails;

  // If this is a child event, fetch parent title + slug + instance_date for breadcrumbs
  if (event.parent_event_id) {
    const { data: parentData } = await supabase
      .from('events')
      .select('title, slug, instance_date')
      .eq('id', event.parent_event_id)
      .eq('status', 'published')
      .is('deleted_at', null)
      .single();

    if (parentData) {
      const parent = parentData as { title: string; slug: string; instance_date: string };
      event.parent_event_title = parent.title;
      // Store slug with date appended so breadcrumb can link directly
      event.parent_event_slug = `${parent.slug}-${parent.instance_date}`;
    }
  }

  console.log('✅ [getEvent] Found event:', event.title);

  return event;
}
