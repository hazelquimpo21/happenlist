/**
 * EVENT TYPES
 * ===========
 * Type definitions for events and related entities.
 */

import type { Database } from '@/lib/supabase/types';

// Base types from database
export type EventRow = Database['public']['Tables']['events']['Row'];
export type LocationRow = Database['public']['Tables']['locations']['Row'];
export type OrganizerRow = Database['public']['Tables']['organizers']['Row'];
export type CategoryRow = Database['public']['Tables']['categories']['Row'];

/**
 * Event with all related entities (for detail pages).
 */
export interface EventWithDetails extends EventRow {
  category: Pick<CategoryRow, 'id' | 'name' | 'slug' | 'icon'> | null;
  location: Pick<
    LocationRow,
    | 'id'
    | 'name'
    | 'slug'
    | 'city'
    | 'state'
    | 'address_line'
    | 'address_line_2'
    | 'postal_code'
    | 'latitude'
    | 'longitude'
    | 'venue_type'
    | 'website_url'
  > | null;
  organizer: Pick<
    OrganizerRow,
    'id' | 'name' | 'slug' | 'logo_url' | 'description' | 'website_url'
  > | null;
}

/**
 * Simplified event for cards and lists.
 * Contains only the fields needed for display.
 */
export interface EventCard {
  id: string;
  title: string;
  slug: string;
  start_datetime: string;
  instance_date: string;
  image_url: string | null;
  thumbnail_url: string | null;
  price_type: string;
  price_low: number | null;
  price_high: number | null;
  is_free: boolean;
  heart_count: number;
  category_name: string | null;
  category_slug: string | null;
  location_name: string | null;
  location_slug: string | null;
  // Audience / age
  age_restriction?: string | null;
  is_family_friendly?: boolean | null;
  // Series info (Phase 2)
  series_id?: string | null;
  series_slug?: string | null;
  series_title?: string | null;
  series_type?: string | null;
  series_sequence?: number | null;
  is_series_instance?: boolean;
}
