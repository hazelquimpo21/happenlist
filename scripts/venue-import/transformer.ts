/**
 * VENUE TRANSFORMER
 * =================
 * Transforms raw CSV rows into clean database records.
 *
 * Handles:
 *   • Field mapping (CSV columns → database columns)
 *   • Data cleaning (trim whitespace, normalize values)
 *   • Type conversions (strings → numbers, JSON parsing)
 *   • Venue type inference from Google category
 *
 * Usage:
 *   const transformer = new VenueTransformer(slugGenerator, batchId);
 *   const record = transformer.transform(csvRow);
 *
 * @module scripts/venue-import/transformer
 */

import type { CsvRow, VenueRecord } from './types';
import { SlugGenerator } from './slug-generator';

// ============================================================================
// VENUE TYPE MAPPING
// ============================================================================

/**
 * Maps Google categories to our venue types.
 * The venue_type field uses a smaller set of categories for filtering.
 */
const CATEGORY_TO_VENUE_TYPE: Record<string, string> = {
  // Entertainment
  'music venue': 'entertainment',
  'concert hall': 'entertainment',
  'night club': 'entertainment',
  bar: 'entertainment',
  pub: 'entertainment',
  brewery: 'entertainment',
  'comedy club': 'entertainment',
  casino: 'entertainment',

  // Arts & Culture
  museum: 'arts',
  'art gallery': 'arts',
  theater: 'arts',
  'performing arts theater': 'arts',
  'movie theater': 'arts',
  library: 'arts',

  // Sports & Recreation
  stadium: 'sports',
  arena: 'sports',
  gym: 'sports',
  'fitness center': 'sports',
  'sports complex': 'sports',
  'bowling alley': 'sports',
  park: 'outdoor',
  'dog park': 'outdoor',
  'golf course': 'sports',

  // Food & Drink
  restaurant: 'restaurant',
  cafe: 'restaurant',
  'coffee shop': 'restaurant',
  bakery: 'restaurant',
  'ice cream shop': 'restaurant',

  // Community
  'community center': 'community',
  church: 'community',
  'event venue': 'venue',
  'banquet hall': 'venue',
  'wedding venue': 'venue',
  'convention center': 'venue',
  hotel: 'venue',

  // Education
  school: 'education',
  university: 'education',
  college: 'education',

  // Default
  default: 'venue',
};

/**
 * Infers venue type from Google category.
 *
 * @param category - Google category string
 * @returns Our venue type
 */
function inferVenueType(category: string): string {
  if (!category) return 'venue';

  const lowerCategory = category.toLowerCase().trim();

  // Check for exact matches first
  if (CATEGORY_TO_VENUE_TYPE[lowerCategory]) {
    return CATEGORY_TO_VENUE_TYPE[lowerCategory];
  }

  // Check for partial matches
  for (const [key, type] of Object.entries(CATEGORY_TO_VENUE_TYPE)) {
    if (lowerCategory.includes(key) || key.includes(lowerCategory)) {
      return type;
    }
  }

  return 'venue';
}

// ============================================================================
// DATA CLEANING HELPERS
// ============================================================================

/**
 * Safely parses a string to a float.
 * Returns null if parsing fails.
 */
function parseFloat(value: string): number | null {
  if (!value || value.trim() === '') return null;
  const num = Number.parseFloat(value);
  return Number.isNaN(num) ? null : num;
}

/**
 * Safely parses a string to an integer.
 * Returns 0 if parsing fails.
 */
function parseInt(value: string): number {
  if (!value || value.trim() === '') return 0;
  const num = Number.parseInt(value, 10);
  return Number.isNaN(num) ? 0 : num;
}

/**
 * Cleans a phone number string.
 * Removes common formatting characters.
 */
function cleanPhone(phone: string): string | null {
  if (!phone || phone.trim() === '') return null;
  // Keep the original format for now, just trim
  return phone.trim() || null;
}

/**
 * Cleans a URL string.
 * Adds https:// if missing, validates format.
 */
function cleanUrl(url: string): string | null {
  if (!url || url.trim() === '') return null;

  let cleaned = url.trim();

  // Skip obviously invalid URLs
  if (cleaned === 'None' || cleaned === 'null' || cleaned === 'undefined') {
    return null;
  }

  // Add https:// if missing
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }

  return cleaned;
}

/**
 * Parses working hours JSON string.
 * Returns null if parsing fails.
 */
function parseWorkingHours(hoursStr: string): Record<string, string> | null {
  if (!hoursStr || hoursStr.trim() === '' || hoursStr === 'None') {
    return null;
  }

  try {
    // The CSV has hours as JSON like {"Sunday": "6AM-10PM", ...}
    const parsed = JSON.parse(hoursStr);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, string>;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Cleans and normalizes a state value.
 * Handles both full names and abbreviations.
 */
function cleanState(state: string, usState: string): string | null {
  // Prefer us_state (abbreviation) if available
  if (usState && usState.trim() && usState !== 'None') {
    // Extract abbreviation if it's the full name
    const cleaned = usState.trim();
    if (cleaned.toLowerCase() === 'wisconsin') return 'WI';
    return cleaned;
  }

  if (state && state.trim() && state !== 'None') {
    const cleaned = state.trim();
    if (cleaned.toLowerCase() === 'wisconsin') return 'WI';
    return cleaned;
  }

  return null;
}

// ============================================================================
// TRANSFORMER CLASS
// ============================================================================

/**
 * Transforms CSV rows into database records.
 */
export class VenueTransformer {
  private slugGenerator: SlugGenerator;
  private batchId: string;
  private transformedCount = 0;

  constructor(slugGenerator: SlugGenerator, batchId: string) {
    this.slugGenerator = slugGenerator;
    this.batchId = batchId;
  }

  /**
   * Cleans and validates a neighborhood/borough value.
   * Returns null if the value is empty, "None", or not meaningful.
   *
   * @param borough - Raw borough value from CSV
   * @returns Cleaned neighborhood string or null
   */
  private cleanNeighborhood(borough: string): string | null {
    if (!borough) return null;

    const cleaned = borough.trim();

    // Skip invalid values
    if (
      cleaned === '' ||
      cleaned.toLowerCase() === 'none' ||
      cleaned.toLowerCase() === 'null' ||
      cleaned.toLowerCase() === 'undefined'
    ) {
      return null;
    }

    return cleaned;
  }

  /**
   * Transforms a single CSV row into a VenueRecord.
   *
   * @param row - Raw CSV row
   * @returns Cleaned VenueRecord ready for database
   */
  transform(row: CsvRow): VenueRecord {
    this.transformedCount++;

    // Clean neighborhood (borough field from CSV)
    const neighborhood = this.cleanNeighborhood(row.borough);

    // Generate unique slug with city and neighborhood
    // Format: venue-name-neighborhood-city
    const slug = this.slugGenerator.generate(row.name, row.city, neighborhood);

    // Build the venue record
    const record: VenueRecord = {
      // Core identification
      name: row.name.trim(),
      slug,

      // Address fields
      address_line: row.street?.trim() || null,
      city: row.city.trim(),
      state: cleanState(row.state, row.us_state),
      postal_code: row.postal_code?.trim() || null,
      country: row.country_code?.trim() || 'US',

      // Coordinates
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),

      // Classification
      venue_type: inferVenueType(row.category || row.type),
      category: row.category?.trim() || null,

      // Contact
      website_url: cleanUrl(row.site),
      phone: cleanPhone(row.phone),

      // Images - store the Google photo URL
      external_image_url: cleanUrl(row.photo),

      // Google data
      google_place_id: row.place_id?.trim() || null,
      rating: parseFloat(row.rating),
      review_count: parseInt(row.reviews),
      working_hours: parseWorkingHours(row.working_hours),

      // Import metadata
      source: 'csv_import',
      import_batch_id: this.batchId,
      is_active: true,
    };

    return record;
  }

  /**
   * Transforms multiple rows.
   *
   * @param rows - Array of CSV rows
   * @returns Array of VenueRecords
   */
  transformMany(rows: CsvRow[]): VenueRecord[] {
    console.log(`\n🔄 Transforming ${rows.length} venues...`);

    const records = rows.map((row) => this.transform(row));

    console.log(`✅ Transformed ${records.length} venues`);

    return records;
  }

  /**
   * Gets the count of transformed records.
   */
  get count(): number {
    return this.transformedCount;
  }
}
