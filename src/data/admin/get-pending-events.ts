/**
 * GET PENDING EVENTS
 * ===================
 * Fetches events that are pending admin review.
 */

import { createClient } from '@/lib/supabase/server';
import { adminDataLogger } from '@/lib/utils/logger';
import type { EventStatus, EventSource } from '@/lib/supabase/types';

export interface AdminEventCard {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  start_datetime: string;
  end_datetime: string | null;
  instance_date: string;
  image_url: string | null;
  thumbnail_url: string | null;
  status: EventStatus;
  source: EventSource;
  source_url: string | null;
  scraped_at: string | null;
  created_at: string;
  series_id: string | null;
  series_title: string | null;
  parent_event_id: string | null;
  parent_event_title: string | null;
  parent_group: string | null;
  category_name: string | null;
  category_slug: string | null;
  location_name: string | null;
  location_city: string | null;
  organizer_name: string | null;
  price_type: string;
  price_low: number | null;
  price_high: number | null;
  is_free: boolean;
}

export interface PendingEventsFilters {
  source?: EventSource;
  status?: EventStatus;
  search?: string;
  page?: number;
  limit?: number;
  orderBy?: 'scraped_at' | 'created_at' | 'start_datetime' | 'title';
  orderDir?: 'asc' | 'desc';
  /** When true, show only soft-deleted events (overrides status filter) */
  showDeleted?: boolean;
  /** Filter by series membership: 'in_series' | 'no_series' | undefined (all) */
  seriesFilter?: 'in_series' | 'no_series';
}

export interface PendingEventsResult {
  events: AdminEventCard[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Fetch events pending review with filtering and pagination
 */
export async function getPendingEvents(
  filters: PendingEventsFilters = {},
  options: { skipStatusDefault?: boolean } = {}
): Promise<PendingEventsResult> {
  const {
    source,
    search,
    page = 1,
    limit = 20,
    orderBy = 'scraped_at',
    orderDir = 'desc',
  } = filters;

  // Status defaults to 'pending_review' unless skipStatusDefault is true
  // This allows getAllAdminEvents to show ALL statuses by default
  const status = options.skipStatusDefault ? filters.status : (filters.status ?? 'pending_review');

  const timer = adminDataLogger.time('getPendingEvents', {
    action: 'event_fetch',
    metadata: { status, source, page, limit },
  });

  try {
    const supabase = await createClient();
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('events')
      .select(
        `
        id,
        title,
        slug,
        description,
        start_datetime,
        end_datetime,
        instance_date,
        image_url,
        thumbnail_url,
        status,
        source,
        source_url,
        scraped_at,
        created_at,
        series_id,
        series:series(title),
        parent_event_id,
        parent_group,
        parent_event:events!parent_event_id(title),
        price_type,
        price_low,
        price_high,
        is_free,
        category:categories(name, slug),
        location:locations(name, city),
        organizer:organizers(name)
      `,
        { count: 'exact' }
      );

    // Soft-delete filtering
    if (filters.showDeleted) {
      // Show ONLY soft-deleted events
      query = query.not('deleted_at', 'is', null);
    } else {
      // Hide soft-deleted events from normal views
      query = query.is('deleted_at', null);
    }

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply source filter
    if (source) {
      query = query.eq('source', source);
    }

    // Apply search filter
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // Apply series filter
    if (filters.seriesFilter === 'in_series') {
      query = query.not('series_id', 'is', null);
    } else if (filters.seriesFilter === 'no_series') {
      query = query.is('series_id', null);
    }

    // Apply ordering
    const ascending = orderDir === 'asc';
    query = query.order(orderBy, { ascending, nullsFirst: false });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      timer.error('Failed to fetch pending events', error);
      throw error;
    }

    // Transform data - type assertion needed until migration is run
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events: AdminEventCard[] = ((data || []) as any[]).map((event) => ({
      id: event.id,
      title: event.title,
      slug: event.slug,
      description: event.description || null,
      start_datetime: event.start_datetime,
      end_datetime: event.end_datetime || null,
      instance_date: event.instance_date,
      image_url: event.image_url,
      thumbnail_url: event.thumbnail_url,
      status: event.status as EventStatus,
      source: (event.source || 'manual') as EventSource,
      source_url: event.source_url,
      scraped_at: event.scraped_at,
      created_at: event.created_at,
      series_id: event.series_id || null,
      series_title: (event.series as { title: string } | null)?.title || null,
      parent_event_id: event.parent_event_id || null,
      parent_event_title: (event.parent_event as { title: string } | null)?.title || null,
      parent_group: event.parent_group || null,
      price_type: event.price_type,
      price_low: event.price_low,
      price_high: event.price_high,
      is_free: event.is_free,
      category_name: (event.category as { name: string } | null)?.name || null,
      category_slug: (event.category as { slug: string } | null)?.slug || null,
      location_name: (event.location as { name: string } | null)?.name || null,
      location_city: (event.location as { city: string } | null)?.city || null,
      organizer_name: (event.organizer as { name: string } | null)?.name || null,
    }));

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    timer.success(`Fetched ${events.length} pending events`, {
      metadata: { total, page, totalPages },
    });

    return {
      events,
      total,
      page,
      limit,
      totalPages,
    };
  } catch (error) {
    timer.error('Failed to fetch pending events', error);
    throw error;
  }
}

/**
 * Fetch all events with any status for admin view
 *
 * NOTE: If status filter is provided, it will be applied.
 * If no status filter is provided, all events are returned (no default).
 */
export async function getAllAdminEvents(
  filters: PendingEventsFilters = {}
): Promise<PendingEventsResult> {
  // Skip the default status filter so ALL events show when no status is specified
  // But if a status IS specified, it will be used for filtering
  return getPendingEvents(filters, { skipStatusDefault: true });
}
