/**
 * GET ADMIN EVENT
 * ================
 * Fetches a single event with full details for admin review.
 */

import { createClient } from '@/lib/supabase/server';
import { adminDataLogger } from '@/lib/utils/logger';
import type { Database, EventStatus, EventSource, Json } from '@/lib/supabase/types';
import type { AuditLogEntry } from './get-admin-stats';

export interface AdminEventDetails {
  // Basic info
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;

  // Timing
  start_datetime: string;
  end_datetime: string | null;
  instance_date: string;
  is_all_day: boolean;
  timezone: string;

  // Pricing
  price_type: string;
  price_low: number | null;
  price_high: number | null;
  price_details: string | null;
  is_free: boolean;
  ticket_url: string | null;

  // Media
  image_url: string | null;
  flyer_url: string | null;
  thumbnail_url: string | null;

  // Status
  status: EventStatus;
  is_featured: boolean;

  // Source tracking
  source: EventSource;
  source_url: string | null;
  source_id: string | null;
  scraped_at: string | null;
  scraped_data: Json | null;

  // Review info
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  rejection_reason: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  published_at: string | null;

  // Related entities
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  } | null;

  location: {
    id: string;
    name: string;
    slug: string;
    address_line: string | null;
    city: string;
    state: string | null;
    venue_type: string;
  } | null;

  organizer: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    website_url: string | null;
  } | null;
}

/**
 * Fetch a single event by ID for admin review
 */
export async function getAdminEvent(eventId: string): Promise<AdminEventDetails | null> {
  const timer = adminDataLogger.time('getAdminEvent', {
    action: 'event_fetch_single',
    entityType: 'event',
    entityId: eventId,
  });

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('events')
      .select(
        `
        *,
        category:categories(id, name, slug, icon),
        location:locations(id, name, slug, address_line, city, state, venue_type),
        organizer:organizers(id, name, slug, logo_url, website_url)
      `
      )
      .eq('id', eventId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        adminDataLogger.warn('Event not found', { entityType: 'event', entityId: eventId });
        return null;
      }
      timer.error('Failed to fetch event', error);
      throw error;
    }

    // Type assertion needed until types are regenerated after migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData = data as any;

    const event: AdminEventDetails = {
      id: rawData.id,
      title: rawData.title,
      slug: rawData.slug,
      description: rawData.description,
      short_description: rawData.short_description,
      start_datetime: rawData.start_datetime,
      end_datetime: rawData.end_datetime,
      instance_date: rawData.instance_date,
      is_all_day: rawData.is_all_day,
      timezone: rawData.timezone,
      price_type: rawData.price_type,
      price_low: rawData.price_low,
      price_high: rawData.price_high,
      price_details: rawData.price_details,
      is_free: rawData.is_free,
      ticket_url: rawData.ticket_url,
      image_url: rawData.image_url,
      flyer_url: rawData.flyer_url,
      thumbnail_url: rawData.thumbnail_url,
      status: rawData.status as EventStatus,
      is_featured: rawData.is_featured,
      source: (rawData.source || 'manual') as EventSource,
      source_url: rawData.source_url,
      source_id: rawData.source_id,
      scraped_at: rawData.scraped_at,
      scraped_data: rawData.scraped_data,
      reviewed_at: rawData.reviewed_at,
      reviewed_by: rawData.reviewed_by,
      review_notes: rawData.review_notes,
      rejection_reason: rawData.rejection_reason,
      created_at: rawData.created_at,
      updated_at: rawData.updated_at,
      published_at: rawData.published_at,
      category: rawData.category as AdminEventDetails['category'],
      location: rawData.location as AdminEventDetails['location'],
      organizer: rawData.organizer as AdminEventDetails['organizer'],
    };

    timer.success(`Fetched event: ${event.title}`);
    return event;
  } catch (error) {
    timer.error('Failed to fetch event', error);
    throw error;
  }
}

/**
 * Fetch event audit history
 */
export async function getEventAuditHistory(eventId: string, limit: number = 20): Promise<AuditLogEntry[]> {
  const timer = adminDataLogger.time('getEventAuditHistory', {
    action: 'fetch',
    entityType: 'event',
    entityId: eventId,
  });

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('admin_audit_log')
      .select('*')
      .eq('entity_type', 'event')
      .eq('entity_id', eventId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      timer.error('Failed to fetch audit history', error);
      throw error;
    }

    timer.success(`Fetched ${data?.length || 0} audit entries`);
    return data || [];
  } catch (error) {
    timer.error('Failed to fetch audit history', error);
    throw error;
  }
}
