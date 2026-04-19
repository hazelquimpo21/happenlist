/**
 * DATE UTILITIES
 * ==============
 * Formatting and manipulation functions for dates.
 *
 * TIMEZONE HANDLING:
 * All event times are America/Chicago. Every formatter in this file renders
 * in Chicago regardless of runtime TZ (Vercel server = UTC, client = whatever).
 *
 * The core primitive is `toMKE(date)` which returns a "proxy" Date whose
 * local-time accessors (getHours/getDate/etc.) return Chicago wall-clock
 * values. Passing that proxy to date-fns's `format()` or `isToday()` then
 * yields Chicago-correct output even though date-fns itself is TZ-naive.
 *
 * Do NOT call date-fns `format()` on a raw `new Date(iso)` — on UTC runtimes
 * it renders UTC hours. Always go through toMKE() or the helpers here.
 */

import {
  format,
  isSameDay,
  differenceInCalendarDays,
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

// ---------------------------------------------------------------------------
// Timezone-safe formatting (hydration-safe)
// ---------------------------------------------------------------------------

const MKE_TZ = 'America/Chicago';

/**
 * Convert any Date (an instant) to a proxy Date whose **local** accessors
 * (getHours, getDate, getDay, …) return Chicago wall-clock values.
 *
 * This is the foundation for passing a Date to date-fns formatters that
 * only know about the runtime's local TZ. The proxy is NOT the same instant
 * as the input — don't use it for anything except display formatting.
 */
export function toMKE(input: Date | string): Date {
  // Date-only strings ("YYYY-MM-DD" from e.g. instance_date) have no time
  // or zone component. Treat them as a Chicago calendar date — don't shift
  // them through a TZ conversion, or midnight UTC slides to the previous day.
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return new Date(`${input}T00:00:00`);
  }

  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) return d;

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: MKE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .formatToParts(d)
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== 'literal') acc[p.type] = p.value;
      return acc;
    }, {});

  // Intl returns "24" for midnight under hourCycle h23 on some locales.
  const hour = parts.hour === '24' ? '00' : parts.hour;
  return new Date(
    `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}:${parts.second}`
  );
}

/**
 * date-fns `format()` wrapper that renders in America/Chicago.
 * Pass any datetime-shaped input (ISO string, Date, or parseable string).
 */
export function formatMKEPattern(input: Date | string, pattern: string): string {
  try {
    return format(toMKE(input), pattern);
  } catch {
    return '';
  }
}

/** True iff the given instant falls on today's Chicago calendar date. */
export function isMKEToday(input: Date | string): boolean {
  try {
    return isSameDay(toMKE(input), toMKE(new Date()));
  } catch {
    return false;
  }
}

/** True iff the given instant falls on tomorrow's Chicago calendar date. */
export function isMKETomorrow(input: Date | string): boolean {
  try {
    return isSameDay(toMKE(input), toMKE(new Date(Date.now() + 86_400_000)));
  } catch {
    return false;
  }
}

/** True iff both instants fall on the same Chicago calendar date. */
export function isSameMKEDay(a: Date | string, b: Date | string): boolean {
  try {
    return isSameDay(toMKE(a), toMKE(b));
  } catch {
    return false;
  }
}

/** Calendar-day delta between two instants, measured in Chicago. */
export function mkeDifferenceInCalendarDays(
  later: Date | string,
  earlier: Date | string
): number {
  try {
    return differenceInCalendarDays(toMKE(later), toMKE(earlier));
  } catch {
    return 0;
  }
}

/** True iff the instant's Chicago wall-clock is exactly 00:00. */
export function isMKEMidnight(input: Date | string): boolean {
  const d = toMKE(input);
  return d.getHours() === 0 && d.getMinutes() === 0;
}

/**
 * Today's Chicago calendar date as "YYYY-MM-DD". Use this for comparing
 * against date-only columns like `instance_date` where the value has no
 * time component and shouldn't be shifted by a timezone conversion.
 */
export function mkeTodayDateOnly(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: MKE_TZ });
}

/**
 * Common date format presets for display.
 * All produce identical output on server and client.
 */
const DATE_PRESETS = {
  /** "Feb 14, 2025" */
  short: { month: 'short', day: 'numeric', year: 'numeric' } as const,
  /** "Friday, February 14, 2025" */
  long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' } as const,
  /** "Fri, Feb 14, 2025" */
  dayShort: { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' } as const,
  /** "Feb 14" */
  monthDay: { month: 'short', day: 'numeric' } as const,
};

const TIME_PRESETS = {
  /** "7:00 PM" */
  short: { hour: 'numeric', minute: '2-digit', hour12: true } as const,
};

/**
 * Format a date string in Milwaukee timezone. Hydration-safe.
 *
 * @example
 * formatMKE('2025-02-14T19:00:00', 'short')      // "Feb 14, 2025"
 * formatMKE('2025-02-14T19:00:00', 'long')        // "Friday, February 14, 2025"
 * formatMKE('2025-02-14T19:00:00', 'dayShort')    // "Fri, Feb 14, 2025"
 * formatMKE('2025-02-14T19:00:00', 'monthDay')    // "Feb 14"
 */
export function formatMKE(
  dateString: string,
  preset: keyof typeof DATE_PRESETS = 'short'
): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      ...DATE_PRESETS[preset],
      timeZone: MKE_TZ,
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format a time string in Milwaukee timezone. Hydration-safe.
 *
 * @example
 * formatTimeMKE('2025-02-14T19:00:00') // "7:00 PM"
 */
export function formatTimeMKE(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      ...TIME_PRESETS.short,
      timeZone: MKE_TZ,
    }).format(date);
  } catch {
    return '';
  }
}

/**
 * Format a date + time string in Milwaukee timezone. Hydration-safe.
 *
 * @example
 * formatDateTimeMKE('2025-02-14T19:00:00', 'short')  // "Feb 14, 7:00 PM"
 * formatDateTimeMKE('2025-02-14T19:00:00', 'long')    // "Friday, February 14, 2025 at 7:00 PM"
 * formatDateTimeMKE('2025-02-14T19:00:00', 'full')    // "Feb 14, 2025, 7:00 PM"
 */
export function formatDateTimeMKE(
  dateString: string,
  preset: 'short' | 'long' | 'full' = 'short'
): string {
  try {
    const date = new Date(dateString);
    const opts: Intl.DateTimeFormatOptions = {
      timeZone: MKE_TZ,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };

    if (preset === 'short') {
      return new Intl.DateTimeFormat('en-US', {
        ...opts,
        month: 'short',
        day: 'numeric',
      }).format(date);
    }

    if (preset === 'long') {
      return new Intl.DateTimeFormat('en-US', {
        ...opts,
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    }

    // full
    return new Intl.DateTimeFormat('en-US', {
      ...opts,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

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
  const mke = toMKE(dateString);

  // Relative format
  if (fmt === 'relative') {
    if (isMKEToday(dateString)) {
      return includeTime ? `Today at ${format(mke, 'h:mm a')}` : 'Today';
    }
    if (isMKETomorrow(dateString)) {
      return includeTime ? `Tomorrow at ${format(mke, 'h:mm a')}` : 'Tomorrow';
    }
  }

  // Short format: "Feb 14 - 7:00 PM"
  if (fmt === 'short') {
    const dateStr = format(mke, 'MMM d');
    return includeTime ? `${dateStr} - ${format(mke, 'h:mm a')}` : dateStr;
  }

  // Long format: "Friday, February 14, 2025 at 7:00 PM"
  const dateStr = format(mke, 'EEEE, MMMM d, yyyy');
  return includeTime ? `${dateStr} at ${format(mke, 'h:mm a')}` : dateStr;
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
  if (!start) return `Until ${format(toMKE(end!), 'MMM d')}`;
  if (!end) return `From ${format(toMKE(start), 'MMM d')}`;

  const startDate = toMKE(start);
  const endDate = toMKE(end);

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

/**
 * Format a date with a custom pattern
 *
 * @example
 * formatDate('2025-02-14', 'EEE, MMM d')
 * // => 'Fri, Feb 14'
 */
export function formatDate(dateString: string, pattern: string = 'MMM d, yyyy'): string {
  try {
    return format(toMKE(dateString), pattern);
  } catch {
    return dateString;
  }
}

/**
 * Format a time from a datetime string
 *
 * @example
 * formatTime('2025-02-14T19:00:00')
 * // => '7:00 PM'
 */
export function formatTime(datetimeString: string, pattern: string = 'h:mm a'): string {
  try {
    return format(toMKE(datetimeString), pattern);
  } catch {
    return '';
  }
}
