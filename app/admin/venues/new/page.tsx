// ============================================================================
// ➕ HAPPENLIST - New Venue Page
// ============================================================================
// Form page for creating a new venue.
// ============================================================================

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { VenueForm } from '@/components/forms/venue-form'
import { ROUTES } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'
import type { Metadata } from 'next'

// ============================================================================
// 📋 Metadata
// ============================================================================

export const metadata: Metadata = {
  title: 'New Venue',
  description: 'Add a new venue to Happenlist.',
}

// ============================================================================
// ➕ New Venue Page Component
// ============================================================================

export default function NewVenuePage() {
  logger.info('📍 Rendering new venue page')

  return (
    <div className="max-w-2xl mx-auto">
      {/* ========================================
          🔙 Back Navigation
          ======================================== */}
      <Link
        href={ROUTES.adminVenues}
        className="inline-flex items-center gap-2 text-body-sm text-text-secondary hover:text-text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Venues
      </Link>

      {/* ========================================
          📋 Page Header
          ======================================== */}
      <div className="mb-8">
        <h1 className="text-heading-lg font-bold text-text-primary">
          Add New Venue
        </h1>
        <p className="text-body-md text-text-secondary mt-1">
          Add a new location where events can take place
        </p>
      </div>

      {/* ========================================
          📝 Venue Form
          ======================================== */}
      <VenueForm />
    </div>
  )
}
