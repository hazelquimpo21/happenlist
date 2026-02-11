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
          // New fields for venue import system
          google_place_id: string | null;
          external_image_url: string | null;
          rating: number | null;
          review_count: number;
          working_hours: Record<string, string> | null;
          google_category: string | null;
          source: string;
          import_batch_id: string | null;
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
          // New fields for venue import system
          google_place_id?: string | null;
          external_image_url?: string | null;
          rating?: number | null;
          review_count?: number;
          working_hours?: Record<string, string> | null;
          google_category?: string | null;
          source?: string;
          import_batch_id?: string | null;
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
          // New fields for venue import system
          google_place_id?: string | null;
          external_image_url?: string | null;
          rating?: number | null;
          review_count?: number;
          working_hours?: Record<string, string> | null;
          google_category?: string | null;
          source?: string;
          import_batch_id?: string | null;
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
          is_all_day: boolean;
          timezone: string;
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
          // Submission tracking
          submitted_by_email: string | null;
          submitted_by_name: string | null;
          submitted_at: string | null;
          // Change request flow
          change_request_message: string | null;
          // Review tracking
          reviewed_at: string | null;
          reviewed_by: string | null;
          review_notes: string | null;
          rejection_reason: string | null;
          // Edit tracking
          last_edited_at: string | null;
          last_edited_by: string | null;
          edit_count: number;
          // Soft delete
          deleted_at: string | null;
          deleted_by: string | null;
          delete_reason: string | null;
          // Age/audience fields (migration 00008)
          age_low: number | null;
          age_high: number | null;
          age_restriction: string | null;
          is_family_friendly: boolean | null;
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
          is_all_day?: boolean;
          timezone?: string;
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
          // is_free is a generated column — do not include in Insert/Update
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
          // Submission tracking
          submitted_by_email?: string | null;
          submitted_by_name?: string | null;
          submitted_at?: string | null;
          // Change request flow
          change_request_message?: string | null;
          // Review tracking
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          review_notes?: string | null;
          rejection_reason?: string | null;
          // Edit tracking
          last_edited_at?: string | null;
          last_edited_by?: string | null;
          edit_count?: number;
          // Soft delete
          deleted_at?: string | null;
          deleted_by?: string | null;
          delete_reason?: string | null;
          // Age/audience fields (migration 00008)
          age_low?: number | null;
          age_high?: number | null;
          age_restriction?: string | null;
          is_family_friendly?: boolean | null;
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
          is_all_day?: boolean;
          timezone?: string;
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
          // is_free is a generated column — do not include in Insert/Update
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
          // Submission tracking
          submitted_by_email?: string | null;
          submitted_by_name?: string | null;
          submitted_at?: string | null;
          // Change request flow
          change_request_message?: string | null;
          // Review tracking
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          review_notes?: string | null;
          rejection_reason?: string | null;
          // Edit tracking
          last_edited_at?: string | null;
          last_edited_by?: string | null;
          edit_count?: number;
          // Soft delete
          deleted_at?: string | null;
          deleted_by?: string | null;
          delete_reason?: string | null;
          // Age/audience fields (migration 00008)
          age_low?: number | null;
          age_high?: number | null;
          age_restriction?: string | null;
          is_family_friendly?: boolean | null;
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
          // -- Camps/classes enhancements (migration: 20260209_series_camps_classes) --
          /** Core program start time (HH:MM:SS) */
          core_start_time: string | null;
          /** Core program end time (HH:MM:SS) */
          core_end_time: string | null;
          /** Before-care / early drop-off start (HH:MM:SS). NULL = not offered */
          extended_start_time: string | null;
          /** After-care / late pickup end (HH:MM:SS). NULL = not offered */
          extended_end_time: string | null;
          /** Human-readable care options & pricing */
          extended_care_details: string | null;
          /** Drop-in / single-session price. NULL = no drop-in */
          per_session_price: number | null;
          /** Separate materials/supply fee. NULL = none */
          materials_fee: number | null;
          /** Pricing notes: early bird, sibling discount, etc. */
          pricing_notes: string | null;
          /** How participants attend: 'registered' | 'drop_in' | 'hybrid' */
          attendance_mode: string;
          /** Minimum age. NULL = no minimum */
          age_low: number | null;
          /** Maximum age. NULL = no maximum */
          age_high: number | null;
          /** Human-readable age details */
          age_details: string | null;
          /** Skill level: 'beginner' | 'intermediate' | 'advanced' | 'all_levels' */
          skill_level: string | null;
          /** Days of week (0=Sun..6=Sat). For camps: [1,2,3,4,5] = Mon-Fri */
          days_of_week: number[] | null;
          /** Semester/term label (e.g., "Fall 2026") */
          term_name: string | null;
          /** Parent series ID for multi-week camp programs */
          parent_series_id: string | null;
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
          registration_url?: string | null;
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
          // -- Camps/classes enhancements --
          core_start_time?: string | null;
          core_end_time?: string | null;
          extended_start_time?: string | null;
          extended_end_time?: string | null;
          extended_care_details?: string | null;
          per_session_price?: number | null;
          materials_fee?: number | null;
          pricing_notes?: string | null;
          attendance_mode?: string;
          age_low?: number | null;
          age_high?: number | null;
          age_details?: string | null;
          skill_level?: string | null;
          days_of_week?: number[] | null;
          term_name?: string | null;
          parent_series_id?: string | null;
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
          registration_url?: string | null;
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
          // -- Camps/classes enhancements --
          core_start_time?: string | null;
          core_end_time?: string | null;
          extended_start_time?: string | null;
          extended_end_time?: string | null;
          extended_care_details?: string | null;
          per_session_price?: number | null;
          materials_fee?: number | null;
          pricing_notes?: string | null;
          attendance_mode?: string;
          age_low?: number | null;
          age_high?: number | null;
          age_details?: string | null;
          skill_level?: string | null;
          days_of_week?: number[] | null;
          term_name?: string | null;
          parent_series_id?: string | null;
        };
      };

      // =====================================================================
      // HEARTS TABLE (User saved events)
      // =====================================================================
      hearts: {
        Row: {
          id: string;
          user_id: string;
          event_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_id?: string;
          created_at?: string;
        };
      };

      // =====================================================================
      // USER FOLLOWS TABLE (Polymorphic follows)
      // =====================================================================
      user_follows: {
        Row: {
          id: string;
          user_id: string;
          entity_type: string; // 'organizer' | 'venue' | 'category'
          entity_id: string;
          notify_new_events: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entity_type: string;
          entity_id: string;
          notify_new_events?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entity_type?: string;
          entity_id?: string;
          notify_new_events?: boolean;
          created_at?: string;
        };
      };

      // =====================================================================
      // PROFILES TABLE (User preferences)
      // =====================================================================
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          email_notifications: boolean;
          email_weekly_digest: boolean;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string; // matches auth.users.id
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          email_notifications?: boolean;
          email_weekly_digest?: boolean;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          email_notifications?: boolean;
          email_weekly_digest?: boolean;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
      };

      // =====================================================================
      // EVENT DRAFTS TABLE (In-progress submissions)
      // =====================================================================
      event_drafts: {
        Row: {
          id: string;
          user_id: string;
          user_email: string;
          user_name: string | null;
          draft_data: Record<string, unknown>;
          series_draft_data: Record<string, unknown> | null;
          current_step: number;
          completed_steps: number[];
          submitted_event_id: string | null;
          created_at: string;
          updated_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          user_email: string;
          user_name?: string | null;
          draft_data?: Record<string, unknown>;
          series_draft_data?: Record<string, unknown> | null;
          current_step?: number;
          completed_steps?: number[];
          submitted_event_id?: string | null;
          created_at?: string;
          updated_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          user_email?: string;
          user_name?: string | null;
          draft_data?: Record<string, unknown>;
          series_draft_data?: Record<string, unknown> | null;
          current_step?: number;
          completed_steps?: number[];
          submitted_event_id?: string | null;
          created_at?: string;
          updated_at?: string;
          expires_at?: string;
        };
      };

      // =====================================================================
      // ORGANIZER USERS TABLE (Organizer claims/team)
      // =====================================================================
      organizer_users: {
        Row: {
          id: string;
          user_id: string;
          organizer_id: string;
          role: string; // 'member' | 'admin'
          status: string; // 'pending' | 'verified' | 'rejected'
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organizer_id: string;
          role?: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organizer_id?: string;
          role?: string;
          status?: string;
          created_at?: string;
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
 *
 * CANONICAL DEFINITION: This is the single source of truth.
 * All fields are optional here because this represents what's stored in the DB.
 * For form validation, use `RecurrenceRuleFormData` from types/submission.ts
 * which makes user-facing required fields non-optional.
 */
export interface RecurrenceRule {
  /** How often the event repeats */
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  /** Repeat every N frequency units (e.g., every 2 weeks). Default: 1 */
  interval?: number;
  /** Which days of the week (0=Sun, 1=Mon, ..., 6=Sat) */
  days_of_week?: number[];
  /** Day of month for monthly recurrence (1-31) */
  day_of_month?: number;
  /** Start time in HH:MM format */
  time?: string;
  /** Duration of each session in minutes */
  duration_minutes?: number;
  /** How the recurrence ends */
  end_type?: 'date' | 'count' | 'never';
  /** End date if end_type is 'date' (YYYY-MM-DD) */
  end_date?: string;
  /** Number of occurrences if end_type is 'count' */
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
 *
 * State transitions:
 *   draft -> pending_review (user submits)
 *   pending_review -> published | changes_requested | rejected (admin)
 *   changes_requested -> pending_review (user resubmits)
 *   published -> cancelled | postponed (admin)
 *   postponed -> published (admin reschedules)
 *
 * CANONICAL DEFINITION: This is the single source of truth.
 * Import this type everywhere -- do not redefine.
 */
export type EventStatus =
  | 'draft'
  | 'pending_review'
  | 'changes_requested'
  | 'published'
  | 'rejected'
  | 'cancelled'
  | 'postponed';

/**
 * Price type enum values.
 *
 * CANONICAL DEFINITION: This is the single source of truth.
 * Import this type everywhere -- do not redefine.
 */
export type PriceType =
  | 'free'
  | 'fixed'
  | 'range'
  | 'varies'
  | 'donation'
  | 'per_session';

/**
 * Attendance mode for series.
 *
 * - 'registered': Must sign up for the full series
 * - 'drop_in': Show up to any individual session
 * - 'hybrid': Register for series OR drop in to individual sessions
 *
 * CANONICAL DEFINITION: This is the single source of truth.
 */
export type AttendanceMode = 'registered' | 'drop_in' | 'hybrid';

/**
 * Skill level for classes/workshops.
 *
 * CANONICAL DEFINITION: This is the single source of truth.
 */
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'all_levels';

/**
 * Event source — where the event came from.
 *
 * - 'manual': Created by an admin directly in the database
 * - 'scraper': Imported via the Chrome extension or automated scraper
 * - 'user_submission': Submitted through the website's event submission form
 * - 'api': Created via external API
 * - 'import': Bulk imported
 *
 * CANONICAL DEFINITION: This is the single source of truth.
 */
export type EventSource = 'manual' | 'scraper' | 'user_submission' | 'api' | 'import';

/**
 * Venue type enum values.
 */
export type VenueType =
  | 'venue'
  | 'outdoor'
  | 'online'
  | 'various'
  | 'tbd'
  | 'entertainment'
  | 'arts'
  | 'sports'
  | 'restaurant'
  | 'community'
  | 'education';
