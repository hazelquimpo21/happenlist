// ============================================================================
// 🔌 HAPPENLIST - Supabase Middleware Client
// ============================================================================
// This file creates a Supabase client for use in Next.js middleware.
// It handles cookie operations in the middleware context.
// ============================================================================

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'

// ============================================================================
// 🛡️ Middleware Client Factory
// ============================================================================

/**
 * Creates a Supabase client for use in Next.js middleware.
 * This is needed because middleware has a different cookie API than
 * Server Components.
 *
 * @param request - The incoming Next.js request
 * @returns Object containing the Supabase client and response
 */
export function createMiddlewareClient(request: NextRequest) {
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    logger.error('🚨 Missing Supabase env vars in middleware')
    throw new Error('Missing Supabase environment variables')
  }

  // Create a response that we can modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      // Get a cookie from the request
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      // Set a cookie on the response
      set(name: string, value: string, options: CookieOptions) {
        // Set on request for downstream usage
        request.cookies.set({
          name,
          value,
          ...options,
        })
        // Set on response to send to browser
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({
          name,
          value,
          ...options,
        })
      },
      // Remove a cookie
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: '',
          ...options,
        })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({
          name,
          value: '',
          ...options,
        })
      },
    },
  })

  return { supabase, response }
}
