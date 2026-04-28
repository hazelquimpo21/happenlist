/**
 * EVENT EDIT FORM — SHARED HELPERS, CONSTANTS, AND TYPES
 * =======================================================
 * Extracted from the original monolithic event-edit-form.tsx (2026-04-22 split).
 * Used by ./index.tsx and the sub-components in this directory.
 *
 * @module components/superadmin/event-edit-form/helpers
 */

import { formatMKEPattern } from '@/lib/utils/dates';
import type { Hours } from '@/lib/events/hours-schema';

// Status options now live in lib/constants/admin-status-palette.ts
// (STATUS_META, STATUS_ORDER, getStatusMeta).

export const PRICE_TYPES = [
  { value: 'free', label: 'Free' },
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'range', label: 'Price Range' },
  { value: 'varies', label: 'Varies' },
  { value: 'donation', label: 'Donation' },
  { value: 'per_session', label: 'Per Session' },
];

export type FormStatus = 'idle' | 'saving' | 'saved' | 'error';

export type OccurrenceScope = 'single' | 'all' | 'future';

export interface VenueSearchResult {
  id: string;
  name: string;
  address_line: string | null;
  city: string;
  state: string | null;
  venue_type: string;
  category: string | null;
  rating: number | null;
  review_count: number;
  latitude: number | null;
  longitude: number | null;
  similarity_score?: number;
}

export interface OrganizerSearchResult {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
}

export interface FormState {
  title: string;
  description: string;
  short_description: string;
  start_datetime: string;
  end_datetime: string;
  is_all_day: boolean;
  price_type: string;
  price_low: string;
  price_high: string;
  // is_free is initialized from event but NEVER written to updates in
  // handleSave — the server derives it from price_type === 'free'. Kept on
  // FormState for completeness only.
  is_free: boolean;
  ticket_url: string;
  // External links
  website_url: string;
  instagram_url: string;
  facebook_url: string;
  registration_url: string;
  // Audience
  good_for: string[];
  // Tagging-expansion (Stage 4 admin manual editing). Multi-value arrays +
  // two single-value enums. Sliders are NOT here — they go through the
  // SignalsReviewPanel override flow so every change is attributed.
  accessibility_tags: string[];
  sensory_tags: string[];
  leave_with: string[];
  social_mode: string;
  energy_needed: string;
  // Music genres (scraper migration 00024). Array field, same chip-toggle
  // pattern. Analyzer under-tags deliberately, so manual override is the
  // usual way this fills in for mis-categorized music events.
  music_genres: string[];
  // Image (Supabase Storage render URL with width+quality params)
  image_url: string;
  // Category
  category_id: string;
  // Status
  status: string;
  // Event shape v4 (2026-04-22). `hours` populated = Single · Ongoing;
  // `parent_event_id` populated = Collection child. Shape is DERIVED from
  // these + series_id — never set directly by the admin.
  hours: Hours | null;
  parent_event_id: string;
}

export function formatDateTimeLocal(dateString: string): string {
  return formatMKEPattern(dateString, "yyyy-MM-dd'T'HH:mm");
}
