/**
 * HEARTS API ROUTE
 * ================
 * API endpoints for managing user's saved/hearted events.
 *
 * ENDPOINTS:
 *   POST /api/hearts - Toggle heart on an event
 *   GET  /api/hearts - Get user's hearted events or check status
 *
 * 🔒 AUTHENTICATION: Required for all endpoints
 *
 * @module app/api/hearts/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { toggleHeart, getHearts, checkHearts } from '@/data/user';
import { createLogger } from '@/lib/utils/logger';

// ============================================================================
// LOGGER
// ============================================================================

const logger = createLogger('HeartsAPI');

// ============================================================================
// TYPES
// ============================================================================

/**
 * Request body for POST /api/hearts
 */
interface ToggleHeartBody {
  eventId: string;
}

/**
 * Query params for GET /api/hearts
 */
interface GetHeartsQuery {
  /** Check specific event IDs (comma-separated) */
  eventIds?: string;
  /** Limit for pagination */
  limit?: string;
  /** Offset for pagination */
  offset?: string;
  /** Include past events (default: true) */
  includePast?: string;
}

// ============================================================================
// POST: TOGGLE HEART
// ============================================================================

/**
 * Toggle heart on an event (add if not hearted, remove if hearted)
 *
 * @example
 * ```ts
 * // Request
 * POST /api/hearts
 * { "eventId": "event-123" }
 *
 * // Response
 * {
 *   "success": true,
 *   "hearted": true,
 *   "heartCount": 42
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  const timer = logger.time('POST /api/hearts');

  try {
    // -------------------------------------------------------------------------
    // 1. CHECK AUTHENTICATION
    // -------------------------------------------------------------------------

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Unauthenticated request');
      timer.error('Unauthorized');
      return NextResponse.json(
        {
          success: false,
          error: 'Please sign in to save events',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // -------------------------------------------------------------------------
    // 2. PARSE REQUEST BODY
    // -------------------------------------------------------------------------

    let body: ToggleHeartBody;

    try {
      body = await request.json();
    } catch {
      logger.warn('Invalid JSON body');
      timer.error('Bad request');
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          code: 'INVALID_BODY',
        },
        { status: 400 }
      );
    }

    const { eventId } = body;

    if (!eventId || typeof eventId !== 'string') {
      logger.warn('Missing eventId in body');
      timer.error('Missing eventId');
      return NextResponse.json(
        {
          success: false,
          error: 'Event ID is required',
          code: 'MISSING_EVENT_ID',
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------------------
    // 3. TOGGLE HEART
    // -------------------------------------------------------------------------

    logger.debug('Toggling heart', {
      metadata: {
        userId: user.id.slice(0, 8) + '...',
        eventId,
      },
    });

    const result = await toggleHeart({
      userId: user.id,
      eventId,
    });

    if (!result.success) {
      logger.error('Toggle failed', { metadata: { error: result.error } });
      timer.error('Toggle failed');
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to toggle heart',
          code: 'TOGGLE_FAILED',
        },
        { status: 500 }
      );
    }

    // -------------------------------------------------------------------------
    // 4. RETURN SUCCESS
    // -------------------------------------------------------------------------

    timer.success(result.hearted ? 'Heart added' : 'Heart removed', {
      metadata: { heartCount: result.heartCount },
    });

    return NextResponse.json({
      success: true,
      hearted: result.hearted,
      heartCount: result.heartCount,
    });
  } catch (error) {
    timer.error('Unexpected error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Something went wrong',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET: FETCH HEARTS
// ============================================================================

/**
 * Get user's hearted events or check if specific events are hearted
 *
 * @example Check specific events
 * ```ts
 * GET /api/hearts?eventIds=a,b,c
 *
 * // Response
 * {
 *   "success": true,
 *   "hearts": { "a": true, "b": false, "c": true }
 * }
 * ```
 *
 * @example Get all hearted events
 * ```ts
 * GET /api/hearts?limit=20&offset=0
 *
 * // Response
 * {
 *   "success": true,
 *   "events": [...],
 *   "total": 42
 * }
 * ```
 */
export async function GET(request: NextRequest) {
  const timer = logger.time('GET /api/hearts');

  try {
    // -------------------------------------------------------------------------
    // 1. CHECK AUTHENTICATION
    // -------------------------------------------------------------------------

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Unauthenticated request');
      timer.error('Unauthorized');
      return NextResponse.json(
        {
          success: false,
          error: 'Please sign in to view saved events',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // -------------------------------------------------------------------------
    // 2. PARSE QUERY PARAMS
    // -------------------------------------------------------------------------

    const url = new URL(request.url);
    const params: GetHeartsQuery = {
      eventIds: url.searchParams.get('eventIds') || undefined,
      limit: url.searchParams.get('limit') || undefined,
      offset: url.searchParams.get('offset') || undefined,
      includePast: url.searchParams.get('includePast') || undefined,
    };

    // -------------------------------------------------------------------------
    // 3A. CHECK SPECIFIC EVENTS (if eventIds provided)
    // -------------------------------------------------------------------------

    if (params.eventIds) {
      const eventIds = params.eventIds.split(',').filter(Boolean);

      logger.debug('Checking heart status', {
        metadata: { eventCount: eventIds.length },
      });

      const result = await checkHearts({
        userId: user.id,
        eventIds,
      });

      if (!result.success) {
        timer.error('Check failed');
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'Failed to check hearts',
            code: 'CHECK_FAILED',
          },
          { status: 500 }
        );
      }

      timer.success(`Checked ${eventIds.length} events`);

      return NextResponse.json({
        success: true,
        hearts: result.hearts,
      });
    }

    // -------------------------------------------------------------------------
    // 3B. GET ALL HEARTED EVENTS
    // -------------------------------------------------------------------------

    const limit = params.limit ? parseInt(params.limit, 10) : 50;
    const offset = params.offset ? parseInt(params.offset, 10) : 0;
    const includePast = params.includePast !== 'false';

    logger.debug('Fetching hearts', {
      metadata: { limit, offset, includePast },
    });

    const result = await getHearts({
      userId: user.id,
      limit,
      offset,
      includePast,
    });

    if (!result.success) {
      timer.error('Fetch failed');
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch hearts',
          code: 'FETCH_FAILED',
        },
        { status: 500 }
      );
    }

    timer.success(`Fetched ${result.events.length} events`);

    return NextResponse.json({
      success: true,
      events: result.events,
      total: result.total,
    });
  } catch (error) {
    timer.error('Unexpected error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Something went wrong',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
