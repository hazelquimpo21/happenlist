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
  isAccessibilityTag,
  isSensoryTag,
  isLeaveWith,
  isSocialMode,
  isEnergyNeeded,
  type GoodForSlug,
  type AccessibilityTag,
  type SensoryTag,
  type LeaveWith,
} from '@/lib/constants/vocabularies';
import {
  isTimeOfDay,
  matchesTimeOfDay,
  type TimeOfDay,
} from '@/lib/constants/time-of-day';
import {
  resolveInterestPresetGoodFor,
  resolveInterestPresetSubcultures,
} from '@/lib/constants/interest-presets';
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
    created_at: (row.created_at as string | null) ?? null,
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
    // Tagging expansion: flat vocab columns. Type-cast to the union array
    // types is safe because the scraper post-validates against the vocabs
    // before insert; anything that slipped through would fail the isX guards
    // during filter runtime rather than cause a query error. Empty arrays,
    // not null, so consumers don't need existence checks.
    accessibility_tags: ((row.accessibility_tags as string[] | null) ?? []) as EventCard['accessibility_tags'],
    sensory_tags: ((row.sensory_tags as string[] | null) ?? []) as EventCard['sensory_tags'],
    leave_with: ((row.leave_with as string[] | null) ?? []) as EventCard['leave_with'],
    social_mode: (row.social_mode as EventCard['social_mode']) ?? null,
    energy_needed: (row.energy_needed as EventCard['energy_needed']) ?? null,
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
    soloFriendly,
    curiousMinds,
    noTicketsNeeded,
    dropInOk,
    familyFriendly,
    includePast,
    includeLifestyle,
    priceTier,
    ageGroup,
    nearLat,
    nearLng,
    radiusMiles,
    accessibility,
    sensory,
    leaveWith,
    socialMode,
    energyNeeded,
    orderBy = 'date-asc',
    page = 1,
    limit = 24,
    collapseSeries = false,
  } = params;

  // Normalize the new multi-value params up front so the rest of the function
  // works against typed, deduped, validated arrays.
  const goodForSlugs = resolveGoodForFilter(goodFor, interestPreset);
  // Subculture-driven presets (Comedy, Queer, Theater) resolve to an array
  // here. Merged with any direct single-value `subculture` filter so the two
  // inputs compose naturally: (direct OR preset) via PostgREST `.overlaps()`.
  // Stale ids resolve empty and fall through to the direct single-value path.
  const presetSubcultures = interestPreset
    ? resolveInterestPresetSubcultures(interestPreset)
    : [];
  // Merge direct subculture param (single value, legacy) with any subcultures
  // contributed by the active interest preset. Used both for query-time filter
  // (.contains / .overlaps below) and the active-filters log above. Computed
  // here so it's in scope for both.
  const allSubcultures = Array.from(new Set<string>([
    ...(subculture ? [subculture] : []),
    ...presetSubcultures,
  ]));
  const timeOfDayBuckets = normalizeStringArray<TimeOfDay>(timeOfDay, isTimeOfDay);
  const priceTierSlugs = normalizeStringArray(priceTier, isPriceTierSlug);
  const ageGroupSlugs = normalizeStringArray(ageGroup, isAgeGroupSlug);
  const accessibilityTags = normalizeStringArray<AccessibilityTag>(accessibility, isAccessibilityTag);
  const sensoryTags = normalizeStringArray<SensoryTag>(sensory, isSensoryTag);
  const leaveWithSlugs = normalizeStringArray<LeaveWith>(leaveWith, isLeaveWith);
  // Single-value enums: validate via guard, drop if unknown. Defensive against
  // stale shared URLs carrying vocab values we've since renamed/removed.
  const socialModeValue = socialMode && isSocialMode(socialMode) ? socialMode : undefined;
  const energyNeededValue = energyNeeded && isEnergyNeeded(energyNeeded) ? energyNeeded : undefined;

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
  if (allSubcultures.length > 0) activeFilters.subcultures = allSubcultures;
  if (noiseLevel) activeFilters.noiseLevel = noiseLevel;
  if (accessType) activeFilters.accessType = accessType;
  if (familyFriendly) activeFilters.familyFriendly = familyFriendly;
  if (priceTierSlugs.length > 0) activeFilters.priceTier = priceTierSlugs;
  if (ageGroupSlugs.length > 0) activeFilters.ageGroup = ageGroupSlugs;
  if (accessibilityTags.length > 0) activeFilters.accessibility = accessibilityTags;
  if (sensoryTags.length > 0) activeFilters.sensory = sensoryTags;
  if (leaveWithSlugs.length > 0) activeFilters.leaveWith = leaveWithSlugs;
  if (socialModeValue) activeFilters.socialMode = socialModeValue;
  if (energyNeededValue) activeFilters.energyNeeded = energyNeededValue;
  if (nearLat != null && nearLng != null) activeFilters.geo = { nearLat, nearLng, radiusMiles: radiusMiles ?? DEFAULT_RADIUS_MILES };
  if (includePast) activeFilters.includePast = includePast;
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
    // supabase-js rpc() Args generic defaults to `never` when TS can't widen
    // the named overload (happens for some Database types despite the shape
    // being correctly declared in types.ts). Cast via `never` to bypass.
    const { data: geoRows, error: geoError } = await supabase
      .rpc('events_within_radius', {
        p_lat: nearLat!,
        p_lng: nearLng!,
        p_radius_miles: clampedRadius,
        p_limit: 500,  // generous upper bound; real pagination happens below
      } as never);

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

  // Over-fetch the MAIN query when post-fetch JS filters can shrink the set,
  // so we still have enough cards to fill `limit`. Lifestyle exclusion (the
  // common default), `collapseSeries`, and `timeOfDay` are all post-fetch.
  //
  // The accurate `total` shown to the user is computed by a SEPARATE
  // lightweight count query below — over-fetch sizing only affects card
  // density on the page, not count correctness.
  const lifestyleShrinks = includeLifestyle !== true;
  const needsOverFetch = collapseSeries || timeOfDayBuckets.length > 0 || lifestyleShrinks;
  const fetchLimit = needsOverFetch ? limit * 3 : limit;
  const fetchOffset = needsOverFetch ? 0 : offset;

  // Pre-resolve awaited values so the predicate-application closure stays sync.
  const categoryId = categorySlug ? await getCategoryIdBySlug(categorySlug) : null;

  let benefitEventIds: string[] | null = null;
  if (hasMemberBenefits || membershipOrgId) {
    let benefitQuery = supabase
      .from('event_membership_benefits')
      .select('event_id');
    if (membershipOrgId) {
      benefitQuery = benefitQuery.eq('membership_org_id', membershipOrgId);
    }
    const { data: benefitRows } = await benefitQuery;
    benefitEventIds = benefitRows?.map((r) => (r as { event_id: string }).event_id) ?? [];
    if (benefitEventIds.length === 0) {
      return { events: [], total: 0 };
    }
  }

  /**
   * Apply every DB-side predicate to a Supabase query builder.
   *
   * Shared between the main fetch (with heavy joins + pagination) and the
   * lightweight count query below so both see identical filters. If you add a
   * new DB-side predicate, add it HERE — never inline on a single query — or
   * the displayed count will drift from the rendered cards.
   *
   * Post-fetch JS filters (lifestyle, time-of-day, series collapse) are
   * applied separately to BOTH query results below; that's how the count
   * stays accurate.
   *
   * Loosely typed (`any`) because Supabase's filter-builder type narrows on
   * each chained call and refuses to round-trip through a generic. Single
   * source of truth for predicates wins over TS strictness inside the closure.
   */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  function applyDbPredicates(q: any): any {
    let query = q
      .eq('status', 'published')
      .is('deleted_at', null)
      .is('parent_event_id', null);

    if (!includePast) {
      query = query.gte('instance_date', new Date().toISOString().split('T')[0]);
    }

    if (search) {
      query = query.textSearch('title', search, { type: 'websearch' });
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
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

    if (vibeTag) {
      query = query.contains('vibe_tags', [vibeTag]);
    }

    if (allSubcultures.length === 1) {
      query = query.contains('subcultures', allSubcultures);
    } else if (allSubcultures.length > 1) {
      query = query.overlaps('subcultures', allSubcultures);
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

    if (soloFriendly) {
      query = query.contains('good_for', ['solo_friendly']);
    }

    if (curiousMinds) {
      query = query.contains('good_for', ['curious_minds']);
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

    if (accessibilityTags.length > 0) {
      query = query.overlaps('accessibility_tags', accessibilityTags);
    }

    if (sensoryTags.length > 0) {
      query = query.overlaps('sensory_tags', sensoryTags);
    }

    if (leaveWithSlugs.length > 0) {
      query = query.overlaps('leave_with', leaveWithSlugs);
    }

    if (socialModeValue) {
      query = query.eq('social_mode', socialModeValue);
    }

    if (energyNeededValue) {
      query = query.eq('energy_needed', energyNeededValue);
    }

    if (priceTierSlugs.length > 0) {
      const priceClauses: string[] = [];
      for (const tier of priceTierSlugs) {
        switch (tier) {
          case 'free':
            priceClauses.push('is_free.eq.true');
            break;
          case 'under_10':
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
        const uniqueClauses = [...new Set(priceClauses)];
        query = query.or(uniqueClauses.join(','));
      }
    }

    if (ageGroupSlugs.length > 0) {
      const ageClauses: string[] = [];
      for (const group of ageGroupSlugs) {
        switch (group) {
          case 'all_ages':
            ageClauses.push('age_low.is.null');
            ageClauses.push('age_low.eq.0');
            break;
          case 'families_young_kids':
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
            ageClauses.push('and(age_low.gte.18,age_low.lte.25)');
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

    if (geoEventIds) {
      query = query.in('id', geoEventIds);
    }

    if (benefitEventIds) {
      query = query.in('id', benefitEventIds);
    }

    return query;
  }

  // ── Build MAIN query (heavy joins, count, pagination) ─────────────────────
  let mainQuery = applyDbPredicates(
    supabase
      .from('events')
      .select(
        `
        id, title, slug, start_datetime, instance_date, created_at,
        image_url, thumbnail_url, price_type, price_low, price_high,
        is_free, heart_count, good_for,
        short_description, tagline, talent_name,
        access_type, noise_level, vibe_tags,
        accessibility_tags, sensory_tags, leave_with,
        social_mode, energy_needed,
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
      `
      )
  );

  // Apply sorting (main query only — count query doesn't care about order)
  switch (orderBy) {
    case 'date-asc':
      mainQuery = mainQuery
        .order('instance_date', { ascending: true })
        .order('start_datetime', { ascending: true });
      break;
    case 'date-desc':
      mainQuery = mainQuery.order('instance_date', { ascending: false });
      break;
    case 'name-asc':
      mainQuery = mainQuery.order('title', { ascending: true });
      break;
    case 'popular':
      mainQuery = mainQuery.order('heart_count', { ascending: false });
      break;
    case 'newest':
      mainQuery = mainQuery.order('created_at', { ascending: false });
      break;
    case 'distance-asc':
      mainQuery = mainQuery
        .order('instance_date', { ascending: true })
        .order('start_datetime', { ascending: true });
      break;
  }

  mainQuery = mainQuery.range(fetchOffset, fetchOffset + fetchLimit - 1);

  // ── Build COUNT query (lightweight: just enough to apply post-fetch JS) ──
  // Selects only the columns post-fetch filters (lifestyle/timeOfDay/collapse)
  // need. No pagination — we must see EVERY matching row to count accurately
  // after JS filtering. Cost: ~few KB per page request even at full DB size.
  const countQuery = applyDbPredicates(
    supabase
      .from('events')
      .select('id, series_id, start_datetime, series(series_type)')
  );

  const [mainResult, countResult] = await Promise.all([mainQuery, countQuery]);

  if (mainResult.error) {
    console.error('❌ [getEvents] Error fetching events:', mainResult.error);
    throw mainResult.error;
  }
  if (countResult.error) {
    console.error('❌ [getEvents] Error fetching count:', countResult.error);
    throw countResult.error;
  }

  const data = mainResult.data;
  const countRows = (countResult.data || []) as Array<{
    id: string;
    series_id: string | null;
    start_datetime: string;
    series: { series_type: string | null } | null;
  }>;

  let events: EventCard[] = ((data as Record<string, unknown>[] | null) || []).map(transformToEventCard);

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

  // Newest sort: same story — collapseSeriesInstances re-sorts by instance_date,
  // so we have to re-apply created_at DESC after collapse or the slice below
  // returns the soonest-dated events instead of the most-recently-added ones.
  // (This was the bug behind "I added events and they don't show in the feed"
  //  — newest events tend to have the FURTHEST future instance_date and were
  //  getting pushed past the first-page cutoff.)
  if (orderBy === 'newest') {
    events.sort((a, b) => {
      const ca = a.created_at ?? '';
      const cb = b.created_at ?? '';
      return cb.localeCompare(ca);
    });
  }

  // ── Accurate total ────────────────────────────────────────────────────────
  // Apply the SAME post-fetch filters to the lightweight count rows so the
  // total reflects what the user will actually see. Without this, the count
  // diverges from rendered cards (the bug this whole refactor exists to fix).
  let countFiltered = countRows;
  if (includeLifestyle === 'only') {
    countFiltered = countFiltered.filter(
      (r) => r.series?.series_type && LIFESTYLE_SERIES_TYPES.has(r.series.series_type)
    );
  } else if (!includeLifestyle) {
    countFiltered = countFiltered.filter(
      (r) => !r.series?.series_type || !LIFESTYLE_SERIES_TYPES.has(r.series.series_type)
    );
  }
  if (timeOfDayBuckets.length > 0) {
    countFiltered = countFiltered.filter((r) =>
      matchesTimeOfDay(r.start_datetime, timeOfDayBuckets)
    );
  }
  let total: number;
  if (collapseSeries) {
    // Count distinct collapsible series + standalone events. Mirrors
    // collapseSeriesInstances(): festivals/seasons (non-collapsible types)
    // each count as a separate row.
    const seenSeries = new Set<string>();
    let standaloneCount = 0;
    for (const r of countFiltered) {
      const sid = r.series_id;
      const stype = r.series?.series_type ?? null;
      if (!sid || !stype || !COLLAPSIBLE_SERIES_TYPES.has(stype)) {
        standaloneCount++;
      } else {
        seenSeries.add(sid);
      }
    }
    total = standaloneCount + seenSeries.size;
  } else {
    total = countFiltered.length;
  }

  // Manual pagination on the events array. The DB .range() over-fetched 3x
  // when post-fetch filters were active, so we re-slice here to return
  // exactly `limit` cards. Without this, the over-fetch would leak through.
  if (needsOverFetch) {
    events = events.slice(offset, offset + limit);
  }

  console.log(
    `[get-events] returning ${events.length} events ` +
    `(total ${total}, raw ${countRows.length})`
  );

  return { events, total };
}
