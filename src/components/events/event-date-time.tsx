/**
 * EVENT DATE TIME COMPONENT
 * =========================
 * Enhanced date and time display for event detail pages.
 * Shows both start and end times in a clear, scannable format.
 *
 * 🎯 PURPOSE:
 * - Display event date with start AND end times
 * - Handle edge cases (all-day, no end time, multi-day)
 * - Provide clear visual hierarchy
 *
 * 📝 USAGE:
 * ```tsx
 * <EventDateTime
 *   startDatetime={event.start_datetime}
 *   endDatetime={event.end_datetime}
 *   isAllDay={event.is_all_day}
 *   timezone={event.timezone}
 * />
 * ```
 *
 * 🎨 DISPLAY EXAMPLES:
 * - Single time: "7:00 PM"
 * - With end time: "7:00 PM → 10:00 PM"
 * - All day: "All Day"
 * - Multi-day: "Feb 14, 7:00 PM → Feb 16, 5:00 PM"
 */

import { Clock, Calendar, Sun } from 'lucide-react';
import { format, parseISO, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface EventDateTimeProps {
  /** Start datetime (ISO string) */
  startDatetime: string;
  /** End datetime (ISO string, optional) */
  endDatetime?: string | null;
  /** Whether it's an all-day event */
  isAllDay?: boolean;
  /** Timezone (e.g., 'America/Chicago') - for display purposes */
  timezone?: string;
  /** Display variant */
  variant?: 'full' | 'compact' | 'inline';
  /** Show the date (or just time) */
  showDate?: boolean;
  /** Show icon */
  showIcon?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formats a time from a datetime string.
 * Returns format like "7:00 PM"
 */
function formatTime(datetime: string): string {
  try {
    const date = parseISO(datetime);
    return format(date, 'h:mm a');
  } catch (error) {
    console.error('⚠️ [EventDateTime] Error formatting time:', error);
    return '';
  }
}

/**
 * Formats a date from a datetime string.
 * Returns format like "Feb 14" or "Friday, Feb 14"
 */
function formatDate(datetime: string, includeDay = false): string {
  try {
    const date = parseISO(datetime);
    return includeDay ? format(date, 'EEEE, MMM d') : format(date, 'MMM d');
  } catch (error) {
    console.error('⚠️ [EventDateTime] Error formatting date:', error);
    return '';
  }
}

/**
 * Checks if two datetimes are on the same day.
 */
function areSameDay(datetime1: string, datetime2: string): boolean {
  try {
    return isSameDay(parseISO(datetime1), parseISO(datetime2));
  } catch {
    return false;
  }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Time display badge with optional label.
 */
function TimeBadge({
  time,
  label,
  className,
}: {
  time: string;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col', className)}>
      {label && (
        <span className="text-xs text-stone uppercase tracking-wide mb-0.5">
          {label}
        </span>
      )}
      <span className="font-medium text-charcoal">{time}</span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Enhanced date and time display for events.
 *
 * @example Full variant (event detail page sidebar)
 * ```tsx
 * <EventDateTime
 *   startDatetime="2025-02-14T19:00:00"
 *   endDatetime="2025-02-14T22:00:00"
 *   variant="full"
 *   showIcon
 * />
 * // Renders: 🕐 Starts 7:00 PM → Ends 10:00 PM
 * ```
 *
 * @example Inline variant (within text)
 * ```tsx
 * <EventDateTime
 *   startDatetime="2025-02-14T19:00:00"
 *   endDatetime="2025-02-14T22:00:00"
 *   variant="inline"
 * />
 * // Renders: 7:00 PM - 10:00 PM
 * ```
 */
export function EventDateTime({
  startDatetime,
  endDatetime,
  isAllDay = false,
  timezone,
  variant = 'full',
  showDate = false,
  showIcon = true,
  className,
}: EventDateTimeProps) {
  // Validate input
  if (!startDatetime) {
    console.warn('⚠️ [EventDateTime] No start datetime provided');
    return null;
  }

  // Format times
  const startTime = formatTime(startDatetime);
  const startDate = formatDate(startDatetime, true);
  const endTime = endDatetime ? formatTime(endDatetime) : null;
  const endDate = endDatetime ? formatDate(endDatetime) : null;

  // Determine if event spans multiple days
  const isMultiDay = endDatetime && !areSameDay(startDatetime, endDatetime);

  // Log for debugging
  console.log('🕐 [EventDateTime] Rendering:', {
    startTime,
    endTime,
    isAllDay,
    isMultiDay,
  });

  // -------------------------------------------------------------------------
  // ALL DAY EVENT
  // -------------------------------------------------------------------------
  if (isAllDay) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {showIcon && <Sun className="w-5 h-5 text-coral flex-shrink-0" />}
        <div>
          {showDate && <p className="text-body-sm text-stone">{startDate}</p>}
          <p className="font-medium text-charcoal">All Day Event</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // INLINE VARIANT: Compact single-line display
  // -------------------------------------------------------------------------
  if (variant === 'inline') {
    const timeDisplay = endTime ? `${startTime} – ${endTime}` : startTime;

    return (
      <span className={cn('text-charcoal', className)}>
        {showDate && `${formatDate(startDatetime)} · `}
        {timeDisplay}
      </span>
    );
  }

  // -------------------------------------------------------------------------
  // COMPACT VARIANT: Single line with icon
  // -------------------------------------------------------------------------
  if (variant === 'compact') {
    const timeDisplay = endTime ? `${startTime} – ${endTime}` : startTime;

    return (
      <div className={cn('flex items-center gap-2', className)}>
        {showIcon && <Clock className="w-4 h-4 text-coral flex-shrink-0" />}
        <span className="text-body-sm text-charcoal">{timeDisplay}</span>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // FULL VARIANT: Detailed display with start/end labels
  // -------------------------------------------------------------------------

  // Multi-day event
  if (isMultiDay) {
    return (
      <div className={cn('space-y-3', className)}>
        {/* Start */}
        <div className="flex items-start gap-3">
          {showIcon && <Calendar className="w-5 h-5 text-coral mt-0.5 flex-shrink-0" />}
          <div>
            <p className="text-xs text-stone uppercase tracking-wide">Starts</p>
            <p className="font-medium text-charcoal">{startDate}</p>
            <p className="text-body-sm text-stone">{startTime}</p>
          </div>
        </div>

        {/* End */}
        {endDatetime && (
          <div className="flex items-start gap-3">
            {showIcon && <Calendar className="w-5 h-5 text-sage mt-0.5 flex-shrink-0" />}
            <div>
              <p className="text-xs text-stone uppercase tracking-wide">Ends</p>
              <p className="font-medium text-charcoal">{endDate}</p>
              <p className="text-body-sm text-stone">{endTime}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Same-day event with start and end time
  if (endTime) {
    return (
      <div className={cn('flex items-start gap-3', className)}>
        {showIcon && <Clock className="w-5 h-5 text-coral mt-0.5 flex-shrink-0" />}
        <div className="flex items-center gap-4">
          <TimeBadge time={startTime} label="Starts" />
          <span className="text-stone">→</span>
          <TimeBadge time={endTime} label="Ends" />
        </div>
      </div>
    );
  }

  // Single start time only
  return (
    <div className={cn('flex items-start gap-3', className)}>
      {showIcon && <Clock className="w-5 h-5 text-coral mt-0.5 flex-shrink-0" />}
      <div>
        <p className="text-xs text-stone uppercase tracking-wide">Time</p>
        <p className="font-medium text-charcoal">{startTime}</p>
        {timezone && (
          <p className="text-xs text-stone mt-0.5">{timezone}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY: Format time range as string
// ============================================================================

/**
 * Formats a time range as a simple string.
 * Useful when you just need the text, not a component.
 *
 * @example
 * formatTimeRange('2025-02-14T19:00:00', '2025-02-14T22:00:00')
 * // => "7:00 PM – 10:00 PM"
 *
 * @example
 * formatTimeRange('2025-02-14T19:00:00', null)
 * // => "7:00 PM"
 */
export function formatTimeRange(
  startDatetime: string,
  endDatetime?: string | null,
  isAllDay = false
): string {
  if (isAllDay) {
    return 'All Day';
  }

  const startTime = formatTime(startDatetime);

  if (!endDatetime) {
    return startTime;
  }

  const endTime = formatTime(endDatetime);
  return `${startTime} – ${endTime}`;
}


