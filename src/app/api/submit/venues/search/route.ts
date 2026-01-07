/**
 * VENUE SEARCH API ROUTE
 * ======================
 * API route for searching venues with fuzzy matching.
 *
 * Features:
 *   • Fuzzy search using PostgreSQL pg_trgm
 *   • Similarity scoring for result ranking
 *   • Falls back to simple ILIKE if search_venues unavailable
 *   • Returns popular venues when no query provided
 *
 * GET /api/submit/venues/search?q=query&limit=20
 *
 * @module api/submit/venues/search
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchVenues, getPopularVenues } from '@/data/venues';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('API.Venues');

// ============================================================================
// GET - Search Venues
// ============================================================================

export async function GET(request: NextRequest) {
  const timer = logger.time('GET /api/submit/venues/search');

  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // 📝 Log the search request
    console.log(`🏛️ [VenueSearchAPI] Query: "${query}", Limit: ${limit}`);

    let venues;

    // If no query, return popular venues
    if (!query.trim()) {
      console.log('🏛️ [VenueSearchAPI] No query, returning popular venues');
      venues = await getPopularVenues(limit);
    } else {
      // Search venues with fuzzy matching
      venues = await searchVenues({
        query: query.trim(),
        limit,
      });
    }

    timer.success(`Found ${venues.length} venues for "${query}"`);

    return NextResponse.json({
      success: true,
      venues,
      query: query.trim(),
      count: venues.length,
    });
  } catch (error) {
    // 🚨 Log and return error
    console.error('❌ [VenueSearchAPI] Error:', error);
    timer.error('Unexpected error', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search venues',
        venues: [],
      },
      { status: 500 }
    );
  }
}
