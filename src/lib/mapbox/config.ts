/**
 * MAPBOX CONFIGURATION
 * ====================
 * Configuration and utilities for Mapbox integration.
 *
 * Environment Variable Required:
 *   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN - Your Mapbox access token
 *
 * Get a token at: https://account.mapbox.com/access-tokens/
 *
 * @module lib/mapbox/config
 */

// ============================================================================
// ACCESS TOKEN
// ============================================================================

/**
 * Mapbox access token from environment variable.
 * Must be set in .env.local as NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
 */
export const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

/**
 * Checks if Mapbox is configured.
 * @returns true if access token is set
 */
export function isMapboxConfigured(): boolean {
  return Boolean(MAPBOX_ACCESS_TOKEN);
}

// ============================================================================
// MAP STYLES
// ============================================================================

/**
 * Available Mapbox map styles.
 * Using Mapbox's standard styles for consistency.
 */
export const MAP_STYLES = {
  /** Clean, light style for event cards and detail pages */
  light: 'mapbox://styles/mapbox/light-v11',

  /** Dark style for night mode (future) */
  dark: 'mapbox://styles/mapbox/dark-v11',

  /** Street-focused style with more detail */
  streets: 'mapbox://styles/mapbox/streets-v12',

  /** Outdoor-focused style for parks and outdoor venues */
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
} as const;

export type MapStyle = keyof typeof MAP_STYLES;

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

/**
 * Default map center - Milwaukee, WI
 * [longitude, latitude]
 */
export const DEFAULT_CENTER: [number, number] = [-87.9065, 43.0389];

/**
 * Default zoom levels for different contexts.
 */
export const ZOOM_LEVELS = {
  /** City overview */
  city: 11,

  /** Neighborhood level */
  neighborhood: 13,

  /** Venue detail */
  venue: 15,

  /** Street level */
  street: 17,
} as const;

/**
 * Default map options.
 */
export const DEFAULT_MAP_OPTIONS = {
  center: DEFAULT_CENTER,
  zoom: ZOOM_LEVELS.neighborhood,
  style: MAP_STYLES.light,
  attributionControl: false,
  logoPosition: 'bottom-right' as const,
};

// ============================================================================
// GEOCODING SETTINGS
// ============================================================================

/**
 * Mapbox Geocoding API settings.
 */
export const GEOCODING_CONFIG = {
  /** API endpoint */
  endpoint: 'https://api.mapbox.com/geocoding/v5/mapbox.places',

  /** Limit results to US */
  country: 'us',

  /** Bias results toward Milwaukee area */
  proximity: DEFAULT_CENTER,

  /** Limit results to specific types */
  types: ['address', 'poi'],

  /** Maximum results to return */
  limit: 5,
};

// ============================================================================
// MARKER STYLES
// ============================================================================

/**
 * Marker colors for different venue types.
 */
export const MARKER_COLORS: Record<string, string> = {
  entertainment: '#E86C5D', // coral
  arts: '#9B59B6',          // purple
  sports: '#3498DB',        // blue
  outdoor: '#7B9E87',       // sage
  restaurant: '#F39C12',    // orange
  community: '#E74C3C',     // red
  education: '#1ABC9C',     // teal
  venue: '#7A7670',         // stone (default)
};

/**
 * Gets the marker color for a venue type.
 */
export function getMarkerColor(venueType: string): string {
  return MARKER_COLORS[venueType] || MARKER_COLORS.venue;
}
