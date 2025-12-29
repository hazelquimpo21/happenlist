/**
 * CATEGORY TYPES
 * ==============
 * Type definitions for event categories.
 */

import type { Database } from '@/lib/supabase/types';

// Base type from database
export type Category = Database['public']['Tables']['categories']['Row'];

/**
 * Category with event count (for display).
 */
export interface CategoryWithCount extends Category {
  event_count: number;
}
