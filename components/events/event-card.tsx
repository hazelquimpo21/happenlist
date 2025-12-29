// ============================================================================
// 🎫 HAPPENLIST - Event Card Component
// ============================================================================
// Displays an event in card format for listings.
// Shows image, date, title, venue, and price info.
//
// Usage:
//   <EventCard event={eventWithRelations} />
//   <EventCard event={eventWithRelations} variant="compact" />
// ============================================================================

import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin, Clock } from 'lucide-react'
import { Card } from '@/components/ui'
import { CategoryBadge } from '@/components/categories/category-badge'
import { formatEventDate, formatEventTime } from '@/lib/utils/dates'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils/cn'
import type { EventWithRelations } from '@/types'

// ============================================================================
// 📋 EventCard Props
// ============================================================================

export interface EventCardProps {
  /** The event to display (with relations populated) */
  event: EventWithRelations
  /** Card variant */
  variant?: 'default' | 'featured' | 'compact'
  /** Additional CSS classes */
  className?: string
}

// ============================================================================
// 🎫 EventCard Component
// ============================================================================

export function EventCard({
  event,
  variant = 'default',
  className,
}: EventCardProps) {
  // Format date and time for display
  const formattedDate = formatEventDate(event.start_at)
  const formattedTime = formatEventTime(event.start_at)

  // Compact variant renders differently
  if (variant === 'compact') {
    return <EventCardCompact event={event} className={className} />
  }

  return (
    <Link href={ROUTES.eventDetail(event.slug)} className={cn('block', className)}>
      <Card hover className="h-full flex flex-col">
        {/* ========================================
            🖼️ Event Image
            ======================================== */}
        <div className="relative aspect-[4/3] bg-background">
          {event.image_url ? (
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-12 h-12 text-text-tertiary" />
            </div>
          )}

          {/* Category badge overlay */}
          {event.category && (
            <div className="absolute bottom-3 left-3">
              <CategoryBadge category={event.category} />
            </div>
          )}
        </div>

        {/* ========================================
            📝 Event Content
            ======================================== */}
        <div className="p-4 flex flex-col flex-1">
          {/* Date */}
          <p className="text-caption font-semibold text-primary uppercase tracking-wide">
            {formattedDate}
          </p>

          {/* Title */}
          <h3 className="text-heading-sm mt-1 line-clamp-2 text-text-primary">
            {event.title}
          </h3>

          {/* Venue */}
          {event.venue && (
            <p className="text-body-sm text-text-secondary mt-2 flex items-center gap-1">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">{event.venue.name}</span>
            </p>
          )}

          {/* Time & Price */}
          <div className="mt-auto pt-3 flex items-center justify-between text-body-sm text-text-secondary">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formattedTime}
            </span>

            {event.is_free ? (
              <span className="text-primary font-medium">Free</span>
            ) : event.price_min ? (
              <span>
                ${event.price_min}
                {event.price_max && event.price_max !== event.price_min
                  ? `–$${event.price_max}`
                  : ''}
              </span>
            ) : null}
          </div>
        </div>
      </Card>
    </Link>
  )
}

// ============================================================================
// 📱 Compact Variant
// ============================================================================

function EventCardCompact({
  event,
  className,
}: {
  event: EventWithRelations
  className?: string
}) {
  const formattedDate = formatEventDate(event.start_at, 'short')
  const formattedTime = formatEventTime(event.start_at)

  return (
    <Link href={ROUTES.eventDetail(event.slug)} className={cn('block', className)}>
      <div className="flex gap-4 p-4 rounded-lg hover:bg-background transition-colors">
        {/* Thumbnail */}
        <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-background">
          {event.image_url ? (
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-text-tertiary" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-caption font-semibold text-primary">
            {formattedDate}
          </p>
          <h3 className="text-body-md font-medium text-text-primary truncate">
            {event.title}
          </h3>
          <p className="text-body-sm text-text-secondary truncate">
            {event.venue?.name} • {formattedTime}
          </p>
        </div>

        {/* Category */}
        {event.category && (
          <div className="hidden sm:block">
            <CategoryBadge category={event.category} size="sm" />
          </div>
        )}
      </div>
    </Link>
  )
}
