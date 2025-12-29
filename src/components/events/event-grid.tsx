/**
 * EVENT GRID COMPONENT
 * ====================
 * Responsive grid layout for event cards.
 */

import { EventCard } from './event-card';
import { EventCardSkeleton } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { EventCard as EventCardType } from '@/types';

interface EventGridProps {
  /** Events to display */
  events: EventCardType[];
  /** Number of columns (auto-adjusts for responsive) */
  columns?: 2 | 3 | 4;
  /** Show loading skeletons */
  loading?: boolean;
  /** Number of skeleton cards to show */
  skeletonCount?: number;
  /** Message when no events found */
  emptyMessage?: string;
  /** Empty state title */
  emptyTitle?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Grid layout for event cards.
 *
 * @example
 * <EventGrid events={events} />
 *
 * @example
 * <EventGrid
 *   events={events}
 *   columns={3}
 *   emptyMessage="No events found for this category."
 * />
 */
export function EventGrid({
  events,
  columns = 4,
  loading = false,
  skeletonCount = 8,
  emptyMessage = 'No events found',
  emptyTitle = 'Nothing happening yet',
  className,
}: EventGridProps) {
  // Column classes based on column count
  const columnClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  // Loading state
  if (loading) {
    return (
      <div className={cn('grid gap-6', columnClasses[columns], className)}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <EventCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Empty state
  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sand mb-4">
          <span className="text-2xl">📅</span>
        </div>
        <h3 className="font-display text-h3 text-charcoal mb-2">
          {emptyTitle}
        </h3>
        <p className="text-stone text-body max-w-md mx-auto">{emptyMessage}</p>
      </div>
    );
  }

  // Event grid
  return (
    <div className={cn('grid gap-6', columnClasses[columns], className)}>
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
