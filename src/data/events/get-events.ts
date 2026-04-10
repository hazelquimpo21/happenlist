/**
 * GET EVENTS
 * ==========
 * Fetches a list of events with filtering and pagination.
 *
 * Supports series collapsing: when `collapseSeries` is true, recurring
 * event instances are grouped so only the next upcoming date appears in the
 * feed, with a human-readable recurrence label and count of remaining dates.
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

// =============================================================================
// SERIES COLLAPSING TYPES & HELPERS
// =============================================================================

/** Day of week labels (0 = Sunday) for recurrence display. */
const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

/** Frequency labels for recurrence display. */
const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Every day',
  weekly: 'Every week',
  biweekly: 'Every 2 weeks',
  monthly: 'Every month',
  yearly: 'Every year',
};

/** Series types that should be collapsed (repeating content). */
const COLLAPSIBLE_SERIES_TYPES = new Set(['recurring', 'class', 'workshop', 'lifestyle', 'ongoing', 'exhibit']);

/**
 * Series types considered "lifestyle" — recurring low-urgency events that
 * should be hidden from the main browse feed by default (yoga, trivia,
 * happy hour, exhibits, etc.) but discoverable via filters or dedicated pages.
 */
const LIFESTYLE_SERIES_TYPES = new Set(['lifestyle', 'ongoing', 'exhibit']);

/**
 * Build a human-readable recurrence label from a series recurrence_rule JSON.
 * Examples: "Every Tuesday", "Every other Friday", "Monthly on the 15th"
 */
function buildRecurrenceLabel(rule: Record<string, unknown> | null, seriesType: string | null): string | null {
  if (!rule) {
    // Fallback: if no rule but it's a known collapsible type, return a generic label
    if (seriesType === 'class') return 'Ongoing class';
    if (seriesType === 'workshop') return 'Ongoing workshop';
    if (seriesType === 'lifestyle') return 'Recurring';
    if (seriesType === 'ongoing') return 'Ongoing';
    if (seriesType === 'exhibit') return 'On view';
    return 'Recurring';
  }

  const frequency = rule.frequency as string | undefined;
  const daysOfWeek = rule.days_of_week as number[] | undefined;
  const dayOfMonth = rule.day_of_month as number | undefined;

  if (frequency === 'weekly' && daysOfWeek?.length === 1) {
    return `Every ${DAY_LABELS[daysOfWeek[0]]}`;
  }
  if (frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 1) {
    const dayNames = daysOfWeek.map((d) => DAY_LABELS[d]);
    return `Every ${dayNames.slice(0, -1).join(', ')} & ${dayNames[dayNames.length - 1]}`;
  }
  if (frequency === 'biweekly' && daysOfWeek?.length === 1) {
    return `Every other ${DAY_LABELS[daysOfWeek[0]]}`;
  }
  if (frequency === 'monthly' && dayOfMonth) {
    const suffix = ['th', 'st', 'nd', 'rd'];
    const v = dayOfMonth % 100;
    const ord = dayOfMonth + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
    return `Monthly on the ${ord}`;
  }

  return FREQUENCY_LABELS[frequency ?? ''] || 'Recurring';
}

/**
 * Collapse series instances: keep only the soonest event per series,
 * annotating it with the recurrence label and count of remaining dates.
 *
 * Events without a series_id pass through unchanged. Festivals and
 * seasons are never collapsed (each date is distinct content).
 */
function collapseSeriesInstances(events: EventCard[]): EventCard[] {
  // Group by series_id (null series_id events go straight to output)
  const seriesGroups = new Map<string, EventCard[]>();
  const standalone: EventCard[] = [];

  for (const event of events) {
    const sid = event.series_id;
    const stype = event.series_type;

    // Don't collapse festivals/seasons or non-series events
    if (!sid || !stype || !COLLAPSIBLE_SERIES_TYPES.has(stype)) {
      standalone.push(event);
      continue;
    }

    const group = seriesGroups.get(sid);
    if (group) {
      group.push(event);
    } else {
      seriesGroups.set(sid, [event]);
    }
  }

  // For each series group, keep earliest and annotate
  const collapsed: EventCard[] = [];
  for (const [, group] of seriesGroups) {
    // Already sorted by date from the query, so first is soonest
    const representative = { ...group[0] };
    representative.upcoming_count = group.length - 1;
    collapsed.push(representative);
  }

  // Merge standalone + collapsed, then re-sort by instance_date to maintain order
  const merged = [...standalone, ...collapsed];
  merged.sort((a, b) => {
    const da = a.instance_date || a.start_datetime;
    const db = b.instance_date || b.start_datetime;
    return da.localeCompare(db);
  });

  return merged;
}

// =============================================================================
// TRANSFORM
// =============================================================================

/**
 * Transform raw database row to EventCard format.
 */
function transformToEventCard(row: Record<string, unknown>): EventCard {
  const category = row.category as Record<string, unknown> | null;
  const location = row.location as Record<string, unknown> | null;
  // PostgREST returns embedded count as [{ count: N }]
  const children = row.children as { count: number }[] | null;
  const childCount = children?.[0]?.count ?? 0;

  // Series info
  const series = row.series as Record<string, unknown> | null;
  const seriesType = series?.series_type as string | null ?? null;
  const recurrenceRule = series?.recurrence_rule as Record<string, unknown> | null ?? null;
  const recurrenceLabel = buildRecurrenceLabel(recurrenceRule, seriesType);

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
    // Descriptions & talent
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
    // Series fields
    series_id: row.series_id as string | null ?? null,
    series_title: series?.title as string | null ?? null,
    series_slug: series?.slug as string | null ?? null,
    series_type: seriesType,
    series_sequence: row.series_sequence as number | null ?? null,
    is_series_instance: !!(row.series_id),
    recurrence_label: (row.series_id && COLLAPSIBLE_SERIES_TYPES.has(seriesType ?? ''))
      ? recurrenceLabel
      : null,
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
    includeLifestyle,
    orderBy = 'date-asc',
    page = 1,
    limit = 24,
    collapseSeries = false,
  } = params;

  console.log('📋 [getEvents] Fetching events with params:', {
    search,
    categorySlug,
    dateRange,
    isFree,
    goodFor,
    page,
    limit,
    collapseSeries,
  });

  const supabase = await createClient();
  const offset = (page - 1) * limit;

  // When collapsing series, over-fetch to compensate for duplicates being removed.
  // We fetch 3x the limit so that after collapsing we still have enough cards.
  const fetchLimit = collapseSeries ? limit * 3 : limit;
  const fetchOffset = collapseSeries ? 0 : offset;

  // Build query — joins series table for recurrence info
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
      series_id, series_sequence,
      category:categories(name, slug),
      location:locations(name, slug),
      series(title, slug, series_type, recurrence_rule),
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
  query = query.range(fetchOffset, fetchOffset + fetchLimit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('❌ [getEvents] Error fetching events:', error);
    throw error;
  }

  let events = (data || []).map(transformToEventCard);

  // Lifestyle filtering: exclude lifestyle/ongoing/exhibit series from main feeds
  // unless explicitly included. This is post-fetch because we can't easily express
  // "series IS NULL OR series.series_type NOT IN (...)" in a single PostgREST filter.
  if (includeLifestyle === 'only') {
    // Show ONLY lifestyle events
    events = events.filter((e) => e.series_type && LIFESTYLE_SERIES_TYPES.has(e.series_type));
  } else if (!includeLifestyle) {
    // Default: exclude lifestyle events from feed
    events = events.filter((e) => !e.series_type || !LIFESTYLE_SERIES_TYPES.has(e.series_type));
  }
  // includeLifestyle === true: no filtering, show everything

  // Series collapsing: group recurring instances, keep only the soonest per series
  if (collapseSeries) {
    events = collapseSeriesInstances(events);

    // Apply manual pagination after collapsing
    const totalCollapsed = events.length;
    events = events.slice(offset, offset + limit);

    console.log(`✅ [getEvents] Found ${events.length} events after collapsing (${totalCollapsed} unique, ${count} raw)`);

    return {
      events,
      // Use collapsed count for pagination when possible, but if we hit the
      // over-fetch ceiling the real total is unknown — use raw count as upper bound
      total: totalCollapsed < fetchLimit ? totalCollapsed : (count || 0),
    };
  }

  console.log(`✅ [getEvents] Found ${events.length} events (total: ${count})`);

  return {
    events,
    total: count || 0,
  };
}
