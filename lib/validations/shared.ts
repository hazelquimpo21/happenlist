// ============================================================================
// 🔐 HAPPENLIST - Shared Validation Schemas
// ============================================================================
// Reusable Zod schemas for common field types.
// These are building blocks used in entity-specific schemas.
// ============================================================================

import { z } from 'zod'

// ============================================================================
// 📝 String Schemas
// ============================================================================

/**
 * URL-friendly slug format.
 * Only lowercase letters, numbers, and hyphens.
 * Must not start or end with a hyphen.
 */
export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(255, 'Slug is too long')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be lowercase letters, numbers, and hyphens only'
  )

// ============================================================================
// 🔗 URL Schemas
// ============================================================================

/**
 * Optional URL field.
 * Accepts valid URLs or empty strings.
 */
export const urlSchema = z
  .string()
  .url('Please enter a valid URL')
  .max(500, 'URL is too long')
  .optional()
  .or(z.literal(''))
  .transform((val) => (val === '' ? undefined : val))

/**
 * Optional image URL field.
 * Same as urlSchema but with a clearer name for image fields.
 */
export const imageUrlSchema = z
  .string()
  .url('Please enter a valid image URL')
  .max(500, 'URL is too long')
  .optional()
  .or(z.literal(''))
  .transform((val) => (val === '' ? undefined : val))

// ============================================================================
// 💰 Number Schemas
// ============================================================================

/**
 * Price field (positive number with 2 decimal places max).
 */
export const priceSchema = z
  .number()
  .min(0, 'Price cannot be negative')
  .max(99999.99, 'Price is too high')
  .optional()

/**
 * Latitude coordinate (-90 to 90).
 */
export const latitudeSchema = z
  .number()
  .min(-90, 'Invalid latitude')
  .max(90, 'Invalid latitude')
  .optional()

/**
 * Longitude coordinate (-180 to 180).
 */
export const longitudeSchema = z
  .number()
  .min(-180, 'Invalid longitude')
  .max(180, 'Invalid longitude')
  .optional()

// ============================================================================
// 📅 Date Schemas
// ============================================================================

/**
 * ISO datetime string.
 */
export const datetimeSchema = z.string().datetime({
  message: 'Please enter a valid date and time',
})

/**
 * Optional ISO datetime string.
 */
export const optionalDatetimeSchema = z
  .string()
  .datetime({ message: 'Please enter a valid date and time' })
  .optional()
  .or(z.literal(''))
  .transform((val) => (val === '' ? undefined : val))

// ============================================================================
// 🆔 ID Schemas
// ============================================================================

/**
 * UUID identifier.
 */
export const uuidSchema = z.string().uuid('Invalid ID format')

/**
 * Optional UUID identifier.
 */
export const optionalUuidSchema = z
  .string()
  .uuid('Invalid ID format')
  .optional()
  .or(z.literal(''))
  .transform((val) => (val === '' ? undefined : val))

// ============================================================================
// 📱 Social Media Schemas
// ============================================================================

/**
 * Instagram handle (without @).
 * Allows letters, numbers, periods, and underscores.
 */
export const instagramHandleSchema = z
  .string()
  .max(100, 'Handle is too long')
  .regex(
    /^[a-zA-Z0-9._]*$/,
    'Instagram handle can only contain letters, numbers, periods, and underscores'
  )
  .optional()
  .transform((val) => val?.replace(/^@/, '')) // Remove @ if present
