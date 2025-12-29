// ============================================================================
// 🔐 HAPPENLIST - Auth Validation Schemas
// ============================================================================
// Zod schemas for validating authentication form data.
// ============================================================================

import { z } from 'zod'

// ============================================================================
// 🔑 Login Form Schema
// ============================================================================

/**
 * Validation schema for the login form.
 */
export const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),

  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
})

/**
 * Type inferred from the login form schema.
 */
export type LoginFormData = z.infer<typeof loginFormSchema>
