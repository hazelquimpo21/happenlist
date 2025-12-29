// ============================================================================
// 📍 HAPPENLIST - Admin Venues List
// ============================================================================
// Lists all venues with management actions.
// ============================================================================

import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Plus, Edit, Trash2, Globe, MoreHorizontal } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { getVenues } from '@/lib/queries/venues'
import { ROUTES } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'
import type { Metadata } from 'next'

// ============================================================================
// 📋 Metadata
// ============================================================================

export const metadata: Metadata = {
  title: 'Venues',
  description: 'Manage venues on Happenlist.',
}

// ============================================================================
// 📍 Admin Venues Page Component
// ============================================================================

export default async function AdminVenuesPage() {
  logger.info('📍 Rendering admin venues page')

  return (
    <div className="space-y-6">
      {/* ========================================
          📋 Page Header
          ======================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-heading-lg font-bold text-text-primary">Venues</h1>
          <p className="text-body-md text-text-secondary mt-1">
            Manage event venues and locations
          </p>
        </div>

        <Button asChild>
          <Link href={ROUTES.adminVenueNew}>
            <Plus className="w-4 h-4 mr-2" />
            New Venue
          </Link>
        </Button>
      </div>

      {/* ========================================
          📍 Venues List
          ======================================== */}
      <Suspense fallback={<VenuesListSkeleton />}>
        <VenuesList />
      </Suspense>
    </div>
  )
}

// ============================================================================
// 📍 Venues List Component
// ============================================================================

async function VenuesList() {
  const venues = await getVenues()

  if (venues.length === 0) {
    return (
      <Card className="p-12 text-center">
        <MapPin className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
        <h3 className="text-heading-sm font-semibold text-text-primary">
          No venues yet
        </h3>
        <p className="text-body-sm text-text-secondary mt-2">
          Get started by creating your first venue.
        </p>
        <Button asChild className="mt-6">
          <Link href={ROUTES.adminVenueNew}>
            <Plus className="w-4 h-4 mr-2" />
            Create Venue
          </Link>
        </Button>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {venues.map((venue) => (
        <Card key={venue.id} className="overflow-hidden">
          {/* Venue Image */}
          <div className="relative aspect-video bg-background">
            {venue.image_url ? (
              <Image
                src={venue.image_url}
                alt={venue.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin className="w-12 h-12 text-text-tertiary" />
              </div>
            )}
          </div>

          {/* Venue Info */}
          <div className="p-4">
            <h3 className="text-heading-sm font-semibold text-text-primary">
              {venue.name}
            </h3>

            {(venue.address || venue.city) && (
              <p className="text-body-sm text-text-secondary mt-1 flex items-center gap-1">
                <MapPin className="w-4 h-4 shrink-0" />
                {venue.address || venue.city}
              </p>
            )}

            {venue.website_url && (
              <a
                href={venue.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-body-sm text-primary hover:underline mt-1 flex items-center gap-1"
              >
                <Globe className="w-4 h-4" />
                Website
              </a>
            )}

            {/* Actions */}
            <div className="mt-4 flex items-center gap-2">
              <Button asChild variant="secondary" size="sm" className="flex-1">
                <Link href={ROUTES.adminVenueEdit(venue.id)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Link>
              </Button>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ============================================================================
// ⏳ Loading Skeleton
// ============================================================================

function VenuesListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden animate-pulse">
          <div className="aspect-video bg-background" />
          <div className="p-4 space-y-3">
            <div className="h-6 bg-background rounded w-3/4" />
            <div className="h-4 bg-background rounded w-1/2" />
          </div>
        </Card>
      ))}
    </div>
  )
}
