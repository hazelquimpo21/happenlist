/**
 * APP CONFIGURATION
 * =================
 * Central configuration values for the application.
 */

/**
 * Site metadata and branding.
 */
export const SITE_CONFIG = {
  name: 'Happenlist',
  tagline: 'Discover Local Events',
  description: 'Find concerts, festivals, classes, workshops, and more happening in your area.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  defaultImage: '/og-image.jpg',
} as const;

/**
 * Pagination defaults.
 */
export const PAGINATION = {
  defaultLimit: 24,
  maxLimit: 100,
} as const;

/**
 * Feature flags for Phase 1.
 */
export const FEATURES = {
  enableHearts: false,     // Phase 3
  enableAuth: false,       // Phase 3
  enableDashboard: false,  // Phase 4
  enableSeries: false,     // Phase 2
} as const;

/**
 * Default timezone for events.
 */
export const DEFAULT_TIMEZONE = 'America/Chicago';
