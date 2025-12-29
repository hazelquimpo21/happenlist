// ============================================================================
// 👥 HAPPENLIST - Admin Organizers List
// ============================================================================
// Lists all organizers with management actions.
// ============================================================================

import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Users, Plus, Edit, Globe, MoreHorizontal } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { getOrganizers } from '@/lib/queries/organizers'
import { ROUTES } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'
import type { Metadata } from 'next'

// ============================================================================
// 📋 Metadata
// ============================================================================

export const metadata: Metadata = {
  title: 'Organizers',
  description: 'Manage organizers on Happenlist.',
}

// ============================================================================
// 👥 Admin Organizers Page Component
// ============================================================================

export default async function AdminOrganizersPage() {
  logger.info('👥 Rendering admin organizers page')

  return (
    <div className="space-y-6">
      {/* ========================================
          📋 Page Header
          ======================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-heading-lg font-bold text-text-primary">
            Organizers
          </h1>
          <p className="text-body-md text-text-secondary mt-1">
            Manage event organizers and promoters
          </p>
        </div>

        <Button asChild>
          <Link href={ROUTES.adminOrganizerNew}>
            <Plus className="w-4 h-4 mr-2" />
            New Organizer
          </Link>
        </Button>
      </div>

      {/* ========================================
          👥 Organizers List
          ======================================== */}
      <Suspense fallback={<OrganizersListSkeleton />}>
        <OrganizersList />
      </Suspense>
    </div>
  )
}

// ============================================================================
// 👥 Organizers List Component
// ============================================================================

async function OrganizersList() {
  const organizers = await getOrganizers()

  if (organizers.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Users className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
        <h3 className="text-heading-sm font-semibold text-text-primary">
          No organizers yet
        </h3>
        <p className="text-body-sm text-text-secondary mt-2">
          Get started by adding your first organizer.
        </p>
        <Button asChild className="mt-6">
          <Link href={ROUTES.adminOrganizerNew}>
            <Plus className="w-4 h-4 mr-2" />
            Add Organizer
          </Link>
        </Button>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {organizers.map((organizer) => (
        <Card key={organizer.id} className="p-6">
          <div className="flex items-start gap-4">
            {/* Logo */}
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

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-heading-sm font-semibold text-text-primary truncate">
                {organizer.name}
              </h3>

              {organizer.website_url && (
                <a
                  href={organizer.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-body-sm text-primary hover:underline mt-1 flex items-center gap-1"
                >
                  <Globe className="w-4 h-4" />
                  Website
                </a>
              )}
            </div>
          </div>

          {/* Description */}
          {organizer.description && (
            <p className="text-body-sm text-text-secondary mt-4 line-clamp-2">
              {organizer.description}
            </p>
          )}

          {/* Actions */}
          <div className="mt-4 flex items-center gap-2">
            <Button asChild variant="secondary" size="sm" className="flex-1">
              <Link href={ROUTES.adminOrganizerEdit(organizer.id)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ============================================================================
// ⏳ Loading Skeleton
// ============================================================================

function OrganizersListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-6 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-background" />
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-background rounded w-3/4" />
              <div className="h-4 bg-background rounded w-1/2" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
