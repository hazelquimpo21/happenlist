/**
 * TOGGLE HEART
 * ============
 * Add or remove a heart (save) on an event.
 *
 * This is the core function for the hearts feature.
 * It handles both adding and removing hearts in one call.
 *
 * 📋 WHAT IT DOES:
 *   - If user hasn't hearted the event → add heart
 *   - If user has hearted the event → remove heart
 *
 * 🔒 REQUIRES: User must be authenticated
 *
 * @module data/user/toggle-heart
 */

import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/utils/logger';

// ============================================================================
// LOGGER
// ============================================================================

const logger = createLogger('ToggleHeart');

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of toggling a heart
 */
export interface ToggleHeartResult {
  /** Was the operation successful? */
  success: boolean;

  /** Is the event now hearted? */
  hearted: boolean;

  /** Updated heart count for the event */
  heartCount: number;

  /** Error message if failed */
  error?: string;
}

/**
 * Parameters for toggling a heart
 */
export interface ToggleHeartParams {
  /** The event to heart/unheart */
  eventId: string;

  /** The user performing the action */
  userId: string;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Toggle heart on an event (add if not hearted, remove if hearted)
 *
 * @example
 * ```ts
 * const result = await toggleHeart({
 *   eventId: 'abc-123',
 *   userId: 'user-456'
 * });
 *
 * if (result.success) {
 *   console.log(result.hearted ? 'Added!' : 'Removed!');
 *   console.log(`Heart count: ${result.heartCount}`);
 * }
 * ```
 */
export async function toggleHeart(
  params: ToggleHeartParams
): Promise<ToggleHeartResult> {
  const { eventId, userId } = params;
  const timer = logger.time('toggleHeart');

  try {
    // -------------------------------------------------------------------------
    // 1. VALIDATE PARAMS
    // -------------------------------------------------------------------------

    if (!eventId || !userId) {
      logger.warn('Missing required params', {
        metadata: { hasEventId: !!eventId, hasUserId: !!userId },
      });
      return {
        success: false,
        hearted: false,
        heartCount: 0,
        error: 'Missing event ID or user ID',
      };
    }

    logger.debug('Toggling heart', {
      metadata: { eventId, userId: userId.slice(0, 8) + '...' },
    });

    // -------------------------------------------------------------------------
    // 2. CHECK IF ALREADY HEARTED
    // -------------------------------------------------------------------------

    const supabase = await createClient();

    const { data: existingHeart, error: checkError } = await supabase
      .from('hearts')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .maybeSingle();

    if (checkError) {
      logger.error('Failed to check existing heart', checkError);
      return {
        success: false,
        hearted: false,
        heartCount: 0,
        error: 'Failed to check heart status',
      };
    }

    // -------------------------------------------------------------------------
    // 3. TOGGLE: ADD OR REMOVE
    // -------------------------------------------------------------------------

    let isNowHearted = false;

    if (existingHeart) {
      // 💔 REMOVE HEART
      const { error: deleteError } = await supabase
        .from('hearts')
        .delete()
        .eq('id', existingHeart.id);

      if (deleteError) {
        logger.error('Failed to remove heart', deleteError);
        return {
          success: false,
          hearted: true,
          heartCount: 0,
          error: 'Failed to remove heart',
        };
      }

      isNowHearted = false;
      logger.success('💔 Heart removed', {
        metadata: { eventId, userId: userId.slice(0, 8) + '...' },
      });
    } else {
      // ❤️ ADD HEART
      const { error: insertError } = await supabase.from('hearts').insert({
        user_id: userId,
        event_id: eventId,
      });

      if (insertError) {
        logger.error('Failed to add heart', insertError);
        return {
          success: false,
          hearted: false,
          heartCount: 0,
          error: 'Failed to add heart',
        };
      }

      isNowHearted = true;
      logger.success('❤️ Heart added', {
        metadata: { eventId, userId: userId.slice(0, 8) + '...' },
      });
    }

    // -------------------------------------------------------------------------
    // 4. GET UPDATED HEART COUNT
    // -------------------------------------------------------------------------

    const { data: event, error: countError } = await supabase
      .from('events')
      .select('heart_count')
      .eq('id', eventId)
      .single();

    if (countError) {
      logger.warn('Failed to get updated heart count', {
        metadata: { error: countError.message },
      });
    }

    const heartCount = event?.heart_count ?? 0;

    // -------------------------------------------------------------------------
    // 5. RETURN RESULT
    // -------------------------------------------------------------------------

    timer.success(isNowHearted ? 'Heart added' : 'Heart removed', {
      metadata: { heartCount },
    });

    return {
      success: true,
      hearted: isNowHearted,
      heartCount,
    };
  } catch (error) {
    timer.error('Unexpected error', error);
    return {
      success: false,
      hearted: false,
      heartCount: 0,
      error: error instanceof Error ? error.message : 'Unexpected error',
    };
  }
}
