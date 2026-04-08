/**
 * GET MEMBERSHIP ORG (SINGLE)
 * ===========================
 * Fetches a single membership org by slug with its event benefits.
 */

import { createClient } from '@/lib/supabase/server';
import type { MembershipOrganization, EventCard } from '@/types';

/**
 * Fetches a single membership organization by slug.
 */
export async function getMembershipOrg(
  params: { slug: string }
): Promise<MembershipOrganization | null> {
  console.log('🏛️ [getMembershipOrg] Fetching org:', params.slug);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('membership_organizations')
    .select('id, name, slug, description, website_url, logo_url, organizer_id, is_active')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('⚠️ [getMembershipOrg] Org not found');
      return null;
    }
    console.error('❌ [getMembershipOrg] Error:', error);
    throw error;
  }

  console.log('✅ [getMembershipOrg] Found org:', data?.name);

  return data as MembershipOrganization;
}

/**
 * Event card with benefit info attached.
 */
export interface EventWithBenefit extends EventCard {
  benefit_type: string;
  benefit_details: string | null;
  member_price: number | null;
}

/**
 * Fetches upcoming events that have benefits for a given membership org.
 */
export async function getMembershipOrgEvents(
  orgId: string
): Promise<EventWithBenefit[]> {
  console.log('🏛️ [getMembershipOrgEvents] Fetching events for org:', orgId);

  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('event_membership_benefits')
    .select(`
      benefit_type, benefit_details, member_price,
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
    .eq('membership_org_id', orgId)
    .gte('event.instance_date', today)
    .eq('event.status', 'published')
    .is('event.deleted_at', null);

  if (error) {
    console.error('❌ [getMembershipOrgEvents] Error:', error);
    throw error;
  }

  const events: EventWithBenefit[] = [];

  for (const row of data || []) {
    const e = row.event as Record<string, unknown>;
    if (!e) continue;

    const category = e.category as Record<string, unknown> | null;
    const location = e.location as Record<string, unknown> | null;

    events.push({
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
      benefit_type: row.benefit_type,
      benefit_details: row.benefit_details,
      member_price: row.member_price,
    });
  }

  // Sort by date ascending
  events.sort((a, b) => a.start_datetime.localeCompare(b.start_datetime));

  console.log(`✅ [getMembershipOrgEvents] Found ${events.length} events`);

  return events;
}
