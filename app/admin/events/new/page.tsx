// ============================================================================
// ➕ HAPPENLIST - New Event Page
// ============================================================================
// Form page for creating a new event.
// ============================================================================

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { EventForm } from '@/components/forms/event-form'
import { getCategories } from '@/lib/queries/categories'
import { getVenues } from '@/lib/queries/venues'
import { getOrganizers } from '@/lib/queries/organizers'
import { getTags } from '@/lib/queries/tags'
import { ROUTES } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'
import type { Metadata } from 'next'

// ============================================================================
// 📋 Metadata
// ============================================================================

export const metadata: Metadata = {
  title: 'New Event',
  description: 'Create a new event on Happenlist.',
}

// ============================================================================
// ➕ New Event Page Component
// ============================================================================

export default async function NewEventPage() {
  logger.info('📅 Rendering new event page')

  // Fetch form data in parallel
  const [categories, venues, organizers, tags] = await Promise.all([
    getCategories(),
    getVenues(),
    getOrganizers(),
    getTags(),
  ])

  return (
    <div className="max-w-4xl mx-auto">
      {/* ========================================
          🔙 Back Navigation
          ======================================== */}
      <Link
        href={ROUTES.adminEvents}
        className="inline-flex items-center gap-2 text-body-sm text-text-secondary hover:text-text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Events
      </Link>

      {/* ========================================
          📋 Page Header
          ======================================== */}
      <div className="mb-8">
        <h1 className="text-heading-lg font-bold text-text-primary">
          Create New Event
        </h1>
        <p className="text-body-md text-text-secondary mt-1">
          Fill out the form below to create a new event
        </p>
      </div>

      {/* ========================================
          📝 Event Form
          ======================================== */}
      <EventForm
        categories={categories}
        venues={venues}
        organizers={organizers}
        tags={tags}
      />
    </div>
  )
}
