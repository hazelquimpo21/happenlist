/**
 * LOGOUT ROUTE
 * ============
 * Signs out the current user and redirects to home.
 *
 * ROUTE: /auth/logout
 *
 * This is a server-side route that:
 * 1. Signs out the user from Supabase
 * 2. Clears the session cookie
 * 3. Redirects to home page
 *
 * USAGE:
 *   Navigate to /auth/logout to sign out
 *   Or call signOut() from the auth context (preferred)
 *
 * @module app/auth/logout/route
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createLogger } from '@/lib/utils/logger';

// ============================================================================
// LOGGER
// ============================================================================

const logger = createLogger('AuthLogout');

// ============================================================================
// ROUTE HANDLER
// ============================================================================

/**
 * GET /auth/logout
 *
 * Sign out the current user and redirect to home.
 */
export async function GET(request: NextRequest) {
  const timer = logger.time('signOut');

  try {
    const supabase = await createClient();

    // Get current user before signing out (for logging)
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      logger.info('Signing out user', { metadata: { email: user.email } });
    }

    // Sign out
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.warn('Sign out had an error', { metadata: { error: error.message } });
      // Still redirect home even if there was an error
    } else {
      timer.success('User signed out');
      logger.success('👋 User signed out successfully');
    }

  } catch (error) {
    timer.error('Unexpected error during sign out', error);
    // Still redirect home
  }

  // Always redirect to home
  return NextResponse.redirect(new URL('/', request.url));
}

/**
 * POST /auth/logout
 *
 * Alternative POST method for form submissions or fetch calls.
 */
export async function POST(request: NextRequest) {
  // Just delegate to GET handler
  return GET(request);
}
