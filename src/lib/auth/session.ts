/**
 * SESSION MANAGEMENT
 * ==================
 * Utilities for managing user sessions with Supabase Auth.
 *
 * @module lib/auth/session
 */

import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { isAdmin } from './is-admin';
import { isSuperAdmin } from './is-superadmin';

const logger = createLogger('Auth');

// ============================================================================
// TYPES
// ============================================================================

/**
 * User session information
 */
export interface UserSession {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
}

/**
 * Result of getting session
 */
export interface SessionResult {
  session: UserSession | null;
  error: string | null;
}

// ============================================================================
// SESSION FUNCTIONS
// ============================================================================

/**
 * Get the current user session from Supabase
 *
 * @returns User session if logged in, null otherwise
 *
 * @example
 * ```ts
 * const { session, error } = await getSession();
 * if (session) {
 *   console.log(`Logged in as ${session.email}`);
 * }
 * ```
 */
export async function getSession(): Promise<SessionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      logger.debug('No active session', { metadata: { error: error.message } });
      return { session: null, error: null };
    }

    if (!user) {
      return { session: null, error: null };
    }

    // Get user metadata for name
    const name = user.user_metadata?.name || user.user_metadata?.full_name || null;

    const session: UserSession = {
      id: user.id,
      email: user.email!,
      name,
      isAdmin: isAdmin(user.email),
      isSuperAdmin: isSuperAdmin(user.email),
      createdAt: user.created_at,
    };

    logger.debug('Session retrieved', {
      metadata: { email: session.email, isAdmin: session.isAdmin },
    });

    return { session, error: null };
  } catch (error) {
    logger.error('Failed to get session', error);
    return {
      session: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Require authentication - throws if not logged in
 *
 * @returns User session
 * @throws Error if not authenticated
 *
 * @example
 * ```ts
 * const session = await requireAuth();
 * // Continue with authenticated operation
 * ```
 */
export async function requireAuth(): Promise<UserSession> {
  const { session, error } = await getSession();

  if (error) {
    throw new Error(`Authentication error: ${error}`);
  }

  if (!session) {
    throw new Error('Authentication required');
  }

  return session;
}

/**
 * Require admin authentication - throws if not admin
 *
 * @returns Admin user session
 * @throws Error if not authenticated or not admin
 *
 * @example
 * ```ts
 * const session = await requireAdminAuth();
 * // Continue with admin-only operation
 * ```
 */
export async function requireAdminAuth(): Promise<UserSession> {
  const session = await requireAuth();

  if (!session.isAdmin) {
    logger.warn('Non-admin attempted admin action', {
      metadata: { email: session.email },
    });
    throw new Error('Admin access required');
  }

  return session;
}

/**
 * Require superadmin authentication - throws if not superadmin
 *
 * @returns Superadmin user session
 * @throws Error if not authenticated or not superadmin
 *
 * @example
 * ```ts
 * const session = await requireSuperadminAuth();
 * // Continue with superadmin-only operation (edit any event, etc.)
 * ```
 */
export async function requireSuperadminAuth(): Promise<UserSession> {
  const session = await requireAuth();

  if (!session.isSuperAdmin) {
    logger.warn('🦸 Non-superadmin attempted superadmin action', {
      metadata: { email: session.email },
    });
    throw new Error('Superadmin access required');
  }

  logger.info('🦸 Superadmin access granted', {
    metadata: { email: session.email },
  });

  return session;
}

/**
 * Get user session with optional admin check
 *
 * @param requireAdminAccess - If true, throws if not admin
 * @returns User session
 *
 * @example
 * ```ts
 * const session = await getAuthenticatedSession(true);
 * // User is guaranteed to be admin
 * ```
 */
export async function getAuthenticatedSession(
  requireAdminAccess: boolean = false
): Promise<UserSession> {
  if (requireAdminAccess) {
    return requireAdminAuth();
  }
  return requireAuth();
}

// ============================================================================
// AUTH ACTIONS
// ============================================================================

/**
 * Sign in with magic link
 *
 * @param email - Email address to send magic link to
 * @param redirectTo - URL to redirect after auth
 * @returns Success status
 *
 * @example
 * ```ts
 * const result = await signInWithMagicLink('user@example.com', '/submit/new');
 * if (result.success) {
 *   // Show "check your email" message
 * }
 * ```
 */
export async function signInWithMagicLink(
  email: string,
  redirectTo?: string
): Promise<{ success: boolean; error: string | null }> {
  const timer = logger.time('signInWithMagicLink');

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo || `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      timer.error('Failed to send magic link', error);
      return { success: false, error: error.message };
    }

    timer.success('Magic link sent');
    return { success: true, error: null };
  } catch (error) {
    timer.error('Unexpected error', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sign out the current user
 *
 * @returns Success status
 */
export async function signOut(): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error('Sign out failed', error);
      return { success: false, error: error.message };
    }

    logger.info('User signed out');
    return { success: true, error: null };
  } catch (error) {
    logger.error('Unexpected sign out error', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
