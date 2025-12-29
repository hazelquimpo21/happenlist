// ============================================================================
// ✏️ HAPPENLIST - Edit Organizer Page
// ============================================================================
// Form page for editing an existing organizer.
// ============================================================================

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye } from 'lucide-react'
import { Button } from '@/components/ui'
import { OrganizerForm } from '@/components/forms/organizer-form'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'
import type { Metadata } from 'next'

// ============================================================================
// 📋 Metadata Generator
// ============================================================================

interface EditOrganizerPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: EditOrganizerPageProps): Promise<Metadata> {
  const { id } = await params

  const supabase = createClient()
  const { data: organizer } = await supabase
    .from('organizers')
    .select('name')
    .eq('id', id)
    .single()

  return {
    title: organizer ? `Edit: ${organizer.name}` : 'Edit Organizer',
    description: 'Edit organizer details.',
  }
}

// ============================================================================
// ✏️ Edit Organizer Page Component
// ============================================================================

export default async function EditOrganizerPage({
  params,
}: EditOrganizerPageProps) {
  const { id } = await params

  logger.info('👥 Rendering edit organizer page', { id })

  const supabase = createClient()
  const { data: organizer, error } = await supabase
    .from('organizers')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !organizer) {
    logger.warn('👥 Organizer not found', { id })
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* ========================================
          🔙 Back Navigation & Actions
          ======================================== */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={ROUTES.adminOrganizers}
          className="inline-flex items-center gap-2 text-body-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Organizers
        </Link>

        <Button asChild variant="ghost" size="sm">
          <Link href={ROUTES.organizerDetail(organizer.slug)} target="_blank">
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
          Edit Organizer
        </h1>
        <p className="text-body-md text-text-secondary mt-1">{organizer.name}</p>
      </div>

      {/* ========================================
          📝 Organizer Form
          ======================================== */}
      <OrganizerForm organizer={organizer} />
    </div>
  )
}
