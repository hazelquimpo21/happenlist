/**
 * SEARCH SERIES
 * ==============
 * Functions for searching existing series to link events to.
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

    // Transform results
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
        upcoming_event_count: 0, // Would need subquery to get this
        total_sessions: row.total_sessions,
      })
    );

    timer.success(`Found ${series.length} series matching "${query}"`);

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

    // Transform results
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
        upcoming_event_count: 0,
        total_sessions: row.total_sessions,
      })
    );

    timer.success(`Got ${series.length} recent series`);

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

    timer.success('Series found');

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
        upcoming_event_count: 0,
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
