/**
 * SUPABASE SERVER CLIENT
 * ======================
 * Use this client for Server Components and Route Handlers.
 * This client properly handles cookies for authentication.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

/**
 * Creates a Supabase client for use in Server Components.
 *
 * Note: This is an async function because `cookies()` is async in Next.js 15+.
 *
 * Usage:
 * ```tsx
 * // In a Server Component or Route Handler
 * import { createClient } from '@/lib/supabase/server';
 *
 * export default async function Page() {
 *   const supabase = await createClient();
 *   const { data } = await supabase.from('events').select();
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      '❌ Missing Supabase environment variables. ' +
      'Please copy .env.example to .env.local and fill in your Supabase credentials.'
    );
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
            );
          } catch {
            // This will throw in Server Components when attempting to set cookies.
            // This is expected behavior - cookies can only be set in Route Handlers
            // or Server Actions. The Supabase client handles this gracefully.
          }
        },
      },
    }
  );
}
