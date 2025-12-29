// ============================================================================
// 🔐 HAPPENLIST - Organizer Validation Schemas
// ============================================================================
// Zod schemas for validating organizer form data.
// ============================================================================

import { z } from 'zod'
import { urlSchema, imageUrlSchema, instagramHandleSchema } from './shared'

// ============================================================================
// 👥 Organizer Form Schema
// ============================================================================

/**
 * Validation schema for organizer forms.
 */
export const organizerFormSchema = z.object({
  // ========================================
  // 📝 Basic Info
  // ========================================
  name: z
    .string()
    .min(1, 'Organizer name is required')
    .max(255, 'Name is too long (max 255 characters)'),

  description: z
    .string()
    .max(5000, 'Description is too long (max 5,000 characters)')
    .optional()
    .or(z.literal('')),

  // ========================================
  // 🔗 Links & Media
  // ========================================
  logo_url: imageUrlSchema,
  website: urlSchema,

  // ========================================
  // 📱 Social Media
  // ========================================
  instagram_handle: instagramHandleSchema,
})

/**
 * Type inferred from the organizer form schema.
 */
export type OrganizerFormData = z.infer<typeof organizerFormSchema>

// ============================================================================
// 🔄 Partial Organizer Schema (for updates)
// ============================================================================

/**
 * Partial schema for updating organizers.
 */
export const organizerUpdateSchema = organizerFormSchema.partial()

export type OrganizerUpdateData = z.infer<typeof organizerUpdateSchema>
