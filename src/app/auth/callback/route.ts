/**
 * AUTH CALLBACK ROUTE
 * ===================
 * Handles magic link authentication from Supabase.
 *
 * ROUTE: /auth/callback
 *
 * FLOW:
 * 1. User clicks magic link in email
 * 2. Supabase redirects here with auth code or token
 * 3. This route exchanges code/token for session
 * 4. Redirects to intended destination or home
 *
 * QUERY PARAMS (from Supabase):
 *   ?code=xxx           - PKCE auth code (primary method)
 *   ?token_hash=xxx     - OTP token (fallback method)
 *   ?type=magiclink     - Auth type (with token_hash)
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
 * Process the magic link and establish a session.
 * Handles both PKCE code exchange and OTP token verification.
 */
export async function GET(request: NextRequest) {
  const timer = logger.time('processAuthCallback');

  try {
    // -------------------------------------------------------------------------
    // 1. PARSE URL PARAMS
    // -------------------------------------------------------------------------

    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const token_hash = requestUrl.searchParams.get('token_hash');
    const type = requestUrl.searchParams.get('type');
    const next = requestUrl.searchParams.get('next') ?? '/';
    const errorParam = requestUrl.searchParams.get('error');
    const errorDescription = requestUrl.searchParams.get('error_description');

    logger.debug('Auth callback received', {
      metadata: {
        hasCode: !!code,
        hasToken: !!token_hash,
        type,
        next,
        error: errorParam,
      },
    });

    // -------------------------------------------------------------------------
    // 2. CHECK FOR ERROR FROM SUPABASE
    // -------------------------------------------------------------------------

    if (errorParam) {
      logger.warn('Supabase returned an error', {
        metadata: { error: errorParam, description: errorDescription },
      });
      timer.error('Supabase error');
      return NextResponse.redirect(
        new URL(`/auth/login?error=${errorParam}`, request.url)
      );
    }

    // -------------------------------------------------------------------------
    // 3. EXCHANGE CODE FOR SESSION (PKCE Flow - Primary)
    // -------------------------------------------------------------------------

    const supabase = await createClient();

    if (code) {
      logger.debug('Exchanging PKCE code for session');

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        logger.warn('Code exchange failed', {
          metadata: { error: error.message },
        });
        timer.error('Code exchange failed', error);

        let errorCode = 'invalid_token';
        if (error.message.includes('expired')) {
          errorCode = 'expired_token';
        } else if (error.message.includes('already')) {
          errorCode = 'already_used';
        }

        return NextResponse.redirect(
          new URL(`/auth/login?error=${errorCode}`, request.url)
        );
      }

      timer.success('PKCE code exchanged successfully', { metadata: { next } });
      logger.success('🎉 User authenticated via magic link (PKCE)', {
        metadata: { redirectTo: next },
      });

      return NextResponse.redirect(new URL(next, request.url));
    }

    // -------------------------------------------------------------------------
    // 4. VERIFY OTP TOKEN (Fallback for non-PKCE)
    // -------------------------------------------------------------------------

    if (token_hash && type) {
      logger.debug('Verifying OTP token');

      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as 'signup' | 'magiclink' | 'recovery' | 'email_change' | 'email',
      });

      if (error) {
        let errorCode = 'invalid_token';
        if (error.message.includes('expired')) {
          errorCode = 'expired_token';
        } else if (error.message.includes('already used')) {
          errorCode = 'already_used';
        }

        logger.warn('Token verification failed', {
          metadata: { error: error.message, errorCode },
        });
        timer.error('Token verification failed', error);

        return NextResponse.redirect(
          new URL(`/auth/login?error=${errorCode}`, request.url)
        );
      }

      timer.success('OTP verified successfully', { metadata: { next } });
      logger.success('🎉 User authenticated via magic link (OTP)', {
        metadata: { redirectTo: next },
      });

      return NextResponse.redirect(new URL(next, request.url));
    }

    // -------------------------------------------------------------------------
    // 5. NO VALID AUTH PARAMS
    // -------------------------------------------------------------------------

    logger.warn('No valid auth params in callback');
    timer.error('Missing auth params');

    return NextResponse.redirect(
      new URL('/auth/login?error=invalid_token', request.url)
    );

  } catch (error) {
    // -------------------------------------------------------------------------
    // 6. UNEXPECTED ERROR
    // -------------------------------------------------------------------------

    timer.error('Unexpected error in auth callback', error);

    return NextResponse.redirect(
      new URL('/auth/login?error=server_error', request.url)
    );
  }
}
