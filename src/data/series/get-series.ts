/**
 * GET SERIES (LIST)
 * =================
 * Fetches a list of series with filtering and pagination.
 *
 * Used by: /series page, category pages, organizer pages
 *
 * Phase B additions:
 *   - Select new camps/classes fields for card display
 *   - Filter by attendance_mode, skill_level, age, has_extended_care, day_of_week
 */

import { createClient } from '@/lib/supabase/server';
import type { SeriesCard, SeriesQueryParams, SeriesQueryResult } from '@/types';
import type { SeriesType, AttendanceMode, SkillLevel } from '@/lib/supabase/types';

// ============================================================================
// TRANSFORM FUNCTION
// ============================================================================

/**
 * Transform raw database row to SeriesCard format.
 * Handles nested relationships and new camps/classes fields safely.
 */
function transformToSeriesCard(row: Record<string, unknown>): SeriesCard {
  const category = row.category as Record<string, unknown> | null;
  const location = row.location as Record<string, unknown> | null;
  const organizer = row.organizer as Record<string, unknown> | null;

  return {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    short_description: row.short_description as string | null,
    series_type: row.series_type as SeriesType,
    total_sessions: row.total_sessions as number | null,
    sessions_remaining: row.sessions_remaining as number | null,
    start_date: row.start_date as string | null,
    end_date: row.end_date as string | null,
    image_url: row.image_url as string | null,
    thumbnail_url: row.thumbnail_url as string | null,
    price_type: row.price_type as string,
    price_low: row.price_low as number | null,
    price_high: row.price_high as number | null,
    is_free: row.is_free as boolean,
    heart_count: row.heart_count as number,
    category_name: (category?.name as string) ?? null,
    category_slug: (category?.slug as string) ?? null,
    location_name: (location?.name as string) ?? null,
    location_slug: (location?.slug as string) ?? null,
    organizer_name: (organizer?.name as string) ?? null,
    organizer_slug: (organizer?.slug as string) ?? null,
    upcoming_event_count: row.upcoming_event_count as number | undefined,
    next_event_date: row.next_event_date as string | null | undefined,

    // -- Camps/classes card display fields (Phase B) --
    attendance_mode: (row.attendance_mode as AttendanceMode) ?? undefined,
    per_session_price: (row.per_session_price as number | null) ?? null,
    age_low: (row.age_low as number | null) ?? null,
    age_high: (row.age_high as number | null) ?? null,
    skill_level: (row.skill_level as SkillLevel | null) ?? null,
    // Derived: has_extended_care is true when extended_end_time is set
    has_extended_care: row.extended_end_time != null,
  };
}

// ============================================================================
// MAIN FETCH FUNCTION
// ============================================================================

/**
 * Fetches series with optional filtering and pagination.
 *
 * @example Basic usage
 * ```ts
 * const { series, total } = await getSeries({ limit: 12 });
 * ```
 *
 * @example With camps/classes filters
 * ```ts
 * const result = await getSeries({
 *   type: 'camp',
 *   hasExtendedCare: true,
 *   age: 8,
 *   attendanceMode: 'registered',
 * });
 * ```
 */
export async function getSeries(
  params: SeriesQueryParams = {}
): Promise<SeriesQueryResult> {
  const {
    search,
    type,
    categorySlug,
    organizerSlug,
    city,
    isFree,
    featured,
    orderBy = 'start-date-asc',
    page = 1,
    limit = 12,
    includePast = false,
    // Phase B: new filter params
    attendanceMode,
    skillLevel,
    age,
    hasExtendedCare,
    dayOfWeek,
  } = params;

  console.log('📚 [getSeries] Fetching series with params:', {
    search,
    type,
    categorySlug,
    isFree,
    featured,
    page,
    limit,
    // Log new filter params when present for troubleshooting
    ...(attendanceMode && { attendanceMode }),
    ...(skillLevel && { skillLevel }),
    ...(age !== undefined && { age }),
    ...(hasExtendedCare && { hasExtendedCare }),
    ...(dayOfWeek !== undefined && { dayOfWeek }),
  });

  const supabase = await createClient();
  const offset = (page - 1) * limit;

  // Build query -- includes new camps/classes columns for card display
  let query = supabase
    .from('series')
    .select(
      `
      id, title, slug, short_description,
      series_type, total_sessions, sessions_remaining,
      start_date, end_date,
      image_url, thumbnail_url,
      price_type, price_low, price_high, is_free,
      heart_count,
      attendance_mode, per_session_price,
      age_low, age_high, skill_level,
      extended_end_time, days_of_week,
      category:categories(name, slug),
      location:locations(name, slug),
      organizer:organizers(name, slug)
    `,
      { count: 'exact' }
    )
    .eq('status', 'published');

  // Exclude past series unless specifically included
  if (!includePast) {
    const today = new Date().toISOString().split('T')[0];
    query = query.or(`end_date.gte.${today},end_date.is.null`);
  }

  // ========================================
  // Existing filters
  // ========================================

  if (search) {
    query = query.textSearch('title', search, { type: 'websearch' });
  }

  if (type) {
    query = query.eq('series_type', type);
  }

  if (categorySlug) {
    // Look up category ID first
    const { data: categoryData } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();

    if (categoryData?.id) {
      query = query.eq('category_id', categoryData.id);
    } else {
      console.warn(`⚠️ [getSeries] Category slug not found: "${categorySlug}" -- skipping filter`);
    }
  }

  if (organizerSlug) {
    // Look up organizer ID first
    const { data: organizerData } = await supabase
      .from('organizers')
      .select('id')
      .eq('slug', organizerSlug)
      .single();

    if (organizerData?.id) {
      query = query.eq('organizer_id', organizerData.id);
    } else {
      console.warn(`⚠️ [getSeries] Organizer slug not found: "${organizerSlug}" -- skipping filter`);
    }
  }

  if (city) {
    query = query.eq('location.city', city);
  }

  if (isFree) {
    query = query.eq('is_free', true);
  }

  if (featured) {
    query = query.eq('is_featured', true);
  }

  // ========================================
  // Phase B: Camps/classes filters
  // ========================================

  // Filter by attendance mode (uses idx_series_attendance_mode index)
  if (attendanceMode) {
    console.log(`🔍 [getSeries] Filtering by attendance_mode: ${attendanceMode}`);
    query = query.eq('attendance_mode', attendanceMode);
  }

  // Filter by skill level (uses idx_series_skill_level index)
  if (skillLevel) {
    console.log(`🔍 [getSeries] Filtering by skill_level: ${skillLevel}`);
    query = query.eq('skill_level', skillLevel);
  }

  // Filter by age: find series where age_low <= age AND age_high >= age
  // null age_low means no minimum restriction; null age_high means no maximum
  if (age !== undefined) {
    console.log(`🔍 [getSeries] Filtering by age: ${age} (uses idx_series_age_range)`);
    query = query.or(`age_low.is.null,age_low.lte.${age}`);
    query = query.or(`age_high.is.null,age_high.gte.${age}`);
  }

  // Filter for extended care availability (uses idx_series_extended_care index)
  if (hasExtendedCare) {
    console.log('🔍 [getSeries] Filtering for series with extended care (after/before care)');
    query = query.not('extended_end_time', 'is', null);
  }

  // Filter by day of week (series running on a specific day)
  // Uses PostgreSQL array containment: days_of_week @> [dayOfWeek]
  if (dayOfWeek !== undefined) {
    console.log(`🔍 [getSeries] Filtering by day_of_week containing: ${dayOfWeek}`);
    query = query.contains('days_of_week', [dayOfWeek]);
  }

  // ========================================
  // Apply sorting
  // ========================================

  switch (orderBy) {
    case 'start-date-asc':
      query = query.order('start_date', { ascending: true, nullsFirst: false });
      break;
    case 'start-date-desc':
      query = query.order('start_date', { ascending: false });
      break;
    case 'title-asc':
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
    console.error('❌ [getSeries] Error fetching series:', error);
    throw error;
  }

  const series = (data || []).map(transformToSeriesCard);
  const total = count || 0;

  console.log(`✅ [getSeries] Found ${series.length} series (total: ${total})`);

  return {
    series,
    total,
    page,
    limit,
    hasMore: offset + series.length < total,
  };
}

// ============================================================================
// FEATURED SERIES
// ============================================================================

/**
 * Fetches featured series for homepage display.
 *
 * @example
 * ```ts
 * const featured = await getFeaturedSeries(4);
 * ```
 */
export async function getFeaturedSeries(limit = 4): Promise<SeriesCard[]> {
  console.log('⭐ [getFeaturedSeries] Fetching featured series');

  const { series } = await getSeries({
    featured: true,
    orderBy: 'start-date-asc',
    limit,
  });

  console.log(`✅ [getFeaturedSeries] Found ${series.length} featured series`);

  return series;
}

// ============================================================================
// SERIES BY TYPE
// ============================================================================

/**
 * Fetches series by type (class, camp, workshop, etc.).
 *
 * @example
 * ```ts
 * const classes = await getSeriesByType('class', 12);
 * ```
 */
export async function getSeriesByType(
  type: SeriesType,
  limit = 12
): Promise<SeriesCard[]> {
  console.log(`📚 [getSeriesByType] Fetching ${type} series`);

  const { series } = await getSeries({
    type,
    limit,
  });

  console.log(`✅ [getSeriesByType] Found ${series.length} ${type} series`);

  return series;
}
