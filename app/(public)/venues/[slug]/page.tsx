// ============================================================================
// 📍 HAPPENLIST - Venue Detail Page
// ============================================================================
// Displays full details for a single venue and its upcoming events.
// ============================================================================

import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Globe, ArrowLeft, Calendar } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { EventCard } from '@/components/events/event-card'
import { EventCardSkeleton } from '@/components/events/event-card-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { getVenueBySlug } from '@/lib/queries/venues'
import { getEventsByVenue } from '@/lib/queries/events'
import { ROUTES } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'
import { Suspense } from 'react'
import type { Metadata } from 'next'

// ============================================================================
// 📋 Metadata Generator
// ============================================================================

interface VenueDetailPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: VenueDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const venue = await getVenueBySlug(slug)

  if (!venue) {
    return {
      title: 'Venue Not Found',
    }
  }

  return {
    title: venue.name,
    description: `Discover events at ${venue.name}${venue.city ? ` in ${venue.city}` : ''}.`,
    openGraph: {
      title: venue.name,
      description: `Discover events at ${venue.name}${venue.city ? ` in ${venue.city}` : ''}.`,
      images: venue.image_url ? [venue.image_url] : undefined,
    },
  }
}

// ============================================================================
// 📍 Venue Detail Page Component
// ============================================================================

export default async function VenueDetailPage({ params }: VenueDetailPageProps) {
  const { slug } = await params

  logger.info('📍 Rendering venue detail page', { slug })

  const venue = await getVenueBySlug(slug)

  if (!venue) {
    logger.warn('📍 Venue not found', { slug })
    notFound()
  }

  // Build full address
  const fullAddress = [venue.address, venue.city, venue.zip]
    .filter(Boolean)
    .join(', ')

  // Google Maps link
  const mapsUrl = fullAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
    : null

  return (
    <div className="py-8 md:py-12">
      <div className="page-container">
        {/* ========================================
            🔙 Back Navigation
            ======================================== */}
        <Link
          href={ROUTES.venues}
          className="inline-flex items-center gap-2 text-body-sm text-text-secondary hover:text-text-primary mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Venues
        </Link>

        {/* ========================================
            📍 Venue Header
            ======================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Venue Image */}
          <div className="lg:col-span-2">
            {venue.image_url ? (
              <div className="relative aspect-video rounded-xl overflow-hidden bg-background">
                <Image
                  src={venue.image_url}
                  alt={venue.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
              </div>
            ) : (
              <div className="aspect-video rounded-xl bg-background flex items-center justify-center">
                <MapPin className="w-16 h-16 text-text-tertiary" />
              </div>
            )}
          </div>

          {/* Venue Info Card */}
          <Card className="p-6 h-fit">
            <h1 className="text-heading-md font-bold text-text-primary">
              {venue.name}
            </h1>

            {/* Address */}
            {fullAddress && (
              <div className="mt-4 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-text-primary">{venue.address}</p>
                  <p className="text-body-sm text-text-secondary">
                    {venue.city}{venue.zip && `, ${venue.zip}`}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              {mapsUrl && (
                <Button asChild variant="secondary" className="w-full">
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                    <MapPin className="w-4 h-4 mr-2" />
                    Get Directions
                  </a>
                </Button>
              )}

              {venue.website_url && (
                <Button asChild variant="ghost" className="w-full">
                  <a
                    href={venue.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Visit Website
                  </a>
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* ========================================
            📅 Upcoming Events at Venue
            ======================================== */}
        <section>
          <h2 className="text-heading-md font-bold text-text-primary mb-8">
            Upcoming Events at {venue.name}
          </h2>

          <Suspense fallback={<VenueEventsSkeleton />}>
            <VenueEvents venueId={venue.id} venueName={venue.name} />
          </Suspense>
        </section>
      </div>
    </div>
  )
}

// ============================================================================
// 📅 Venue Events Section
// ============================================================================

async function VenueEvents({
  venueId,
  venueName,
}: {
  venueId: string
  venueName: string
}) {
  const { events, total } = await getEventsByVenue(venueId, 12)

  if (events.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="w-12 h-12" />}
        title="No upcoming events"
        description={`There are no upcoming events scheduled at ${venueName}. Check back soon!`}
        action={
          <Button asChild variant="secondary">
            <Link href={ROUTES.events}>Browse All Events</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div>
      <p className="text-body-sm text-text-secondary mb-6">
        {total} upcoming event{total !== 1 ? 's' : ''}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {total > 12 && (
        <div className="mt-8 text-center">
          <Button asChild variant="secondary">
            <Link href={`${ROUTES.events}?venue=${venueId}`}>
              View All {total} Events
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

function VenueEventsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  )
}
