// ============================================================================
// ✏️ HAPPENLIST - Edit Venue Page
// ============================================================================
// Form page for editing an existing venue.
// ============================================================================

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye } from 'lucide-react'
import { Button } from '@/components/ui'
import { VenueForm } from '@/components/forms/venue-form'
import { getVenueBySlug } from '@/lib/queries/venues'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'
import type { Metadata } from 'next'

// ============================================================================
// 📋 Metadata Generator
// ============================================================================

interface EditVenuePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: EditVenuePageProps): Promise<Metadata> {
  const { id } = await params

  const supabase = createClient()
  const { data: venue } = await supabase
    .from('venues')
    .select('name')
    .eq('id', id)
    .single()

  return {
    title: venue ? `Edit: ${venue.name}` : 'Edit Venue',
    description: 'Edit venue details.',
  }
}

// ============================================================================
// ✏️ Edit Venue Page Component
// ============================================================================

export default async function EditVenuePage({ params }: EditVenuePageProps) {
  const { id } = await params

  logger.info('📍 Rendering edit venue page', { id })

  const supabase = createClient()
  const { data: venue, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !venue) {
    logger.warn('📍 Venue not found', { id })
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* ========================================
          🔙 Back Navigation & Actions
          ======================================== */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={ROUTES.adminVenues}
          className="inline-flex items-center gap-2 text-body-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Venues
        </Link>

        <Button asChild variant="ghost" size="sm">
          <Link href={ROUTES.venueDetail(venue.slug)} target="_blank">
            <Eye className="w-4 h-4 mr-2" />
            View Live
          </Link>
        </Button>
      </div>

      {/* ========================================
          📋 Page Header
          ======================================== */}
      <div className="mb-8">
        <h1 className="text-heading-lg font-bold text-text-primary">
          Edit Venue
        </h1>
        <p className="text-body-md text-text-secondary mt-1">{venue.name}</p>
      </div>

      {/* ========================================
          📝 Venue Form
          ======================================== */}
      <VenueForm venue={venue} />
    </div>
  )
}
