// ============================================================================
// 👥 HAPPENLIST - Organizer Detail Page
// ============================================================================
// Displays full details for a single organizer and their events.
// ============================================================================

import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Users, Globe, ArrowLeft, Calendar } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { EventCard } from '@/components/events/event-card'
import { EventCardSkeleton } from '@/components/events/event-card-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { getOrganizerBySlug } from '@/lib/queries/organizers'
import { getEventsByOrganizer } from '@/lib/queries/events'
import { ROUTES } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'
import { Suspense } from 'react'
import type { Metadata } from 'next'

// ============================================================================
// 📋 Metadata Generator
// ============================================================================

interface OrganizerDetailPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: OrganizerDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const organizer = await getOrganizerBySlug(slug)

  if (!organizer) {
    return {
      title: 'Organizer Not Found',
    }
  }

  return {
    title: organizer.name,
    description:
      organizer.description || `Discover events by ${organizer.name}.`,
    openGraph: {
      title: organizer.name,
      description:
        organizer.description || `Discover events by ${organizer.name}.`,
      images: organizer.logo_url ? [organizer.logo_url] : undefined,
    },
  }
}

// ============================================================================
// 👥 Organizer Detail Page Component
// ============================================================================

export default async function OrganizerDetailPage({
  params,
}: OrganizerDetailPageProps) {
  const { slug } = await params

  logger.info('👥 Rendering organizer detail page', { slug })

  const organizer = await getOrganizerBySlug(slug)

  if (!organizer) {
    logger.warn('👥 Organizer not found', { slug })
    notFound()
  }

  return (
    <div className="py-8 md:py-12">
      <div className="page-container">
        {/* ========================================
            🔙 Back Navigation
            ======================================== */}
        <Link
          href={ROUTES.organizers}
          className="inline-flex items-center gap-2 text-body-sm text-text-secondary hover:text-text-primary mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Organizers
        </Link>

        {/* ========================================
            👥 Organizer Header
            ======================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Organizer Logo & Description */}
          <div className="lg:col-span-2">
            <div className="flex items-start gap-6">
              {/* Logo */}
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-full overflow-hidden bg-background">
                {organizer.logo_url ? (
                  <Image
                    src={organizer.logo_url}
                    alt={organizer.name}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users className="w-12 h-12 text-text-tertiary" />
                  </div>
                )}
              </div>

              {/* Name & Description */}
              <div className="flex-1">
                <h1 className="text-heading-lg font-bold text-text-primary">
                  {organizer.name}
                </h1>

                {organizer.description && (
                  <p className="mt-4 text-body-md text-text-secondary whitespace-pre-wrap">
                    {organizer.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Organizer Info Card */}
          <Card className="p-6 h-fit">
            <h2 className="text-heading-sm font-semibold text-text-primary mb-4">
              About
            </h2>

            {/* Stats placeholder - could add event counts here */}
            <div className="space-y-4">
              {organizer.website_url && (
                <Button asChild className="w-full">
                  <a
                    href={organizer.website_url}
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
            📅 Organizer's Events
            ======================================== */}
        <section>
          <h2 className="text-heading-md font-bold text-text-primary mb-8">
            Events by {organizer.name}
          </h2>

          <Suspense fallback={<OrganizerEventsSkeleton />}>
            <OrganizerEvents
              organizerId={organizer.id}
              organizerName={organizer.name}
            />
          </Suspense>
        </section>
      </div>
    </div>
  )
}

// ============================================================================
// 📅 Organizer Events Section
// ============================================================================

async function OrganizerEvents({
  organizerId,
  organizerName,
}: {
  organizerId: string
  organizerName: string
}) {
  const { events, total } = await getEventsByOrganizer(organizerId, 12)

  if (events.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="w-12 h-12" />}
        title="No upcoming events"
        description={`${organizerName} doesn't have any upcoming events scheduled. Check back soon!`}
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
            <Link href={`${ROUTES.events}?organizer=${organizerId}`}>
              View All {total} Events
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

function OrganizerEventsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  )
}
