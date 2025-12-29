/**
 * GET VENUES
 * ==========
 * Fetches venues with optional filtering and pagination.
 */

import { createClient } from '@/lib/supabase/server';
import type { Venue } from '@/types';

interface GetVenuesParams {
  /** Search query */
  search?: string;
  /** Sort order */
  orderBy?: 'name' | 'event_count';
  /** Page number */
  page?: number;
  /** Items per page */
  limit?: number;
}

/**
 * Fetches venues with optional filtering.
 *
 * @example
 * const { venues, total } = await getVenues({ limit: 24 });
 */
export async function getVenues(
  params: GetVenuesParams = {}
): Promise<{ venues: Venue[]; total: number }> {
  const { search, orderBy = 'name', page = 1, limit = 24 } = params;

  console.log('🏛️ [getVenues] Fetching venues:', { search, orderBy, page, limit });

  const supabase = await createClient();
  const offset = (page - 1) * limit;

  let query = supabase
    .from('locations')
    .select('*', { count: 'exact' })
    .eq('is_active', true);

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  if (orderBy === 'name') {
    query = query.order('name', { ascending: true });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('❌ [getVenues] Error:', error);
    throw error;
  }

  console.log(`✅ [getVenues] Found ${data?.length || 0} venues (total: ${count})`);

  return {
    venues: data || [],
    total: count || 0,
  };
}

/**
 * Fetches a single venue by slug.
 *
 * @example
 * const venue = await getVenue({ slug: 'pabst-theater' });
 */
export async function getVenue(params: { slug: string }): Promise<Venue | null> {
  console.log('🏛️ [getVenue] Fetching venue:', params.slug);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('⚠️ [getVenue] Venue not found');
      return null;
    }
    console.error('❌ [getVenue] Error:', error);
    throw error;
  }

  console.log('✅ [getVenue] Found venue:', (data as Venue)?.name);

  return data as Venue;
}
