/**
 * GET PERFORMERS
 * ==============
 * Fetches performers with optional filtering and pagination.
 */

import { createClient } from '@/lib/supabase/server';
import type { PerformerCard } from '@/types';

interface GetPerformersParams {
  search?: string;
  genre?: string;
  page?: number;
  limit?: number;
}

/**
 * Fetches performers with event counts, sorted by most upcoming events.
 */
export async function getPerformers(
  params: GetPerformersParams = {}
): Promise<{ performers: PerformerCard[]; total: number }> {
  const { search, genre, page = 1, limit = 24 } = params;

  console.log('🎤 [getPerformers] Fetching performers:', { search, genre, page, limit });

  const supabase = await createClient();
  const offset = (page - 1) * limit;
  const today = new Date().toISOString().split('T')[0];

  // We need to get performers with their upcoming event count.
  // Use a two-step approach: get performers, then count events.
  let query = supabase
    .from('performers')
    .select('id, name, slug, genre, image_url', { count: 'exact' });

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  if (genre) {
    query = query.ilike('genre', `%${genre}%`);
  }

  query = query
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('❌ [getPerformers] Error:', error);
    throw error;
  }

  // For each performer, count upcoming events
  const performers: PerformerCard[] = [];
  if (data && data.length > 0) {
    const performerIds = data.map((p) => p.id);

    // Batch count: get event_performers for these performers where event is upcoming
    const { data: eventLinks } = await supabase
      .from('event_performers')
      .select('performer_id, event:events!inner(id, instance_date, status, deleted_at)')
      .in('performer_id', performerIds)
      .gte('event.instance_date', today)
      .eq('event.status', 'published')
      .is('event.deleted_at', null);

    // Count per performer
    const countMap = new Map<string, number>();
    if (eventLinks) {
      for (const link of eventLinks) {
        const pid = (link as { performer_id: string }).performer_id;
        countMap.set(pid, (countMap.get(pid) || 0) + 1);
      }
    }

    for (const p of data) {
      performers.push({
        id: p.id,
        name: p.name,
        slug: p.slug,
        genre: p.genre,
        image_url: p.image_url,
        upcoming_event_count: countMap.get(p.id) || 0,
      });
    }

    // Sort by upcoming event count descending (most active first)
    performers.sort((a, b) => b.upcoming_event_count - a.upcoming_event_count);
  }

  console.log(`✅ [getPerformers] Found ${performers.length} performers (total: ${count})`);

  return {
    performers,
    total: count || 0,
  };
}

/**
 * Get distinct genres from all performers for filter chips.
 */
export async function getPerformerGenres(): Promise<string[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('performers')
    .select('genre')
    .not('genre', 'is', null)
    .order('genre', { ascending: true });

  if (!data) return [];

  const genres = new Set<string>();
  for (const row of data) {
    if (row.genre) genres.add(row.genre);
  }

  return Array.from(genres);
}
