/**
 * SUPABASE DATABASE TYPES
 * =======================
 * TypeScript types for the Supabase PostgreSQL database.
 *
 * These types are manually maintained to match the database schema.
 * After running new migrations, update these types accordingly.
 *
 * To regenerate from Supabase (requires CLI):
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
 */

// ============================================================================
// DATABASE INTERFACE
// ============================================================================

export interface Database {
  public: {
    Tables: {
      // =====================================================================
      // CATEGORIES TABLE
      // =====================================================================
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          color: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      // =====================================================================
      // LOCATIONS (VENUES) TABLE
      // =====================================================================
      locations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          address_line: string | null;
          address_line_2: string | null;
          city: string;
          state: string | null;
          postal_code: string | null;
          country: string;
          latitude: number | null;
          longitude: number | null;
          venue_type: string;
          website_url: string | null;
          phone: string | null;
          image_url: string | null;
          meta_title: string | null;
          meta_description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          address_line?: string | null;
          address_line_2?: string | null;
          city: string;
          state?: string | null;
          postal_code?: string | null;
          country?: string;
          latitude?: number | null;
          longitude?: number | null;
          venue_type?: string;
          website_url?: string | null;
          phone?: string | null;
          image_url?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          address_line?: string | null;
          address_line_2?: string | null;
          city?: string;
          state?: string | null;
          postal_code?: string | null;
          country?: string;
          latitude?: number | null;
          longitude?: number | null;
          venue_type?: string;
          website_url?: string | null;
          phone?: string | null;
          image_url?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      // =====================================================================
      // ORGANIZERS TABLE
      // =====================================================================
      organizers: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          website_url: string | null;
          email: string | null;
          phone: string | null;
          social_links: Record<string, string>;
          meta_title: string | null;
          meta_description: string | null;
          is_active: boolean;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          website_url?: string | null;
          email?: string | null;
          phone?: string | null;
          social_links?: Record<string, string>;
          meta_title?: string | null;
          meta_description?: string | null;
          is_active?: boolean;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          website_url?: string | null;
          email?: string | null;
          phone?: string | null;
          social_links?: Record<string, string>;
          meta_title?: string | null;
          meta_description?: string | null;
          is_active?: boolean;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      // =====================================================================
      // EVENTS TABLE
      // =====================================================================
      events: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          short_description: string | null;
          happenlist_summary: string | null;
          organizer_description: string | null;
          start_datetime: string;
          end_datetime: string | null;
          instance_date: string;
          on_sale_date: string | null;
          is_all_day: boolean;
          timezone: string;
          event_type: string;
          recurrence_parent_id: string | null;
          is_recurrence_template: boolean;
          recurrence_pattern: Record<string, unknown> | null;
          series_id: string | null;
          series_sequence: number | null;
          is_series_instance: boolean;
          location_id: string | null;
          organizer_id: string | null;
          category_id: string | null;
          price_type: string;
          price_low: number | null;
          price_high: number | null;
          price_details: string | null;
          is_free: boolean;
          ticket_url: string | null;
          image_url: string | null;
          image_hosted: boolean;
          image_storage_path: string | null;
          raw_image_url: string | null;
          image_validated: boolean;
          image_validated_at: string | null;
          image_validation_notes: string | null;
          flyer_url: string | null;
          flyer_hosted: boolean;
          flyer_storage_path: string | null;
          thumbnail_url: string | null;
          thumbnail_hosted: boolean;
          thumbnail_storage_path: string | null;
          raw_thumbnail_url: string | null;
          // External link fields (added 2026-01-06)
          website_url: string | null;
          instagram_url: string | null;
          facebook_url: string | null;
          registration_url: string | null;
          meta_title: string | null;
          meta_description: string | null;
          heart_count: number;
          view_count: number;
          status: string;
          is_featured: boolean;
          featured_order: number | null;
          source: string;
          source_url: string | null;
          source_id: string | null;
          scraped_at: string | null;
          scraped_data: Record<string, unknown> | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          review_notes: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          short_description?: string | null;
          happenlist_summary?: string | null;
          organizer_description?: string | null;
          start_datetime: string;
          end_datetime?: string | null;
          instance_date: string;
          on_sale_date?: string | null;
          is_all_day?: boolean;
          timezone?: string;
          event_type?: string;
          recurrence_parent_id?: string | null;
          is_recurrence_template?: boolean;
          recurrence_pattern?: Record<string, unknown> | null;
          series_id?: string | null;
          series_sequence?: number | null;
          is_series_instance?: boolean;
          location_id?: string | null;
          organizer_id?: string | null;
          category_id?: string | null;
          price_type?: string;
          price_low?: number | null;
          price_high?: number | null;
          price_details?: string | null;
          is_free?: boolean;
          ticket_url?: string | null;
          image_url?: string | null;
          image_hosted?: boolean;
          image_storage_path?: string | null;
          raw_image_url?: string | null;
          image_validated?: boolean;
          image_validated_at?: string | null;
          image_validation_notes?: string | null;
          flyer_url?: string | null;
          flyer_hosted?: boolean;
          flyer_storage_path?: string | null;
          thumbnail_url?: string | null;
          thumbnail_hosted?: boolean;
          thumbnail_storage_path?: string | null;
          raw_thumbnail_url?: string | null;
          // External link fields (added 2026-01-06)
          website_url?: string | null;
          instagram_url?: string | null;
          facebook_url?: string | null;
          registration_url?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
          heart_count?: number;
          view_count?: number;
          status?: string;
          is_featured?: boolean;
          featured_order?: number | null;
          source?: string;
          source_url?: string | null;
          source_id?: string | null;
          scraped_at?: string | null;
          scraped_data?: Record<string, unknown> | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          review_notes?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          short_description?: string | null;
          happenlist_summary?: string | null;
          organizer_description?: string | null;
          start_datetime?: string;
          end_datetime?: string | null;
          instance_date?: string;
          on_sale_date?: string | null;
          is_all_day?: boolean;
          timezone?: string;
          event_type?: string;
          recurrence_parent_id?: string | null;
          is_recurrence_template?: boolean;
          recurrence_pattern?: Record<string, unknown> | null;
          series_id?: string | null;
          series_sequence?: number | null;
          is_series_instance?: boolean;
          location_id?: string | null;
          organizer_id?: string | null;
          category_id?: string | null;
          price_type?: string;
          price_low?: number | null;
          price_high?: number | null;
          price_details?: string | null;
          is_free?: boolean;
          ticket_url?: string | null;
          image_url?: string | null;
          image_hosted?: boolean;
          image_storage_path?: string | null;
          raw_image_url?: string | null;
          image_validated?: boolean;
          image_validated_at?: string | null;
          image_validation_notes?: string | null;
          flyer_url?: string | null;
          flyer_hosted?: boolean;
          flyer_storage_path?: string | null;
          thumbnail_url?: string | null;
          thumbnail_hosted?: boolean;
          thumbnail_storage_path?: string | null;
          raw_thumbnail_url?: string | null;
          // External link fields (added 2026-01-06)
          website_url?: string | null;
          instagram_url?: string | null;
          facebook_url?: string | null;
          registration_url?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
          heart_count?: number;
          view_count?: number;
          status?: string;
          is_featured?: boolean;
          featured_order?: number | null;
          source?: string;
          source_url?: string | null;
          source_id?: string | null;
          scraped_at?: string | null;
          scraped_data?: Record<string, unknown> | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          review_notes?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
      };

      // =====================================================================
      // SERIES TABLE (PHASE 2)
      // =====================================================================
      series: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          short_description: string | null;
          series_type: string;
          total_sessions: number | null;
          sessions_remaining: number | null;
          start_date: string | null;
          end_date: string | null;
          recurrence_rule: RecurrenceRule | null;
          organizer_id: string | null;
          category_id: string | null;
          location_id: string | null;
          price_type: string;
          price_low: number | null;
          price_high: number | null;
          price_details: string | null;
          is_free: boolean;
          registration_url: string | null;
          registration_required: boolean;
          capacity: number | null;
          waitlist_enabled: boolean;
          image_url: string | null;
          image_hosted: boolean;
          image_storage_path: string | null;
          thumbnail_url: string | null;
          meta_title: string | null;
          meta_description: string | null;
          status: string;
          is_featured: boolean;
          featured_order: number | null;
          heart_count: number;
          view_count: number;
          enrollment_count: number;
          source: string;
          source_url: string | null;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          short_description?: string | null;
          series_type?: string;
          total_sessions?: number | null;
          sessions_remaining?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          recurrence_rule?: RecurrenceRule | null;
          organizer_id?: string | null;
          category_id?: string | null;
          location_id?: string | null;
          price_type?: string;
          price_low?: number | null;
          price_high?: number | null;
          price_details?: string | null;
          is_free?: boolean;
          registration_url?: string | null;
          registration_required?: boolean;
          capacity?: number | null;
          waitlist_enabled?: boolean;
          image_url?: string | null;
          image_hosted?: boolean;
          image_storage_path?: string | null;
          thumbnail_url?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
          status?: string;
          is_featured?: boolean;
          featured_order?: number | null;
          heart_count?: number;
          view_count?: number;
          enrollment_count?: number;
          source?: string;
          source_url?: string | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          short_description?: string | null;
          series_type?: string;
          total_sessions?: number | null;
          sessions_remaining?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          recurrence_rule?: RecurrenceRule | null;
          organizer_id?: string | null;
          category_id?: string | null;
          location_id?: string | null;
          price_type?: string;
          price_low?: number | null;
          price_high?: number | null;
          price_details?: string | null;
          is_free?: boolean;
          registration_url?: string | null;
          registration_required?: boolean;
          capacity?: number | null;
          waitlist_enabled?: boolean;
          image_url?: string | null;
          image_hosted?: boolean;
          image_storage_path?: string | null;
          thumbnail_url?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
          status?: string;
          is_featured?: boolean;
          featured_order?: number | null;
          heart_count?: number;
          view_count?: number;
          enrollment_count?: number;
          source?: string;
          source_url?: string | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
      };

      // =====================================================================
      // ADMIN AUDIT LOG TABLE
      // =====================================================================
      admin_audit_log: {
        Row: {
          id: string;
          action: string;
          entity_type: string;
          entity_id: string;
          admin_id: string | null;
          admin_email: string | null;
          changes: Record<string, unknown> | null;
          notes: string | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          action: string;
          entity_type: string;
          entity_id: string;
          admin_id?: string | null;
          admin_email?: string | null;
          changes?: Record<string, unknown> | null;
          notes?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          admin_id?: string | null;
          admin_email?: string | null;
          changes?: Record<string, unknown> | null;
          notes?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };

    Views: {
      events_with_details: {
        Row: Record<string, unknown>;
      };
      series_with_details: {
        Row: Record<string, unknown>;
      };
      series_upcoming: {
        Row: Record<string, unknown>;
      };
      admin_event_stats: {
        Row: Record<string, unknown>;
      };
    };

    Functions: {
      log_admin_action: {
        Args: {
          p_action: string;
          p_entity_type: string;
          p_entity_id: string;
          p_admin_id?: string;
          p_admin_email?: string;
          p_changes?: Record<string, unknown>;
          p_notes?: string;
        };
        Returns: string;
      };
      get_series_events: {
        Args: {
          p_series_id: string;
          p_include_past?: boolean;
          p_limit?: number;
        };
        Returns: Array<{
          event_id: string;
          title: string;
          slug: string;
          instance_date: string;
          start_datetime: string;
          end_datetime: string | null;
          series_sequence: number | null;
          status: string;
          location_name: string | null;
          location_slug: string | null;
        }>;
      };
    };
  };
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Recurrence rule for recurring series/events.
 * Based on iCal RRULE standard but simplified.
 */
export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  interval?: number;
  days_of_week?: number[]; // 0=Sun, 1=Mon, 2=Tue, etc.
  day_of_month?: number;
  time?: string; // HH:MM format
  duration_minutes?: number;
  end_type?: 'date' | 'count' | 'never';
  end_date?: string;
  end_count?: number;
}

/**
 * Series type enum values.
 */
export type SeriesType =
  | 'class'     // Multi-session class
  | 'camp'      // Day camp or intensive
  | 'workshop'  // Workshop series
  | 'recurring' // True recurring event
  | 'festival'  // Multi-day festival
  | 'season';   // Performance season

/**
 * Event status enum values.
 */
export type EventStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'rejected'
  | 'cancelled'
  | 'postponed';

/**
 * Price type enum values.
 */
export type PriceType =
  | 'free'
  | 'fixed'
  | 'range'
  | 'varies'
  | 'donation'
  | 'per_session';

/**
 * Venue type enum values.
 */
export type VenueType =
  | 'venue'
  | 'outdoor'
  | 'online'
  | 'various'
  | 'tbd';
