/**
 * SUPABASE ADMIN CLIENT
 * =====================
 * Uses the service role key for admin operations like storage uploads.
 * This client bypasses RLS - use carefully and only on the server!
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Creates a Supabase admin client using the service role key.
 * This bypasses Row Level Security and should only be used server-side.
 * 
 * Required environment variable: SUPABASE_SERVICE_ROLE_KEY
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  
  if (!serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
      'This is required for storage uploads. ' +
      'Find it in Supabase Dashboard > Settings > API > service_role key'
    );
  }
  
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}





