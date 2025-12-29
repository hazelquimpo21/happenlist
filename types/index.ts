// ============================================================================
// 📦 HAPPENLIST - Types Index
// ============================================================================
// Central export point for all TypeScript types.
// Import from '@/types' instead of individual files.
//
// @example
// import type { Event, EventWithRelations, ActionResponse } from '@/types'
// ============================================================================

// ============================================================================
// 🗄️ Database Types (raw table structures)
// ============================================================================

export type {
  EventStatus,
  EventType,
  Category,
  Tag,
  Venue,
  Organizer,
  Event,
  EventTag,
} from './database'

// ============================================================================
// 🔗 Extended Types (with relations populated)
// ============================================================================

export type {
  EventWithRelations,
  VenueWithEvents,
  OrganizerWithEvents,
  CategoryWithCount,
  TagWithCount,
} from './extended'

// ============================================================================
// 🔌 API Types (requests, responses, queries)
// ============================================================================

export type {
  EventFilters,
  EventSortOption,
  PaginationParams,
  PaginationMeta,
  PaginatedResponse,
  ActionResponse,
  SearchResult,
} from './api'

// ============================================================================
// 📝 Form Types (form inputs)
// ============================================================================

export type {
  EventFormInput,
  VenueFormInput,
  OrganizerFormInput,
  LoginFormInput,
} from './forms'
