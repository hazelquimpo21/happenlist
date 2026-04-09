/**
 * GET EVENTS
 * ==========
 * Fetches a list of events with filtering and pagination.
 */

import { unstable_cache } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import type { EventCard, EventQueryParams } from '@/types';

/**
 * Cached category slug → ID resolver.
 * Uses a plain Supabase client (no cookies/request context) so it works
 * inside unstable_cache which runs outside the request lifecycle.
 */
const getCategoryIdBySlug = unstable_cache(
  async (slug: string): Promise<string | null> => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createSupabaseClient(url, key);
    const { data } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single();

    if (data && typeof data === 'object' && 'id' in data) {
      return (data as { id: string }).id;
    }
    return null;
  },
  ['category-slug-to-id'],
  { revalidate: 86400, tags: ['categories'] }
);

/**
 * Transform raw database row to EventCard format.
 */
function transformToEventCard(row: Record<string, unknown>): EventCard {
  const category = row.category as Record<string, unknown> | null;
  const location = row.location as Record<string, unknown> | null;
  // PostgREST returns embedded count as [{ count: N }]
  const children = row.children as { count: number }[] | null;
  const childCount = children?.[0]?.count ?? 0;

  // Performers: extract top 2 by billing_order
  const rawPerformers = row.event_performers as { role: string; billing_order: number; performer: { name: string } }[] | null;
  const sortedPerformers = rawPerformers
    ? [...rawPerformers].sort((a, b) => a.billing_order - b.billing_order).slice(0, 2)
    : [];
  const performers = sortedPerformers.map((ep) => ({
    name: ep.performer?.name ?? '',
    role: ep.role,
  }));

  // Membership benefits: detect presence and pick best label for card badge
  const rawBenefits = row.event_membership_benefits as { benefit_type: string; member_price: number | null; benefit_details: string | null }[] | null;
  const hasMemberBenefits = !!rawBenefits && rawBenefits.length > 0;
  let memberBenefitLabel: string | null = null;
  if (hasMemberBenefits && rawBenefits) {
    const free = rawBenefits.find((b) => b.benefit_type === 'free');
    if (free) {
      memberBenefitLabel = 'Free for members';
    } else {
      const priced = rawBenefits.find((b) => b.benefit_type === 'member_price');
      memberBenefitLabel = priced?.member_price ? `$${priced.member_price} members` : 'Member pricing';
    }
  }

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
    // New fields (migrations 00010, 00011)
    short_description: row.short_description as string | null ?? null,
    tagline: row.tagline as string | null ?? null,
    talent_name: row.talent_name as string | null ?? null,
    access_type: row.access_type as string | null ?? null,
    noise_level: row.noise_level as string | null ?? null,
    vibe_tags: (row.vibe_tags as string[] | null) ?? [],
    organizer_name: row.organizer_name as string | null ?? null,
    organizer_is_venue: (row.organizer_is_venue as boolean | null) ?? false,
    // Parent event fields
    parent_event_id: row.parent_event_id as string | null ?? null,
    child_event_count: childCount > 0 ? childCount : undefined,
    // Performers (top 2 for card display)
    performers: performers.length > 0 ? performers : undefined,
    // Membership benefit info for card badges
    has_member_benefits: hasMemberBenefits || undefined,
    member_benefit_label: memberBenefitLabel,
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
    goodFor,
    locationId,
    organizerId,
    excludeEventId,
    vibeTag,
    subculture,
    noiseLevel,
    accessType,
    excludeMembership,
    hasMemberBenefits,
    membershipOrgId,
    energyMin,
    energyMax,
    formalityMax,
    soloFriendly,
    beginnerFriendly,
    noTicketsNeeded,
    dropInOk,
    familyFriendly,
    orderBy = 'date-asc',
    page = 1,
    limit = 24,
  } = params;

  console.log('📋 [getEvents] Fetching events with params:', {
    search,
    categorySlug,
    dateRange,
    isFree,
    goodFor,
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
      is_free, heart_count, good_for,
      short_description, tagline, talent_name,
      access_type, noise_level, vibe_tags,
      organizer_name, organizer_is_venue,
      age_restriction, is_family_friendly,
      parent_event_id,
      category:categories(name, slug),
      location:locations(name, slug),
      children:events!parent_event_id(count),
      event_performers(role, billing_order, performer:performers(name)),
      event_membership_benefits(benefit_type, member_price, benefit_details)
    `,
      { count: 'exact' }
    )
    .eq('status', 'published')
    .is('deleted_at', null)
    .is('parent_event_id', null) // Hide child events from main feed
    .gte('instance_date', new Date().toISOString().split('T')[0]);

  // Apply filters
  if (search) {
    query = query.textSearch('title', search, { type: 'websearch' });
  }

  // Filter by category (cached slug→ID lookup avoids a waterfall query)
  if (categorySlug) {
    const categoryId = await getCategoryIdBySlug(categorySlug);
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
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

  if (goodFor) {
    query = query.contains('good_for', [goodFor]);
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

  // New atmosphere/access filters (migrations 00010, 00011)
  if (vibeTag) {
    query = query.contains('vibe_tags', [vibeTag]);
  }

  if (subculture) {
    query = query.contains('subcultures', [subculture]);
  }

  if (noiseLevel) {
    query = query.eq('noise_level', noiseLevel);
  }

  if (accessType) {
    query = query.eq('access_type', accessType);
  }

  if (excludeMembership) {
    query = query.eq('membership_required', false);
  }

  if (energyMin) {
    query = query.gte('energy_level', energyMin);
  }

  if (energyMax) {
    query = query.lte('energy_level', energyMax);
  }

  if (formalityMax) {
    query = query.lte('formality', formalityMax);
  }

  if (soloFriendly) {
    query = query.lte('social_pressure', 2);
  }

  if (beginnerFriendly) {
    query = query.gte('accessibility_score', 4);
  }

  if (noTicketsNeeded) {
    query = query.or('access_type.in.(open,pay_at_door),is_free.eq.true');
  }

  if (dropInOk) {
    query = query.or('attendance_mode.in.(drop_in,hybrid),attendance_mode.is.null');
  }

  if (familyFriendly) {
    query = query.eq('is_family_friendly', true);
  }

  // Membership benefit filters — requires subquery to get event IDs
  if (hasMemberBenefits || membershipOrgId) {
    let benefitQuery = supabase
      .from('event_membership_benefits')
      .select('event_id');
    if (membershipOrgId) {
      benefitQuery = benefitQuery.eq('membership_org_id', membershipOrgId);
    }
    const { data: benefitRows } = await benefitQuery;
    const eventIds = benefitRows?.map((r) => (r as { event_id: string }).event_id) ?? [];
    if (eventIds.length > 0) {
      query = query.in('id', eventIds);
    } else {
      // No events match — return empty
      return { events: [], total: 0 };
    }
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
