/**
 * CHECK HEARTS
 * ============
 * Check if specific events are hearted by a user.
 *
 * Optimized for batch checking - useful when displaying
 * a grid of events and need to show heart state for each.
 *
 * 🔒 REQUIRES: User must be authenticated
 *
 * @module data/user/check-hearts
 */

import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/utils/logger';

// ============================================================================
// LOGGER
// ============================================================================

const logger = createLogger('CheckHearts');

// ============================================================================
// TYPES
// ============================================================================

/**
 * Map of event ID → is hearted
 */
export type HeartStatusMap = Record<string, boolean>;

/**
 * Result of checking heart status
 */
export interface CheckHeartsResult {
  /** Was the check successful? */
  success: boolean;

  /** Map of event ID → is hearted */
  hearts: HeartStatusMap;

  /** Error message if failed */
  error?: string;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Check if multiple events are hearted by a user
 *
 * @example
 * ```ts
 * const result = await checkHearts({
 *   userId: 'user-123',
 *   eventIds: ['event-a', 'event-b', 'event-c']
 * });
 *
 * if (result.success) {
 *   console.log(result.hearts['event-a']); // true or false
 * }
 * ```
 */
export async function checkHearts(params: {
  userId: string;
  eventIds: string[];
}): Promise<CheckHeartsResult> {
  const { userId, eventIds } = params;
  const timer = logger.time('checkHearts');

  try {
    // -------------------------------------------------------------------------
    // 1. VALIDATE PARAMS
    // -------------------------------------------------------------------------

    if (!userId) {
      logger.debug('No userId provided - returning all false');
      const hearts: HeartStatusMap = {};
      eventIds.forEach((id) => {
        hearts[id] = false;
      });
      return { success: true, hearts };
    }

    if (!eventIds.length) {
      return { success: true, hearts: {} };
    }

    logger.debug('Checking hearts', {
      metadata: {
        userId: userId.slice(0, 8) + '...',
        eventCount: eventIds.length,
      },
    });

    // -------------------------------------------------------------------------
    // 2. FETCH USER'S HEARTS FOR THESE EVENTS
    // -------------------------------------------------------------------------

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('hearts')
      .select('event_id')
      .eq('user_id', userId)
      .in('event_id', eventIds);

    if (error) {
      logger.error('Failed to check hearts', error);
      return {
        success: false,
        hearts: {},
        error: 'Failed to check heart status',
      };
    }

    // -------------------------------------------------------------------------
    // 3. BUILD RESULT MAP
    // -------------------------------------------------------------------------

    const heartedIds = new Set((data || []).map((h) => h.event_id));

    const hearts: HeartStatusMap = {};
    eventIds.forEach((id) => {
      hearts[id] = heartedIds.has(id);
    });

    // -------------------------------------------------------------------------
    // 4. RETURN RESULT
    // -------------------------------------------------------------------------

    const heartedCount = Object.values(hearts).filter(Boolean).length;

    timer.success(`Checked ${eventIds.length} events, ${heartedCount} hearted`);

    return { success: true, hearts };
  } catch (error) {
    timer.error('Unexpected error', error);
    return {
      success: false,
      hearts: {},
      error: error instanceof Error ? error.message : 'Unexpected error',
    };
  }
}

// ============================================================================
// HELPER: CHECK SINGLE EVENT
// ============================================================================

/**
 * Check if a single event is hearted by a user
 *
 * @example
 * ```ts
 * const isHearted = await checkSingleHeart('user-123', 'event-456');
 * ```
 */
export async function checkSingleHeart(
  userId: string,
  eventId: string
): Promise<boolean> {
  const logger2 = createLogger('CheckSingleHeart');

  try {
    if (!userId || !eventId) return false;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('hearts')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .maybeSingle();

    if (error) {
      logger2.error('Failed to check heart', error);
      return false;
    }

    return !!data;
  } catch (error) {
    logger2.error('Unexpected error', error);
    return false;
  }
}
