// ============================================================================
// 🔗 HAPPENLIST - Extended Types
// ============================================================================
// Types for entities with their related data populated.
// These are the types you'll use most often in components.
// ============================================================================

import type {
  Event,
  Category,
  Venue,
  Organizer,
  Tag,
  EventType,
} from './database'

// ============================================================================
// 📅 Event with Relations
// ============================================================================

/**
 * Event with all related entities populated.
 * This is what you get from queries that join related tables.
 *
 * @example
 * // In a component
 * function EventCard({ event }: { event: EventWithRelations }) {
 *   return (
 *     <div>
 *       <h3>{event.title}</h3>
 *       <p>Category: {event.category?.name}</p>
 *       <p>Venue: {event.venue?.name}</p>
 *     </div>
 *   )
 * }
 */
export interface EventWithRelations extends Event {
  /** The event's category (e.g., Music, Food & Drink) */
  category: Category | null
  /** Where the event takes place */
  venue: Venue | null
  /** Who's hosting the event */
  organizer: Organizer | null
  /** The type of event (single, series, festival, etc.) */
  event_type: EventType | null
  /** Tags associated with this event */
  tags: Tag[]
}

// ============================================================================
// 📍 Venue with Events
// ============================================================================

/**
 * Venue with its events and count.
 * Used on venue detail pages.
 */
export interface VenueWithEvents extends Venue {
  /** Events at this venue (usually just upcoming) */
  events: Event[]
  /** Total count of upcoming events */
  upcoming_event_count: number
}

// ============================================================================
// 👥 Organizer with Events
// ============================================================================

/**
 * Organizer with their events and count.
 * Used on organizer detail pages.
 */
export interface OrganizerWithEvents extends Organizer {
  /** Events by this organizer (usually just upcoming) */
  events: Event[]
  /** Total count of upcoming events */
  upcoming_event_count: number
}

// ============================================================================
// 🏷️ Category with Count
// ============================================================================

/**
 * Category with count of events.
 * Used for category navigation.
 */
export interface CategoryWithCount extends Category {
  /** Number of upcoming events in this category */
  event_count: number
}

// ============================================================================
// 🔖 Tag with Count
// ============================================================================

/**
 * Tag with count of events.
 * Used for tag filtering.
 */
export interface TagWithCount extends Tag {
  /** Number of upcoming events with this tag */
  event_count: number
}
