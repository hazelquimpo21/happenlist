/**
 * SUPABASE BROWSER CLIENT
 * =======================
 * Use this client for client-side components ('use client').
 * This client runs in the browser and respects RLS policies.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

/**
 * Creates a Supabase client for use in browser components.
 *
 * Usage:
 * ```tsx
 * 'use client';
 * import { createClient } from '@/lib/supabase/client';
 *
 * const supabase = createClient();
 * const { data } = await supabase.from('events').select();
 * ```
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      '❌ Missing Supabase environment variables. ' +
      'Please copy .env.example to .env.local and fill in your Supabase credentials.'
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
