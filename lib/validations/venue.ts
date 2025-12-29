// ============================================================================
// 🔐 HAPPENLIST - Venue Validation Schemas
// ============================================================================
// Zod schemas for validating venue form data.
// ============================================================================

import { z } from 'zod'
import {
  urlSchema,
  imageUrlSchema,
  latitudeSchema,
  longitudeSchema,
} from './shared'

// ============================================================================
// 📍 Venue Form Schema
// ============================================================================

/**
 * Validation schema for venue forms.
 */
export const venueFormSchema = z.object({
  // ========================================
  // 📝 Basic Info
  // ========================================
  name: z
    .string()
    .min(1, 'Venue name is required')
    .max(255, 'Name is too long (max 255 characters)'),

  // ========================================
  // 📍 Address
  // ========================================
  address: z
    .string()
    .max(500, 'Address is too long')
    .optional()
    .or(z.literal('')),

  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City name is too long')
    .default('Milwaukee'),

  state: z
    .string()
    .min(1, 'State is required')
    .max(50, 'State name is too long')
    .default('WI'),

  zip: z
    .string()
    .max(20, 'ZIP code is too long')
    .optional()
    .or(z.literal('')),

  // ========================================
  // 🗺️ Coordinates
  // ========================================
  lat: latitudeSchema,
  lng: longitudeSchema,

  // ========================================
  // 🔗 Links & Media
  // ========================================
  website: urlSchema,
  image_url: imageUrlSchema,
})

/**
 * Type inferred from the venue form schema.
 */
export type VenueFormData = z.infer<typeof venueFormSchema>

// ============================================================================
// 🔄 Partial Venue Schema (for updates)
// ============================================================================

/**
 * Partial schema for updating venues.
 */
export const venueUpdateSchema = venueFormSchema.partial()

export type VenueUpdateData = z.infer<typeof venueUpdateSchema>
