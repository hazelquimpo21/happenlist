/**
 * GET EVENT (SINGLE)
 * ==================
 * Fetches a single event by slug and date.
 */

import { createClient } from '@/lib/supabase/server';
import type { EventWithDetails } from '@/types';

interface GetEventParams {
  /** Event slug (may or may not include date suffix) */
  slug: string;
  /** Instance date (YYYY-MM-DD) — used as fallback filter if slug alone doesn't match */
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

  // DB slugs include the instance date as a segment — sometimes at the end
  // ("jazz-at-the-lake-2026-04-10"), sometimes followed by extra suffix
  // like a time ("wisconsin-card-show-2026-06-26-1500"). parseEventSlug
  // strips the trailing YYYY-MM-DD from the URL, so `slug` arriving here
  // may already contain a date segment. Only append when the instanceDate
  // isn't already present as a `-YYYY-MM-DD-` or trailing segment —
  // otherwise we double-append and miss the lookup.
  const dateSegment = new RegExp(`(^|-)${instanceDate}(-|$)`);
  const fullSlug = dateSegment.test(slug) ? slug : `${slug}-${instanceDate}`;

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
      event_performers(
        id, performer_id, role, billing_order,
        performer:performers(id, name, slug, bio, genre, image_url, website_url)
      ),
      event_membership_benefits(
        id, membership_org_id, benefit_type, benefit_details, member_price,
        membership_organization:membership_organizations(id, name, slug, description, website_url, logo_url)
      )
    `
    )
    .eq('slug', fullSlug)
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

  // Sort performers by billing_order
  if (event.event_performers) {
    event.event_performers.sort((a, b) => a.billing_order - b.billing_order);
  }

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
