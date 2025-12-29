// ============================================================================
// 🔌 HAPPENLIST - Supabase Browser Client
// ============================================================================
// This file creates a Supabase client for use in browser/client components.
// Use this for client-side operations (not recommended for most cases).
//
// ⚠️  IMPORTANT: Prefer server-side data fetching with Server Components!
//     Only use this client when you absolutely need client-side interactivity.
// ============================================================================

import { createBrowserClient } from '@supabase/ssr'
import { logger } from '@/lib/utils/logger'

// ============================================================================
// 🌐 Browser Client Factory
// ============================================================================

/**
 * Creates a Supabase client for use in browser/client components.
 *
 * @example
 * // In a client component ('use client')
 * const supabase = createClient()
 * const { data } = await supabase.from('events').select()
 *
 * @returns Supabase browser client instance
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

  logger.debug('🔌 Creating Supabase browser client')

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Export a singleton instance for convenience
// Note: This is fine because the browser client handles its own state
export const supabase = createClient()
