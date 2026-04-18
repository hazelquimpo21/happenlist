/**
 * EVENT TYPES
 * ===========
 * Type definitions for events and related entities.
 */

import type { Database } from '@/lib/supabase/types';
import type { EventPerformer } from './performer';
import type { EventMembershipBenefit } from './membership';
import type {
  AccessibilityTag,
  SensoryTag,
  LeaveWith,
  SocialMode,
  EnergyNeeded,
  SliderDimension,
  ProTip,
} from '@/lib/constants/vocabularies';

/**
 * Per-tag evidence map — the quoted fragment from the page that justifies
 * each tag. Written by the scraper's analyzers into
 * events.inferred_signals.<dimension>.evidence so reviewers can audit.
 *
 * Keys are snake_case vocab values (typed loosely as string so the JSONB
 * round-trip doesn't force a narrow union at read time); values are the
 * evidence strings or "(inferred from event type: …)" placeholders.
 */
export type EvidenceMap = Record<string, string>;

/**
 * Slider reading on a single dimension. `value` is 1–5 (rubric in
 * SLIDER_RUBRICS[dimension]); `confidence` reflects how much of the reading
 * was grounded vs. inferred; `evidence` is the justifying quote or an
 * "(inferred…)" placeholder.
 *
 * ADMIN-ONLY in v1 — surfaces only via the admin review panel until human
 * calibration audit confirms 1/3/5 labeling holds across categories.
 */
export interface SliderReading {
  value: 1 | 2 | 3 | 4 | 5;
  confidence: 'high' | 'medium' | 'low';
  evidence: string;
}

/**
 * Shape of the events.inferred_signals JSONB blob. All keys optional — the
 * payload grows as the scraper runs more analyzers on a given event, and
 * older events won't have all keys. Detail-page / admin consumers must
 * handle missing keys defensively.
 */
export interface InferredSignals {
  accessibility?: {
    evidence: EvidenceMap;
    explicit_only?: boolean;
  };
  sensory?: {
    evidence: EvidenceMap;
    confidence?: 'high' | 'medium' | 'low';
  };
  leave_with?: {
    evidence: EvidenceMap;
  };
  sliders?: Partial<Record<SliderDimension, SliderReading>>;
}

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
  // Parent event relationships (parent_event_id and parent_group come from EventRow)
  parent_event_title?: string | null;
  parent_event_slug?: string | null;
  child_event_count?: number;
  // Linked performers (from event_performers junction)
  event_performers?: EventPerformer[];
  // Linked membership benefits (from event_membership_benefits junction)
  event_membership_benefits?: EventMembershipBenefit[];

  // Tagging expansion (scraper migrations 00016–00019). Typed here because
  // the generated Database types in src/lib/supabase/types.ts have not been
  // regenerated to include these columns yet.
  accessibility_tags?: AccessibilityTag[] | null;
  sensory_tags?: SensoryTag[] | null;
  leave_with?: LeaveWith[] | null;
  social_mode?: SocialMode | null;
  energy_needed?: EnergyNeeded | null;
  inferred_signals?: InferredSignals | null;
  // Pro tips — 0–2 persona-scoped insider notes (scraper migration 00023).
  pro_tips?: ProTip[] | null;
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
  // Series info
  series_id?: string | null;
  series_slug?: string | null;
  series_title?: string | null;
  series_type?: string | null;
  series_sequence?: number | null;
  is_series_instance?: boolean;
  // Recurring event collapsing (populated when collapseSeries is enabled)
  /** Human-readable recurrence label, e.g. "Every Tuesday" */
  recurrence_label?: string | null;
  /** Number of additional upcoming dates beyond this one */
  upcoming_count?: number;
  // Descriptions
  short_description?: string | null;
  tagline?: string | null;
  // Talent
  talent_name?: string | null;
  // Access & attendance
  access_type?: string | null;
  noise_level?: string | null;
  // Vibe tags (up to 2 shown on cards)
  vibe_tags?: string[];
  // Organizer
  organizer_name?: string | null;
  organizer_is_venue?: boolean;
  // Parent event relationships
  parent_event_id?: string | null;
  parent_group?: string | null;
  child_event_count?: number;
  // Performers (max 2 for card display)
  performers?: { name: string; role: string }[];
  // Membership benefit summary for card badge
  has_member_benefits?: boolean;
  member_benefit_label?: string | null;
  // Geo distance (populated when nearLat/nearLng anchor is set in query)
  distance_miles?: number | null;

  // Tagging expansion (scraper migrations 00016–00019). Cards don't need
  // inferred_signals — that's detail-page / admin-only. These flat columns
  // are all the card needs for badge + filter surfacing.
  accessibility_tags?: AccessibilityTag[];
  sensory_tags?: SensoryTag[];
  leave_with?: LeaveWith[];
  social_mode?: SocialMode | null;
  energy_needed?: EnergyNeeded | null;
}
