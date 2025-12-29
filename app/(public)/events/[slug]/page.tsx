// ============================================================================
// 🎫 HAPPENLIST - Event Detail Page
// ============================================================================
// Displays full details for a single event.
// Shows event info, venue, organizer, and related events.
// ============================================================================

import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  DollarSign,
  ExternalLink,
  Share2,
  ArrowLeft,
  Tag,
} from 'lucide-react'
import { Button, Card, Badge } from '@/components/ui'
import { CategoryBadge } from '@/components/categories/category-badge'
import { EventCard } from '@/components/events/event-card'
import { getEventBySlug, getEventsByVenue } from '@/lib/queries/events'
import { formatEventDate, formatEventTime, formatDateRange } from '@/lib/utils/dates'
import { ROUTES } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'
import type { Metadata } from 'next'

// ============================================================================
// 📋 Metadata Generator
// ============================================================================

interface EventDetailPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const event = await getEventBySlug(slug)

  if (!event) {
    return {
      title: 'Event Not Found',
    }
  }

  return {
    title: event.title,
    description: event.description || `${event.title} at ${event.venue?.name}`,
    openGraph: {
      title: event.title,
      description: event.description || `${event.title} at ${event.venue?.name}`,
      images: event.image_url ? [event.image_url] : undefined,
    },
  }
}

// ============================================================================
// 🎫 Event Detail Page Component
// ============================================================================

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params

  logger.info('🎫 Rendering event detail page', { slug })

  const event = await getEventBySlug(slug)

  if (!event) {
    logger.warn('🎫 Event not found', { slug })
    notFound()
  }

  // Fetch related events from same venue
  const { events: relatedEvents } = event.venue
    ? await getEventsByVenue(event.venue.id, 3)
    : { events: [] }

  // Filter out current event from related
  const filteredRelated = relatedEvents.filter((e) => e.id !== event.id)

  // Format dates
  const dateDisplay = event.end_at
    ? formatDateRange(event.start_at, event.end_at)
    : formatEventDate(event.start_at)
  const timeDisplay = formatEventTime(event.start_at)

  return (
    <div className="py-8 md:py-12">
      <div className="page-container">
        {/* ========================================
            🔙 Back Navigation
            ======================================== */}
        <Link
          href={ROUTES.events}
          className="inline-flex items-center gap-2 text-body-sm text-text-secondary hover:text-text-primary mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ========================================
              📄 Main Content (2/3 width on desktop)
              ======================================== */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Image */}
            {event.image_url ? (
              <div className="relative aspect-video rounded-xl overflow-hidden bg-background">
                <Image
                  src={event.image_url}
                  alt={event.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
              </div>
            ) : (
              <div className="aspect-video rounded-xl bg-background flex items-center justify-center">
                <Calendar className="w-16 h-16 text-text-tertiary" />
              </div>
            )}

            {/* Category Badge */}
            {event.category && (
              <Link href={ROUTES.categoryEvents(event.category.slug)}>
                <CategoryBadge category={event.category} size="lg" />
              </Link>
            )}

            {/* Event Title */}
            <h1 className="text-heading-lg font-bold text-text-primary">
              {event.title}
            </h1>

            {/* Event Description */}
            {event.description && (
              <div className="prose prose-lg max-w-none text-text-secondary">
                <p className="whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <Badge key={tag.id} variant="outline" className="gap-1">
                    <Tag className="w-3 h-3" />
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Flyer Image (if available) */}
            {event.flyer_url && (
              <div className="space-y-4">
                <h2 className="text-heading-sm font-semibold text-text-primary">
                  Event Flyer
                </h2>
                <div className="relative max-w-md">
                  <Image
                    src={event.flyer_url}
                    alt={`${event.title} flyer`}
                    width={400}
                    height={600}
                    className="rounded-lg shadow-md"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ========================================
              📱 Sidebar (1/3 width on desktop)
              ======================================== */}
          <div className="space-y-6">
            {/* Event Details Card */}
            <Card className="p-6 space-y-6">
              <h2 className="text-heading-sm font-semibold text-text-primary">
                Event Details
              </h2>

              {/* Date & Time */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-text-primary">{dateDisplay}</p>
                    <p className="text-body-sm text-text-secondary">Date</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-text-primary">{timeDisplay}</p>
                    <p className="text-body-sm text-text-secondary">Time</p>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  {event.is_free ? (
                    <p className="font-medium text-primary">Free Event!</p>
                  ) : event.price_min ? (
                    <p className="font-medium text-text-primary">
                      ${event.price_min}
                      {event.price_max && event.price_max !== event.price_min
                        ? ` – $${event.price_max}`
                        : ''}
                    </p>
                  ) : (
                    <p className="font-medium text-text-primary">See website</p>
                  )}
                  <p className="text-body-sm text-text-secondary">Price</p>
                </div>
              </div>

              {/* CTA Button */}
              {event.ticket_url && (
                <Button asChild className="w-full" size="lg">
                  <a
                    href={event.ticket_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get Tickets
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              )}

              {event.website_url && !event.ticket_url && (
                <Button asChild className="w-full" size="lg">
                  <a
                    href={event.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit Website
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              )}

              {/* Share Button */}
              <Button variant="secondary" className="w-full">
                <Share2 className="w-4 h-4 mr-2" />
                Share Event
              </Button>
            </Card>

            {/* Venue Card */}
            {event.venue && (
              <Card className="p-6 space-y-4">
                <h2 className="text-heading-sm font-semibold text-text-primary">
                  Venue
                </h2>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <Link
                      href={ROUTES.venueDetail(event.venue.slug)}
                      className="font-medium text-text-primary hover:text-primary"
                    >
                      {event.venue.name}
                    </Link>
                    {event.venue.address && (
                      <p className="text-body-sm text-text-secondary">
                        {event.venue.address}
                        {event.venue.city && `, ${event.venue.city}`}
                        {event.venue.zip && ` ${event.venue.zip}`}
                      </p>
                    )}
                  </div>
                </div>

                {event.venue.website_url && (
                  <Button asChild variant="ghost" size="sm" className="w-full">
                    <a
                      href={event.venue.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Venue Website
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                )}
              </Card>
            )}

            {/* Organizer Card */}
            {event.organizer && (
              <Card className="p-6 space-y-4">
                <h2 className="text-heading-sm font-semibold text-text-primary">
                  Organizer
                </h2>

                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <Link
                      href={ROUTES.organizerDetail(event.organizer.slug)}
                      className="font-medium text-text-primary hover:text-primary"
                    >
                      {event.organizer.name}
                    </Link>
                    {event.organizer.description && (
                      <p className="text-body-sm text-text-secondary line-clamp-2">
                        {event.organizer.description}
                      </p>
                    )}
                  </div>
                </div>

                {event.organizer.website_url && (
                  <Button asChild variant="ghost" size="sm" className="w-full">
                    <a
                      href={event.organizer.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Organizer Website
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* ========================================
            🔗 Related Events
            ======================================== */}
        {filteredRelated.length > 0 && (
          <section className="mt-16">
            <h2 className="text-heading-md font-bold text-text-primary mb-8">
              More Events at {event.venue?.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRelated.map((relatedEvent) => (
                <EventCard key={relatedEvent.id} event={relatedEvent} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
