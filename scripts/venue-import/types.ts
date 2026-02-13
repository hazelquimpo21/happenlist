/**
 * VENUE IMPORT TYPES
 * ==================
 * TypeScript types for the venue CSV import system.
 *
 * This file defines the shape of data at each stage:
 *   1. CsvRow - Raw CSV row from Google Maps export
 *   2. VenueRecord - Cleaned/transformed record ready for database
 *   3. ImportResult - Result of an import operation
 *
 * @module scripts/venue-import/types
 */

// ============================================================================
// CSV ROW TYPE
// ============================================================================

/**
 * Raw row from the Google Maps CSV export.
 * These field names match the CSV column headers exactly.
 */
export interface CsvRow {
  query: string;
  name: string;
  name_for_emails: string;
  site: string;
  subtypes: string;
  category: string;
  type: string;
  phone: string;
  full_address: string;
  borough: string;
  street: string;
  city: string;
  postal_code: string;
  state: string;
  us_state: string;
  country: string;
  country_code: string;
  latitude: string;
  longitude: string;
  h3: string;
  time_zone: string;
  plus_code: string;
  area_service: string;
  rating: string;
  reviews: string;
  reviews_link: string;
  reviews_tags: string;
  reviews_per_score: string;
  reviews_per_score_1: string;
  reviews_per_score_2: string;
  reviews_per_score_3: string;
  reviews_per_score_4: string;
  reviews_per_score_5: string;
  photos_count: string;
  photo: string;
  street_view: string;
  located_in: string;
  working_hours: string;
  working_hours_csv_compatible: string;
  working_hours_old_format: string;
  other_hours: string;
  popular_times: string;
  business_status: string;
  about: string;
  range: string;
  prices: string;
  posts: string;
  logo: string;
  description: string;
  typical_time_spent: string;
  verified: string;
  owner_id: string;
  owner_title: string;
  owner_link: string;
  reservation_links: string;
  booking_appointment_link: string;
  menu_link: string;
  order_links: string;
  location_link: string;
  location_reviews_link: string;
  place_id: string;
  google_id: string;
  cid: string;
  kgmid: string;
  reviews_id: string;
  located_google_id: string;
}

// ============================================================================
// VENUE RECORD TYPE
// ============================================================================

/**
 * Cleaned venue record ready for database insertion.
 * Maps to the Supabase `locations` table schema.
 */
export interface VenueRecord {
  // Core identification
  name: string;
  slug: string;

  // Address fields
  address_line: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;

  // Coordinates
  latitude: number | null;
  longitude: number | null;

  // Classification
  venue_type: string;
  category: string | null;

  // Contact
  website_url: string | null;
  phone: string | null;

  // Images
  external_image_url: string | null;

  // Google data
  google_place_id: string | null;
  rating: number | null;
  review_count: number;
  working_hours: Record<string, string> | null;

  // Description
  description: string | null;

  // Import metadata
  source: 'csv_import';
  import_batch_id: string;
  is_active: boolean;
}

// ============================================================================
// IMPORT RESULT TYPES
// ============================================================================

/**
 * Result of a single venue import attempt.
 */
export interface VenueImportResult {
  /** Original row index from CSV */
  rowIndex: number;

  /** Venue name */
  name: string;

  /** Whether import was successful */
  success: boolean;

  /** Action taken: 'inserted', 'skipped' (duplicate), 'error' */
  action: 'inserted' | 'skipped' | 'error';

  /** Database ID if inserted */
  id?: string;

  /** Generated slug if inserted */
  slug?: string;

  /** Error message if failed */
  error?: string;

  /** Reason if skipped */
  skipReason?: string;
}

/**
 * Summary of an entire import batch.
 */
export interface ImportSummary {
  /** Unique ID for this import batch */
  batchId: string;

  /** When the import started */
  startedAt: Date;

  /** When the import finished */
  finishedAt: Date;

  /** Total rows processed */
  totalRows: number;

  /** Successfully inserted */
  inserted: number;

  /** Skipped (duplicates or invalid) */
  skipped: number;

  /** Failed with errors */
  errors: number;

  /** List of all results */
  results: VenueImportResult[];
}

// ============================================================================
// IMPORT OPTIONS
// ============================================================================

/**
 * Options for the import process.
 */
export interface ImportOptions {
  /** Path to CSV file */
  csvPath: string;

  /** Whether to run in dry-run mode (no database writes) */
  dryRun: boolean;

  /** Maximum venues to import (for testing) */
  limit?: number;

  /** Skip venues with missing required fields */
  skipInvalid: boolean;

  /** Update existing venues if found by google_place_id */
  updateExisting: boolean;
}
