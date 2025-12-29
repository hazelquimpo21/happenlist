// ============================================================================
// 📅 HAPPENLIST - Event Server Actions
// ============================================================================
// Server actions for creating, updating, and deleting events.
// ============================================================================

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { eventFormSchema } from '@/lib/validations/event'
import { slugify, generateUniqueSlug } from '@/lib/utils/slugify'
import { logger } from '@/lib/utils/logger'
import { ROUTES } from '@/lib/constants'
import type { ActionResponse, EventFormInput } from '@/types'

// ============================================================================
// ➕ Create Event Action
// ============================================================================

/**
 * Creates a new event.
 *
 * @example
 * const result = await createEvent(eventFormData)
 * if (result.success) {
 *   router.push(`/events/${result.data.slug}`)
 * }
 */
export async function createEvent(
  input: EventFormInput
): Promise<ActionResponse<{ id: string; slug: string }>> {
  logger.info('📅 Creating event', { title: input.title })

  const supabase = createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    logger.warn('📅 Create event failed: unauthorized')
    return { success: false, error: 'You must be logged in to create events' }
  }

  // Validate input
  const parsed = eventFormSchema.safeParse(input)
  if (!parsed.success) {
    logger.warn('📅 Create event validation failed', {
      errors: parsed.error.flatten().fieldErrors,
    })
    return {
      success: false,
      error: 'Please check your input and try again',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { tag_ids, ...eventData } = parsed.data

  // Generate unique slug
  const { data: existingSlugs } = await supabase
    .from('events')
    .select('slug')

  const slug = generateUniqueSlug(
    eventData.title,
    existingSlugs?.map((e) => e.slug) ?? []
  )

  // Insert event
  const { data: event, error } = await supabase
    .from('events')
    .insert({
      ...eventData,
      slug,
      description: eventData.description || null,
      end_at: eventData.end_at || null,
    })
    .select('id, slug')
    .single()

  if (error) {
    logger.error('❌ Failed to create event', { error })
    return { success: false, error: 'Failed to create event. Please try again.' }
  }

  // Insert tags
  if (tag_ids.length > 0) {
    await supabase.from('event_tags').insert(
      tag_ids.map((tagId) => ({
        event_id: event.id,
        tag_id: tagId,
      }))
    )
  }

  logger.info('✅ Event created', { id: event.id, slug: event.slug })

  // Revalidate pages
  revalidatePath(ROUTES.events)
  revalidatePath(ROUTES.adminEvents)
  revalidatePath(ROUTES.home)

  return { success: true, data: event }
}

// ============================================================================
// ✏️ Update Event Action
// ============================================================================

/**
 * Updates an existing event.
 *
 * @example
 * const result = await updateEvent('event-uuid', updatedData)
 */
export async function updateEvent(
  id: string,
  input: Partial<EventFormInput>
): Promise<ActionResponse<{ slug: string }>> {
  logger.info('📅 Updating event', { id })

  const supabase = createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    logger.warn('📅 Update event failed: unauthorized')
    return { success: false, error: 'You must be logged in to update events' }
  }

  // Partial validation
  const parsed = eventFormSchema.partial().safeParse(input)
  if (!parsed.success) {
    logger.warn('📅 Update event validation failed', {
      errors: parsed.error.flatten().fieldErrors,
    })
    return {
      success: false,
      error: 'Please check your input and try again',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { tag_ids, ...eventData } = parsed.data

  // Update event
  const { data: event, error } = await supabase
    .from('events')
    .update({
      ...eventData,
      description: eventData.description || null,
      end_at: eventData.end_at || null,
    })
    .eq('id', id)
    .select('slug')
    .single()

  if (error) {
    logger.error('❌ Failed to update event', { id, error })
    return { success: false, error: 'Failed to update event. Please try again.' }
  }

  // Update tags if provided
  if (tag_ids !== undefined) {
    // Delete existing tags
    await supabase.from('event_tags').delete().eq('event_id', id)

    // Insert new tags
    if (tag_ids.length > 0) {
      await supabase.from('event_tags').insert(
        tag_ids.map((tagId) => ({
          event_id: id,
          tag_id: tagId,
        }))
      )
    }
  }

  logger.info('✅ Event updated', { id, slug: event.slug })

  // Revalidate pages
  revalidatePath(ROUTES.events)
  revalidatePath(ROUTES.eventDetail(event.slug))
  revalidatePath(ROUTES.adminEvents)
  revalidatePath(ROUTES.home)

  return { success: true, data: { slug: event.slug } }
}

// ============================================================================
// 🗑️ Delete Event Action (Soft Delete)
// ============================================================================

/**
 * Archives an event (soft delete).
 *
 * @example
 * const result = await deleteEvent('event-uuid')
 */
export async function deleteEvent(id: string): Promise<ActionResponse> {
  logger.info('📅 Deleting event', { id })

  const supabase = createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    logger.warn('📅 Delete event failed: unauthorized')
    return { success: false, error: 'You must be logged in to delete events' }
  }

  // Soft delete by setting status to archived
  const { error } = await supabase
    .from('events')
    .update({ status: 'archived' })
    .eq('id', id)

  if (error) {
    logger.error('❌ Failed to delete event', { id, error })
    return { success: false, error: 'Failed to delete event. Please try again.' }
  }

  logger.info('✅ Event archived', { id })

  // Revalidate pages
  revalidatePath(ROUTES.events)
  revalidatePath(ROUTES.adminEvents)
  revalidatePath(ROUTES.home)

  return { success: true, data: undefined }
}

// ============================================================================
// 📋 Duplicate Event Action
// ============================================================================

/**
 * Duplicates an event as a new draft.
 *
 * @example
 * const result = await duplicateEvent('event-uuid')
 * if (result.success) {
 *   router.push(`/admin/events/${result.data.id}/edit`)
 * }
 */
export async function duplicateEvent(
  id: string
): Promise<ActionResponse<{ id: string; slug: string }>> {
  logger.info('📅 Duplicating event', { id })

  const supabase = createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    logger.warn('📅 Duplicate event failed: unauthorized')
    return { success: false, error: 'You must be logged in to duplicate events' }
  }

  // Fetch original event
  const { data: original } = await supabase
    .from('events')
    .select('*, event_tags(tag_id)')
    .eq('id', id)
    .single()

  if (!original) {
    logger.warn('📅 Duplicate event failed: not found', { id })
    return { success: false, error: 'Event not found' }
  }

  // Generate new slug
  const { data: existingSlugs } = await supabase.from('events').select('slug')
  const newTitle = `${original.title} (copy)`
  const newSlug = generateUniqueSlug(
    newTitle,
    existingSlugs?.map((e) => e.slug) ?? []
  )

  // Create copy (without dates - user should set new ones)
  const {
    id: _id,
    slug: _slug,
    created_at,
    updated_at,
    event_tags,
    start_at,
    end_at,
    ...copyData
  } = original

  const { data: newEvent, error } = await supabase
    .from('events')
    .insert({
      ...copyData,
      title: newTitle,
      slug: newSlug,
      status: 'draft',
      start_at: new Date().toISOString(), // Placeholder - user should update
    })
    .select('id, slug')
    .single()

  if (error) {
    logger.error('❌ Failed to duplicate event', { id, error })
    return { success: false, error: 'Failed to duplicate event. Please try again.' }
  }

  // Copy tags
  if (event_tags && event_tags.length > 0) {
    await supabase.from('event_tags').insert(
      event_tags.map((et: any) => ({
        event_id: newEvent.id,
        tag_id: et.tag_id,
      }))
    )
  }

  logger.info('✅ Event duplicated', {
    originalId: id,
    newId: newEvent.id,
    newSlug: newEvent.slug,
  })

  // Revalidate
  revalidatePath(ROUTES.adminEvents)

  return { success: true, data: newEvent }
}
