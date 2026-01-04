/**
 * ROUTE PROTECTION MIDDLEWARE
 * ===========================
 * Handles authentication and authorization for protected routes.
 *
 * PROTECTED ROUTES:
 *   /my/*     - Requires authentication
 *   /submit/* - Requires authentication
 *   /admin/*  - Requires admin role
 *
 * HOW IT WORKS:
 *   1. Checks for valid session
 *   2. For protected routes, redirects to login if not authenticated
 *   3. For admin routes, checks if user is admin
 *   4. Refreshes session to keep it alive
 *
 * @module middleware
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Admin emails from environment variable
 */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Route patterns that require authentication
 */
const PROTECTED_ROUTES = ['/my', '/submit'];

/**
 * Route patterns that require admin role
 */
const ADMIN_ROUTES = ['/admin'];

/**
 * Routes that should be excluded from middleware
 */
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/callback',
  '/auth/logout',
  '/api/auth',
];

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if a path matches any of the given patterns
 */
function matchesPattern(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.endsWith('*')) {
      return path.startsWith(pattern.slice(0, -1));
    }
    return path === pattern || path.startsWith(pattern + '/');
  });
}

/**
 * Check if an email is an admin
 */
function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Log middleware action (in development only)
 */
function logMiddleware(
  action: string,
  details: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `🛡️ [Middleware] ${action}`,
      JSON.stringify(details, null, 2)
    );
  }
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // ---------------------------------------------------------------------------
  // 1. SKIP PUBLIC ROUTES
  // ---------------------------------------------------------------------------

  if (matchesPattern(path, PUBLIC_ROUTES)) {
    return NextResponse.next();
  }

  // ---------------------------------------------------------------------------
  // 2. CREATE SUPABASE CLIENT
  // ---------------------------------------------------------------------------

  // We need to create a response to pass to Supabase
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set cookie on request for server components
          request.cookies.set({
            name,
            value,
            ...options,
          });
          // Set cookie on response for browser
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // ---------------------------------------------------------------------------
  // 3. GET SESSION (also refreshes token if needed)
  // ---------------------------------------------------------------------------

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // ---------------------------------------------------------------------------
  // 4. CHECK PROTECTED ROUTES
  // ---------------------------------------------------------------------------

  const isProtectedRoute = matchesPattern(path, PROTECTED_ROUTES);
  const isAdminRoute = matchesPattern(path, ADMIN_ROUTES);

  // User is not authenticated
  if (error || !user) {
    // Protected routes require login
    if (isProtectedRoute || isAdminRoute) {
      logMiddleware('Redirecting to login', { path, reason: 'Not authenticated' });

      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirect', path);

      return NextResponse.redirect(redirectUrl);
    }

    // Public route - allow through
    return response;
  }

  // ---------------------------------------------------------------------------
  // 5. CHECK ADMIN ROUTES
  // ---------------------------------------------------------------------------

  if (isAdminRoute) {
    const userIsAdmin = isAdmin(user.email);

    if (!userIsAdmin) {
      logMiddleware('Blocked from admin route', {
        path,
        email: user.email,
        reason: 'Not an admin',
      });

      // Redirect non-admins to home
      return NextResponse.redirect(new URL('/', request.url));
    }

    logMiddleware('Admin access granted', {
      path,
      email: user.email,
    });
  }

  // ---------------------------------------------------------------------------
  // 6. ALLOW AUTHENTICATED REQUEST
  // ---------------------------------------------------------------------------

  if (isProtectedRoute) {
    logMiddleware('Protected route access granted', {
      path,
      email: user.email,
    });
  }

  return response;
}

// ============================================================================
// MATCHER CONFIG
// ============================================================================

/**
 * Specify which routes the middleware should run on.
 *
 * This excludes:
 *   - Static files (_next/static, images, favicon)
 *   - API routes (handled separately)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
