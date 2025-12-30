/**
 * SUPABASE DATABASE TYPES
 * =======================
 * These types define the structure of your Supabase database.
 *
 * To regenerate after schema changes:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
 *
 * For now, we define types manually based on our schema.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // ==========================================
      // CATEGORIES TABLE
      // ==========================================
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

      // ==========================================
      // LOCATIONS (VENUES) TABLE
      // ==========================================
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

      // ==========================================
      // ORGANIZERS TABLE
      // ==========================================
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
          social_links: Json;
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
          social_links?: Json;
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
          social_links?: Json;
          meta_title?: string | null;
          meta_description?: string | null;
          is_active?: boolean;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ==========================================
      // EVENTS TABLE
      // ==========================================
      events: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          short_description: string | null;
          start_datetime: string;
          end_datetime: string | null;
          instance_date: string;
          on_sale_date: string | null;
          is_all_day: boolean;
          timezone: string;
          event_type: string;
          recurrence_parent_id: string | null;
          is_recurrence_template: boolean;
          recurrence_pattern: Json | null;
          series_id: string | null;
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
          flyer_url: string | null;
          thumbnail_url: string | null;
          meta_title: string | null;
          meta_description: string | null;
          heart_count: number;
          view_count: number;
          status: string;
          is_featured: boolean;
          featured_order: number | null;
          created_at: string;
          updated_at: string;
          published_at: string | null;
          // Source tracking fields (for scraped events)
          source: string;
          source_url: string | null;
          source_id: string | null;
          scraped_at: string | null;
          scraped_data: Json | null;
          // Admin review fields
          reviewed_at: string | null;
          reviewed_by: string | null;
          review_notes: string | null;
          rejection_reason: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          short_description?: string | null;
          start_datetime: string;
          end_datetime?: string | null;
          instance_date: string;
          on_sale_date?: string | null;
          is_all_day?: boolean;
          timezone?: string;
          event_type?: string;
          recurrence_parent_id?: string | null;
          is_recurrence_template?: boolean;
          recurrence_pattern?: Json | null;
          series_id?: string | null;
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
          flyer_url?: string | null;
          thumbnail_url?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
          heart_count?: number;
          view_count?: number;
          status?: string;
          is_featured?: boolean;
          featured_order?: number | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          // Source tracking fields
          source?: string;
          source_url?: string | null;
          source_id?: string | null;
          scraped_at?: string | null;
          scraped_data?: Json | null;
          // Admin review fields
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          review_notes?: string | null;
          rejection_reason?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          short_description?: string | null;
          start_datetime?: string;
          end_datetime?: string | null;
          instance_date?: string;
          on_sale_date?: string | null;
          is_all_day?: boolean;
          timezone?: string;
          event_type?: string;
          recurrence_parent_id?: string | null;
          is_recurrence_template?: boolean;
          recurrence_pattern?: Json | null;
          series_id?: string | null;
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
          flyer_url?: string | null;
          thumbnail_url?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
          heart_count?: number;
          view_count?: number;
          status?: string;
          is_featured?: boolean;
          featured_order?: number | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          // Source tracking fields
          source?: string;
          source_url?: string | null;
          source_id?: string | null;
          scraped_at?: string | null;
          scraped_data?: Json | null;
          // Admin review fields
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          review_notes?: string | null;
          rejection_reason?: string | null;
        };
      };

      // ==========================================
      // ADMIN AUDIT LOG TABLE
      // ==========================================
      admin_audit_log: {
        Row: {
          id: string;
          action: string;
          entity_type: string;
          entity_id: string;
          admin_id: string | null;
          admin_email: string | null;
          changes: Json | null;
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
          changes?: Json | null;
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
          changes?: Json | null;
          notes?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };

    Views: {
      admin_event_stats: {
        Row: {
          pending_review_count: number;
          published_count: number;
          draft_count: number;
          rejected_count: number;
          scraped_count: number;
          scraped_pending_count: number;
          scraped_last_24h: number;
          reviewed_last_24h: number;
          total_count: number;
        };
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
          p_changes?: Json;
          p_notes?: string;
        };
        Returns: string;
      };
    };

    Enums: {
      [_ in never]: never;
    };
  };
}

// ==========================================
// EVENT STATUS TYPES
// ==========================================
export type EventStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'rejected'
  | 'cancelled'
  | 'postponed';

// ==========================================
// EVENT SOURCE TYPES
// ==========================================
export type EventSource =
  | 'manual'
  | 'scraper'
  | 'api'
  | 'import';

// ==========================================
// ADMIN AUDIT ACTION TYPES
// ==========================================
export type AdminAuditAction =
  | 'event_approved'
  | 'event_rejected'
  | 'event_edited'
  | 'event_deleted'
  | 'event_published'
  | 'event_unpublished'
  | 'venue_created'
  | 'venue_edited'
  | 'organizer_created'
  | 'organizer_edited';
