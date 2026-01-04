/**
 * UPDATE USER PROFILE
 * ===================
 * Update the current user's profile in the database.
 *
 * Allowed updates:
 *   - display_name
 *   - avatar_url
 *   - email_notifications
 *   - email_weekly_digest
 *   - timezone
 *   - And more notification preferences...
 *
 * 🔒 REQUIRES: User must be authenticated
 * 🔒 RLS: Users can only update their own profile
 *
 * @module data/user/update-profile
 */

import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import type { Profile, ProfileUpdateData } from '@/types/user';

// ============================================================================
// LOGGER
// ============================================================================

const logger = createLogger('UpdateProfile');

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of updating a profile
 */
export interface UpdateProfileResult {
  /** Was the update successful? */
  success: boolean;

  /** The updated profile (null if failed) */
  profile: Profile | null;

  /** Error message if failed */
  error?: string;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Update a user's profile
 *
 * @example
 * ```ts
 * const result = await updateProfile('user-123', {
 *   display_name: 'Jane Doe',
 *   email_notifications: true
 * });
 *
 * if (result.success) {
 *   console.log('Profile updated!');
 * }
 * ```
 */
export async function updateProfile(
  userId: string,
  data: ProfileUpdateData
): Promise<UpdateProfileResult> {
  const timer = logger.time('updateProfile');

  try {
    // -------------------------------------------------------------------------
    // 1. VALIDATE PARAMS
    // -------------------------------------------------------------------------

    if (!userId) {
      logger.warn('Missing userId');
      return {
        success: false,
        profile: null,
        error: 'User ID is required',
      };
    }

    if (!data || Object.keys(data).length === 0) {
      logger.warn('No data to update');
      return {
        success: false,
        profile: null,
        error: 'No data to update',
      };
    }

    logger.debug('Updating profile', {
      metadata: {
        userId: userId.slice(0, 8) + '...',
        fields: Object.keys(data),
      },
    });

    // -------------------------------------------------------------------------
    // 2. SANITIZE UPDATE DATA
    // -------------------------------------------------------------------------

    // Only allow specific fields to be updated
    const allowedFields = [
      'display_name',
      'avatar_url',
      'email_notifications',
      'email_weekly_digest',
      'timezone',
      'notify_on_approval',
      'notify_on_rejection',
      'notify_on_new_events',
      'preferred_city',
      'preferred_state',
    ];

    const sanitizedData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        sanitizedData[key] = value;
      } else {
        logger.warn(`Ignoring disallowed field: ${key}`);
      }
    }

    if (Object.keys(sanitizedData).length === 0) {
      logger.warn('No valid fields to update');
      return {
        success: false,
        profile: null,
        error: 'No valid fields to update',
      };
    }

    // -------------------------------------------------------------------------
    // 3. UPDATE PROFILE
    // -------------------------------------------------------------------------

    const supabase = await createClient();

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(sanitizedData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update profile', error);
      return {
        success: false,
        profile: null,
        error: 'Failed to update profile',
      };
    }

    // -------------------------------------------------------------------------
    // 4. RETURN UPDATED PROFILE
    // -------------------------------------------------------------------------

    timer.success('Profile updated', {
      metadata: { fields: Object.keys(sanitizedData) },
    });

    return {
      success: true,
      profile: updatedProfile as Profile,
    };
  } catch (error) {
    timer.error('Unexpected error', error);
    return {
      success: false,
      profile: null,
      error: error instanceof Error ? error.message : 'Unexpected error',
    };
  }
}
