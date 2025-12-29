// ============================================================================
// 📅 HAPPENLIST - Event Queries
// ============================================================================
// Database query functions for fetching events.
// All queries use the Supabase server client for SSR.
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { getDateRange } from '@/lib/utils/dates'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'
import type {
  EventWithRelations,
  EventFilters,
  PaginatedResponse,
} from '@/types'

// ============================================================================
// 🔧 Query Helpers
// ============================================================================

/**
 * Base select query for events with all relations.
 * Used by all event queries for consistency.
 */
const EVENT_SELECT = `
  *,
  category:categories(*),
  venue:venues(*),
  organizer:organizers(*),
  event_type:event_types(*),
  tags:event_tags(tag:tags(*))
`

/**
 * Transforms raw event data from Supabase into our expected format.
 * Flattens the nested tags structure.
 */
function transformEvent(data: any): EventWithRelations {
  return {
    ...data,
    tags: data.tags?.map((et: any) => et.tag).filter(Boolean) ?? [],
  }
}

// ============================================================================
// 📅 Get Events (Paginated with Filters)
// ============================================================================

/**
 * Fetches a paginated list of published events with optional filters.
 *
 * @example
 * const { data, pagination } = await getEvents(
 *   { category: 'music', isFree: true },
 *   1,
 *   20
 * )
 */
export async function getEvents(
  filters: EventFilters = {},
  page = 1,
  limit = DEFAULT_PAGE_SIZE
): Promise<PaginatedResponse<EventWithRelations>> {
  logger.debug('📅 Fetching events', { filters, page, limit })

  const supabase = createClient()
  const offset = (page - 1) * limit

  // Start building the query
  let query = supabase
    .from('events')
    .select(EVENT_SELECT, { count: 'exact' })
    .eq('status', 'published')
    .gte('start_at', new Date().toISOString())
    .order('start_at', { ascending: true })
    .range(offset, offset + limit - 1)

  // Apply date filter preset
  if (filters.dateFilter) {
    const range = getDateRange(filters.dateFilter as any)
    query = query.gte('start_at', range.from).lte('start_at', range.to)
  }

  // Apply custom date range
  if (filters.dateFrom) {
    query = query.gte('start_at', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('start_at', filters.dateTo)
  }

  // Apply free filter
  if (filters.isFree) {
    query = query.eq('is_free', true)
  }

  // Apply search
  if (filters.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    )
  }

  // Apply venue filter
  if (filters.venueId) {
    query = query.eq('venue_id', filters.venueId)
  }

  // Apply organizer filter
  if (filters.organizerId) {
    query = query.eq('organizer_id', filters.organizerId)
  }

  const { data, error, count } = await query

  if (error) {
    logger.error('❌ Failed to fetch events', { error })
    throw new Error(`Failed to fetch events: ${error.message}`)
  }

  const events = data?.map(transformEvent) ?? []
  const total = count ?? 0

  logger.info(`✅ Fetched ${events.length} events (page ${page}/${Math.ceil(total / limit)})`)

  return {
    data: events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: offset + limit < total,
    },
  }
}

// ============================================================================
// 📅 Get Event by Slug
// ============================================================================

/**
 * Fetches a single published event by its URL slug.
 *
 * @example
 * const event = await getEventBySlug('summer-music-festival-2024')
 */
export async function getEventBySlug(
  slug: string
): Promise<EventWithRelations | null> {
  logger.debug('📅 Fetching event by slug', { slug })

  const supabase = createClient()

  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      logger.debug('📅 Event not found', { slug })
      return null
    }
    logger.error('❌ Failed to fetch event', { slug, error })
    throw new Error(`Failed to fetch event: ${error.message}`)
  }

  logger.info('✅ Fetched event', { slug })
  return transformEvent(data)
}

// ============================================================================
// 📅 Get Events by Venue
// ============================================================================

/**
 * Fetches events at a specific venue.
 *
 * @example
 * const events = await getEventsByVenue('venue-uuid', false)
 */
export async function getEventsByVenue(
  venueId: string,
  includePast = false
): Promise<EventWithRelations[]> {
  logger.debug('📅 Fetching events by venue', { venueId, includePast })

  const supabase = createClient()

  let query = supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('venue_id', venueId)
    .eq('status', 'published')
    .order('start_at', { ascending: true })

  if (!includePast) {
    query = query.gte('start_at', new Date().toISOString())
  }

  const { data, error } = await query

  if (error) {
    logger.error('❌ Failed to fetch venue events', { venueId, error })
    throw new Error(`Failed to fetch venue events: ${error.message}`)
  }

  logger.info(`✅ Fetched ${data?.length ?? 0} events for venue`)
  return data?.map(transformEvent) ?? []
}

// ============================================================================
// 📅 Get Events by Organizer
// ============================================================================

/**
 * Fetches events by a specific organizer.
 *
 * @example
 * const events = await getEventsByOrganizer('organizer-uuid', false)
 */
export async function getEventsByOrganizer(
  organizerId: string,
  includePast = false
): Promise<EventWithRelations[]> {
  logger.debug('📅 Fetching events by organizer', { organizerId, includePast })

  const supabase = createClient()

  let query = supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('organizer_id', organizerId)
    .eq('status', 'published')
    .order('start_at', { ascending: true })

  if (!includePast) {
    query = query.gte('start_at', new Date().toISOString())
  }

  const { data, error } = await query

  if (error) {
    logger.error('❌ Failed to fetch organizer events', { organizerId, error })
    throw new Error(`Failed to fetch organizer events: ${error.message}`)
  }

  logger.info(`✅ Fetched ${data?.length ?? 0} events for organizer`)
  return data?.map(transformEvent) ?? []
}

// ============================================================================
// 📅 Get Events by Category
// ============================================================================

/**
 * Fetches events in a specific category.
 *
 * @example
 * const { data, pagination } = await getEventsByCategory('music', 1, 20)
 */
export async function getEventsByCategory(
  categorySlug: string,
  page = 1,
  limit = DEFAULT_PAGE_SIZE
): Promise<PaginatedResponse<EventWithRelations>> {
  logger.debug('📅 Fetching events by category', { categorySlug, page, limit })

  const supabase = createClient()
  const offset = (page - 1) * limit

  // First, get the category ID
  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .single()

  if (!category) {
    return {
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasMore: false,
      },
    }
  }

  const { data, error, count } = await supabase
    .from('events')
    .select(EVENT_SELECT, { count: 'exact' })
    .eq('category_id', category.id)
    .eq('status', 'published')
    .gte('start_at', new Date().toISOString())
    .order('start_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    logger.error('❌ Failed to fetch category events', { categorySlug, error })
    throw new Error(`Failed to fetch category events: ${error.message}`)
  }

  const events = data?.map(transformEvent) ?? []
  const total = count ?? 0

  logger.info(`✅ Fetched ${events.length} events in category ${categorySlug}`)

  return {
    data: events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: offset + limit < total,
    },
  }
}

// ============================================================================
// 📅 Get Featured Events (for homepage)
// ============================================================================

/**
 * Fetches a small number of upcoming events for the homepage.
 *
 * @example
 * const events = await getFeaturedEvents(4)
 */
export async function getFeaturedEvents(
  limit = 4
): Promise<EventWithRelations[]> {
  logger.debug('📅 Fetching featured events', { limit })

  const supabase = createClient()

  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('status', 'published')
    .gte('start_at', new Date().toISOString())
    .order('start_at', { ascending: true })
    .limit(limit)

  if (error) {
    logger.error('❌ Failed to fetch featured events', { error })
    throw new Error(`Failed to fetch featured events: ${error.message}`)
  }

  logger.info(`✅ Fetched ${data?.length ?? 0} featured events`)
  return data?.map(transformEvent) ?? []
}
