// ============================================================================
// 🔌 HAPPENLIST - Supabase Server Client
// ============================================================================
// This file creates a Supabase client for use in Server Components,
// Server Actions, and Route Handlers. It properly handles cookies
// for authentication.
//
// 🎯 This is the PREFERRED way to access Supabase in Next.js App Router!
// ============================================================================

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'

// ============================================================================
// 🖥️ Server Client Factory
// ============================================================================

/**
 * Creates a Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. This client properly handles cookies for authentication.
 *
 * @example
 * // In a Server Component or Server Action
 * const supabase = createClient()
 * const { data } = await supabase.from('events').select()
 *
 * @returns Supabase server client instance
 */
export function createClient() {
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = '🚨 Missing Supabase environment variables!'
    logger.error(errorMsg, {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
    })
    throw new Error(errorMsg + ' Check your .env.local file.')
  }

  logger.debug('🖥️ Creating Supabase server client')

  // Get the cookies store from Next.js
  const cookieStore = cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      // Get a cookie by name
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      // Set a cookie (for auth token refresh)
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // This can fail in Server Components (read-only)
          // That's OK - cookies will be set in middleware
          logger.debug('📝 Cookie set attempted in read-only context', { name })
        }
      },
      // Remove a cookie (for sign out)
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // This can fail in Server Components (read-only)
          logger.debug('📝 Cookie remove attempted in read-only context', { name })
        }
      },
    },
  })
}

// ============================================================================
// 🔑 Admin Client Factory (Service Role)
// ============================================================================

/**
 * Creates a Supabase client with service role privileges.
 *
 * ⚠️  WARNING: This bypasses RLS! Only use for admin operations
 *     that need full database access.
 *
 * @example
 * // For admin-only operations
 * const supabase = createAdminClient()
 * const { data } = await supabase.from('events').select() // Gets ALL events
 *
 * @returns Supabase admin client instance
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    const errorMsg = '🚨 Missing Supabase service role key!'
    logger.error(errorMsg, {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
    })
    throw new Error(errorMsg + ' Check your .env.local file.')
  }

  logger.debug('🔐 Creating Supabase admin client (service role)')

  return createServerClient(supabaseUrl, supabaseServiceKey, {
    cookies: {
      get: () => undefined,
      set: () => {},
      remove: () => {},
    },
  })
}
