// ============================================================================
// ➕ HAPPENLIST - New Organizer Page
// ============================================================================
// Form page for creating a new organizer.
// ============================================================================

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { OrganizerForm } from '@/components/forms/organizer-form'
import { ROUTES } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'
import type { Metadata } from 'next'

// ============================================================================
// 📋 Metadata
// ============================================================================

export const metadata: Metadata = {
  title: 'New Organizer',
  description: 'Add a new organizer to Happenlist.',
}

// ============================================================================
// ➕ New Organizer Page Component
// ============================================================================

export default function NewOrganizerPage() {
  logger.info('👥 Rendering new organizer page')

  return (
    <div className="max-w-2xl mx-auto">
      {/* ========================================
          🔙 Back Navigation
          ======================================== */}
      <Link
        href={ROUTES.adminOrganizers}
        className="inline-flex items-center gap-2 text-body-sm text-text-secondary hover:text-text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Organizers
      </Link>

      {/* ========================================
          📋 Page Header
          ======================================== */}
      <div className="mb-8">
        <h1 className="text-heading-lg font-bold text-text-primary">
          Add New Organizer
        </h1>
        <p className="text-body-md text-text-secondary mt-1">
          Add a new event organizer or promoter
        </p>
      </div>

      {/* ========================================
          📝 Organizer Form
          ======================================== */}
      <OrganizerForm />
    </div>
  )
}
