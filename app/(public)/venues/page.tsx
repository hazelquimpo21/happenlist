// ============================================================================
// 📍 HAPPENLIST - Venues Listing Page
// ============================================================================
// Displays all venues in the Milwaukee area.
// Shows venue cards with upcoming event counts.
// ============================================================================

import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Calendar, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui'
import { EmptyState } from '@/components/shared/empty-state'
import { getVenues } from '@/lib/queries/venues'
import { ROUTES } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'
import type { Metadata } from 'next'

// ============================================================================
// 📋 Metadata
// ============================================================================

export const metadata: Metadata = {
  title: 'Venues',
  description:
    'Explore venues in Milwaukee. Find concert halls, theaters, bars, parks, and more hosting events in your city.',
}

// ============================================================================
// 📍 Venues Page Component
// ============================================================================

export default async function VenuesPage() {
  logger.info('📍 Rendering venues page')

  return (
    <div className="py-8 md:py-12">
      <div className="page-container">
        {/* ========================================
            📋 Page Header
            ======================================== */}
        <div className="mb-8">
          <h1 className="text-heading-lg font-bold text-text-primary">
            Milwaukee Venues
          </h1>
          <p className="text-body-md text-text-secondary mt-2">
            Discover the best places for events in Milwaukee
          </p>
        </div>

        {/* ========================================
            📍 Venues Grid
            ======================================== */}
        <Suspense fallback={<VenuesGridSkeleton />}>
          <VenuesGrid />
        </Suspense>
      </div>
    </div>
  )
}

// ============================================================================
// 📍 Venues Grid
// ============================================================================

async function VenuesGrid() {
  const venues = await getVenues()

  if (venues.length === 0) {
    return (
      <EmptyState
        icon={<MapPin className="w-12 h-12" />}
        title="No venues yet"
        description="Check back soon for Milwaukee venues."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {venues.map((venue) => (
        <VenueCard key={venue.id} venue={venue} />
      ))}
    </div>
  )
}

// ============================================================================
// 🏢 Venue Card Component
// ============================================================================

interface VenueCardProps {
  venue: {
    id: string
    name: string
    slug: string
    address?: string | null
    city?: string | null
    image_url?: string | null
    website_url?: string | null
  }
}

function VenueCard({ venue }: VenueCardProps) {
  return (
    <Link href={ROUTES.venueDetail(venue.slug)}>
      <Card hover className="h-full flex flex-col">
        {/* Venue Image */}
        <div className="relative aspect-[4/3] bg-background">
          {venue.image_url ? (
            <Image
              src={venue.image_url}
              alt={venue.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="w-12 h-12 text-text-tertiary" />
            </div>
          )}
        </div>

        {/* Venue Info */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="text-heading-sm font-semibold text-text-primary">
            {venue.name}
          </h3>

          {(venue.address || venue.city) && (
            <p className="text-body-sm text-text-secondary mt-1 flex items-center gap-1">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {venue.address || venue.city}
              </span>
            </p>
          )}

          {/* Website Link */}
          {venue.website_url && (
            <p className="mt-auto pt-3 text-body-sm text-primary flex items-center gap-1">
              <ExternalLink className="w-4 h-4" />
              Visit Website
            </p>
          )}
        </div>
      </Card>
    </Link>
  )
}

// ============================================================================
// ⏳ Loading Skeleton
// ============================================================================

function VenuesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 9 }).map((_, i) => (
        <Card key={i} className="h-full">
          <div className="aspect-[4/3] bg-background animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-6 bg-background rounded animate-pulse w-3/4" />
            <div className="h-4 bg-background rounded animate-pulse w-1/2" />
          </div>
        </Card>
      ))}
    </div>
  )
}
