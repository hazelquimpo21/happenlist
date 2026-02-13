/**
 * VENUE TYPES
 * ===========
 * Type definitions for venues (locations).
 */

import type { Database } from '@/lib/supabase/types';

// Base type from database
export type Venue = Database['public']['Tables']['locations']['Row'];

/**
 * Venue card data for lists.
 */
export interface VenueCard {
  id: string;
  name: string;
  slug: string;
  city: string;
  image_url: string | null;
  venue_type: string;
  event_count?: number;
}

/**
 * Venue with event count (for index pages).
 */
export interface VenueWithCount extends Venue {
  event_count: number;
}

/**
 * Social links structure for venues.
 * Matches the organizer SocialLinks pattern.
 */
export interface VenueSocialLinks {
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
}
