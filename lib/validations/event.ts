// ============================================================================
// 🔐 HAPPENLIST - Event Validation Schemas
// ============================================================================
// Zod schemas for validating event form data.
// Used both client-side (forms) and server-side (actions).
// ============================================================================

import { z } from 'zod'
import {
  urlSchema,
  imageUrlSchema,
  priceSchema,
  optionalUuidSchema,
  datetimeSchema,
  optionalDatetimeSchema,
} from './shared'

// ============================================================================
// 📊 Event Status Schema
// ============================================================================

/**
 * Valid event statuses.
 */
export const eventStatusSchema = z.enum([
  'draft',
  'published',
  'cancelled',
  'archived',
])

// ============================================================================
// 📅 Event Form Schema
// ============================================================================

/**
 * Complete validation schema for event forms.
 * Includes custom refinements for complex validation logic.
 */
export const eventFormSchema = z
  .object({
    // ========================================
    // 📝 Basic Info
    // ========================================
    title: z
      .string()
      .min(1, 'Title is required')
      .max(500, 'Title is too long (max 500 characters)'),

    description: z
      .string()
      .max(10000, 'Description is too long (max 10,000 characters)')
      .optional()
      .or(z.literal('')),

    // ========================================
    // 🔗 Relationships
    // ========================================
    type_id: optionalUuidSchema,
    category_id: optionalUuidSchema,
    venue_id: optionalUuidSchema,
    organizer_id: optionalUuidSchema,

    // ========================================
    // 📅 Date & Time
    // ========================================
    start_at: datetimeSchema,
    end_at: optionalDatetimeSchema,
    is_all_day: z.boolean().default(false),

    // ========================================
    // 🖼️ Media
    // ========================================
    image_url: imageUrlSchema,
    flyer_url: imageUrlSchema,

    // ========================================
    // 🔗 Links
    // ========================================
    source_url: urlSchema,
    ticket_url: urlSchema,

    // ========================================
    // 💰 Pricing
    // ========================================
    price_min: priceSchema,
    price_max: priceSchema,
    is_free: z.boolean().default(false),

    // ========================================
    // 📊 Status & Tags
    // ========================================
    status: eventStatusSchema.default('draft'),
    tag_ids: z.array(z.string().uuid()).default([]),
  })
  // ========================================
  // ✅ Custom Validations
  // ========================================
  .refine(
    (data) => {
      // End date must be after start date
      if (data.end_at && data.end_at !== '') {
        return new Date(data.end_at) > new Date(data.start_at)
      }
      return true
    },
    {
      message: 'End date must be after start date',
      path: ['end_at'],
    }
  )
  .refine(
    (data) => {
      // Max price must be >= min price
      if (
        data.price_min !== undefined &&
        data.price_max !== undefined &&
        data.price_min !== null &&
        data.price_max !== null
      ) {
        return data.price_max >= data.price_min
      }
      return true
    },
    {
      message: 'Maximum price must be greater than or equal to minimum price',
      path: ['price_max'],
    }
  )
  .refine(
    (data) => {
      // If not free, should have at least min price
      if (!data.is_free && !data.price_min && !data.ticket_url) {
        // This is just a warning, not blocking
        return true
      }
      return true
    },
    {
      message: 'Consider adding price information or a ticket URL',
      path: ['price_min'],
    }
  )

/**
 * Type inferred from the event form schema.
 * Use this in your form components.
 */
export type EventFormData = z.infer<typeof eventFormSchema>

// ============================================================================
// 🔄 Partial Event Schema (for updates)
// ============================================================================

/**
 * Partial schema for updating events.
 * All fields are optional.
 */
export const eventUpdateSchema = eventFormSchema.partial()

export type EventUpdateData = z.infer<typeof eventUpdateSchema>
