// ============================================================================
// 📋 HAPPENLIST - Application Constants
// ============================================================================
// Centralized configuration values used throughout the application.
// Change these values here and they'll update everywhere!
// ============================================================================

// ============================================================================
// 📊 Pagination Settings
// ============================================================================

/** Default number of items per page */
export const DEFAULT_PAGE_SIZE = 20

/** Maximum allowed items per page (prevents abuse) */
export const MAX_PAGE_SIZE = 100

// ============================================================================
// 📅 Date Format Patterns
// ============================================================================

/**
 * Date format patterns used throughout the app.
 * Uses date-fns format strings.
 */
export const DATE_FORMATS = {
  /** Display format: Jan 5, 2025 */
  display: 'MMM d, yyyy',
  /** Display with time: Jan 5, 2025 7:00 PM */
  displayWithTime: 'MMM d, yyyy h:mm a',
  /** Time only: 7:00 PM */
  displayTime: 'h:mm a',
  /** Input format for date pickers: 2025-01-05 */
  input: 'yyyy-MM-dd',
  /** Input format for datetime pickers: 2025-01-05T19:00 */
  inputDateTime: "yyyy-MM-dd'T'HH:mm",
  /** ISO 8601 format for APIs */
  iso: "yyyy-MM-dd'T'HH:mm:ssXXX",
} as const

// ============================================================================
// 🌍 Timezone
// ============================================================================

/** Milwaukee's timezone - used for date display */
export const TIMEZONE = 'America/Chicago'

// ============================================================================
// 📊 Event Statuses
// ============================================================================

/**
 * Possible event statuses.
 * Used for filtering and display.
 */
export const EVENT_STATUSES = [
  'draft',
  'published',
  'cancelled',
  'archived',
] as const

export type EventStatus = (typeof EVENT_STATUSES)[number]

/**
 * Human-readable labels and colors for each status.
 */
export const EVENT_STATUS_CONFIG: Record<
  EventStatus,
  { label: string; color: string; bgColor: string }
> = {
  draft: {
    label: 'Draft',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
  },
  published: {
    label: 'Published',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
  archived: {
    label: 'Archived',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
}

// ============================================================================
// 🖼️ Image Settings
// ============================================================================

/**
 * Image upload constraints for different types.
 */
export const IMAGE_LIMITS = {
  /** Event thumbnail image */
  thumbnail: {
    maxSize: 2 * 1024 * 1024, // 2MB
    maxWidth: 800,
    maxHeight: 600,
  },
  /** Event flyer/poster image */
  flyer: {
    maxSize: 5 * 1024 * 1024, // 5MB
    maxWidth: 1200,
    maxHeight: 1600,
  },
  /** Venue image */
  venue: {
    maxSize: 2 * 1024 * 1024, // 2MB
    maxWidth: 800,
    maxHeight: 600,
  },
  /** Organizer logo */
  organizer: {
    maxSize: 1 * 1024 * 1024, // 1MB
    maxWidth: 400,
    maxHeight: 400,
  },
} as const

/** Accepted image MIME types for uploads */
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

// ============================================================================
// 🔍 Filter Options
// ============================================================================

/**
 * Date filter presets for event browsing.
 */
export const DATE_FILTER_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'this-weekend', label: 'This Weekend' },
  { value: 'this-week', label: 'This Week' },
  { value: 'this-month', label: 'This Month' },
] as const

/**
 * Sort options for event listings.
 */
export const SORT_OPTIONS = [
  { value: 'date', label: 'Date (soonest first)' },
  { value: 'created', label: 'Recently Added' },
  { value: 'title', label: 'Alphabetical' },
] as const

// ============================================================================
// 🛣️ Routes
// ============================================================================

/**
 * Application route paths.
 * Use these instead of hardcoding paths throughout the app.
 */
export const ROUTES = {
  // Public routes
  home: '/',
  events: '/events',
  eventDetail: (slug: string) => `/events/${slug}`,
  venues: '/venues',
  venueDetail: (slug: string) => `/venues/${slug}`,
  organizers: '/organizers',
  organizerDetail: (slug: string) => `/organizers/${slug}`,
  categoryEvents: (slug: string) => `/categories/${slug}`,

  // Auth routes
  login: '/login',

  // Admin routes
  admin: '/admin',
  adminEvents: '/admin/events',
  adminEventNew: '/admin/events/new',
  adminEventEdit: (id: string) => `/admin/events/${id}/edit`,
  adminVenues: '/admin/venues',
  adminVenueNew: '/admin/venues/new',
  adminVenueEdit: (id: string) => `/admin/venues/${id}/edit`,
  adminOrganizers: '/admin/organizers',
  adminOrganizerNew: '/admin/organizers/new',
  adminOrganizerEdit: (id: string) => `/admin/organizers/${id}/edit`,
} as const

// ============================================================================
// 🔧 Supabase Storage
// ============================================================================

/** Supabase storage bucket name */
export const STORAGE_BUCKET = 'happenlist'

/** Storage path structure */
export const STORAGE_PATHS = {
  eventThumbnails: 'events/thumbnails',
  eventFlyers: 'events/flyers',
  venues: 'venues',
  organizers: 'organizers',
} as const
