// ============================================================================
// 📍 HAPPENLIST - Venue Queries
// ============================================================================
// Database query functions for fetching venues.
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import type { Venue, VenueWithEvents } from '@/types'

// ============================================================================
// 📍 Get All Venues
// ============================================================================

/**
 * Fetches all venues ordered alphabetically.
 *
 * @example
 * const venues = await getVenues()
 */
export async function getVenues(): Promise<Venue[]> {
  logger.debug('📍 Fetching venues')

  const supabase = createClient()

  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    logger.error('❌ Failed to fetch venues', { error })
    throw new Error(`Failed to fetch venues: ${error.message}`)
  }

  logger.info(`✅ Fetched ${data?.length ?? 0} venues`)
  return data ?? []
}

// ============================================================================
// 📍 Get Venue by Slug
// ============================================================================

/**
 * Fetches a single venue by its URL slug with event count.
 *
 * @example
 * const venue = await getVenueBySlug('fiserv-forum')
 */
export async function getVenueBySlug(slug: string): Promise<VenueWithEvents | null> {
  logger.debug('📍 Fetching venue by slug', { slug })

  const supabase = createClient()

  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      logger.debug('📍 Venue not found', { slug })
      return null
    }
    logger.error('❌ Failed to fetch venue', { slug, error })
    throw new Error(`Failed to fetch venue: ${error.message}`)
  }

  // Get upcoming event count
  const { count } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('venue_id', data.id)
    .eq('status', 'published')
    .gte('start_at', new Date().toISOString())

  logger.info('✅ Fetched venue', { slug })

  return {
    ...data,
    events: [], // Events are fetched separately
    upcoming_event_count: count ?? 0,
  }
}

// ============================================================================
// 📍 Search Venues
// ============================================================================

/**
 * Searches venues by name (for autocomplete).
 *
 * @example
 * const venues = await searchVenues('fiserv', 5)
 */
export async function searchVenues(query: string, limit = 10): Promise<Venue[]> {
  logger.debug('📍 Searching venues', { query, limit })

  const supabase = createClient()

  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name', { ascending: true })
    .limit(limit)

  if (error) {
    logger.error('❌ Failed to search venues', { query, error })
    throw new Error(`Failed to search venues: ${error.message}`)
  }

  logger.info(`✅ Found ${data?.length ?? 0} venues matching "${query}"`)
  return data ?? []
}
