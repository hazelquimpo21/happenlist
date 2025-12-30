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
  start_datetime: string;
  instance_date: string;
  image_url: string | null;
  thumbnail_url: string | null;
  status: EventStatus;
  source: EventSource;
  source_url: string | null;
  scraped_at: string | null;
  created_at: string;
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
  filters: PendingEventsFilters = {}
): Promise<PendingEventsResult> {
  const {
    source,
    status = 'pending_review',
    search,
    page = 1,
    limit = 20,
    orderBy = 'scraped_at',
    orderDir = 'desc',
  } = filters;

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
        start_datetime,
        instance_date,
        image_url,
        thumbnail_url,
        status,
        source,
        source_url,
        scraped_at,
        created_at,
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
      start_datetime: event.start_datetime,
      instance_date: event.instance_date,
      image_url: event.image_url,
      thumbnail_url: event.thumbnail_url,
      status: event.status as EventStatus,
      source: (event.source || 'manual') as EventSource,
      source_url: event.source_url,
      scraped_at: event.scraped_at,
      created_at: event.created_at,
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
 */
export async function getAllAdminEvents(
  filters: PendingEventsFilters = {}
): Promise<PendingEventsResult> {
  return getPendingEvents({
    ...filters,
    status: undefined, // Remove status filter to get all events
  });
}
