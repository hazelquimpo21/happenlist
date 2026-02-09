/**
 * SEARCH SERIES
 * ==============
 * Functions for searching existing series to link events to.
 *
 * Phase B: Implements real upcoming_event_count via a batch count query
 * instead of the previous hardcoded 0 value. Uses a separate query to
 * count upcoming events for each returned series.
 *
 * @module data/submit/search-series
 */

import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('Submit');

// ============================================================================
// TYPES
// ============================================================================

export interface SeriesSearchResult {
  id: string;
  title: string;
  slug: string;
  series_type: string;
  description: string | null;
  image_url: string | null;
  organizer_name: string | null;
  location_name: string | null;
  location_city: string | null;
  upcoming_event_count: number;
  total_sessions: number | null;
}

export interface SearchSeriesParams {
  query: string;
  limit?: number;
  seriesType?: string;
  categoryId?: string;
}

// ============================================================================
// SEARCH SERIES
// ============================================================================

/**
 * Search for series by title
 *
 * Used in the submission form to link events to existing series.
 *
 * @param params - Search parameters
 * @returns List of matching series
 *
 * @example
 * ```ts
 * const results = await searchSeries({ query: 'pottery', limit: 10 });
 * ```
 */
export async function searchSeries(
  params: SearchSeriesParams
): Promise<{ success: boolean; series?: SeriesSearchResult[]; error?: string }> {
  const { query, limit = 20, seriesType, categoryId } = params;

  const timer = logger.time('searchSeries', {
    action: 'search',
    metadata: { query, limit },
  });

  try {
    const supabase = await createClient();

    // Build base query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dbQuery = (supabase as any)
      .from('series')
      .select(
        `
        id,
        title,
        slug,
        series_type,
        description,
        image_url,
        total_sessions,
        organizers!organizer_id (name),
        locations!location_id (name, city)
      `
      )
      .eq('status', 'published')
      .ilike('title', `%${query}%`)
      .limit(limit);

    // Add optional filters
    if (seriesType) {
      dbQuery = dbQuery.eq('series_type', seriesType);
    }

    if (categoryId) {
      dbQuery = dbQuery.eq('category_id', categoryId);
    }

    const { data, error } = await dbQuery;

    if (error) {
      timer.error('Series search failed', error);
      return { success: false, error: error.message };
    }

    // Phase B: Fetch upcoming event counts for all returned series in one batch query
    const seriesIds = (data || []).map((row: { id: string }) => row.id);
    const upcomingCounts = await getUpcomingEventCounts(supabase, seriesIds);

    // Transform results with real upcoming counts
    const series: SeriesSearchResult[] = (data || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (row: any) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        series_type: row.series_type,
        description: row.description,
        image_url: row.image_url,
        organizer_name: row.organizers?.name || null,
        location_name: row.locations?.name || null,
        location_city: row.locations?.city || null,
        upcoming_event_count: upcomingCounts.get(row.id) ?? 0,
        total_sessions: row.total_sessions,
      })
    );

    timer.success(`Found ${series.length} series matching "${query}" (with upcoming counts)`);

    return {
      success: true,
      series,
    };
  } catch (error) {
    timer.error('Unexpected error', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// GET RECENT SERIES (for quick selection)
// ============================================================================

/**
 * Get recently created series for quick selection
 *
 * @param limit - Max number to return
 * @returns Recent series
 */
export async function getRecentSeries(
  limit: number = 5
): Promise<{ success: boolean; series?: SeriesSearchResult[]; error?: string }> {
  const timer = logger.time('getRecentSeries');

  try {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('series')
      .select(
        `
        id,
        title,
        slug,
        series_type,
        description,
        image_url,
        total_sessions,
        organizers!organizer_id (name),
        locations!location_id (name, city)
      `
      )
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      timer.error('Failed to get recent series', error);
      return { success: false, error: error.message };
    }

    // Phase B: Fetch upcoming event counts for returned series
    const seriesIds = (data || []).map((row: { id: string }) => row.id);
    const upcomingCounts = await getUpcomingEventCounts(supabase, seriesIds);

    // Transform results with real upcoming counts
    const series: SeriesSearchResult[] = (data || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (row: any) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        series_type: row.series_type,
        description: row.description,
        image_url: row.image_url,
        organizer_name: row.organizers?.name || null,
        location_name: row.locations?.name || null,
        location_city: row.locations?.city || null,
        upcoming_event_count: upcomingCounts.get(row.id) ?? 0,
        total_sessions: row.total_sessions,
      })
    );

    timer.success(`Got ${series.length} recent series (with upcoming counts)`);

    return {
      success: true,
      series,
    };
  } catch (error) {
    timer.error('Unexpected error', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// GET SERIES BY ID
// ============================================================================

/**
 * Get a single series by ID
 *
 * @param seriesId - Series ID
 * @returns Series details
 */
export async function getSeriesForLink(
  seriesId: string
): Promise<{ success: boolean; series?: SeriesSearchResult; error?: string }> {
  const timer = logger.time('getSeriesForLink', {
    entityType: 'series',
    entityId: seriesId,
  });

  try {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('series')
      .select(
        `
        id,
        title,
        slug,
        series_type,
        description,
        image_url,
        total_sessions,
        organizers!organizer_id (name),
        locations!location_id (name, city)
      `
      )
      .eq('id', seriesId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        timer.error('Series not found');
        return { success: false, error: 'Series not found' };
      }
      timer.error('Failed to get series', error);
      return { success: false, error: error.message };
    }

    // Phase B: Get real upcoming event count for this series
    const upcomingCounts = await getUpcomingEventCounts(supabase, [data.id]);

    timer.success(`Series found: "${data.title}" (upcoming: ${upcomingCounts.get(data.id) ?? 0})`);

    return {
      success: true,
      series: {
        id: data.id,
        title: data.title,
        slug: data.slug,
        series_type: data.series_type,
        description: data.description,
        image_url: data.image_url,
        organizer_name: data.organizers?.name || null,
        location_name: data.locations?.name || null,
        location_city: data.locations?.city || null,
        upcoming_event_count: upcomingCounts.get(data.id) ?? 0,
        total_sessions: data.total_sessions,
      },
    };
  } catch (error) {
    timer.error('Unexpected error', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// HELPER: GET UPCOMING EVENT COUNTS
// ============================================================================

/**
 * Fetches the count of upcoming (future) published events for a batch of series IDs.
 *
 * Phase B: Replaces the previous hardcoded `upcoming_event_count: 0` in all
 * search/recent/link functions. Uses a single query with `.in()` filter
 * to batch-fetch counts efficiently.
 *
 * @param supabase - Supabase client instance
 * @param seriesIds - Array of series UUIDs to count events for
 * @returns Map of series_id -> upcoming event count
 */
async function getUpcomingEventCounts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  seriesIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();

  // Short-circuit: no series IDs means no counts to fetch
  if (seriesIds.length === 0) {
    return counts;
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    // Fetch all upcoming published events for the given series IDs
    // We select only series_id and count by grouping client-side
    const { data, error } = await supabase
      .from('events')
      .select('series_id')
      .in('series_id', seriesIds)
      .eq('status', 'published')
      .gte('instance_date', today);

    if (error) {
      console.warn('⚠️ [getUpcomingEventCounts] Failed to fetch counts, falling back to 0:', error.message);
      return counts;
    }

    // Group by series_id and count
    for (const row of data || []) {
      const sid = row.series_id as string;
      counts.set(sid, (counts.get(sid) || 0) + 1);
    }

    console.log(`📊 [getUpcomingEventCounts] Counted upcoming events for ${seriesIds.length} series:`,
      Object.fromEntries(counts));
  } catch (err) {
    // Non-fatal: if counting fails, we return 0 for all (graceful degradation)
    console.warn('⚠️ [getUpcomingEventCounts] Unexpected error, falling back to 0:', err);
  }

  return counts;
}
