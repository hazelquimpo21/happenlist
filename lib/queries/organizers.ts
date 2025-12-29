// ============================================================================
// 👥 HAPPENLIST - Organizer Queries
// ============================================================================
// Database query functions for fetching organizers.
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import type { Organizer, OrganizerWithEvents } from '@/types'

// ============================================================================
// 👥 Get All Organizers
// ============================================================================

/**
 * Fetches all organizers ordered alphabetically.
 *
 * @example
 * const organizers = await getOrganizers()
 */
export async function getOrganizers(): Promise<Organizer[]> {
  logger.debug('👥 Fetching organizers')

  const supabase = createClient()

  const { data, error } = await supabase
    .from('organizers')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    logger.error('❌ Failed to fetch organizers', { error })
    throw new Error(`Failed to fetch organizers: ${error.message}`)
  }

  logger.info(`✅ Fetched ${data?.length ?? 0} organizers`)
  return data ?? []
}

// ============================================================================
// 👥 Get Organizer by Slug
// ============================================================================

/**
 * Fetches a single organizer by its URL slug with event count.
 *
 * @example
 * const organizer = await getOrganizerBySlug('milwaukee-music-collective')
 */
export async function getOrganizerBySlug(
  slug: string
): Promise<OrganizerWithEvents | null> {
  logger.debug('👥 Fetching organizer by slug', { slug })

  const supabase = createClient()

  const { data, error } = await supabase
    .from('organizers')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      logger.debug('👥 Organizer not found', { slug })
      return null
    }
    logger.error('❌ Failed to fetch organizer', { slug, error })
    throw new Error(`Failed to fetch organizer: ${error.message}`)
  }

  // Get upcoming event count
  const { count } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('organizer_id', data.id)
    .eq('status', 'published')
    .gte('start_at', new Date().toISOString())

  logger.info('✅ Fetched organizer', { slug })

  return {
    ...data,
    events: [], // Events are fetched separately
    upcoming_event_count: count ?? 0,
  }
}

// ============================================================================
// 👥 Search Organizers
// ============================================================================

/**
 * Searches organizers by name (for autocomplete).
 *
 * @example
 * const organizers = await searchOrganizers('music', 5)
 */
export async function searchOrganizers(
  query: string,
  limit = 10
): Promise<Organizer[]> {
  logger.debug('👥 Searching organizers', { query, limit })

  const supabase = createClient()

  const { data, error } = await supabase
    .from('organizers')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name', { ascending: true })
    .limit(limit)

  if (error) {
    logger.error('❌ Failed to search organizers', { query, error })
    throw new Error(`Failed to search organizers: ${error.message}`)
  }

  logger.info(`✅ Found ${data?.length ?? 0} organizers matching "${query}"`)
  return data ?? []
}
