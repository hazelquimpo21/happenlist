/**
 * GET USER FOLLOWS
 * ================
 * Fetch entities (organizers, venues, categories) a user follows.
 *
 * Used for:
 *   - Following page (/my/following)
 *   - Notification preferences
 *   - Personalized recommendations
 *
 * 🔒 REQUIRES: User must be authenticated
 *
 * @module data/user/get-follows
 */

import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import type { FollowEntityType } from './toggle-follow';

// ============================================================================
// LOGGER
// ============================================================================

const logger = createLogger('GetFollows');

// ============================================================================
// TYPES
// ============================================================================

/**
 * A follow record with entity details
 */
export interface UserFollow {
  id: string;
  userId: string;
  followType: FollowEntityType;
  entityId: string;
  notifyNewEvents: boolean;
  createdAt: string;

  // Entity details (one of these will be populated)
  organizer?: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    followerCount: number;
  };

  venue?: {
    id: string;
    name: string;
    slug: string;
    city: string | null;
  };

  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * Options for fetching user follows
 */
export interface GetFollowsOptions {
  /** User ID to fetch follows for */
  userId: string;

  /** Filter by entity type (optional) */
  entityType?: FollowEntityType;

  /** Maximum number to return */
  limit?: number;

  /** Offset for pagination */
  offset?: number;
}

/**
 * Result of fetching user follows
 */
export interface GetFollowsResult {
  /** Was the fetch successful? */
  success: boolean;

  /** List of follows */
  follows: UserFollow[];

  /** Total count (for pagination) */
  total: number;

  /** Error message if failed */
  error?: string;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Get all entities a user follows
 *
 * @example
 * ```ts
 * // Get all follows
 * const result = await getFollows({ userId: 'user-123' });
 *
 * // Get only followed organizers
 * const result = await getFollows({
 *   userId: 'user-123',
 *   entityType: 'organizer'
 * });
 * ```
 */
export async function getFollows(
  options: GetFollowsOptions
): Promise<GetFollowsResult> {
  const {
    userId,
    entityType,
    limit = 50,
    offset = 0,
  } = options;

  const timer = logger.time('getFollows');

  try {
    // -------------------------------------------------------------------------
    // 1. VALIDATE PARAMS
    // -------------------------------------------------------------------------

    if (!userId) {
      logger.warn('Missing userId');
      return {
        success: false,
        follows: [],
        total: 0,
        error: 'User ID is required',
      };
    }

    logger.debug('Fetching user follows', {
      metadata: {
        userId: userId.slice(0, 8) + '...',
        entityType: entityType || 'all',
        limit,
      },
    });

    // -------------------------------------------------------------------------
    // 2. BUILD QUERY
    // -------------------------------------------------------------------------

    const supabase = await createClient();

    let query = supabase
      .from('user_follows')
      .select(
        `
        id,
        user_id,
        organizer_id,
        venue_id,
        category_id,
        notify_new_events,
        created_at,
        organizer:organizers (
          id,
          name,
          slug,
          logo_url,
          follower_count
        ),
        venue:locations (
          id,
          name,
          slug,
          city
        ),
        category:categories (
          id,
          name,
          slug
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Filter by entity type if specified
    if (entityType === 'organizer') {
      query = query.not('organizer_id', 'is', null);
    } else if (entityType === 'venue') {
      query = query.not('venue_id', 'is', null);
    } else if (entityType === 'category') {
      query = query.not('category_id', 'is', null);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // -------------------------------------------------------------------------
    // 3. EXECUTE QUERY
    // -------------------------------------------------------------------------

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch follows', error);
      return {
        success: false,
        follows: [],
        total: 0,
        error: 'Failed to fetch follows',
      };
    }

    // -------------------------------------------------------------------------
    // 4. TRANSFORM RESULTS
    // -------------------------------------------------------------------------

    const follows: UserFollow[] = (data || []).map((follow: Record<string, unknown>) => {
      // Determine follow type and entity
      let followType: FollowEntityType;
      let entityId: string;

      if (follow.organizer_id) {
        followType = 'organizer';
        entityId = follow.organizer_id as string;
      } else if (follow.venue_id) {
        followType = 'venue';
        entityId = follow.venue_id as string;
      } else {
        followType = 'category';
        entityId = follow.category_id as string;
      }

      // Build result object
      const result: UserFollow = {
        id: follow.id as string,
        userId: follow.user_id as string,
        followType,
        entityId,
        notifyNewEvents: follow.notify_new_events as boolean,
        createdAt: follow.created_at as string,
      };

      // Add entity details
      if (follow.organizer) {
        const org = follow.organizer as Record<string, unknown>;
        result.organizer = {
          id: org.id as string,
          name: org.name as string,
          slug: org.slug as string,
          logoUrl: org.logo_url as string | null,
          followerCount: (org.follower_count as number) || 0,
        };
      }

      if (follow.venue) {
        const ven = follow.venue as Record<string, unknown>;
        result.venue = {
          id: ven.id as string,
          name: ven.name as string,
          slug: ven.slug as string,
          city: ven.city as string | null,
        };
      }

      if (follow.category) {
        const cat = follow.category as Record<string, unknown>;
        result.category = {
          id: cat.id as string,
          name: cat.name as string,
          slug: cat.slug as string,
        };
      }

      return result;
    });

    // -------------------------------------------------------------------------
    // 5. RETURN RESULTS
    // -------------------------------------------------------------------------

    timer.success(`Fetched ${follows.length} follows`, {
      metadata: { total: count || 0 },
    });

    return {
      success: true,
      follows,
      total: count || follows.length,
    };
  } catch (error) {
    timer.error('Unexpected error', error);
    return {
      success: false,
      follows: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Unexpected error',
    };
  }
}

// ============================================================================
// HELPER: CHECK IF FOLLOWING
// ============================================================================

/**
 * Check if user follows a specific entity
 */
export async function checkFollow(params: {
  userId: string;
  entityType: FollowEntityType;
  entityId: string;
}): Promise<boolean> {
  const { userId, entityType, entityId } = params;
  const logger2 = createLogger('CheckFollow');

  try {
    if (!userId || !entityId) return false;

    const supabase = await createClient();
    const entityColumn = `${entityType}_id`;

    const { data, error } = await supabase
      .from('user_follows')
      .select('id')
      .eq('user_id', userId)
      .eq(entityColumn, entityId)
      .maybeSingle();

    if (error) {
      logger2.error('Failed to check follow', error);
      return false;
    }

    return !!data;
  } catch (error) {
    logger2.error('Unexpected error', error);
    return false;
  }
}

/**
 * Get IDs of entities a user follows (for batch checking)
 */
export async function getFollowedIds(
  userId: string,
  entityType: FollowEntityType
): Promise<string[]> {
  const logger2 = createLogger('GetFollowedIds');

  try {
    if (!userId) return [];

    const supabase = await createClient();
    const entityColumn = `${entityType}_id`;

    const { data, error } = await supabase
      .from('user_follows')
      .select(entityColumn)
      .eq('user_id', userId)
      .not(entityColumn, 'is', null);

    if (error) {
      logger2.error('Failed to get followed IDs', error);
      return [];
    }

    return (data || []).map((row) => row[entityColumn] as string);
  } catch (error) {
    logger2.error('Unexpected error', error);
    return [];
  }
}
