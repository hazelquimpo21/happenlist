// ============================================================================
// 📅 HAPPENLIST - Date Utilities
// ============================================================================
// Helper functions for formatting and manipulating dates.
// All dates are stored in UTC and displayed in America/Chicago timezone.
// ============================================================================

import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isThisWeek,
  isThisMonth,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  parseISO,
  isSameDay,
} from 'date-fns'

// ============================================================================
// 🌍 Timezone Configuration
// ============================================================================

/**
 * The timezone used for displaying dates.
 * Milwaukee is in Central Time.
 */
export const TIMEZONE = 'America/Chicago'

// ============================================================================
// 📆 Date Formatting Functions
// ============================================================================

/**
 * Formats an event date for display.
 *
 * @example
 * formatEventDate('2024-01-15T19:00:00Z')
 * // => 'Mon, Jan 15'
 *
 * formatEventDate('2024-01-15T19:00:00Z', 'full')
 * // => 'Monday, January 15, 2024'
 *
 * @param dateString - ISO date string
 * @param variant - 'short' (default), 'medium', or 'full'
 * @returns Formatted date string
 */
export function formatEventDate(
  dateString: string,
  variant: 'short' | 'medium' | 'full' = 'short'
): string {
  const date = parseISO(dateString)

  switch (variant) {
    case 'short':
      return format(date, 'EEE, MMM d') // Mon, Jan 15
    case 'medium':
      return format(date, 'EEEE, MMMM d') // Monday, January 15
    case 'full':
      return format(date, 'EEEE, MMMM d, yyyy') // Monday, January 15, 2024
    default:
      return format(date, 'EEE, MMM d')
  }
}

/**
 * Formats an event time for display.
 *
 * @example
 * formatEventTime('2024-01-15T19:00:00Z')
 * // => '7:00 PM'
 *
 * @param dateString - ISO date string
 * @returns Formatted time string
 */
export function formatEventTime(dateString: string): string {
  const date = parseISO(dateString)
  return format(date, 'h:mm a') // 7:00 PM
}

/**
 * Formats a date range for an event.
 *
 * @example
 * formatEventDateRange('2024-01-15T19:00:00Z', '2024-01-15T22:00:00Z')
 * // => 'Mon, Jan 15 · 7:00 PM - 10:00 PM'
 *
 * formatEventDateRange('2024-01-15T19:00:00Z', '2024-01-16T22:00:00Z')
 * // => 'Mon, Jan 15 - Tue, Jan 16'
 *
 * @param startDate - ISO date string for start
 * @param endDate - ISO date string for end (optional)
 * @returns Formatted date range string
 */
export function formatEventDateRange(
  startDate: string,
  endDate?: string | null
): string {
  const start = parseISO(startDate)
  const startFormatted = formatEventDate(startDate)
  const startTime = formatEventTime(startDate)

  if (!endDate) {
    return `${startFormatted} · ${startTime}`
  }

  const end = parseISO(endDate)
  const endTime = formatEventTime(endDate)

  // Same day event
  if (isSameDay(start, end)) {
    return `${startFormatted} · ${startTime} - ${endTime}`
  }

  // Multi-day event
  const endFormatted = formatEventDate(endDate)
  return `${startFormatted} - ${endFormatted}`
}

/**
 * Returns a human-friendly relative date string.
 *
 * @example
 * getRelativeDate('2024-01-15T19:00:00Z')
 * // => 'Today' | 'Tomorrow' | 'This weekend' | 'Mon, Jan 15'
 *
 * @param dateString - ISO date string
 * @returns Relative date description
 */
export function getRelativeDate(dateString: string): string {
  const date = parseISO(dateString)

  if (isToday(date)) {
    return 'Today'
  }

  if (isTomorrow(date)) {
    return 'Tomorrow'
  }

  // Check if it's this weekend (Sat or Sun)
  const dayOfWeek = date.getDay()
  const now = new Date()
  const daysUntil = Math.ceil(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysUntil <= 7 && (dayOfWeek === 0 || dayOfWeek === 6)) {
    return 'This weekend'
  }

  if (isThisWeek(date)) {
    return format(date, 'EEEE') // Day name like "Wednesday"
  }

  return formatEventDate(dateString)
}

/**
 * Returns "time ago" format for recent items.
 *
 * @example
 * getTimeAgo('2024-01-15T19:00:00Z')
 * // => '2 hours ago' | '3 days ago'
 *
 * @param dateString - ISO date string
 * @returns Relative time string
 */
export function getTimeAgo(dateString: string): string {
  const date = parseISO(dateString)
  return formatDistanceToNow(date, { addSuffix: true })
}

// ============================================================================
// 📆 Date Range Helpers (for filters)
// ============================================================================

/**
 * Returns date ranges for common filter options.
 * All times are in UTC.
 *
 * @example
 * getDateRange('this-weekend')
 * // => { from: '2024-01-13T00:00:00Z', to: '2024-01-14T23:59:59Z' }
 *
 * @param filter - Filter option name
 * @returns Object with from and to ISO date strings
 */
export function getDateRange(
  filter: 'today' | 'tomorrow' | 'this-weekend' | 'this-week' | 'this-month'
): { from: string; to: string } {
  const now = new Date()

  switch (filter) {
    case 'today':
      return {
        from: startOfDay(now).toISOString(),
        to: endOfDay(now).toISOString(),
      }

    case 'tomorrow':
      const tomorrow = addDays(now, 1)
      return {
        from: startOfDay(tomorrow).toISOString(),
        to: endOfDay(tomorrow).toISOString(),
      }

    case 'this-weekend':
      // Find next Saturday
      const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7
      const saturday = addDays(now, daysUntilSaturday === 0 ? 0 : daysUntilSaturday)
      const sunday = addDays(saturday, 1)
      return {
        from: startOfDay(saturday).toISOString(),
        to: endOfDay(sunday).toISOString(),
      }

    case 'this-week':
      return {
        from: startOfWeek(now, { weekStartsOn: 0 }).toISOString(),
        to: endOfWeek(now, { weekStartsOn: 0 }).toISOString(),
      }

    case 'this-month':
      return {
        from: startOfMonth(now).toISOString(),
        to: endOfMonth(now).toISOString(),
      }

    default:
      return {
        from: startOfDay(now).toISOString(),
        to: endOfMonth(now).toISOString(),
      }
  }
}

// ============================================================================
// 🔧 Date Validation Helpers
// ============================================================================

/**
 * Checks if a date string is valid.
 *
 * @param dateString - String to validate
 * @returns True if valid ISO date
 */
export function isValidDate(dateString: string): boolean {
  try {
    const date = parseISO(dateString)
    return !isNaN(date.getTime())
  } catch {
    return false
  }
}

/**
 * Checks if an event is in the past.
 *
 * @param dateString - Event start date
 * @returns True if the event has already started
 */
export function isPastEvent(dateString: string): boolean {
  const date = parseISO(dateString)
  return date < new Date()
}

/**
 * Checks if an event is happening soon (within 24 hours).
 *
 * @param dateString - Event start date
 * @returns True if event starts within 24 hours
 */
export function isHappeningSoon(dateString: string): boolean {
  const date = parseISO(dateString)
  const now = new Date()
  const hoursUntil = (date.getTime() - now.getTime()) / (1000 * 60 * 60)
  return hoursUntil > 0 && hoursUntil <= 24
}
