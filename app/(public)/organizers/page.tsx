// ============================================================================
// 👥 HAPPENLIST - Organizers Listing Page
// ============================================================================
// Displays all event organizers in Milwaukee.
// Shows organizer cards with description and website links.
// ============================================================================

import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Users, Globe, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui'
import { EmptyState } from '@/components/shared/empty-state'
import { getOrganizers } from '@/lib/queries/organizers'
import { ROUTES } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'
import type { Metadata } from 'next'

// ============================================================================
// 📋 Metadata
// ============================================================================

export const metadata: Metadata = {
  title: 'Organizers',
  description:
    'Discover event organizers in Milwaukee. Find promoters, venues, and organizations hosting events in your city.',
}

// ============================================================================
// 👥 Organizers Page Component
// ============================================================================

export default async function OrganizersPage() {
  logger.info('👥 Rendering organizers page')

  return (
    <div className="py-8 md:py-12">
      <div className="page-container">
        {/* ========================================
            📋 Page Header
            ======================================== */}
        <div className="mb-8">
          <h1 className="text-heading-lg font-bold text-text-primary">
            Event Organizers
          </h1>
          <p className="text-body-md text-text-secondary mt-2">
            Meet the people and organizations bringing events to Milwaukee
          </p>
        </div>

        {/* ========================================
            👥 Organizers Grid
            ======================================== */}
        <Suspense fallback={<OrganizersGridSkeleton />}>
          <OrganizersGrid />
        </Suspense>
      </div>
    </div>
  )
}

// ============================================================================
// 👥 Organizers Grid
// ============================================================================

async function OrganizersGrid() {
  const organizers = await getOrganizers()

  if (organizers.length === 0) {
    return (
      <EmptyState
        icon={<Users className="w-12 h-12" />}
        title="No organizers yet"
        description="Check back soon for event organizers."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {organizers.map((organizer) => (
        <OrganizerCard key={organizer.id} organizer={organizer} />
      ))}
    </div>
  )
}

// ============================================================================
// 👤 Organizer Card Component
// ============================================================================

interface OrganizerCardProps {
  organizer: {
    id: string
    name: string
    slug: string
    description?: string | null
    logo_url?: string | null
    website_url?: string | null
  }
}

function OrganizerCard({ organizer }: OrganizerCardProps) {
  return (
    <Link href={ROUTES.organizerDetail(organizer.slug)}>
      <Card hover className="h-full flex flex-col p-6">
        {/* Organizer Logo/Avatar */}
        <div className="flex items-start gap-4">
          <div className="relative w-16 h-16 shrink-0 rounded-full overflow-hidden bg-background">
            {organizer.logo_url ? (
              <Image
                src={organizer.logo_url}
                alt={organizer.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Users className="w-8 h-8 text-text-tertiary" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-heading-sm font-semibold text-text-primary truncate">
              {organizer.name}
            </h3>

            {organizer.website_url && (
              <p className="text-body-sm text-primary flex items-center gap-1 mt-1">
                <Globe className="w-4 h-4" />
                Website
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        {organizer.description && (
          <p className="text-body-sm text-text-secondary mt-4 line-clamp-3">
            {organizer.description}
          </p>
        )}

        {/* View Events Link */}
        <p className="mt-auto pt-4 text-body-sm font-medium text-primary flex items-center gap-1">
          View Events
          <ExternalLink className="w-4 h-4" />
        </p>
      </Card>
    </Link>
  )
}

// ============================================================================
// ⏳ Loading Skeleton
// ============================================================================

function OrganizersGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 9 }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-background animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-background rounded animate-pulse w-3/4" />
              <div className="h-4 bg-background rounded animate-pulse w-1/2" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-4 bg-background rounded animate-pulse" />
            <div className="h-4 bg-background rounded animate-pulse w-3/4" />
          </div>
        </Card>
      ))}
    </div>
  )
}
