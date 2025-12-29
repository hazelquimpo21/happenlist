/**
 * DATE UTILITIES
 * ==============
 * Formatting and manipulation functions for dates.
 */

import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  isThisWeek,
  startOfDay,
  endOfDay,
  startOfWeek,
  addDays,
  isFriday,
  isSaturday,
  isSunday,
  nextFriday,
  getDay,
} from 'date-fns';

/**
 * Format options for event dates.
 */
type DateFormatOption = 'short' | 'long' | 'relative';

interface FormatEventDateOptions {
  format?: DateFormatOption;
  includeTime?: boolean;
}

/**
 * Formats an event datetime for display.
 *
 * @example
 * formatEventDate('2025-02-14T19:00:00')
 * // => 'Feb 14 - 7:00 PM'
 *
 * formatEventDate('2025-02-14T19:00:00', { format: 'relative' })
 * // => 'Tomorrow at 7:00 PM'
 *
 * formatEventDate('2025-02-14T19:00:00', { format: 'long' })
 * // => 'Friday, February 14, 2025 at 7:00 PM'
 */
export function formatEventDate(
  dateString: string,
  options: FormatEventDateOptions = {}
): string {
  const { format: fmt = 'short', includeTime = true } = options;
  const date = parseISO(dateString);

  // Relative format
  if (fmt === 'relative') {
    if (isToday(date)) {
      return includeTime ? `Today at ${format(date, 'h:mm a')}` : 'Today';
    }
    if (isTomorrow(date)) {
      return includeTime ? `Tomorrow at ${format(date, 'h:mm a')}` : 'Tomorrow';
    }
  }

  // Short format: "Feb 14 - 7:00 PM"
  if (fmt === 'short') {
    const dateStr = format(date, 'MMM d');
    return includeTime ? `${dateStr} - ${format(date, 'h:mm a')}` : dateStr;
  }

  // Long format: "Friday, February 14, 2025 at 7:00 PM"
  const dateStr = format(date, 'EEEE, MMMM d, yyyy');
  return includeTime ? `${dateStr} at ${format(date, 'h:mm a')}` : dateStr;
}

/**
 * Formats a date range for display.
 *
 * @example
 * formatDateRange('2025-02-14', '2025-02-16')
 * // => 'Feb 14 - Feb 16'
 */
export function formatDateRange(start?: string, end?: string): string {
  if (!start && !end) return '';
  if (!start) return `Until ${format(parseISO(end!), 'MMM d')}`;
  if (!end) return `From ${format(parseISO(start), 'MMM d')}`;

  const startDate = parseISO(start);
  const endDate = parseISO(end);

  if (format(startDate, 'MMM') === format(endDate, 'MMM')) {
    // Same month: "Feb 14 - 16"
    return `${format(startDate, 'MMM d')} - ${format(endDate, 'd')}`;
  }

  // Different months: "Feb 14 - Mar 2"
  return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`;
}

/**
 * Gets today's date range.
 */
export function getTodayRange(): { start: string; end: string } {
  const today = new Date();
  return {
    start: format(startOfDay(today), 'yyyy-MM-dd'),
    end: format(endOfDay(today), 'yyyy-MM-dd'),
  };
}

/**
 * Gets this weekend's date range (Friday - Sunday).
 */
export function getThisWeekendRange(): { start: string; end: string } {
  const today = new Date();
  const dayOfWeek = getDay(today);

  // Find the next Friday (or today if it's already Fri/Sat/Sun)
  let friday: Date;
  if (isFriday(today) || isSaturday(today) || isSunday(today)) {
    // We're in the weekend, use this Friday
    friday = startOfWeek(today, { weekStartsOn: 5 }); // Friday as start of week
    if (dayOfWeek < 5) {
      friday = addDays(startOfWeek(today, { weekStartsOn: 1 }), 4);
    } else {
      friday = addDays(today, -(dayOfWeek - 5));
    }
  } else {
    friday = nextFriday(today);
  }

  const sunday = addDays(friday, 2);

  return {
    start: format(friday, 'yyyy-MM-dd'),
    end: format(endOfDay(sunday), 'yyyy-MM-dd'),
  };
}

/**
 * Gets this week's date range (today through Sunday).
 */
export function getThisWeekRange(): { start: string; end: string } {
  const today = new Date();
  const sunday = addDays(startOfWeek(today, { weekStartsOn: 1 }), 6);

  return {
    start: format(today, 'yyyy-MM-dd'),
    end: format(endOfDay(sunday), 'yyyy-MM-dd'),
  };
}

/**
 * Gets a month's date range.
 */
export function getMonthRange(
  year: number,
  month: number
): { start: string; end: string } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  };
}

/**
 * Parses a month name to number (1-12).
 */
export function parseMonthName(monthName: string): number {
  const months: Record<string, number> = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12,
  };

  return months[monthName.toLowerCase()] || 1;
}
