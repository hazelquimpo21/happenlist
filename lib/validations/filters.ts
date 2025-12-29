// ============================================================================
// 🔐 HAPPENLIST - Filter Validation Schemas
// ============================================================================
// Zod schemas for validating search/filter query parameters.
// ============================================================================

import { z } from 'zod'

// ============================================================================
// 🔍 Event Filters Schema
// ============================================================================

/**
 * Validation schema for event filter query parameters.
 * Used to validate and parse URL search params.
 */
export const eventFiltersSchema = z.object({
  // Category filter (single-select)
  category: z.string().optional(),

  // Tags filter (multi-select, comma-separated or array)
  tags: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => {
      if (typeof val === 'string') {
        return val.split(',').filter(Boolean)
      }
      return val
    })
    .optional(),

  // Date range filters
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),

  // Date preset filter
  dateFilter: z
    .enum(['today', 'tomorrow', 'this-weekend', 'this-week', 'this-month'])
    .optional(),

  // Price filter
  isFree: z.coerce.boolean().optional(),

  // Search query
  search: z.string().max(200, 'Search query too long').optional(),

  // Pagination
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),

  // Sort
  sort: z.enum(['date', 'created', 'title']).default('date'),
})

/**
 * Type inferred from the event filters schema.
 */
export type EventFiltersInput = z.infer<typeof eventFiltersSchema>

// ============================================================================
// 📄 Pagination Schema
// ============================================================================

/**
 * Simple pagination schema.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

export type PaginationInput = z.infer<typeof paginationSchema>
