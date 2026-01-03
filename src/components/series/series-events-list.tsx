/**
 * SERIES EVENTS LIST
 * ==================
 * Displays the list of events within a series.
 * Shows date, title, location, and status for each event.
 */

import Link from 'next/link';
import { Calendar, MapPin, Check, Clock } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { formatEventDate } from '@/lib/utils/dates';
import { cn } from '@/lib/utils';
import type { SeriesEvent } from '@/types';

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface SeriesEventsListProps {
  /** Array of events in the series */
  events: SeriesEvent[];
  /** Title for the section */
  title?: string;
  /** Show past events */
  showPast?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * List of events within a series.
 * Shows sequence number, date, title, and location.
 *
 * @example
 * ```tsx
 * <SeriesEventsList events={events} />
 * ```
 */
export function SeriesEventsList({
  events,
  title = 'Sessions',
  showPast = false,
  className,
}: SeriesEventsListProps) {
  if (events.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-stone">No upcoming sessions</p>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  // Split into upcoming and past
  const upcoming = events.filter((e) => e.instance_date >= today);
  const past = events.filter((e) => e.instance_date < today);

  return (
    <section className={className}>
      {title && (
        <h2 className="font-display text-h2 text-charcoal mb-6">{title}</h2>
      )}

      {/* Upcoming events */}
      {upcoming.length > 0 && (
        <div className="space-y-3 mb-8">
          {upcoming.map((event, index) => (
            <SeriesEventItem
              key={event.id}
              event={event}
              index={index + 1}
              isUpcoming
            />
          ))}
        </div>
      )}

      {/* Past events (if shown) */}
      {showPast && past.length > 0 && (
        <div className="mt-8">
          <h3 className="text-body-sm text-stone uppercase tracking-wide mb-4">
            Past Sessions ({past.length})
          </h3>
          <div className="space-y-3 opacity-60">
            {past.map((event, index) => (
              <SeriesEventItem
                key={event.id}
                event={event}
                index={upcoming.length + index + 1}
                isUpcoming={false}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ============================================================================
// EVENT ITEM COMPONENT
// ============================================================================

interface SeriesEventItemProps {
  event: SeriesEvent;
  index: number;
  isUpcoming: boolean;
}

/**
 * Single event item within the series list.
 */
function SeriesEventItem({ event, index, isUpcoming }: SeriesEventItemProps) {
  // Build event URL
  const eventUrl = `/event/${event.slug}-${event.instance_date}`;

  // Use sequence number if available, otherwise use index
  const displayNumber = event.series_sequence ?? index;

  return (
    <Card
      className={cn(
        'p-4 hover:border-coral/50 transition-colors',
        !isUpcoming && 'bg-cream'
      )}
    >
      <Link href={eventUrl} className="flex items-start gap-4">
        {/* Session number */}
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
            isUpcoming
              ? 'bg-coral text-warm-white'
              : 'bg-sand text-stone'
          )}
        >
          {!isUpcoming ? (
            <Check className="w-5 h-5" />
          ) : (
            <span className="font-medium">{displayNumber}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Date */}
          <p className="text-body-sm text-stone flex items-center gap-1.5 mb-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatEventDate(event.start_datetime, {
              format: 'long',
              includeTime: true,
            })}
          </p>

          {/* Title */}
          <h3 className="text-body font-medium text-charcoal mb-1 line-clamp-1">
            {event.title}
          </h3>

          {/* Location (if different from series location) */}
          {event.location_name && (
            <p className="text-body-sm text-stone flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{event.location_name}</span>
            </p>
          )}
        </div>

        {/* Status badge for special states */}
        {!isUpcoming && (
          <Badge variant="outline" className="flex-shrink-0">
            Completed
          </Badge>
        )}
      </Link>
    </Card>
  );
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

interface SeriesEventsCompactProps {
  /** First few events to show */
  events: SeriesEvent[];
  /** Total event count (for "X more" label) */
  totalCount?: number;
  /** Link to full series page */
  seriesSlug?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Compact list of next few events in a series.
 * Used on event cards and other compact displays.
 *
 * @example
 * ```tsx
 * <SeriesEventsCompact events={events.slice(0, 3)} totalCount={6} />
 * ```
 */
export function SeriesEventsCompact({
  events,
  totalCount,
  seriesSlug,
  className,
}: SeriesEventsCompactProps) {
  if (events.length === 0) {
    return null;
  }

  const remaining = totalCount ? totalCount - events.length : 0;

  return (
    <div className={cn('space-y-2', className)}>
      {events.map((event) => (
        <div
          key={event.id}
          className="flex items-center gap-2 text-body-sm text-stone"
        >
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">
            {formatEventDate(event.start_datetime, {
              format: 'short',
              includeTime: false,
            })}
          </span>
        </div>
      ))}

      {remaining > 0 && seriesSlug && (
        <Link
          href={`/series/${seriesSlug}`}
          className="text-body-sm text-coral hover:underline"
        >
          +{remaining} more sessions
        </Link>
      )}
    </div>
  );
}
