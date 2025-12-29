/**
 * EVENT DATE COMPONENT
 * ====================
 * Displays formatted event date and time.
 */

import { Calendar, Clock } from 'lucide-react';
import { formatEventDate } from '@/lib/utils/dates';
import { cn } from '@/lib/utils';

interface EventDateProps {
  /** Start datetime */
  startDate: string;
  /** End datetime */
  endDate?: string | null;
  /** Whether it's an all-day event */
  isAllDay?: boolean;
  /** Display format */
  format?: 'short' | 'long' | 'relative';
  /** Show icon */
  showIcon?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays formatted event date.
 *
 * @example
 * <EventDate startDate={event.start_datetime} />
 *
 * @example
 * <EventDate
 *   startDate={event.start_datetime}
 *   endDate={event.end_datetime}
 *   format="long"
 *   showIcon
 * />
 */
export function EventDate({
  startDate,
  endDate,
  isAllDay = false,
  format = 'short',
  showIcon = false,
  className,
}: EventDateProps) {
  // Format the start date
  const formattedStart = formatEventDate(startDate, {
    format,
    includeTime: !isAllDay,
  });

  // Format end time if provided and same day
  let formattedEnd = '';
  if (endDate && !isAllDay) {
    const startDay = startDate.split('T')[0];
    const endDay = endDate.split('T')[0];

    if (startDay === endDay) {
      // Same day - just show end time
      const endTime = new Date(endDate).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      formattedEnd = ` - ${endTime}`;
    }
  }

  return (
    <div className={cn('flex items-center gap-2 text-stone', className)}>
      {showIcon && <Calendar className="w-4 h-4 flex-shrink-0" />}
      <span>
        {formattedStart}
        {formattedEnd}
        {isAllDay && ' (All day)'}
      </span>
    </div>
  );
}
