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
import { formatMKEPattern, isSameMKEDay } from '@/lib/utils/dates';
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
 * Formats a time from a datetime string in America/Chicago.
 * Returns format like "7:00 PM".
 */
function formatTime(datetime: string): string {
  return formatMKEPattern(datetime, 'h:mm a');
}

/**
 * Formats a date from a datetime string in America/Chicago.
 * Returns format like "Feb 14" or "Friday, Feb 14".
 */
function formatDate(datetime: string, includeDay = false): string {
  return formatMKEPattern(datetime, includeDay ? 'EEEE, MMM d' : 'MMM d');
}

/**
 * Checks if two datetimes fall on the same Chicago calendar day.
 */
function areSameDay(datetime1: string, datetime2: string): boolean {
  return isSameMKEDay(datetime1, datetime2);
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
        <span className="text-xs text-zinc uppercase tracking-wide mb-0.5">
          {label}
        </span>
      )}
      <span className="font-medium text-ink">{time}</span>
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
        {showIcon && <Sun className="w-5 h-5 text-blue flex-shrink-0" />}
        <div>
          {showDate && <p className="text-body-sm text-zinc">{startDate}</p>}
          <p className="font-medium text-ink">All Day Event</p>
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
      <span className={cn('text-ink', className)}>
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
        {showIcon && <Clock className="w-4 h-4 text-blue flex-shrink-0" />}
        <span className="text-body-sm text-ink">{timeDisplay}</span>
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
          {showIcon && <Calendar className="w-5 h-5 text-blue mt-0.5 flex-shrink-0" />}
          <div>
            <p className="text-xs text-zinc uppercase tracking-wide">Starts</p>
            <p className="font-medium text-ink">{startDate}</p>
            <p className="text-body-sm text-zinc">{startTime}</p>
          </div>
        </div>

        {/* End */}
        {endDatetime && (
          <div className="flex items-start gap-3">
            {showIcon && <Calendar className="w-5 h-5 text-emerald mt-0.5 flex-shrink-0" />}
            <div>
              <p className="text-xs text-zinc uppercase tracking-wide">Ends</p>
              <p className="font-medium text-ink">{endDate}</p>
              <p className="text-body-sm text-zinc">{endTime}</p>
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
        {showIcon && <Clock className="w-5 h-5 text-blue mt-0.5 flex-shrink-0" />}
        <div className="flex items-center gap-4">
          <TimeBadge time={startTime} label="Starts" />
          <span className="text-zinc">→</span>
          <TimeBadge time={endTime} label="Ends" />
        </div>
      </div>
    );
  }

  // Single start time only
  return (
    <div className={cn('flex items-start gap-3', className)}>
      {showIcon && <Clock className="w-5 h-5 text-blue mt-0.5 flex-shrink-0" />}
      <div>
        <p className="text-xs text-zinc uppercase tracking-wide">Time</p>
        <p className="font-medium text-ink">{startTime}</p>
        {timezone && (
          <p className="text-xs text-zinc mt-0.5">{timezone}</p>
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


