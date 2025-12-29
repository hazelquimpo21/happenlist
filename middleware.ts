// ============================================================================
// 🛡️ HAPPENLIST - Middleware
// ============================================================================
// Next.js middleware that runs before every request.
// Handles:
//   - Auth session refresh
//   - Protected route access control
//   - Redirects for logged-in/logged-out users
// ============================================================================

import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'

// ============================================================================
// 🔧 Configuration
// ============================================================================

/**
 * Routes that require authentication.
 * Users will be redirected to /login if not authenticated.
 */
const PROTECTED_ROUTES = ['/admin']

/**
 * Routes that should redirect authenticated users.
 * Logged-in users visiting /login will be sent to /admin.
 */
const AUTH_ROUTES = ['/login']

// ============================================================================
// 🚦 Middleware Function
// ============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // Static files like .ico, .png, etc.
  ) {
    return NextResponse.next()
  }

  try {
    // Create Supabase client for middleware
    const { supabase, response } = createMiddlewareClient(request)

    // Refresh session - this is important for keeping the session alive
    // The getSession call also refreshes expired tokens
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Check if this is a protected route
    const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
      pathname.startsWith(route)
    )

    // Check if this is an auth route (login, signup, etc.)
    const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))

    // ========================================
    // 🔒 Protected Route Logic
    // ========================================

    if (isProtectedRoute && !session) {
      // User is not logged in, redirect to login
      console.log('🔒 Redirecting unauthenticated user to login')

      const loginUrl = new URL('/login', request.url)
      // Save the original URL so we can redirect back after login
      loginUrl.searchParams.set('redirectTo', pathname)

      return NextResponse.redirect(loginUrl)
    }

    // ========================================
    // 🔓 Auth Route Logic
    // ========================================

    if (isAuthRoute && session) {
      // User is already logged in, redirect to admin
      console.log('🔓 Redirecting authenticated user to admin')

      return NextResponse.redirect(new URL('/admin', request.url))
    }

    // All good, continue with the request
    return response
  } catch (error) {
    // If there's an error with auth, just continue
    // This prevents the app from breaking if Supabase is down
    console.error('⚠️ Middleware auth error:', error)
    return NextResponse.next()
  }
}

// ============================================================================
// 📍 Matcher Configuration
// ============================================================================

/**
 * Specify which routes this middleware runs on.
 * We run on admin routes and auth routes only for efficiency.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
