// ============================================================================
// 👥 HAPPENLIST - Organizer Server Actions
// ============================================================================
// Server actions for creating, updating, and deleting organizers.
// ============================================================================

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { organizerFormSchema } from '@/lib/validations/organizer'
import { slugify } from '@/lib/utils/slugify'
import { logger } from '@/lib/utils/logger'
import { ROUTES } from '@/lib/constants'
import type { ActionResponse, OrganizerFormInput } from '@/types'

// ============================================================================
// ➕ Create Organizer Action
// ============================================================================

/**
 * Creates a new organizer.
 *
 * @example
 * const result = await createOrganizer(organizerFormData)
 */
export async function createOrganizer(
  input: OrganizerFormInput
): Promise<ActionResponse<{ id: string; slug: string }>> {
  logger.info('👥 Creating organizer', { name: input.name })

  const supabase = createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    logger.warn('👥 Create organizer failed: unauthorized')
    return { success: false, error: 'You must be logged in to create organizers' }
  }

  // Validate input
  const parsed = organizerFormSchema.safeParse(input)
  if (!parsed.success) {
    logger.warn('👥 Create organizer validation failed', {
      errors: parsed.error.flatten().fieldErrors,
    })
    return {
      success: false,
      error: 'Please check your input and try again',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // Generate slug
  const slug = slugify(parsed.data.name)

  // Insert organizer
  const { data: organizer, error } = await supabase
    .from('organizers')
    .insert({
      ...parsed.data,
      slug,
      description: parsed.data.description || null,
    })
    .select('id, slug')
    .single()

  if (error) {
    logger.error('❌ Failed to create organizer', { error })

    // Check for duplicate slug
    if (error.code === '23505') {
      return { success: false, error: 'An organizer with this name already exists' }
    }

    return { success: false, error: 'Failed to create organizer. Please try again.' }
  }

  logger.info('✅ Organizer created', { id: organizer.id, slug: organizer.slug })

  // Revalidate pages
  revalidatePath(ROUTES.organizers)
  revalidatePath(ROUTES.adminOrganizers)

  return { success: true, data: organizer }
}

// ============================================================================
// ✏️ Update Organizer Action
// ============================================================================

/**
 * Updates an existing organizer.
 *
 * @example
 * const result = await updateOrganizer('organizer-uuid', updatedData)
 */
export async function updateOrganizer(
  id: string,
  input: Partial<OrganizerFormInput>
): Promise<ActionResponse<{ slug: string }>> {
  logger.info('👥 Updating organizer', { id })

  const supabase = createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    logger.warn('👥 Update organizer failed: unauthorized')
    return { success: false, error: 'You must be logged in to update organizers' }
  }

  // Partial validation
  const parsed = organizerFormSchema.partial().safeParse(input)
  if (!parsed.success) {
    logger.warn('👥 Update organizer validation failed', {
      errors: parsed.error.flatten().fieldErrors,
    })
    return {
      success: false,
      error: 'Please check your input and try again',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // Update organizer
  const { data: organizer, error } = await supabase
    .from('organizers')
    .update({
      ...parsed.data,
      description: parsed.data.description || null,
    })
    .eq('id', id)
    .select('slug')
    .single()

  if (error) {
    logger.error('❌ Failed to update organizer', { id, error })
    return { success: false, error: 'Failed to update organizer. Please try again.' }
  }

  logger.info('✅ Organizer updated', { id, slug: organizer.slug })

  // Revalidate pages
  revalidatePath(ROUTES.organizers)
  revalidatePath(ROUTES.organizerDetail(organizer.slug))
  revalidatePath(ROUTES.adminOrganizers)

  return { success: true, data: { slug: organizer.slug } }
}

// ============================================================================
// 🗑️ Delete Organizer Action
// ============================================================================

/**
 * Deletes an organizer (if no events are associated).
 *
 * @example
 * const result = await deleteOrganizer('organizer-uuid')
 */
export async function deleteOrganizer(id: string): Promise<ActionResponse> {
  logger.info('👥 Deleting organizer', { id })

  const supabase = createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    logger.warn('👥 Delete organizer failed: unauthorized')
    return { success: false, error: 'You must be logged in to delete organizers' }
  }

  // Check for associated events
  const { count } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('organizer_id', id)

  if (count && count > 0) {
    logger.warn('👥 Delete organizer failed: has events', { id, eventCount: count })
    return {
      success: false,
      error: `Cannot delete organizer with ${count} associated event(s). Remove or reassign events first.`,
    }
  }

  // Delete organizer
  const { error } = await supabase.from('organizers').delete().eq('id', id)

  if (error) {
    logger.error('❌ Failed to delete organizer', { id, error })
    return { success: false, error: 'Failed to delete organizer. Please try again.' }
  }

  logger.info('✅ Organizer deleted', { id })

  // Revalidate pages
  revalidatePath(ROUTES.organizers)
  revalidatePath(ROUTES.adminOrganizers)

  return { success: true, data: undefined }
}
