/**
 * TOGGLE FOLLOW
 * =============
 * Follow or unfollow an organizer, venue, or category.
 *
 * Users can follow entities to get notified of new events.
 * Each follow tracks exactly ONE entity type.
 *
 * 🔒 REQUIRES: User must be authenticated
 *
 * @module data/user/toggle-follow
 */

import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/utils/logger';

// ============================================================================
// LOGGER
// ============================================================================

const logger = createLogger('ToggleFollow');

// ============================================================================
// TYPES
// ============================================================================

/**
 * Type of entity to follow
 */
export type FollowEntityType = 'organizer' | 'venue' | 'category';

/**
 * Result of toggling a follow
 */
export interface ToggleFollowResult {
  /** Was the operation successful? */
  success: boolean;

  /** Is the entity now followed? */
  following: boolean;

  /** Error message if failed */
  error?: string;
}

/**
 * Parameters for toggling a follow
 */
export interface ToggleFollowParams {
  /** User ID performing the action */
  userId: string;

  /** Type of entity to follow */
  entityType: FollowEntityType;

  /** ID of the entity to follow */
  entityId: string;

  /** Notify on new events? (default: true) */
  notifyNewEvents?: boolean;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Toggle follow on an entity (add if not following, remove if following)
 *
 * @example
 * ```ts
 * const result = await toggleFollow({
 *   userId: 'user-123',
 *   entityType: 'organizer',
 *   entityId: 'org-456'
 * });
 *
 * if (result.success) {
 *   console.log(result.following ? 'Following!' : 'Unfollowed');
 * }
 * ```
 */
export async function toggleFollow(
  params: ToggleFollowParams
): Promise<ToggleFollowResult> {
  const {
    userId,
    entityType,
    entityId,
    notifyNewEvents = true,
  } = params;

  const timer = logger.time('toggleFollow');

  try {
    // -------------------------------------------------------------------------
    // 1. VALIDATE PARAMS
    // -------------------------------------------------------------------------

    if (!userId || !entityType || !entityId) {
      logger.warn('Missing required params', {
        metadata: { hasUserId: !!userId, entityType, hasEntityId: !!entityId },
      });
      return {
        success: false,
        following: false,
        error: 'Missing required parameters',
      };
    }

    logger.debug('Toggling follow', {
      metadata: { userId: userId.slice(0, 8) + '...', entityType, entityId },
    });

    // -------------------------------------------------------------------------
    // 2. CHECK IF ALREADY FOLLOWING
    // -------------------------------------------------------------------------

    const supabase = await createClient();

    // Build the filter based on entity type
    const entityColumn = `${entityType}_id`;

    const { data: existingFollow, error: checkError } = await supabase
      .from('user_follows')
      .select('id')
      .eq('user_id', userId)
      .eq(entityColumn, entityId)
      .maybeSingle();

    if (checkError) {
      logger.error('Failed to check existing follow', checkError);
      return {
        success: false,
        following: false,
        error: 'Failed to check follow status',
      };
    }

    // -------------------------------------------------------------------------
    // 3. TOGGLE: ADD OR REMOVE
    // -------------------------------------------------------------------------

    let isNowFollowing = false;

    if (existingFollow) {
      // 👋 UNFOLLOW
      const { error: deleteError } = await supabase
        .from('user_follows')
        .delete()
        .eq('id', existingFollow.id);

      if (deleteError) {
        logger.error('Failed to unfollow', deleteError);
        return {
          success: false,
          following: true,
          error: 'Failed to unfollow',
        };
      }

      isNowFollowing = false;
      logger.success(`👋 Unfollowed ${entityType}`, {
        metadata: { entityId },
      });
    } else {
      // 👀 FOLLOW
      const insertData: Record<string, unknown> = {
        user_id: userId,
        notify_new_events: notifyNewEvents,
      };

      // Set the correct entity column
      insertData[entityColumn] = entityId;

      const { error: insertError } = await supabase
        .from('user_follows')
        .insert(insertData);

      if (insertError) {
        logger.error('Failed to follow', insertError);
        return {
          success: false,
          following: false,
          error: 'Failed to follow',
        };
      }

      isNowFollowing = true;
      logger.success(`👀 Following ${entityType}`, {
        metadata: { entityId },
      });
    }

    // -------------------------------------------------------------------------
    // 4. RETURN RESULT
    // -------------------------------------------------------------------------

    timer.success(isNowFollowing ? 'Now following' : 'Unfollowed', {
      metadata: { entityType },
    });

    return {
      success: true,
      following: isNowFollowing,
    };
  } catch (error) {
    timer.error('Unexpected error', error);
    return {
      success: false,
      following: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
    };
  }
}
