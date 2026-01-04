/**
 * AUTH CALLBACK ROUTE
 * ===================
 * Handles magic link authentication from Supabase.
 *
 * ROUTE: /auth/callback
 *
 * FLOW:
 * 1. User clicks magic link in email
 * 2. Link contains ?token_hash=xxx&type=magiclink
 * 3. This route exchanges token for session
 * 4. Redirects to intended destination or home
 *
 * QUERY PARAMS (from Supabase):
 *   ?token_hash=xxx     - One-time auth token
 *   ?type=magiclink     - Auth type
 *   ?next=/submit/new   - Where to redirect after (we set this)
 *
 * ERROR HANDLING:
 *   - Invalid token: Redirect to /auth/login?error=invalid_token
 *   - Expired token: Redirect to /auth/login?error=expired_token
 *   - Server error: Redirect to /auth/login?error=server_error
 *
 * @module app/auth/callback/route
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createLogger } from '@/lib/utils/logger';

// ============================================================================
// LOGGER
// ============================================================================

const logger = createLogger('AuthCallback');

// ============================================================================
// ROUTE HANDLER
// ============================================================================

/**
 * GET /auth/callback
 *
 * Process the magic link token and establish a session.
 */
export async function GET(request: NextRequest) {
  const timer = logger.time('processAuthCallback');

  try {
    // -------------------------------------------------------------------------
    // 1. PARSE URL PARAMS
    // -------------------------------------------------------------------------

    const requestUrl = new URL(request.url);
    const token_hash = requestUrl.searchParams.get('token_hash');
    const type = requestUrl.searchParams.get('type');
    const next = requestUrl.searchParams.get('next') ?? '/';

    logger.debug('Auth callback received', {
      metadata: {
        hasToken: !!token_hash,
        type,
        next,
      },
    });

    // -------------------------------------------------------------------------
    // 2. VALIDATE PARAMS
    // -------------------------------------------------------------------------

    if (!token_hash) {
      logger.warn('No token_hash in callback');
      timer.error('Missing token_hash');
      return NextResponse.redirect(
        new URL('/auth/login?error=invalid_token', request.url)
      );
    }

    if (!type) {
      logger.warn('No type in callback');
      timer.error('Missing type');
      return NextResponse.redirect(
        new URL('/auth/login?error=invalid_token', request.url)
      );
    }

    // -------------------------------------------------------------------------
    // 3. VERIFY TOKEN WITH SUPABASE
    // -------------------------------------------------------------------------

    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'magiclink' | 'recovery' | 'email_change' | 'email',
    });

    if (error) {
      // Determine error type
      let errorCode = 'invalid_token';

      if (error.message.includes('expired')) {
        errorCode = 'expired_token';
      } else if (error.message.includes('already used')) {
        errorCode = 'already_used';
      }

      logger.warn('Token verification failed', {
        metadata: {
          error: error.message,
          errorCode,
        },
      });

      timer.error('Token verification failed', error);

      return NextResponse.redirect(
        new URL(`/auth/login?error=${errorCode}`, request.url)
      );
    }

    // -------------------------------------------------------------------------
    // 4. SUCCESS! REDIRECT TO DESTINATION
    // -------------------------------------------------------------------------

    timer.success('Auth callback successful', { metadata: { next } });

    logger.success('🎉 User authenticated via magic link', {
      metadata: { redirectTo: next },
    });

    // Redirect to the intended destination
    return NextResponse.redirect(new URL(next, request.url));

  } catch (error) {
    // -------------------------------------------------------------------------
    // 5. UNEXPECTED ERROR
    // -------------------------------------------------------------------------

    timer.error('Unexpected error in auth callback', error);

    return NextResponse.redirect(
      new URL('/auth/login?error=server_error', request.url)
    );
  }
}
