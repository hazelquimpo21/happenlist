/**
 * GET ORGANIZERS
 * ==============
 * Fetches organizers with optional filtering and pagination.
 */

import { createClient } from '@/lib/supabase/server';
import type { Organizer } from '@/types';

interface GetOrganizersParams {
  /** Search query */
  search?: string;
  /** Page number */
  page?: number;
  /** Items per page */
  limit?: number;
}

/**
 * Fetches organizers with optional filtering.
 *
 * @example
 * const { organizers, total } = await getOrganizers({ limit: 24 });
 */
export async function getOrganizers(
  params: GetOrganizersParams = {}
): Promise<{ organizers: Organizer[]; total: number }> {
  const { search, page = 1, limit = 24 } = params;

  console.log('👥 [getOrganizers] Fetching organizers:', { search, page, limit });

  const supabase = await createClient();
  const offset = (page - 1) * limit;

  let query = supabase
    .from('organizers')
    .select('*', { count: 'exact' })
    .eq('is_active', true);

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  query = query
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('❌ [getOrganizers] Error:', error);
    throw error;
  }

  console.log(`✅ [getOrganizers] Found ${data?.length || 0} organizers (total: ${count})`);

  return {
    organizers: data || [],
    total: count || 0,
  };
}

/**
 * Fetches a single organizer by slug.
 *
 * @example
 * const organizer = await getOrganizer({ slug: 'milwaukee-jazz-collective' });
 */
export async function getOrganizer(
  params: { slug: string }
): Promise<Organizer | null> {
  console.log('👥 [getOrganizer] Fetching organizer:', params.slug);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organizers')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('⚠️ [getOrganizer] Organizer not found');
      return null;
    }
    console.error('❌ [getOrganizer] Error:', error);
    throw error;
  }

  console.log('✅ [getOrganizer] Found organizer:', (data as Organizer)?.name);

  return data as Organizer;
}
