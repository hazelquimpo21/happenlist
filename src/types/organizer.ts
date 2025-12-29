/**
 * ORGANIZER TYPES
 * ===============
 * Type definitions for event organizers.
 */

import type { Database } from '@/lib/supabase/types';

// Base type from database
export type Organizer = Database['public']['Tables']['organizers']['Row'];

/**
 * Organizer card data for lists.
 */
export interface OrganizerCard {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  event_count?: number;
}

/**
 * Social links structure.
 */
export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  website?: string;
}
