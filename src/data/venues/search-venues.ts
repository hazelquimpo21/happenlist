/**
 * SEARCH VENUES (SMART)
 * =====================
 * Fuzzy venue search using PostgreSQL pg_trgm extension.
 *
 * This function uses the `search_venues` PostgreSQL function which provides:
 *   • Fuzzy matching with typo tolerance
 *   • Full-text search
 *   • Address matching
 *   • Similarity scoring
 *
 * @module data/venues/search-venues
 */

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Venue search result with similarity scoring.
 */
export interface VenueSearchResult {
  id: string;
  name: string;
  address_line: string | null;
  city: string;
  state: string | null;
  venue_type: string;
  google_category: string | null;
  rating: number | null;
  review_count: number;
  latitude: number | null;
  longitude: number | null;
  similarity_score: number;
}

interface SearchVenuesParams {
  /** Search query */
  query: string;

  /** Maximum results to return (default: 20) */
  limit?: number;
}

// ============================================================================
// SEARCH FUNCTION
// ============================================================================

/**
 * Searches venues using fuzzy matching.
 *
 * Uses the PostgreSQL `search_venues` function for intelligent matching:
 *   - Exact name matches prioritized
 *   - Fuzzy matching for typos (e.g., "pabts" → "Pabst Theater")
 *   - Full-text search for partial matches
 *   - Address matching
 *
 * @example
 * const results = await searchVenues({ query: 'pabst', limit: 10 });
 * // Returns venues like "The Pabst Theater" with similarity scores
 *
 * @param params - Search parameters
 * @returns Array of venues with similarity scores
 */
export async function searchVenues(
  params: SearchVenuesParams
): Promise<VenueSearchResult[]> {
  const { query, limit = 20 } = params;

  // 🔍 Validate query
  if (!query || query.trim().length < 2) {
    console.log('🏛️ [searchVenues] Query too short, returning empty');
    return [];
  }

  const cleanQuery = query.trim();
  console.log(`🏛️ [searchVenues] Searching for: "${cleanQuery}" (limit: ${limit})`);

  const supabase = await createClient();

  try {
    // Call the PostgreSQL search_venues function
    // This uses pg_trgm for fuzzy matching and full-text search
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('search_venues', {
      search_query: cleanQuery,
      result_limit: limit,
    });

    if (error) {
      // If the function doesn't exist, fall back to simple search
      if (error.code === '42883') {
        console.warn('🏛️ [searchVenues] search_venues function not found, using fallback');
        return searchVenuesFallback({ query: cleanQuery, limit });
      }

      console.error('❌ [searchVenues] Error:', error);
      throw error;
    }

    const results = (data || []) as VenueSearchResult[];

    console.log(`✅ [searchVenues] Found ${results.length} venues`);
    if (results.length > 0) {
      console.log(`   📍 Top result: "${results[0].name}" (score: ${results[0].similarity_score?.toFixed(2)})`);
    }

    return results;
  } catch (error) {
    console.error('❌ [searchVenues] Unexpected error:', error);
    // Fall back to simple search on any error
    return searchVenuesFallback({ query: cleanQuery, limit });
  }
}

// ============================================================================
// FALLBACK (SIMPLE SEARCH)
// ============================================================================

/**
 * Fallback search using simple ILIKE matching.
 * Used when the search_venues PostgreSQL function is not available.
 */
async function searchVenuesFallback(
  params: SearchVenuesParams
): Promise<VenueSearchResult[]> {
  const { query, limit = 20 } = params;

  console.log(`🏛️ [searchVenuesFallback] Using simple search for: "${query}"`);

  const supabase = await createClient();

  // Sanitize query for use in PostgREST filter strings by escaping
  // special characters that could alter filter syntax (commas, dots, parens).
  const sanitized = query.replace(/[,().%_\\]/g, (c) => `\\${c}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('locations')
    .select(`
      id,
      name,
      address_line,
      city,
      state,
      venue_type,
      google_category,
      rating,
      review_count,
      latitude,
      longitude
    `)
    .eq('is_active', true)
    .or(`name.ilike.%${sanitized}%,address_line.ilike.%${sanitized}%`)
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error('❌ [searchVenuesFallback] Error:', error);
    throw error;
  }

  // Add a dummy similarity score for fallback results
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: VenueSearchResult[] = ((data || []) as any[]).map((venue) => ({
    ...venue,
    similarity_score: 0.5, // Dummy score for fallback
  }));

  console.log(`✅ [searchVenuesFallback] Found ${results.length} venues`);

  return results;
}

// ============================================================================
// GET POPULAR VENUES
// ============================================================================

/**
 * Gets popular venues based on rating and review count.
 * Useful for showing quick-select options in the location picker.
 *
 * @param limit - Maximum venues to return (default: 12)
 * @returns Array of popular venues
 */
/**
 * Gets a single venue by ID.
 * Used to restore a selected venue when returning to Step 4 from a saved draft.
 */
export async function getVenueById(
  id: string
): Promise<VenueSearchResult | null> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('locations')
    .select(`
      id,
      name,
      address_line,
      city,
      state,
      venue_type,
      google_category,
      rating,
      review_count,
      latitude,
      longitude
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('❌ [getVenueById] Error:', error);
    return null;
  }

  return { ...(data as Record<string, unknown>), similarity_score: 0 } as VenueSearchResult;
}

/**
 * Gets popular venues based on rating and review count.
 * Useful for showing quick-select options in the location picker.
 *
 * @param limit - Maximum venues to return (default: 12)
 * @returns Array of popular venues
 */
export async function getPopularVenues(
  limit: number = 12
): Promise<VenueSearchResult[]> {
  console.log(`🏛️ [getPopularVenues] Fetching top ${limit} venues`);

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('locations')
    .select(`
      id,
      name,
      address_line,
      city,
      state,
      venue_type,
      google_category,
      rating,
      review_count,
      latitude,
      longitude
    `)
    .eq('is_active', true)
    .not('rating', 'is', null)
    .order('rating', { ascending: false })
    .order('review_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('❌ [getPopularVenues] Error:', error);
    throw error;
  }

  // Add similarity score of 0 for popular venues (not from search)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: VenueSearchResult[] = ((data || []) as any[]).map((venue) => ({
    ...venue,
    similarity_score: 0,
  }));

  console.log(`✅ [getPopularVenues] Found ${results.length} popular venues`);

  return results;
}
