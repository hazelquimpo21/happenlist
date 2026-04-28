/**
 * GET ADMIN SERIES
 * =================
 * Fetches series for admin listing with filtering and pagination.
 */

import { createClient } from '@/lib/supabase/server';
import { isSeriesOpenEnded } from '@/lib/series/date-display';

export interface AdminSeriesCard {
  id: string;
  title: string;
  slug: string;
  series_type: string;
  status: string;
  total_sessions: number | null;
  start_date: string | null;
  end_date: string | null;
  image_url: string | null;
  created_at: string;
  event_count: number;
  category_name: string | null;
  location_name: string | null;
  organizer_name: string | null;
  attendance_mode: string;
  age_low: number | null;
  age_high: number | null;
  /** True when recurrence_rule.end_type === 'never' — see lib/series/date-display */
  is_open_ended: boolean;
}

export interface AdminSeriesFilters {
  search?: string;
  seriesType?: string;
  status?: string;
  page?: number;
  limit?: number;
  orderBy?: 'created_at' | 'title' | 'start_date' | 'total_sessions';
  orderDir?: 'asc' | 'desc';
}

export interface AdminSeriesResult {
  series: AdminSeriesCard[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getAdminSeries(
  filters: AdminSeriesFilters = {}
): Promise<AdminSeriesResult> {
  const {
    search,
    seriesType,
    status,
    page = 1,
    limit = 20,
    orderBy = 'created_at',
    orderDir = 'desc',
  } = filters;

  const supabase = await createClient();
  const offset = (page - 1) * limit;

  // Build query
  let query = supabase
    .from('series')
    .select(
      `
      id,
      title,
      slug,
      series_type,
      status,
      total_sessions,
      start_date,
      end_date,
      image_url,
      created_at,
      attendance_mode,
      age_low,
      age_high,
      recurrence_rule,
      category:categories(name),
      location:locations(name),
      organizer:organizers(name)
    `,
      { count: 'exact' }
    )
    // Hide soft-deleted series from the admin listing. (Cancelled rows
    // still show — admin needs to see them. Deleted rows are scrubbed.)
    .is('deleted_at', null);

  if (status) {
    query = query.eq('status', status);
  }

  if (seriesType) {
    query = query.eq('series_type', seriesType);
  }

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  const ascending = orderDir === 'asc';
  query = query.order(orderBy, { ascending, nullsFirst: false });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Failed to fetch admin series:', error);
    return { series: [], total: 0, page, limit, totalPages: 0 };
  }

  const total = count || 0;

  // For each series, get the actual event count using lightweight queries
  const seriesIds = (data || []).map((s: { id: string }) => s.id);
  const eventCounts: Record<string, number> = {};

  if (seriesIds.length > 0) {
    // Use parallel count queries — much faster than fetching all rows
    const countPromises = seriesIds.map(async (id: string) => {
      const { count } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('series_id', id)
        .is('deleted_at', null);
      return { id, count: count || 0 };
    });

    const counts = await Promise.all(countPromises);
    for (const { id, count } of counts) {
      eventCounts[id] = count;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const series: AdminSeriesCard[] = (data || []).map((s: any) => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
    series_type: s.series_type,
    status: s.status,
    total_sessions: s.total_sessions,
    start_date: s.start_date,
    end_date: s.end_date,
    image_url: s.image_url,
    created_at: s.created_at,
    event_count: eventCounts[s.id] || 0,
    category_name: s.category?.name || null,
    location_name: s.location?.name || null,
    organizer_name: s.organizer?.name || null,
    attendance_mode: s.attendance_mode || 'drop_in',
    age_low: s.age_low,
    age_high: s.age_high,
    is_open_ended: isSeriesOpenEnded(s.recurrence_rule),
  }));

  return {
    series,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
