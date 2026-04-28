/**
 * GET SERIES DETAIL
 * =================
 * Fetches a single series with full details and relationships.
 *
 * Used by: /series/[slug] detail page
 *
 * Phase B note: The `select('*')` already returns all new camps/classes columns
 * (attendance_mode, age_low/high, skill_level, extended care times, etc.)
 * since they are part of the series table. SeriesWithDetails extends SeriesRow
 * which includes all these fields via the DB types.
 */

import { createClient } from '@/lib/supabase/server';
import type { SeriesWithDetails, SeriesEvent } from '@/types';

// ============================================================================
// GET SERIES BY SLUG
// ============================================================================

/**
 * Fetches a single series by its slug.
 * Returns null if not found or not published.
 *
 * @example
 * ```ts
 * const series = await getSeriesBySlug('pottery-101-spring-2025');
 * if (!series) notFound();
 * ```
 */
export async function getSeriesBySlug(
  slug: string
): Promise<SeriesWithDetails | null> {
  console.log(`📖 [getSeriesBySlug] Fetching series: ${slug}`);

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('series')
    .select(
      `
      *,
      category:categories(id, name, slug, icon),
      location:locations(id, name, slug, city, address_line, venue_type),
      organizer:organizers(id, name, slug, logo_url, description, website_url)
    `
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log(`⚠️ [getSeriesBySlug] Series not found: ${slug}`);
      return null;
    }
    console.error('❌ [getSeriesBySlug] Error fetching series:', error);
    throw error;
  }

  const row = data as Record<string, unknown>;

  // Log camps/classes fields for troubleshooting (only when they have values)
  console.log(`✅ [getSeriesBySlug] Found series: ${row.title}`, {
    series_type: row.series_type,
    attendance_mode: row.attendance_mode,
    ...(row.age_low != null && { age_low: row.age_low }),
    ...(row.age_high != null && { age_high: row.age_high }),
    ...(row.skill_level ? { skill_level: row.skill_level } : {}),
    ...(row.extended_start_time ? { extended_start_time: row.extended_start_time } : {}),
    ...(row.extended_end_time ? { extended_end_time: row.extended_end_time } : {}),
    ...(row.per_session_price != null ? { per_session_price: row.per_session_price } : {}),
    ...(row.materials_fee != null ? { materials_fee: row.materials_fee } : {}),
    ...(row.days_of_week ? { days_of_week: row.days_of_week } : {}),
    ...(row.term_name ? { term_name: row.term_name } : {}),
  });

  return data as SeriesWithDetails;
}

// ============================================================================
// GET SERIES BY ID (lightweight)
// ============================================================================

export interface SeriesSummary {
  id: string;
  title: string;
  slug: string;
  series_type: string;
  // Enriched fields for event detail page display
  attendance_mode: string | null;
  skill_level: string | null;
  per_session_price: number | null;
  materials_fee: number | null;
  pricing_notes: string | null;
  age_low: number | null;
  age_high: number | null;
  age_details: string | null;
  recurrence_rule: Record<string, unknown> | null;
  core_start_time: string | null;
  core_end_time: string | null;
  extended_start_time: string | null;
  extended_end_time: string | null;
  extended_care_details: string | null;
  days_of_week: number[] | null;
  total_sessions: number | null;
  sessions_remaining: number | null;
}

/**
 * Fetches series info by ID with enriched fields for the event detail page.
 * Includes schedule, pricing, age, skill, and attendance details from the series.
 */
export async function getSeriesById(
  id: string
): Promise<SeriesSummary | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('series')
    .select(`
      id, title, slug, series_type,
      attendance_mode, skill_level,
      per_session_price, materials_fee, pricing_notes,
      age_low, age_high, age_details,
      recurrence_rule,
      core_start_time, core_end_time,
      extended_start_time, extended_end_time, extended_care_details,
      days_of_week, total_sessions, sessions_remaining
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('❌ [getSeriesById] Error:', error);
    return null;
  }

  return data as SeriesSummary;
}

// ============================================================================
// GET SERIES EVENTS
// ============================================================================

/**
 * Fetches all events belonging to a series.
 * By default, only returns upcoming events.
 *
 * @param seriesId - The series UUID
 * @param includePast - Whether to include past events
 * @param limit - Maximum number of events to return
 *
 * @example
 * ```ts
 * const events = await getSeriesEvents(series.id);
 * ```
 */
export async function getSeriesEvents(
  seriesId: string,
  includePast = false,
  limit = 50
): Promise<SeriesEvent[]> {
  console.log(`🎫 [getSeriesEvents] Fetching events for series: ${seriesId}`);

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('events')
    .select(
      `
      id, title, slug, instance_date, start_datetime, end_datetime,
      series_sequence, status,
      location:locations(name, slug)
    `
    )
    .eq('series_id', seriesId)
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('series_sequence', { ascending: true, nullsFirst: false })
    .order('instance_date', { ascending: true })
    .limit(limit);

  // Only upcoming events unless past included
  if (!includePast) {
    const today = new Date().toISOString().split('T')[0];
    query = query.gte('instance_date', today);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ [getSeriesEvents] Error fetching events:', error);
    throw error;
  }

  // Transform to SeriesEvent format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events: SeriesEvent[] = (data || []).map((row: any) => {
    const location = row.location as Record<string, unknown> | null;
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      instance_date: row.instance_date,
      start_datetime: row.start_datetime,
      end_datetime: row.end_datetime,
      series_sequence: row.series_sequence,
      status: row.status,
      location_name: (location?.name as string) ?? null,
      location_slug: (location?.slug as string) ?? null,
    };
  });

  console.log(`✅ [getSeriesEvents] Found ${events.length} events`);

  return events;
}

// ============================================================================
// GET PAST SERIES INSTANCES
// ============================================================================

/**
 * Lightweight shape for the "Past instances" section on the event detail page.
 *
 * Why a separate type instead of reusing SeriesEvent?
 *   - Past-instances rendering only needs the bare minimum: title, slug,
 *     instance_date, start_datetime — no location, no series_sequence.
 *   - Keeping the projection narrow keeps the SELECT cheap and the type
 *     surface obvious to the consumer (PastInstances component).
 *
 * Cross-file coupling:
 *   - src/components/events/past-instances.tsx — sole consumer
 *   - src/app/event/[slug]/page.tsx — mounts PastInstances when series_id is set
 */
export interface PastSeriesInstance {
  id: string;
  title: string;
  slug: string;
  instance_date: string | null;
  start_datetime: string;
}

/**
 * Fetch past instances of a series for display on a sibling event detail page.
 *
 * Excludes the currently-viewed event (so the page never lists itself).
 * Past = `instance_date < today` (UTC date — close enough for display ordering;
 * we're not making scheduling decisions here, just showing history).
 *
 * Returns at most `limit` rows, ordered most-recent-first.
 *
 * Returns [] (not null) on error so the caller can render unconditionally.
 */
export async function getPastSeriesInstances(
  seriesId: string,
  excludeEventId: string,
  limit = 6
): Promise<PastSeriesInstance[]> {
  console.log(
    `[getPastSeriesInstances] series=${seriesId} exclude=${excludeEventId} limit=${limit}`
  );

  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('events')
    .select('id, title, slug, instance_date, start_datetime')
    .eq('series_id', seriesId)
    .eq('status', 'published')
    .is('deleted_at', null)
    .neq('id', excludeEventId)
    .lt('instance_date', today)
    .order('instance_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getPastSeriesInstances] error:', error);
    return [];
  }

  const rows = (data ?? []) as PastSeriesInstance[];
  console.log(`[getPastSeriesInstances] found ${rows.length} past instances`);
  return rows;
}

// ============================================================================
// GET RELATED SERIES
// ============================================================================

/**
 * Fetches related series based on category or organizer.
 * Used for "Similar Series" section on detail page.
 *
 * @example
 * ```ts
 * const related = await getRelatedSeries({
 *   categoryId: series.category_id,
 *   organizerId: series.organizer_id,
 *   excludeSeriesId: series.id,
 *   limit: 4,
 * });
 * ```
 */
export async function getRelatedSeries(params: {
  categoryId?: string;
  organizerId?: string;
  excludeSeriesId: string;
  limit?: number;
}): Promise<SeriesWithDetails[]> {
  const { categoryId, organizerId, excludeSeriesId, limit = 4 } = params;

  console.log(`🔗 [getRelatedSeries] Finding related series`);

  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  let query = supabase
    .from('series')
    .select(
      `
      *,
      category:categories(id, name, slug, icon),
      location:locations(id, name, slug, city, address_line, venue_type),
      organizer:organizers(id, name, slug, logo_url)
    `
    )
    .eq('status', 'published')
    .is('deleted_at', null)
    .neq('id', excludeSeriesId)
    .or(`end_date.gte.${today},end_date.is.null`)
    .limit(limit);

  // Prefer same category, then same organizer
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  } else if (organizerId) {
    query = query.eq('organizer_id', organizerId);
  }

  query = query.order('start_date', { ascending: true, nullsFirst: false });

  const { data, error } = await query;

  if (error) {
    console.error('❌ [getRelatedSeries] Error fetching related series:', error);
    throw error;
  }

  console.log(`✅ [getRelatedSeries] Found ${data?.length || 0} related series`);

  return (data || []) as SeriesWithDetails[];
}

// ============================================================================
// GET SERIES STATS
// ============================================================================

/**
 * Calculates statistics for a series.
 * Useful for display on detail pages.
 *
 * @example
 * ```ts
 * const stats = await getSeriesStats(series.id);
 * // { totalEvents: 6, upcomingEvents: 4, pastEvents: 2, nextEventDate: '2025-03-01' }
 * ```
 */
export async function getSeriesStats(seriesId: string): Promise<{
  totalEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  nextEventDate: string | null;
}> {
  console.log(`📊 [getSeriesStats] Calculating stats for series: ${seriesId}`);

  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  // Get total count
  const { count: totalEvents } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('series_id', seriesId)
    .eq('status', 'published')
    .is('deleted_at', null);

  // Get upcoming count
  const { count: upcomingEvents } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('series_id', seriesId)
    .eq('status', 'published')
    .is('deleted_at', null)
    .gte('instance_date', today);

  // Get next event date
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: nextEvent } = await (supabase as any)
    .from('events')
    .select('instance_date')
    .eq('series_id', seriesId)
    .eq('status', 'published')
    .is('deleted_at', null)
    .gte('instance_date', today)
    .order('instance_date', { ascending: true })
    .limit(1)
    .single();

  const stats = {
    totalEvents: totalEvents || 0,
    upcomingEvents: upcomingEvents || 0,
    pastEvents: (totalEvents || 0) - (upcomingEvents || 0),
    nextEventDate: nextEvent?.instance_date || null,
  };

  console.log(`✅ [getSeriesStats] Stats:`, stats);

  return stats;
}
