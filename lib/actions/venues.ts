// ============================================================================
// 📍 HAPPENLIST - Venue Server Actions
// ============================================================================
// Server actions for creating, updating, and deleting venues.
// ============================================================================

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { venueFormSchema } from '@/lib/validations/venue'
import { slugify } from '@/lib/utils/slugify'
import { logger } from '@/lib/utils/logger'
import { ROUTES } from '@/lib/constants'
import type { ActionResponse, VenueFormInput } from '@/types'

// ============================================================================
// ➕ Create Venue Action
// ============================================================================

/**
 * Creates a new venue.
 *
 * @example
 * const result = await createVenue(venueFormData)
 */
export async function createVenue(
  input: VenueFormInput
): Promise<ActionResponse<{ id: string; slug: string }>> {
  logger.info('📍 Creating venue', { name: input.name })

  const supabase = createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    logger.warn('📍 Create venue failed: unauthorized')
    return { success: false, error: 'You must be logged in to create venues' }
  }

  // Validate input
  const parsed = venueFormSchema.safeParse(input)
  if (!parsed.success) {
    logger.warn('📍 Create venue validation failed', {
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

  // Insert venue
  const { data: venue, error } = await supabase
    .from('venues')
    .insert({
      ...parsed.data,
      slug,
      address: parsed.data.address || null,
      zip: parsed.data.zip || null,
    })
    .select('id, slug')
    .single()

  if (error) {
    logger.error('❌ Failed to create venue', { error })

    // Check for duplicate slug
    if (error.code === '23505') {
      return { success: false, error: 'A venue with this name already exists' }
    }

    return { success: false, error: 'Failed to create venue. Please try again.' }
  }

  logger.info('✅ Venue created', { id: venue.id, slug: venue.slug })

  // Revalidate pages
  revalidatePath(ROUTES.venues)
  revalidatePath(ROUTES.adminVenues)

  return { success: true, data: venue }
}

// ============================================================================
// ✏️ Update Venue Action
// ============================================================================

/**
 * Updates an existing venue.
 *
 * @example
 * const result = await updateVenue('venue-uuid', updatedData)
 */
export async function updateVenue(
  id: string,
  input: Partial<VenueFormInput>
): Promise<ActionResponse<{ slug: string }>> {
  logger.info('📍 Updating venue', { id })

  const supabase = createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    logger.warn('📍 Update venue failed: unauthorized')
    return { success: false, error: 'You must be logged in to update venues' }
  }

  // Partial validation
  const parsed = venueFormSchema.partial().safeParse(input)
  if (!parsed.success) {
    logger.warn('📍 Update venue validation failed', {
      errors: parsed.error.flatten().fieldErrors,
    })
    return {
      success: false,
      error: 'Please check your input and try again',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // Update venue
  const { data: venue, error } = await supabase
    .from('venues')
    .update({
      ...parsed.data,
      address: parsed.data.address || null,
      zip: parsed.data.zip || null,
    })
    .eq('id', id)
    .select('slug')
    .single()

  if (error) {
    logger.error('❌ Failed to update venue', { id, error })
    return { success: false, error: 'Failed to update venue. Please try again.' }
  }

  logger.info('✅ Venue updated', { id, slug: venue.slug })

  // Revalidate pages
  revalidatePath(ROUTES.venues)
  revalidatePath(ROUTES.venueDetail(venue.slug))
  revalidatePath(ROUTES.adminVenues)

  return { success: true, data: { slug: venue.slug } }
}

// ============================================================================
// 🗑️ Delete Venue Action
// ============================================================================

/**
 * Deletes a venue (if no events are associated).
 *
 * @example
 * const result = await deleteVenue('venue-uuid')
 */
export async function deleteVenue(id: string): Promise<ActionResponse> {
  logger.info('📍 Deleting venue', { id })

  const supabase = createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    logger.warn('📍 Delete venue failed: unauthorized')
    return { success: false, error: 'You must be logged in to delete venues' }
  }

  // Check for associated events
  const { count } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('venue_id', id)

  if (count && count > 0) {
    logger.warn('📍 Delete venue failed: has events', { id, eventCount: count })
    return {
      success: false,
      error: `Cannot delete venue with ${count} associated event(s). Remove or reassign events first.`,
    }
  }

  // Delete venue
  const { error } = await supabase.from('venues').delete().eq('id', id)

  if (error) {
    logger.error('❌ Failed to delete venue', { id, error })
    return { success: false, error: 'Failed to delete venue. Please try again.' }
  }

  logger.info('✅ Venue deleted', { id })

  // Revalidate pages
  revalidatePath(ROUTES.venues)
  revalidatePath(ROUTES.adminVenues)

  return { success: true, data: undefined }
}
