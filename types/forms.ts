// ============================================================================
// 📝 HAPPENLIST - Form Types
// ============================================================================
// Types for form inputs in the admin interface.
// These define the shape of data submitted from forms.
// ============================================================================

import type { EventStatus } from './database'

// ============================================================================
// 📅 Event Form Types
// ============================================================================

/**
 * Input data for creating or editing an event.
 * This is what the event form submits.
 */
export interface EventFormInput {
  /** Event title (required) */
  title: string
  /** Full description */
  description?: string
  /** Event type ID */
  type_id?: string
  /** Category ID */
  category_id?: string
  /** Venue ID */
  venue_id?: string
  /** Organizer ID */
  organizer_id?: string
  /** Start date/time (ISO string) */
  start_at: string
  /** End date/time (ISO string, optional) */
  end_at?: string
  /** Is this an all-day event? */
  is_all_day: boolean
  /** Thumbnail image URL */
  image_url?: string
  /** Flyer image URL */
  flyer_url?: string
  /** Source attribution URL */
  source_url?: string
  /** Ticket purchase URL */
  ticket_url?: string
  /** Minimum price */
  price_min?: number
  /** Maximum price */
  price_max?: number
  /** Is this event free? */
  is_free: boolean
  /** Event status */
  status: EventStatus
  /** Array of tag IDs */
  tag_ids: string[]
}

// ============================================================================
// 📍 Venue Form Types
// ============================================================================

/**
 * Input data for creating or editing a venue.
 */
export interface VenueFormInput {
  /** Venue name (required) */
  name: string
  /** Street address */
  address?: string
  /** City (defaults to Milwaukee) */
  city: string
  /** State (defaults to WI) */
  state: string
  /** ZIP code */
  zip?: string
  /** Latitude for map */
  lat?: number
  /** Longitude for map */
  lng?: number
  /** Website URL */
  website?: string
  /** Image URL */
  image_url?: string
}

// ============================================================================
// 👥 Organizer Form Types
// ============================================================================

/**
 * Input data for creating or editing an organizer.
 */
export interface OrganizerFormInput {
  /** Organizer name (required) */
  name: string
  /** About the organizer */
  description?: string
  /** Logo image URL */
  logo_url?: string
  /** Website URL */
  website?: string
  /** Instagram handle (without @) */
  instagram_handle?: string
}

// ============================================================================
// 🔐 Auth Form Types
// ============================================================================

/**
 * Input data for the login form.
 */
export interface LoginFormInput {
  /** Email address */
  email: string
  /** Password */
  password: string
}
