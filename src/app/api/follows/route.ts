/**
 * FOLLOWS API ROUTE
 * =================
 * API endpoints for managing user follows (organizers, venues, categories).
 *
 * ENDPOINTS:
 *   POST /api/follows - Toggle follow on an entity
 *   GET  /api/follows - Get user's follows
 *
 * 🔒 AUTHENTICATION: Required for all endpoints
 *
 * @module app/api/follows/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { toggleFollow, getFollows, checkFollow } from '@/data/user';
import type { FollowEntityType } from '@/data/user';
import { createLogger } from '@/lib/utils/logger';

// ============================================================================
// LOGGER
// ============================================================================

const logger = createLogger('FollowsAPI');

// ============================================================================
// TYPES
// ============================================================================

/**
 * Request body for POST /api/follows
 */
interface ToggleFollowBody {
  entityType: FollowEntityType;
  entityId: string;
  notifyNewEvents?: boolean;
}

/**
 * Query params for GET /api/follows
 */
interface GetFollowsQuery {
  /** Filter by entity type */
  entityType?: FollowEntityType;
  /** Check specific entity */
  checkEntityType?: FollowEntityType;
  checkEntityId?: string;
  /** Pagination */
  limit?: string;
  offset?: string;
}

// ============================================================================
// POST: TOGGLE FOLLOW
// ============================================================================

/**
 * Toggle follow on an entity (add if not following, remove if following)
 *
 * @example
 * ```ts
 * POST /api/follows
 * {
 *   "entityType": "organizer",
 *   "entityId": "org-123"
 * }
 *
 * // Response
 * {
 *   "success": true,
 *   "following": true
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  const timer = logger.time('POST /api/follows');

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
          error: 'Please sign in to follow',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // -------------------------------------------------------------------------
    // 2. PARSE REQUEST BODY
    // -------------------------------------------------------------------------

    let body: ToggleFollowBody;

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

    const { entityType, entityId, notifyNewEvents } = body;

    // Validate entity type
    if (!['organizer', 'venue', 'category'].includes(entityType)) {
      logger.warn('Invalid entity type', { metadata: { entityType } });
      timer.error('Invalid entity type');
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid entity type',
          code: 'INVALID_ENTITY_TYPE',
        },
        { status: 400 }
      );
    }

    if (!entityId || typeof entityId !== 'string') {
      logger.warn('Missing entityId');
      timer.error('Missing entityId');
      return NextResponse.json(
        {
          success: false,
          error: 'Entity ID is required',
          code: 'MISSING_ENTITY_ID',
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------------------
    // 3. TOGGLE FOLLOW
    // -------------------------------------------------------------------------

    logger.debug('Toggling follow', {
      metadata: {
        userId: user.id.slice(0, 8) + '...',
        entityType,
        entityId,
      },
    });

    const result = await toggleFollow({
      userId: user.id,
      entityType,
      entityId,
      notifyNewEvents: notifyNewEvents ?? true,
    });

    if (!result.success) {
      logger.error('Toggle failed', { metadata: { error: result.error } });
      timer.error('Toggle failed');
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to toggle follow',
          code: 'TOGGLE_FAILED',
        },
        { status: 500 }
      );
    }

    // -------------------------------------------------------------------------
    // 4. RETURN SUCCESS
    // -------------------------------------------------------------------------

    timer.success(result.following ? 'Now following' : 'Unfollowed', {
      metadata: { entityType },
    });

    return NextResponse.json({
      success: true,
      following: result.following,
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
// GET: FETCH FOLLOWS
// ============================================================================

/**
 * Get user's follows or check if following specific entity
 *
 * @example Check if following
 * ```ts
 * GET /api/follows?checkEntityType=organizer&checkEntityId=org-123
 *
 * // Response
 * { "success": true, "following": true }
 * ```
 *
 * @example Get all follows
 * ```ts
 * GET /api/follows?entityType=organizer
 *
 * // Response
 * {
 *   "success": true,
 *   "follows": [...],
 *   "total": 5
 * }
 * ```
 */
export async function GET(request: NextRequest) {
  const timer = logger.time('GET /api/follows');

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
          error: 'Please sign in to view follows',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // -------------------------------------------------------------------------
    // 2. PARSE QUERY PARAMS
    // -------------------------------------------------------------------------

    const url = new URL(request.url);
    const params: GetFollowsQuery = {
      entityType: url.searchParams.get('entityType') as FollowEntityType | undefined,
      checkEntityType: url.searchParams.get('checkEntityType') as FollowEntityType | undefined,
      checkEntityId: url.searchParams.get('checkEntityId') || undefined,
      limit: url.searchParams.get('limit') || undefined,
      offset: url.searchParams.get('offset') || undefined,
    };

    // -------------------------------------------------------------------------
    // 3A. CHECK SPECIFIC ENTITY (if check params provided)
    // -------------------------------------------------------------------------

    if (params.checkEntityType && params.checkEntityId) {
      logger.debug('Checking follow status', {
        metadata: {
          entityType: params.checkEntityType,
          entityId: params.checkEntityId,
        },
      });

      const isFollowing = await checkFollow({
        userId: user.id,
        entityType: params.checkEntityType,
        entityId: params.checkEntityId,
      });

      timer.success('Follow check complete');

      return NextResponse.json({
        success: true,
        following: isFollowing,
      });
    }

    // -------------------------------------------------------------------------
    // 3B. GET ALL FOLLOWS
    // -------------------------------------------------------------------------

    const limit = params.limit ? parseInt(params.limit, 10) : 50;
    const offset = params.offset ? parseInt(params.offset, 10) : 0;

    logger.debug('Fetching follows', {
      metadata: { entityType: params.entityType || 'all', limit, offset },
    });

    const result = await getFollows({
      userId: user.id,
      entityType: params.entityType,
      limit,
      offset,
    });

    if (!result.success) {
      timer.error('Fetch failed');
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch follows',
          code: 'FETCH_FAILED',
        },
        { status: 500 }
      );
    }

    timer.success(`Fetched ${result.follows.length} follows`);

    return NextResponse.json({
      success: true,
      follows: result.follows,
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
