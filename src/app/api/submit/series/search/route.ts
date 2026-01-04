/**
 * SERIES SEARCH API ROUTE
 * =========================
 * API route for searching series to link events to.
 *
 * GET /api/submit/series/search?q=query
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchSeries, getRecentSeries } from '@/data/submit';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('API.Submit');

// ============================================================================
// GET - Search Series
// ============================================================================

export async function GET(request: NextRequest) {
  const timer = logger.time('GET /api/submit/series/search');

  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const seriesType = searchParams.get('type') || undefined;
    const categoryId = searchParams.get('category') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    let result;

    // If no query, return recent series
    if (!query.trim()) {
      result = await getRecentSeries(limit);
    } else {
      result = await searchSeries({
        query: query.trim(),
        limit,
        seriesType,
        categoryId,
      });
    }

    if (!result.success) {
      timer.error('Search failed', new Error(result.error));
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    timer.success(`Found ${result.series?.length || 0} series`);

    return NextResponse.json({
      success: true,
      series: result.series,
      query: query.trim(),
    });
  } catch (error) {
    timer.error('Unexpected error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
