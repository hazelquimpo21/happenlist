// ============================================================================
// 🗄️ HAPPENLIST - Database Types
// ============================================================================
// TypeScript types that mirror the database schema exactly.
// These are the "raw" types as stored in the database.
//
// 💡 TIP: You can auto-generate these using:
//    npx supabase gen types typescript --local > types/supabase.ts
// ============================================================================

// ============================================================================
// 📊 Enums & Constants
// ============================================================================

/**
 * Possible statuses for an event.
 * - draft: Not visible to public, work in progress
 * - published: Live and visible on the site
 * - cancelled: Event was cancelled (may still be visible with notice)
 * - archived: Hidden from all listings
 */
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'archived'

// ============================================================================
// 📋 Event Types Table
// ============================================================================

/**
 * Types of events (single, series, festival, etc.)
 * Helps categorize how an event spans or recurs over time.
 */
export interface EventType {
  /** Unique identifier (UUID) */
  id: string
  /** Display name (e.g., "Single Event", "Festival") */
  name: string
  /** URL-friendly slug (e.g., "single-event") */
  slug: string
  /** Optional description of this event type */
  description: string | null
  /** Order for display in dropdowns */
  sort_order: number
  /** When this record was created */
  created_at: string
  /** When this record was last updated */
  updated_at: string
}

// ============================================================================
// 🏷️ Categories Table
// ============================================================================

/**
 * Event categories (Music, Food & Drink, Kids & Family, etc.)
 * Each event belongs to exactly one category.
 */
export interface Category {
  /** Unique identifier (UUID) */
  id: string
  /** Display name (e.g., "Music", "Food & Drink") */
  name: string
  /** URL-friendly slug (e.g., "food-drink") */
  slug: string
  /** Lucide icon name for display (e.g., "music", "utensils") */
  icon: string | null
  /** Hex color code for badges (e.g., "#8B5CF6") */
  color: string | null
  /** Order for display in lists */
  sort_order: number
  /** When this record was created */
  created_at: string
  /** When this record was last updated */
  updated_at: string
}

// ============================================================================
// 🔖 Tags Table
// ============================================================================

/**
 * Flexible tags for filtering events.
 * Events can have multiple tags (many-to-many relationship).
 */
export interface Tag {
  /** Unique identifier (UUID) */
  id: string
  /** Display name (e.g., "Free", "Outdoor", "21+") */
  name: string
  /** URL-friendly slug (e.g., "21-plus") */
  slug: string
  /** When this record was created */
  created_at: string
}

// ============================================================================
// 📍 Venues Table
// ============================================================================

/**
 * Physical locations where events take place.
 * A venue can host multiple events.
 */
export interface Venue {
  /** Unique identifier (UUID) */
  id: string
  /** Venue name (e.g., "Fiserv Forum") */
  name: string
  /** URL-friendly slug */
  slug: string
  /** Street address (optional) */
  address: string | null
  /** City name (defaults to Milwaukee) */
  city: string
  /** State abbreviation (defaults to WI) */
  state: string
  /** ZIP/Postal code */
  zip: string | null
  /** Latitude for map display */
  lat: number | null
  /** Longitude for map display */
  lng: number | null
  /** Venue website URL */
  website: string | null
  /** Venue image URL */
  image_url: string | null
  /** When this record was created */
  created_at: string
  /** When this record was last updated */
  updated_at: string
}

// ============================================================================
// 👥 Organizers Table
// ============================================================================

/**
 * Event organizers - people or organizations that host events.
 * An organizer can host multiple events.
 */
export interface Organizer {
  /** Unique identifier (UUID) */
  id: string
  /** Organizer name */
  name: string
  /** URL-friendly slug */
  slug: string
  /** About the organizer */
  description: string | null
  /** Logo image URL */
  logo_url: string | null
  /** Website URL */
  website: string | null
  /** Instagram handle (without @) */
  instagram_handle: string | null
  /** When this record was created */
  created_at: string
  /** When this record was last updated */
  updated_at: string
}

// ============================================================================
// 📅 Events Table
// ============================================================================

/**
 * The main events table - the heart of Happenlist!
 * Each event has dates, location, pricing, and content.
 */
export interface Event {
  /** Unique identifier (UUID) */
  id: string
  /** Event title */
  title: string
  /** URL-friendly slug */
  slug: string
  /** Full description (supports markdown) */
  description: string | null

  /** Foreign key to event_types table */
  type_id: string | null
  /** Foreign key to categories table */
  category_id: string | null
  /** Foreign key to venues table */
  venue_id: string | null
  /** Foreign key to organizers table */
  organizer_id: string | null

  /** When the event starts (ISO 8601 timestamp in UTC) */
  start_at: string
  /** When the event ends (optional) */
  end_at: string | null
  /** Is this an all-day event? */
  is_all_day: boolean

  /** Thumbnail image URL */
  image_url: string | null
  /** Full flyer/poster image URL */
  flyer_url: string | null

  /** Where the event info came from (attribution) */
  source_url: string | null
  /** Where to buy tickets */
  ticket_url: string | null

  /** Minimum ticket price */
  price_min: number | null
  /** Maximum ticket price */
  price_max: number | null
  /** Is this a free event? */
  is_free: boolean

  /** Current status (draft, published, cancelled, archived) */
  status: EventStatus

  /** When this record was created */
  created_at: string
  /** When this record was last updated */
  updated_at: string
}

// ============================================================================
// 🔗 Event Tags Junction Table
// ============================================================================

/**
 * Junction table linking events to tags (many-to-many).
 */
export interface EventTag {
  /** Foreign key to events table */
  event_id: string
  /** Foreign key to tags table */
  tag_id: string
}
