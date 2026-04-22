/**
 * SCRAPER CLIENT TYPES
 * ====================
 * Shared types for calling the Render-hosted happenlist_scraper backend from
 * the happenlist Next.js app. These mirror the extractor output shapes on the
 * scraper side — update in lockstep if the scraper changes its response.
 *
 * MIRROR OF: happenlist_scraper/backend/routes/analyze.js,
 *            happenlist_scraper/backend/routes/analyze-text.js
 *
 * If you change this, change BOTH. Sync verified manually during phase review.
 *
 * @module lib/scraper/types
 */

/**
 * Location/venue shape the scraper returns on an analyzed event.
 * Matches the `venue` object built by buildVenue() in analyze-text.js.
 */
export interface ScraperVenue {
  name: string;
  address_line?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  google_place_id?: string | null;
  venue_type?: string | null;
}

/**
 * A single analyzed event from the scraper. This is the "raw" shape — we map
 * it to our Supabase insert shape at save time (see lib/scraper/save-event.ts).
 *
 * Not every field is always populated — the scraper returns whatever it could
 * extract. Null / missing is normal.
 */
export interface ScraperEvent {
  // Identity
  title: string;
  slug?: string | null;

  // Descriptions (5 variants)
  description?: string | null;
  short_description?: string | null;
  tagline?: string | null;
  happenlist_summary?: string | null;
  organizer_description?: string | null;

  // Timing
  start_datetime: string;
  end_datetime?: string | null;
  instance_date?: string | null;
  is_all_day?: boolean | null;
  timezone?: string | null;

  // Location / venue
  venue?: ScraperVenue | null;

  // Organizer
  organizer_name?: string | null;
  organizer_is_venue?: boolean | null;
  organizer_website_url?: string | null;
  organizer_email?: string | null;

  // Category
  category_slug?: string | null;

  // Pricing
  price_type?: string | null;
  price_low?: number | null;
  price_high?: number | null;
  price_details?: string | null;
  ticket_url?: string | null;
  is_free?: boolean | null;

  // Access / attendance
  access_type?: string | null;
  attendance_mode?: string | null;
  membership_required?: boolean | null;
  membership_details?: string | null;

  // Audience
  age_low?: number | null;
  age_high?: number | null;
  age_restriction?: string | null;
  is_family_friendly?: boolean | null;
  good_for?: string[] | null;

  // Talent
  talent_name?: string | null;
  talent_bio?: string | null;

  // Links
  website_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  registration_url?: string | null;

  // Images
  image_url?: string | null;
  flyer_url?: string | null;
  thumbnail_url?: string | null;

  // Series (per-event hints — not the series record itself)
  is_series?: boolean | null;
  series_title?: string | null;
  series_type?: string | null;
  recurrence_description?: string | null;

  // Provenance
  scraped_data?: Record<string, unknown> | null;
  source_url?: string | null;

  // Extractor passthrough for fields we haven't enumerated
  [key: string]: unknown;
}

export interface ScraperAnalyzeSingleResponse {
  success: true;
  multi?: false;
  event: ScraperEvent;
  confidence?: Record<string, unknown>;
  notes?: Record<string, string>;
}

export interface ScraperAnalyzeMultiResponse {
  success: true;
  multi: true;
  events: ScraperEvent[];
  confidence?: Record<string, unknown>;
  notes?: Record<string, string>;
}

export type ScraperAnalyzeResponse =
  | ScraperAnalyzeSingleResponse
  | ScraperAnalyzeMultiResponse;

export interface ScraperErrorResponse {
  success: false;
  error: string;
}

/**
 * Recurrence rule shape from POST /parse/recurrence.
 * Mirrors `RecurrenceRule` in happenlist_scraper/backend/lib/recurrence-rule.js
 * AND our own RecurrenceRule type in lib/supabase/types.
 */
export interface ScraperRecurrenceResponse {
  success: true;
  recurrence_rule: {
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
    interval?: number;
    days_of_week?: string[];
    week_of_month?: number;
    day_of_month?: number;
    time?: string;
    duration_minutes?: number;
    end_type?: 'date' | 'count' | 'never';
    end_date?: string | null;
    end_count?: number | null;
  };
  recurrence_description: string;
}

/**
 * Result of POST /recheck — what changed since we last scraped.
 * Includes the full new event payload plus a computed diff.
 */
export interface ScraperRecheckResponse {
  success: true;
  event: ScraperEvent;
  /** Field-level diff: { field: { before, after } } */
  diff: Record<string, { before: unknown; after: unknown }>;
  /** True if nothing of consequence changed */
  unchanged: boolean;
}

/** Lightweight availability check result from POST /check-sold-out. */
export interface ScraperSoldOutResponse {
  success: true;
  sold_out: boolean;
  sold_out_details: string | null;
  price_low?: number | null;
  price_high?: number | null;
  price_details?: string | null;
  /** Fields to patch on the event. Values that didn't change are omitted. */
  updates: Record<string, unknown>;
}
