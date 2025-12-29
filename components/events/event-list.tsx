// ============================================================================
// 📋 HAPPENLIST - Event List Component
// ============================================================================
// Displays a grid of event cards with optional empty state.
//
// Usage:
//   <EventList events={events} />
//   <EventList events={events} emptyMessage="No events this weekend" />
// ============================================================================

import { Calendar } from 'lucide-react'
import { EventCard, type EventCardProps } from './event-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui'
import { ROUTES } from '@/lib/constants'
import Link from 'next/link'
import type { EventWithRelations } from '@/types'

// ============================================================================
// 📋 EventList Props
// ============================================================================

export interface EventListProps {
  /** Array of events to display */
  events: EventWithRelations[]
  /** Card variant to use */
  variant?: EventCardProps['variant']
  /** Custom empty state title */
  emptyTitle?: string
  /** Custom empty state message */
  emptyMessage?: string
  /** Show "clear filters" action in empty state */
  showClearFilters?: boolean
  /** Callback when clear filters is clicked */
  onClearFilters?: () => void
}

// ============================================================================
// 📋 EventList Component
// ============================================================================

export function EventList({
  events,
  variant = 'default',
  emptyTitle = 'No events found',
  emptyMessage = "We couldn't find any events matching your criteria. Try adjusting your filters or check back later for new events.",
  showClearFilters = false,
  onClearFilters,
}: EventListProps) {
  // Empty state
  if (events.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="w-12 h-12" />}
        title={emptyTitle}
        description={emptyMessage}
        action={
          showClearFilters ? (
            <Button variant="secondary" onClick={onClearFilters}>
              Clear filters
            </Button>
          ) : (
            <Button variant="secondary" asChild>
              <Link href={ROUTES.events}>Browse all events</Link>
            </Button>
          )
        }
      />
    )
  }

  // Compact layout uses a list
  if (variant === 'compact') {
    return (
      <div className="divide-y divide-border">
        {events.map((event) => (
          <EventCard key={event.id} event={event} variant="compact" />
        ))}
      </div>
    )
  }

  // Default grid layout
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard key={event.id} event={event} variant={variant} />
      ))}
    </div>
  )
}
