/**
 * GET USER PROFILE
 * ================
 * Fetch the current user's profile from the database.
 *
 * The profile contains user preferences, display info, and stats.
 * It's auto-created when a user first signs up.
 *
 * 🔒 REQUIRES: User must be authenticated
 *
 * @module data/user/get-profile
 */

import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import type { Profile } from '@/types/user';

// ============================================================================
// LOGGER
// ============================================================================

const logger = createLogger('GetProfile');

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of fetching a profile
 */
export interface GetProfileResult {
  /** Was the fetch successful? */
  success: boolean;

  /** The profile data (null if not found) */
  profile: Profile | null;

  /** Error message if failed */
  error?: string;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Get a user's profile by user ID
 *
 * @example
 * ```ts
 * const result = await getProfile('user-123');
 *
 * if (result.success && result.profile) {
 *   console.log(`Hello, ${result.profile.display_name}`);
 * }
 * ```
 */
export async function getProfile(userId: string): Promise<GetProfileResult> {
  const timer = logger.time('getProfile');

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

    logger.debug('Fetching profile', {
      metadata: { userId: userId.slice(0, 8) + '...' },
    });

    // -------------------------------------------------------------------------
    // 2. FETCH PROFILE
    // -------------------------------------------------------------------------

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // Profile might not exist yet (edge case)
      if (error.code === 'PGRST116') {
        logger.warn('Profile not found (will be created on first login)', {
          metadata: { userId: userId.slice(0, 8) + '...' },
        });
        return {
          success: true,
          profile: null,
        };
      }

      logger.error('Failed to fetch profile', error);
      return {
        success: false,
        profile: null,
        error: 'Failed to fetch profile',
      };
    }

    // -------------------------------------------------------------------------
    // 3. RETURN PROFILE
    // -------------------------------------------------------------------------

    timer.success('Profile fetched');

    return {
      success: true,
      profile: data as Profile,
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
