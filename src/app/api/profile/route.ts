/**
 * PROFILE API ROUTE
 * =================
 * API endpoints for managing the current user's profile.
 *
 * ENDPOINTS:
 *   GET   /api/profile - Get current user's profile
 *   PATCH /api/profile - Update current user's profile
 *
 * 🔒 AUTHENTICATION: Required for all endpoints
 *
 * @module app/api/profile/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProfile, updateProfile } from '@/data/user';
import { createLogger } from '@/lib/utils/logger';
import type { ProfileUpdateData } from '@/types/user';

// ============================================================================
// LOGGER
// ============================================================================

const logger = createLogger('ProfileAPI');

// ============================================================================
// GET: FETCH PROFILE
// ============================================================================

/**
 * Get the current user's profile
 *
 * @example
 * ```ts
 * GET /api/profile
 *
 * // Response
 * {
 *   "success": true,
 *   "profile": {
 *     "id": "...",
 *     "display_name": "Jane Doe",
 *     "email": "jane@example.com",
 *     ...
 *   }
 * }
 * ```
 */
export async function GET() {
  const timer = logger.time('GET /api/profile');

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
          error: 'Please sign in to view your profile',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // -------------------------------------------------------------------------
    // 2. FETCH PROFILE
    // -------------------------------------------------------------------------

    const result = await getProfile(user.id);

    if (!result.success) {
      timer.error('Fetch failed');
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch profile',
          code: 'FETCH_FAILED',
        },
        { status: 500 }
      );
    }

    // -------------------------------------------------------------------------
    // 3. RETURN PROFILE
    // -------------------------------------------------------------------------

    timer.success('Profile fetched');

    return NextResponse.json({
      success: true,
      profile: result.profile,
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
// PATCH: UPDATE PROFILE
// ============================================================================

/**
 * Update the current user's profile
 *
 * @example
 * ```ts
 * PATCH /api/profile
 * {
 *   "display_name": "Jane Doe",
 *   "email_notifications": true
 * }
 *
 * // Response
 * {
 *   "success": true,
 *   "profile": {...}
 * }
 * ```
 */
export async function PATCH(request: NextRequest) {
  const timer = logger.time('PATCH /api/profile');

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
          error: 'Please sign in to update your profile',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // -------------------------------------------------------------------------
    // 2. PARSE REQUEST BODY
    // -------------------------------------------------------------------------

    let body: ProfileUpdateData;

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

    if (!body || Object.keys(body).length === 0) {
      logger.warn('Empty body');
      timer.error('Empty body');
      return NextResponse.json(
        {
          success: false,
          error: 'No data to update',
          code: 'EMPTY_BODY',
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------------------
    // 3. UPDATE PROFILE
    // -------------------------------------------------------------------------

    logger.debug('Updating profile', {
      metadata: {
        userId: user.id.slice(0, 8) + '...',
        fields: Object.keys(body),
      },
    });

    const result = await updateProfile(user.id, body);

    if (!result.success) {
      timer.error('Update failed');
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to update profile',
          code: 'UPDATE_FAILED',
        },
        { status: 500 }
      );
    }

    // -------------------------------------------------------------------------
    // 4. RETURN UPDATED PROFILE
    // -------------------------------------------------------------------------

    timer.success('Profile updated');

    return NextResponse.json({
      success: true,
      profile: result.profile,
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
