/**
 * GET ADMIN EVENT
 * ================
 * Fetches a single event with full details for admin review.
 */

import { createClient } from '@/lib/supabase/server';
import { adminDataLogger } from '@/lib/utils/logger';
import type { EventRow } from '@/types/event';
import type { AuditLogEntry } from './get-admin-stats';

/**
 * Event with joined relations for admin review/editing.
 * Extends the full DB row type so new columns are automatically available.
 */
export interface AdminEventDetails extends EventRow {
  // Related entities (joined via Supabase select)
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

    // Cast through any because Supabase's generated types don't know about
    // the joined relation shape from our select() string.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const event = data as any as AdminEventDetails;

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
