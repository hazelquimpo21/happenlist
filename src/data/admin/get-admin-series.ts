/**
 * GET ADMIN SERIES
 * =================
 * Fetches series for admin listing with filtering and pagination.
 */

import { createClient } from '@/lib/supabase/server';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      category:categories(name),
      location:locations(name),
      organizer:organizers(name)
    `,
      { count: 'exact' }
    );

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

  // For each series, get the actual event count
  const seriesIds = (data || []).map((s: { id: string }) => s.id);
  const eventCounts: Record<string, number> = {};

  if (seriesIds.length > 0) {
    const { data: countData } = await supabase
      .from('events')
      .select('series_id')
      .in('series_id', seriesIds)
      .is('deleted_at', null);

    if (countData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const row of countData as any[]) {
        eventCounts[row.series_id] = (eventCounts[row.series_id] || 0) + 1;
      }
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
  }));

  return {
    series,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
