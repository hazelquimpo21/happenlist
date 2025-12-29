// ============================================================================
// ✏️ HAPPENLIST - Edit Event Page
// ============================================================================
// Form page for editing an existing event.
// ============================================================================

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye } from 'lucide-react'
import { Button } from '@/components/ui'
import { EventForm } from '@/components/forms/event-form'
import { getCategories } from '@/lib/queries/categories'
import { getVenues } from '@/lib/queries/venues'
import { getOrganizers } from '@/lib/queries/organizers'
import { getTags } from '@/lib/queries/tags'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'
import type { Metadata } from 'next'
import type { EventWithRelations } from '@/types'

// ============================================================================
// 📋 Metadata Generator
// ============================================================================

interface EditEventPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: EditEventPageProps): Promise<Metadata> {
  const { id } = await params

  const supabase = createClient()
  const { data: event } = await supabase
    .from('events')
    .select('title')
    .eq('id', id)
    .single()

  return {
    title: event ? `Edit: ${event.title}` : 'Edit Event',
    description: 'Edit event details.',
  }
}

// ============================================================================
// ✏️ Edit Event Page Component
// ============================================================================

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params

  logger.info('📅 Rendering edit event page', { id })

  // Fetch event and form data in parallel
  const supabase = createClient()

  const [eventResult, categories, venues, organizers, tags] = await Promise.all([
    supabase
      .from('events')
      .select(
        `
        *,
        category:categories(*),
        venue:venues(*),
        organizer:organizers(*),
        tags:event_tags(tag:tags(*))
      `
      )
      .eq('id', id)
      .single(),
    getCategories(),
    getVenues(),
    getOrganizers(),
    getTags(),
  ])

  if (eventResult.error || !eventResult.data) {
    logger.warn('📅 Event not found', { id })
    notFound()
  }

  // Transform the event data
  const event: EventWithRelations = {
    ...eventResult.data,
    tags: eventResult.data.tags?.map((et: any) => et.tag) ?? [],
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* ========================================
          🔙 Back Navigation & Actions
          ======================================== */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={ROUTES.adminEvents}
          className="inline-flex items-center gap-2 text-body-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>

        {event.status === 'published' && (
          <Button asChild variant="ghost" size="sm">
            <Link href={ROUTES.eventDetail(event.slug)} target="_blank">
              <Eye className="w-4 h-4 mr-2" />
              View Live
            </Link>
          </Button>
        )}
      </div>

      {/* ========================================
          📋 Page Header
          ======================================== */}
      <div className="mb-8">
        <h1 className="text-heading-lg font-bold text-text-primary">
          Edit Event
        </h1>
        <p className="text-body-md text-text-secondary mt-1">{event.title}</p>
      </div>

      {/* ========================================
          📝 Event Form
          ======================================== */}
      <EventForm
        event={event}
        categories={categories}
        venues={venues}
        organizers={organizers}
        tags={tags}
      />
    </div>
  )
}
