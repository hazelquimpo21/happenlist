/**
 * AUTH CONTEXT
 * ============
 * Provides authentication state to the entire app.
 *
 * This is the central hub for auth - it:
 * - Tracks if the user is logged in
 * - Provides the user session data
 * - Exposes signIn, signOut, refresh methods
 * - Listens for auth state changes
 *
 * USAGE:
 * ```tsx
 * // In any client component:
 * import { useAuth } from '@/hooks/use-auth';
 *
 * function MyComponent() {
 *   const { session, isLoading, signIn, signOut } = useAuth();
 *
 *   if (isLoading) return <Spinner />;
 *   if (!session) return <LoginButton />;
 *
 *   return <div>Hello, {session.name}!</div>;
 * }
 * ```
 *
 * @module contexts/auth-context
 */

'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import { isAdmin } from '@/lib/auth/is-admin';
import { createLogger } from '@/lib/utils/logger';
import type { AuthContextValue, UserSession } from '@/types/user';
import type { User } from '@supabase/supabase-js';

// ============================================================================
// LOGGER
// ============================================================================

const logger = createLogger('AuthContext');

// ============================================================================
// CONTEXT
// ============================================================================

/**
 * Auth context - provides session state to the app
 *
 * Use the `useAuth()` hook instead of this directly.
 */
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Build a UserSession from a Supabase user
 */
function buildUserSession(user: User): UserSession {
  const email = user.email ?? '';
  const name =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    email.split('@')[0] ||
    null;
  const avatarUrl = user.user_metadata?.avatar_url || null;

  // Determine role
  // TODO: In the future, check profiles table for organizer status
  const userIsAdmin = isAdmin(email);
  const role = userIsAdmin ? 'admin' : 'attendee';

  return {
    id: user.id,
    email,
    name,
    avatarUrl,
    role,
    isAdmin: userIsAdmin,
    organizerId: null, // TODO: Fetch from profiles/organizers
    createdAt: user.created_at,
  };
}

// ============================================================================
// PROVIDER PROPS
// ============================================================================

interface AuthProviderProps {
  /** App content */
  children: ReactNode;

  /** Optional initial session (from server render) */
  initialSession?: UserSession | null;
}

// ============================================================================
// AUTH PROVIDER COMPONENT
// ============================================================================

/**
 * AuthProvider - wrap your app with this to enable auth
 *
 * This component:
 * - Creates a Supabase client
 * - Listens for auth state changes
 * - Provides session to all child components
 * - Exposes signIn/signOut methods
 *
 * @example
 * ```tsx
 * // In your layout.tsx:
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <AuthProvider>
 *           {children}
 *         </AuthProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function AuthProvider({ children, initialSession = null }: AuthProviderProps) {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  const [session, setSession] = useState<UserSession | null>(initialSession);
  const [isLoading, setIsLoading] = useState(!initialSession);

  // Create Supabase client (browser-side)
  const supabase = useMemo(() => createClient(), []);

  // ---------------------------------------------------------------------------
  // SESSION MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Refresh session from Supabase
   */
  const refresh = useCallback(async () => {
    logger.debug('Refreshing session...');

    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        logger.warn('Session refresh failed', { metadata: { error: error.message } });
        setSession(null);
        return;
      }

      if (user) {
        const userSession = buildUserSession(user);
        setSession(userSession);
        logger.debug('Session refreshed', { metadata: { email: userSession.email } });
      } else {
        setSession(null);
        logger.debug('No active session');
      }
    } catch (error) {
      logger.error('Unexpected refresh error', error);
      setSession(null);
    }
  }, [supabase]);

  /**
   * Sign in with magic link
   */
  const signIn = useCallback(
    async (
      email: string,
      redirectTo?: string
    ): Promise<{ success: boolean; error: string | null }> => {
      const timer = logger.time('signIn');

      try {
        // Build the callback URL with redirect
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
        const callbackUrl = new URL('/auth/callback', siteUrl);

        if (redirectTo) {
          callbackUrl.searchParams.set('next', redirectTo);
        }

        logger.debug('Sending magic link', {
          metadata: { email, redirectTo: callbackUrl.toString() },
        });

        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: callbackUrl.toString(),
          },
        });

        if (error) {
          timer.error('Magic link failed', error);
          return { success: false, error: error.message };
        }

        timer.success('Magic link sent');
        return { success: true, error: null };
      } catch (error) {
        timer.error('Unexpected error', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Something went wrong',
        };
      }
    },
    [supabase]
  );

  /**
   * Sign out the current user
   */
  const signOut = useCallback(async () => {
    const timer = logger.time('signOut');

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        timer.error('Sign out failed', error);
        return;
      }

      setSession(null);
      timer.success('Signed out');

      // Redirect to home after sign out
      window.location.href = '/';
    } catch (error) {
      timer.error('Unexpected error', error);
    }
  }, [supabase]);

  // ---------------------------------------------------------------------------
  // AUTH STATE LISTENER
  // ---------------------------------------------------------------------------

  useEffect(() => {
    // Log startup
    logger.info('🔐 AuthProvider initialized');

    // Get initial session
    const initSession = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
          logger.debug('No initial session', { metadata: { error: error.message } });
          setSession(null);
        } else if (user) {
          const userSession = buildUserSession(user);
          setSession(userSession);
          logger.success('User authenticated', {
            metadata: {
              email: userSession.email,
              role: userSession.role,
            },
          });
        }
      } catch (error) {
        logger.error('Failed to get initial session', error);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, supabaseSession) => {
        logger.debug(`Auth state changed: ${event}`, {
          metadata: { hasSession: !!supabaseSession },
        });

        switch (event) {
          case 'SIGNED_IN':
            if (supabaseSession?.user) {
              const userSession = buildUserSession(supabaseSession.user);
              setSession(userSession);
              logger.success('🎉 User signed in', {
                metadata: { email: userSession.email },
              });
            }
            break;

          case 'SIGNED_OUT':
            setSession(null);
            logger.info('👋 User signed out');
            break;

          case 'TOKEN_REFRESHED':
            if (supabaseSession?.user) {
              const userSession = buildUserSession(supabaseSession.user);
              setSession(userSession);
              logger.debug('Token refreshed');
            }
            break;

          case 'USER_UPDATED':
            if (supabaseSession?.user) {
              const userSession = buildUserSession(supabaseSession.user);
              setSession(userSession);
              logger.info('User updated');
            }
            break;

          default:
            break;
        }

        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // ---------------------------------------------------------------------------
  // CONTEXT VALUE
  // ---------------------------------------------------------------------------

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      isAuthenticated: !!session,
      signIn,
      signOut,
      refresh,
    }),
    [session, isLoading, signIn, signOut, refresh]
  );

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * useAuth - access auth state from any component
 *
 * @throws Error if used outside of AuthProvider
 *
 * @example
 * ```tsx
 * function Profile() {
 *   const { session, isLoading, signOut } = useAuth();
 *
 *   if (isLoading) return <Spinner />;
 *   if (!session) return <p>Not logged in</p>;
 *
 *   return (
 *     <div>
 *       <p>Hello, {session.name}!</p>
 *       <button onClick={signOut}>Sign Out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      '❌ useAuth must be used within an AuthProvider. ' +
        'Make sure your component is wrapped in <AuthProvider>.'
    );
  }

  return context;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { AuthProviderProps };
