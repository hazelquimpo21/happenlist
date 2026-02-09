/**
 * SERIES TYPES
 * ============
 * Type definitions for event series and related entities.
 *
 * Series group multiple events together:
 *   - Classes (Pottery 101 - 6 weeks)
 *   - Camps (Summer Art Camp - 5 days)
 *   - Workshops (Bread Baking - 3 sessions)
 *   - Recurring events (Weekly Jazz Jam)
 *   - Festivals (Summerfest - 3 days)
 *   - Seasons (Symphony 2025 Season)
 */

import type { Database, RecurrenceRule, SeriesType, AttendanceMode, SkillLevel } from '@/lib/supabase/types';

// ============================================================================
// BASE TYPES FROM DATABASE
// ============================================================================

/** Raw series row from database */
export type SeriesRow = Database['public']['Tables']['series']['Row'];

// ============================================================================
// SERIES DISPLAY TYPES
// ============================================================================

/**
 * Series with all related entities (for detail pages).
 * Includes category, location, organizer relationships.
 */
export interface SeriesWithDetails extends SeriesRow {
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  } | null;
  location: {
    id: string;
    name: string;
    slug: string;
    city: string;
    address_line: string | null;
    venue_type: string;
  } | null;
  organizer: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    description: string | null;
    website_url: string | null;
  } | null;
  /** Number of upcoming events in this series */
  upcoming_event_count?: number;
  /** Date of next event in this series */
  next_event_date?: string | null;
}

/**
 * Simplified series for cards and lists.
 * Contains only fields needed for display in grids.
 */
export interface SeriesCard {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  series_type: SeriesType;
  total_sessions: number | null;
  sessions_remaining: number | null;
  start_date: string | null;
  end_date: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  price_type: string;
  price_low: number | null;
  price_high: number | null;
  is_free: boolean;
  heart_count: number;
  category_name: string | null;
  category_slug: string | null;
  location_name: string | null;
  location_slug: string | null;
  organizer_name: string | null;
  organizer_slug: string | null;
  /** Number of upcoming events */
  upcoming_event_count?: number;
  /** Next event date */
  next_event_date?: string | null;

  // -- Camps/classes card display fields --
  /** How participants attend: 'registered' | 'drop_in' | 'hybrid' */
  attendance_mode?: AttendanceMode;
  /** Drop-in / single-session price (shown as badge on card) */
  per_session_price?: number | null;
  /** Minimum age for participants */
  age_low?: number | null;
  /** Maximum age for participants */
  age_high?: number | null;
  /** Skill level for classes */
  skill_level?: SkillLevel | null;
  /** Whether extended care (after care) is available -- derived: extended_end_time IS NOT NULL */
  has_extended_care?: boolean;
}

/**
 * Event within a series (simplified).
 * Used for listing events on series detail page.
 */
export interface SeriesEvent {
  id: string;
  title: string;
  slug: string;
  instance_date: string;
  start_datetime: string;
  end_datetime: string | null;
  series_sequence: number | null;
  status: string;
  location_name: string | null;
  location_slug: string | null;
}

// ============================================================================
// SERIES QUERY TYPES
// ============================================================================

/**
 * Parameters for querying series.
 */
export interface SeriesQueryParams {
  /** Search query (title, description) */
  search?: string;
  /** Filter by series type */
  type?: SeriesType;
  /** Filter by category slug */
  categorySlug?: string;
  /** Filter by organizer slug */
  organizerSlug?: string;
  /** Filter by location/city */
  city?: string;
  /** Only free series */
  isFree?: boolean;
  /** Only featured series */
  featured?: boolean;
  /** Sort order */
  orderBy?: SeriesSortOption;
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page */
  limit?: number;
  /** Include past series */
  includePast?: boolean;

  // -- Phase B: Camps/classes filters --

  /** Filter by attendance mode (registered, drop_in, hybrid) */
  attendanceMode?: AttendanceMode;
  /** Filter by skill level (beginner, intermediate, advanced, all_levels) */
  skillLevel?: SkillLevel;
  /** Filter series suitable for this age (matches age_low <= age <= age_high) */
  age?: number;
  /** Only show series with extended care (before/after care available) */
  hasExtendedCare?: boolean;
  /** Filter by day of week (0=Sun..6=Sat) */
  dayOfWeek?: number;
}

/**
 * Available sort options for series.
 */
export type SeriesSortOption =
  | 'start-date-asc'   // Soonest first
  | 'start-date-desc'  // Latest first
  | 'title-asc'        // Alphabetical
  | 'popular';         // Most hearts

/**
 * Result from series query.
 */
export interface SeriesQueryResult {
  series: SeriesCard[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================================
// SERIES TYPE DISPLAY INFO
// ============================================================================

/**
 * Display configuration for each series type.
 * Used for badges, labels, and icons.
 */
export interface SeriesTypeInfo {
  type: SeriesType;
  label: string;
  labelPlural: string;
  description: string;
  icon: string; // Lucide icon name
  badgeColor: string; // Tailwind class
}

/**
 * Map of series type to display info.
 */
export const SERIES_TYPE_INFO: Record<SeriesType, SeriesTypeInfo> = {
  class: {
    type: 'class',
    label: 'Class',
    labelPlural: 'Classes',
    description: 'Multi-session educational class',
    icon: 'GraduationCap',
    badgeColor: 'bg-blue-100 text-blue-800',
  },
  camp: {
    type: 'camp',
    label: 'Camp',
    labelPlural: 'Camps',
    description: 'Day camp or intensive program',
    icon: 'Tent',
    badgeColor: 'bg-green-100 text-green-800',
  },
  workshop: {
    type: 'workshop',
    label: 'Workshop',
    labelPlural: 'Workshops',
    description: 'Workshop series',
    icon: 'Wrench',
    badgeColor: 'bg-amber-100 text-amber-800',
  },
  recurring: {
    type: 'recurring',
    label: 'Recurring',
    labelPlural: 'Recurring Events',
    description: 'Regular repeating event',
    icon: 'Repeat',
    badgeColor: 'bg-purple-100 text-purple-800',
  },
  festival: {
    type: 'festival',
    label: 'Festival',
    labelPlural: 'Festivals',
    description: 'Multi-day festival',
    icon: 'PartyPopper',
    badgeColor: 'bg-pink-100 text-pink-800',
  },
  season: {
    type: 'season',
    label: 'Season',
    labelPlural: 'Seasons',
    description: 'Performance or event season',
    icon: 'Calendar',
    badgeColor: 'bg-indigo-100 text-indigo-800',
  },
};

// ============================================================================
// ATTENDANCE MODE DISPLAY INFO
// ============================================================================

/**
 * Display labels and descriptions for each attendance mode.
 * Used for badges on cards and detail pages.
 */
export const ATTENDANCE_MODE_INFO: Record<AttendanceMode, {
  label: string;
  description: string;
  badgeColor: string;
}> = {
  registered: {
    label: 'Registration Required',
    description: 'Must sign up for the full series',
    badgeColor: 'bg-blue-100 text-blue-800',
  },
  drop_in: {
    label: 'Drop-in Welcome',
    description: 'Show up to any individual session',
    badgeColor: 'bg-green-100 text-green-800',
  },
  hybrid: {
    label: 'Register or Drop In',
    description: 'Register for the series or drop in to individual sessions',
    badgeColor: 'bg-teal-100 text-teal-800',
  },
};

// ============================================================================
// SKILL LEVEL DISPLAY INFO
// ============================================================================

/**
 * Display labels for skill levels.
 * Used for badges on class cards and detail pages.
 */
export const SKILL_LEVEL_INFO: Record<SkillLevel, {
  label: string;
  badgeColor: string;
}> = {
  beginner: {
    label: 'Beginner',
    badgeColor: 'bg-emerald-100 text-emerald-800',
  },
  intermediate: {
    label: 'Intermediate',
    badgeColor: 'bg-amber-100 text-amber-800',
  },
  advanced: {
    label: 'Advanced',
    badgeColor: 'bg-red-100 text-red-800',
  },
  all_levels: {
    label: 'All Levels',
    badgeColor: 'bg-violet-100 text-violet-800',
  },
};

// ============================================================================
// RECURRENCE HELPERS
// ============================================================================

/**
 * Human-readable recurrence frequency.
 */
export const RECURRENCE_LABELS: Record<RecurrenceRule['frequency'], string> = {
  daily: 'Every day',
  weekly: 'Every week',
  biweekly: 'Every 2 weeks',
  monthly: 'Every month',
  yearly: 'Every year',
};

/**
 * Day of week labels (0 = Sunday).
 */
export const DAY_OF_WEEK_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/**
 * Short day labels for compact display.
 */
export const DAY_OF_WEEK_SHORT = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
] as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get display info for a series type.
 */
export function getSeriesTypeInfo(type: string): SeriesTypeInfo {
  return SERIES_TYPE_INFO[type as SeriesType] || SERIES_TYPE_INFO.class;
}

/**
 * Get display label for an attendance mode.
 * Returns null for unrecognized values (defensive).
 */
export function getAttendanceModeLabel(mode: string | null | undefined): string | null {
  if (!mode) return null;
  return ATTENDANCE_MODE_INFO[mode as AttendanceMode]?.label ?? null;
}

/**
 * Get display label for a skill level.
 * Returns null for unrecognized values (defensive).
 */
export function getSkillLevelLabel(level: string | null | undefined): string | null {
  if (!level) return null;
  return SKILL_LEVEL_INFO[level as SkillLevel]?.label ?? null;
}

/**
 * Format an age range to a human-readable string.
 * Examples: "Ages 6-12", "Ages 6+", "Ages 0-5", null (if no age set)
 */
export function formatAgeRange(ageLow: number | null | undefined, ageHigh: number | null | undefined): string | null {
  if (ageLow == null && ageHigh == null) return null;
  if (ageLow != null && ageHigh != null) return `Ages ${ageLow}-${ageHigh}`;
  if (ageLow != null) return `Ages ${ageLow}+`;
  return `Ages up to ${ageHigh}`;
}

/**
 * Format a TIME string (HH:MM:SS or HH:MM) to 12-hour display.
 * Example: "09:00" -> "9:00 AM", "17:30:00" -> "5:30 PM"
 */
export function formatTimeDisplay(time: string | null | undefined): string | null {
  if (!time) return null;
  const [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format recurrence rule to human-readable string.
 * Example: "Every Tuesday at 7:00 PM"
 */
export function formatRecurrence(rule: RecurrenceRule | null): string {
  if (!rule) return '';

  const parts: string[] = [];

  // Frequency
  if (rule.frequency === 'weekly' && rule.days_of_week?.length === 1) {
    parts.push(`Every ${DAY_OF_WEEK_LABELS[rule.days_of_week[0]]}`);
  } else if (rule.frequency === 'biweekly' && rule.days_of_week?.length === 1) {
    parts.push(`Every other ${DAY_OF_WEEK_LABELS[rule.days_of_week[0]]}`);
  } else if (rule.frequency === 'monthly' && rule.day_of_month) {
    parts.push(`Monthly on the ${ordinal(rule.day_of_month)}`);
  } else {
    parts.push(RECURRENCE_LABELS[rule.frequency] || rule.frequency);
  }

  // Time
  if (rule.time) {
    const [hours, minutes] = rule.time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    parts.push(`at ${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`);
  }

  return parts.join(' ');
}

/**
 * Convert number to ordinal (1 -> "1st", 2 -> "2nd", etc.)
 */
function ordinal(n: number): string {
  const suffix = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
}
