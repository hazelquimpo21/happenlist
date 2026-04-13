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
import {
  isGoodForSlug,
  type GoodForSlug,
} from '@/lib/constants/vocabularies';
import {
  isTimeOfDay,
  matchesTimeOfDay,
  type TimeOfDay,
} from '@/lib/constants/time-of-day';
import { resolveInterestPresetGoodFor } from '@/lib/constants/interest-presets';
import {
  DEFAULT_RADIUS_MILES,
  MAX_RADIUS_MILES,
} from '@/lib/constants/milwaukee-neighborhoods';
import { isPriceTierSlug } from '@/lib/constants/price-tiers';
import { isAgeGroupSlug } from '@/lib/constants/age-groups';

/**
 * Coerce a loose `string | string[] | undefined` param into a deduped,
 * type-narrowed array using a vocabulary guard. Drops any value that
 * fails the guard — defensive against stale URL params, typos, and
 * vocab values that have since been removed.
 */
function normalizeStringArray<T extends string>(
  value: string | readonly string[] | undefined,
  guard: (v: string) => v is T
): T[] {
  if (value === undefined) return [];
  const raw = Array.isArray(value) ? value : [value];
  const filtered: T[] = [];
  const seen = new Set<string>();
  for (const v of raw) {
    if (typeof v !== 'string' || seen.has(v) || !guard(v)) continue;
    seen.add(v);
    filtered.push(v);
  }
  return filtered;
}

/**
 * Resolve goodFor + interestPreset params into a single deduped slug array.
 *
 * Both inputs are optional. If both are provided they MERGE (any-match).
 * Stale preset ids resolve to an empty union (silently ignored).
 */
function resolveGoodForFilter(
  goodFor: string | string[] | undefined,
  interestPreset: string | undefined
): GoodForSlug[] {
  const direct = normalizeStringArray<GoodForSlug>(goodFor, isGoodForSlug);
  const fromPreset = interestPreset
    ? resolveInterestPresetGoodFor(interestPreset)
    : [];

  if (fromPreset.length === 0) return direct;
  const merged = new Set<GoodForSlug>([...direct, ...fromPreset]);
  return [...merged];
}

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
    interestPreset,
    timeOfDay,
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
    priceTier,
    ageGroup,
    nearLat,
    nearLng,
    radiusMiles,
    orderBy = 'date-asc',
    page = 1,
    limit = 24,
    collapseSeries = false,
  } = params;

  // Normalize the new multi-value params up front so the rest of the function
  // works against typed, deduped, validated arrays.
  const goodForSlugs = resolveGoodForFilter(goodFor, interestPreset);
  const timeOfDayBuckets = normalizeStringArray<TimeOfDay>(timeOfDay, isTimeOfDay);
  const priceTierSlugs = normalizeStringArray(priceTier, isPriceTierSlug as (v: string) => v is string);
  const ageGroupSlugs = normalizeStringArray(ageGroup, isAgeGroupSlug as (v: string) => v is string);

  // Single structured log line — only emit non-default filters so the noise
  // floor stays low. Convention: [scope:action] prefix per CLAUDE.md.
  const activeFilters: Record<string, unknown> = {};
  if (search) activeFilters.search = search;
  if (categorySlug) activeFilters.categorySlug = categorySlug;
  if (dateRange) activeFilters.dateRange = dateRange;
  if (isFree) activeFilters.isFree = isFree;
  if (goodForSlugs.length > 0) activeFilters.goodFor = goodForSlugs;
  if (interestPreset) activeFilters.interestPreset = interestPreset;
  if (timeOfDayBuckets.length > 0) activeFilters.timeOfDay = timeOfDayBuckets;
  if (locationId) activeFilters.locationId = locationId;
  if (organizerId) activeFilters.organizerId = organizerId;
  if (vibeTag) activeFilters.vibeTag = vibeTag;
  if (subculture) activeFilters.subculture = subculture;
  if (noiseLevel) activeFilters.noiseLevel = noiseLevel;
  if (accessType) activeFilters.accessType = accessType;
  if (familyFriendly) activeFilters.familyFriendly = familyFriendly;
  if (priceTierSlugs.length > 0) activeFilters.priceTier = priceTierSlugs;
  if (ageGroupSlugs.length > 0) activeFilters.ageGroup = ageGroupSlugs;
  if (nearLat != null && nearLng != null) activeFilters.geo = { nearLat, nearLng, radiusMiles: radiusMiles ?? DEFAULT_RADIUS_MILES };
  if (includeLifestyle !== undefined) activeFilters.includeLifestyle = includeLifestyle;
  if (collapseSeries) activeFilters.collapseSeries = collapseSeries;
  if (orderBy && orderBy !== 'date-asc') activeFilters.orderBy = orderBy;
  console.log('[get-events] applied filters:', activeFilters, `page=${page} limit=${limit}`);

  const supabase = await createClient();
  const offset = (page - 1) * limit;

  // ── Geo pre-filter: call events_within_radius RPC to get IDs + distances ──
  // Runs BEFORE the main query so we can use .in('id', geoIds) as a predicate.
  // The distance map is attached to EventCards post-transform.
  const hasGeoAnchor = nearLat != null && nearLng != null;
  let geoEventIds: string[] | null = null;
  let distanceMap: Map<string, number> | null = null;

  if (hasGeoAnchor) {
    const clampedRadius = Math.max(0.1, Math.min(radiusMiles ?? DEFAULT_RADIUS_MILES, MAX_RADIUS_MILES));
    const { data: geoRows, error: geoError } = await supabase
      .rpc('events_within_radius', {
        p_lat: nearLat!,
        p_lng: nearLng!,
        p_radius_miles: clampedRadius,
        p_limit: 500,  // generous upper bound; real pagination happens below
      });

    if (geoError) {
      console.error('[get-events:geo] RPC error:', geoError);
      // Non-fatal: fall through without geo filter rather than crash the page
    } else {
      const rows = (geoRows ?? []) as { event_id: string; distance_miles: number }[];
      geoEventIds = rows.map((r) => r.event_id);
      distanceMap = new Map(rows.map((r) => [r.event_id, r.distance_miles]));
      console.log(`[get-events:geo] ${geoEventIds.length} events within ${clampedRadius}mi`);

      if (geoEventIds.length === 0) {
        // No events in radius — short-circuit
        return { events: [], total: 0 };
      }
    }
  }

  // Over-fetch when ANY post-fetch filter is active so we still have enough
  // cards after JS-side filtering. Both `collapseSeries` and `timeOfDay`
  // shrink the result set after the DB fetch — without over-fetch the page
  // would be sparse or empty.
  //
  // 3x is a heuristic, not a proof. If you add another post-fetch filter,
  // bump this multiplier OR move the filter into a real DB predicate.
  // Distance-asc sort is NOT a post-fetch filter (it doesn't shrink the set,
  // just reorders), but geo filtering via .in('id', geoEventIds) already
  // restricts the DB result. No extra over-fetch needed for geo.
  const needsOverFetch = collapseSeries || timeOfDayBuckets.length > 0;
  const fetchLimit = needsOverFetch ? limit * 3 : limit;
  const fetchOffset = needsOverFetch ? 0 : offset;

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

  // good_for: ANY-match. PostgREST `.overlaps()` maps to PG's `&&` operator
  // on text[] — returns rows where good_for shares at least one element with
  // the requested set. Single-value calls produce a 1-element array, which
  // behaves identically to the old `.contains([slug])` form.
  if (goodForSlugs.length > 0) {
    query = query.overlaps('good_for', goodForSlugs);
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

  // Price tier: each tier maps to a specific predicate. Multi-select = OR.
  // Built as a single .or() clause combining all selected tier predicates.
  if (priceTierSlugs.length > 0) {
    const priceClauses: string[] = [];
    for (const tier of priceTierSlugs) {
      switch (tier) {
        case 'free':
          priceClauses.push('is_free.eq.true');
          break;
        case 'under_10':
          // Inclusive of free events — people searching cheap stuff want free too
          priceClauses.push('is_free.eq.true');
          priceClauses.push('price_low.lte.10');
          break;
        case '10_to_25':
          priceClauses.push('and(price_low.gte.10,price_low.lte.25)');
          break;
        case '25_to_50':
          priceClauses.push('and(price_low.gte.25,price_low.lte.50)');
          break;
        case 'over_50':
          priceClauses.push('price_low.gt.50');
          break;
        case 'donation':
          priceClauses.push('price_type.eq.donation');
          break;
      }
    }
    if (priceClauses.length > 0) {
      // Dedupe in case multiple tiers produce the same clause (e.g. free + under_10)
      const uniqueClauses = [...new Set(priceClauses)];
      query = query.or(uniqueClauses.join(','));
    }
  }

  // Age group: each group maps to a predicate using age_low only.
  // age_high is empty in the DB — see age-groups.ts header comment.
  // Multi-select = OR, built as a single .or() clause.
  if (ageGroupSlugs.length > 0) {
    const ageClauses: string[] = [];
    for (const group of ageGroupSlugs) {
      switch (group) {
        case 'all_ages':
          // NULL age_low = organizer didn't specify = assumed all-ages
          ageClauses.push('age_low.is.null');
          ageClauses.push('age_low.eq.0');
          break;
        case 'families_young_kids':
          // age_low <= 5 OR NULL (unspecified = presumed accessible)
          ageClauses.push('age_low.lte.5');
          ageClauses.push('age_low.is.null');
          break;
        case 'elementary':
          ageClauses.push('and(age_low.gte.6,age_low.lte.11)');
          break;
        case 'teens':
          ageClauses.push('and(age_low.gte.12,age_low.lte.17)');
          break;
        case 'college':
          // age_low 18-25 OR tagged as college_crowd in good_for
          ageClauses.push('and(age_low.gte.18,age_low.lte.25)');
          ageClauses.push('good_for.cs.{college_crowd}');
          break;
        case 'twenty_one_plus':
          ageClauses.push('age_low.gte.21');
          break;
      }
    }
    if (ageClauses.length > 0) {
      const uniqueClauses = [...new Set(ageClauses)];
      query = query.or(uniqueClauses.join(','));
    }
  }

  // Geo filter: restrict to event IDs returned by the RPC
  if (geoEventIds) {
    query = query.in('id', geoEventIds);
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
    case 'distance-asc':
      // Distance sorting happens post-fetch using the distanceMap from the
      // geo RPC. DB-side sort falls back to date-asc so results are stable
      // when distances are equal or when no geo anchor is set.
      query = query
        .order('instance_date', { ascending: true })
        .order('start_datetime', { ascending: true });
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

  // Attach distance_miles from the geo RPC result map. Done immediately after
  // transform so all downstream filters (lifestyle, time-of-day, collapse)
  // operate on distance-annotated cards.
  if (distanceMap) {
    for (const event of events) {
      const dist = distanceMap.get(event.id);
      if (dist !== undefined) {
        event.distance_miles = Math.round(dist * 100) / 100; // 2 decimal places
      }
    }
  }

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

  // Time-of-day post-fetch filter. See src/lib/constants/time-of-day.ts header
  // for why this runs in JS rather than as a DB predicate (no PostgREST support
  // for computed expressions; would require an RPC + migration). Runs BEFORE
  // collapseSeries so the collapse step sees a pre-filtered set — otherwise
  // the "next upcoming date" picked by collapse could be a date that doesn't
  // match the time-of-day filter.
  if (timeOfDayBuckets.length > 0) {
    events = events.filter((e) => matchesTimeOfDay(e.start_datetime, timeOfDayBuckets));
  }

  // Series collapsing: group recurring instances, keep only the soonest per series.
  if (collapseSeries) {
    events = collapseSeriesInstances(events);
  }

  // Distance-asc sort: re-order by distance AFTER collapse. collapseSeriesInstances
  // re-sorts by instance_date internally, which would destroy distance ordering if
  // we sorted earlier. This is the final ordering before pagination.
  if (orderBy === 'distance-asc' && distanceMap) {
    events.sort((a, b) => (a.distance_miles ?? Infinity) - (b.distance_miles ?? Infinity));
  }

  // Manual pagination when ANY post-fetch filter shrunk the result set.
  // The DB-level .range() can't account for events removed by the JS filters
  // above, so we re-paginate the filtered list here. Without this, an
  // over-fetched call would return 3x the requested limit.
  if (needsOverFetch) {
    const totalAfterFilters = events.length;
    events = events.slice(offset, offset + limit);

    console.log(
      `[get-events] returning ${events.length} events ` +
      `(${totalAfterFilters} after post-fetch filters, ${count ?? 0} raw)`
    );

    return {
      events,
      // If we exhausted the over-fetch we can't trust totalAfterFilters as a
      // true total — fall back to the raw DB count as an upper bound. Real
      // pagination accuracy needs a DB-side predicate (future migration).
      total: totalAfterFilters < fetchLimit ? totalAfterFilters : (count || 0),
    };
  }

  console.log(`[get-events] returning ${events.length} events (total: ${count ?? 0})`);

  return {
    events,
    total: count || 0,
  };
}
