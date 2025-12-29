// ============================================================================
// 🔐 HAPPENLIST - Auth Server Actions
// ============================================================================
// Server actions for authentication (login, logout).
// ============================================================================

'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { loginFormSchema } from '@/lib/validations/auth'
import { logger } from '@/lib/utils/logger'
import { ROUTES } from '@/lib/constants'

// ============================================================================
// 🔑 Sign In Action
// ============================================================================

/**
 * Signs in a user with email and password.
 *
 * @example
 * const result = await signIn('admin@example.com', 'password123')
 * if (!result.success) {
 *   setError(result.error)
 * }
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  logger.info('🔑 Sign in attempt', { email })

  // Validate input
  const parsed = loginFormSchema.safeParse({ email, password })
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0]
    logger.warn('🔑 Sign in validation failed', { email })
    return { success: false, error: firstError || 'Invalid input' }
  }

  const supabase = createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    logger.warn('🔑 Sign in failed', { email, error: error.message })
    return { success: false, error: 'Invalid email or password' }
  }

  logger.info('✅ Sign in successful', { email })

  // Revalidate and redirect
  revalidatePath('/', 'layout')
  redirect(ROUTES.admin)
}

// ============================================================================
// 🚪 Sign Out Action
// ============================================================================

/**
 * Signs out the current user.
 *
 * @example
 * await signOut()
 */
export async function signOut(): Promise<void> {
  logger.info('🚪 Sign out')

  const supabase = createClient()
  await supabase.auth.signOut()

  logger.info('✅ Sign out successful')

  revalidatePath('/', 'layout')
  redirect(ROUTES.login)
}

// ============================================================================
// 👤 Get Current User Action
// ============================================================================

/**
 * Gets the currently authenticated user.
 *
 * @example
 * const user = await getCurrentUser()
 * if (!user) {
 *   redirect('/login')
 * }
 */
export async function getCurrentUser() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}
