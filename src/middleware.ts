/**
 * NEXT.JS MIDDLEWARE
 * ==================
 * Handles Supabase auth session refresh and cookie management.
 *
 * This middleware runs on every request and:
 * 1. Refreshes the auth session if needed
 * 2. Properly updates cookies for Supabase SSR
 *
 * CRITICAL: Without this middleware, the PKCE auth flow will fail
 * because the code verifier cookie won't be properly handled.
 *
 * @module middleware
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Create a response that we can modify
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Create Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // First, set cookies on the request (for server components)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          // Then, set cookies on the response (for the browser)
          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not run any Supabase auth code between
  // createServerClient and supabase.auth.getUser()

  // This refreshes the session if expired and updates cookies
  // The getUser() call is required to properly refresh tokens
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Optional: Protect certain routes
  // Uncomment to enable route protection
  /*
  const protectedPaths = ['/my', '/submit'];
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !user) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }
  */

  return supabaseResponse;
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
