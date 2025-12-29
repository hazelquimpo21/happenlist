// ============================================================================
// 🔌 HAPPENLIST - API Types
// ============================================================================
// Types for API requests, responses, and query parameters.
// These define the shape of data flowing through the application.
// ============================================================================

import type { EventStatus } from './database'

// ============================================================================
// 🔍 Filter Types
// ============================================================================

/**
 * Filter parameters for querying events.
 * These map to URL search params on the events page.
 *
 * @example
 * // URL: /events?category=music&free=true&date=this-weekend
 * const filters: EventFilters = {
 *   category: 'music',
 *   isFree: true,
 *   dateFilter: 'this-weekend',
 * }
 */
export interface EventFilters {
  /** Filter by category slug (single-select) */
  category?: string
  /** Filter by tag slugs (multi-select) */
  tags?: string[]
  /** Start of date range (ISO date string) */
  dateFrom?: string
  /** End of date range (ISO date string) */
  dateTo?: string
  /** Date filter preset (today, this-weekend, etc.) */
  dateFilter?: string
  /** Only show free events */
  isFree?: boolean
  /** Search query (searches title, description) */
  search?: string
  /** Filter by status (admin only) */
  status?: EventStatus
  /** Filter by venue ID */
  venueId?: string
  /** Filter by organizer ID */
  organizerId?: string
}

// ============================================================================
// 📊 Sort Types
// ============================================================================

/**
 * Available sort options for event listings.
 */
export type EventSortOption = 'date' | 'created' | 'title'

// ============================================================================
// 📄 Pagination Types
// ============================================================================

/**
 * Pagination parameters for list queries.
 */
export interface PaginationParams {
  /** Page number (1-indexed) */
  page?: number
  /** Items per page */
  limit?: number
}

/**
 * Pagination metadata returned with paginated results.
 */
export interface PaginationMeta {
  /** Current page number */
  page: number
  /** Items per page */
  limit: number
  /** Total number of items */
  total: number
  /** Total number of pages */
  totalPages: number
  /** Whether there are more pages */
  hasMore: boolean
}

/**
 * Wrapper for paginated API responses.
 *
 * @example
 * const response: PaginatedResponse<Event> = {
 *   data: [event1, event2, ...],
 *   pagination: {
 *     page: 1,
 *     limit: 20,
 *     total: 100,
 *     totalPages: 5,
 *     hasMore: true,
 *   }
 * }
 */
export interface PaginatedResponse<T> {
  /** The actual data items */
  data: T[]
  /** Pagination metadata */
  pagination: PaginationMeta
}

// ============================================================================
// 🎯 Server Action Response Types
// ============================================================================

/**
 * Standard response type for server actions.
 * Either succeeds with data or fails with an error message.
 *
 * @example
 * // Success case
 * return { success: true, data: { id: '123', slug: 'my-event' } }
 *
 * // Error case
 * return { success: false, error: 'Event not found' }
 *
 * // Validation error case
 * return {
 *   success: false,
 *   error: 'Validation failed',
 *   fieldErrors: { title: ['Title is required'] }
 * }
 */
export type ActionResponse<T = void> =
  | { success: true; data: T }
  | {
      success: false
      error: string
      /** Field-specific validation errors */
      fieldErrors?: Record<string, string[]>
    }

// ============================================================================
// 🔍 Search Types
// ============================================================================

/**
 * Search result item with relevance info.
 */
export interface SearchResult {
  /** ID of the matched item */
  id: string
  /** Type of item (event, venue, organizer) */
  type: 'event' | 'venue' | 'organizer'
  /** Title/name of the item */
  title: string
  /** URL slug */
  slug: string
  /** Preview text or description */
  description?: string
  /** Image URL if available */
  imageUrl?: string
}
