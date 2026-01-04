/**
 * SERIES LIMITS & CONFIGURATION
 * ==============================
 * Constants defining limits and behavior for different series types.
 *
 * These help validate user input and control how events are generated.
 *
 * @module lib/constants/series-limits
 */

// ============================================================================
// SERIES TYPE CONFIGURATION
// ============================================================================

/**
 * Configuration for each series type
 */
export interface SeriesTypeConfig {
  /** Minimum number of sessions/events */
  minSessions: number;
  /** Maximum sessions (null = unlimited for recurring) */
  maxSessions: number | null;
  /** How dates are selected */
  dateSelection: 'manual' | 'consecutive' | 'pattern';
  /** Human-readable description */
  description: string;
  /** Emoji for display */
  emoji: string;
  /** For recurring: how many weeks ahead to generate */
  generationWindow?: number;
}

/**
 * All series type configurations
 */
export const SERIES_LIMITS: Record<string, SeriesTypeConfig> = {
  class: {
    minSessions: 2,
    maxSessions: 52,
    dateSelection: 'manual',
    description: 'Multi-session class (2-52 sessions)',
    emoji: '📚',
  },
  camp: {
    minSessions: 2,
    maxSessions: 14,
    dateSelection: 'consecutive',
    description: 'Day camp or intensive (2-14 days)',
    emoji: '🏕️',
  },
  workshop: {
    minSessions: 2,
    maxSessions: 12,
    dateSelection: 'manual',
    description: 'Workshop series (2-12 sessions)',
    emoji: '🔧',
  },
  recurring: {
    minSessions: 1,
    maxSessions: null,
    dateSelection: 'pattern',
    generationWindow: 12, // weeks
    description: 'Recurring event (weekly, monthly, etc.)',
    emoji: '🔁',
  },
  festival: {
    minSessions: 1,
    maxSessions: 14,
    dateSelection: 'consecutive',
    description: 'Multi-day festival (1-14 days)',
    emoji: '🎪',
  },
  season: {
    minSessions: 2,
    maxSessions: 100,
    dateSelection: 'manual',
    description: 'Performance season (2-100 events)',
    emoji: '🎭',
  },
};

/**
 * Get configuration for a series type
 */
export function getSeriesConfig(type: string): SeriesTypeConfig | null {
  return SERIES_LIMITS[type] || null;
}

/**
 * Check if a session count is valid for a series type
 */
export function isValidSessionCount(type: string, count: number): boolean {
  const config = SERIES_LIMITS[type];
  if (!config) return false;

  if (count < config.minSessions) return false;
  if (config.maxSessions !== null && count > config.maxSessions) return false;

  return true;
}

// ============================================================================
// SERIES TYPE OPTIONS FOR UI
// ============================================================================

/**
 * Series types for dropdown/selection
 */
export const SERIES_TYPE_OPTIONS = [
  {
    value: 'class',
    label: 'Class',
    description: 'Multi-week course with sequential sessions',
    emoji: '📚',
  },
  {
    value: 'camp',
    label: 'Camp',
    description: 'Day camp or intensive program (consecutive days)',
    emoji: '🏕️',
  },
  {
    value: 'workshop',
    label: 'Workshop',
    description: 'Workshop series with multiple sessions',
    emoji: '🔧',
  },
  {
    value: 'festival',
    label: 'Festival',
    description: 'Multi-day festival or event',
    emoji: '🎪',
  },
  {
    value: 'season',
    label: 'Season',
    description: 'Performance or sports season',
    emoji: '🎭',
  },
] as const;

// ============================================================================
// RECURRENCE CONFIGURATION
// ============================================================================

/**
 * Maximum events to generate upfront for recurring series
 */
export const MAX_RECURRING_GENERATION = 52; // 1 year of weekly events

/**
 * Minimum events to maintain for recurring series
 * When remaining < this, generate more
 */
export const MIN_RECURRING_BUFFER = 8;

/**
 * Default generation window in weeks
 */
export const DEFAULT_GENERATION_WINDOW = 12;

/**
 * Recurrence frequency options
 */
export const RECURRENCE_FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily', description: 'Every day' },
  { value: 'weekly', label: 'Weekly', description: 'Same day each week' },
  { value: 'biweekly', label: 'Biweekly', description: 'Every two weeks' },
  { value: 'monthly', label: 'Monthly', description: 'Same day each month' },
] as const;

// ============================================================================
// VALIDATION LIMITS
// ============================================================================

/**
 * Maximum title length
 */
export const MAX_TITLE_LENGTH = 100;

/**
 * Maximum description length
 */
export const MAX_DESCRIPTION_LENGTH = 5000;

/**
 * Maximum short description length
 */
export const MAX_SHORT_DESCRIPTION_LENGTH = 160;

/**
 * Maximum image file size (5MB)
 */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Maximum image dimensions
 */
export const MAX_IMAGE_DIMENSIONS = { width: 2000, height: 2000 };

/**
 * Draft expiration days
 */
export const DRAFT_EXPIRATION_DAYS = 30;

/**
 * Auto-save debounce delay (ms)
 */
export const AUTO_SAVE_DELAY = 2000;

/**
 * Auto-save interval (ms) - save periodically even without changes
 */
export const AUTO_SAVE_INTERVAL = 30000;
