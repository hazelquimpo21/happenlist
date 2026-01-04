/**
 * GET USER HEARTS
 * ===============
 * Fetch events that a user has hearted (saved).
 *
 * Used for:
 *   - My Hearts page (/my/hearts)
 *   - Checking which events to show as hearted in listings
 *
 * 🔒 REQUIRES: User must be authenticated
 *
 * @module data/user/get-hearts
 */

import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import type { HeartedEvent } from '@/types/user';

// ============================================================================
// LOGGER
// ============================================================================

const logger = createLogger('GetHearts');

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for fetching user hearts
 */
export interface GetHeartsOptions {
  /** User ID to fetch hearts for */
  userId: string;

  /** Maximum number of hearts to return */
  limit?: number;

  /** Number to skip (for pagination) */
  offset?: number;

  /** Include past events? (default: true) */
  includePast?: boolean;
}

/**
 * Result of fetching user hearts
 */
export interface GetHeartsResult {
  /** Was the fetch successful? */
  success: boolean;

  /** List of hearted events */
  events: HeartedEvent[];

  /** Total count (for pagination) */
  total: number;

  /** Error message if failed */
  error?: string;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Get all events a user has hearted
 *
 * @example
 * ```ts
 * const result = await getHearts({ userId: 'user-123' });
 *
 * if (result.success) {
 *   result.events.forEach(event => {
 *     console.log(`${event.title} - hearted at ${event.hearted_at}`);
 *   });
 * }
 * ```
 */
export async function getHearts(
  options: GetHeartsOptions
): Promise<GetHeartsResult> {
  const {
    userId,
    limit = 50,
    offset = 0,
    includePast = true,
  } = options;

  const timer = logger.time('getHearts');

  try {
    // -------------------------------------------------------------------------
    // 1. VALIDATE PARAMS
    // -------------------------------------------------------------------------

    if (!userId) {
      logger.warn('Missing userId');
      return {
        success: false,
        events: [],
        total: 0,
        error: 'User ID is required',
      };
    }

    logger.debug('Fetching user hearts', {
      metadata: { userId: userId.slice(0, 8) + '...', limit, offset },
    });

    // -------------------------------------------------------------------------
    // 2. BUILD QUERY
    // -------------------------------------------------------------------------

    const supabase = await createClient();

    // Use the v_user_hearts view if available, otherwise join manually
    let query = supabase
      .from('hearts')
      .select(
        `
        id,
        created_at,
        event_id,
        events (
          id,
          title,
          slug,
          instance_date,
          start_datetime,
          end_datetime,
          image_url,
          short_description,
          is_free,
          price_low,
          price_high,
          status,
          heart_count,
          category:categories (
            name,
            slug
          ),
          location:locations (
            name,
            city
          ),
          organizer:organizers (
            name,
            slug
          )
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // -------------------------------------------------------------------------
    // 3. APPLY FILTERS
    // -------------------------------------------------------------------------

    // Filter for published events only
    // Note: This filter is on the nested events table
    // We'll filter in JS for simplicity

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // -------------------------------------------------------------------------
    // 4. EXECUTE QUERY
    // -------------------------------------------------------------------------

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch hearts', error);
      return {
        success: false,
        events: [],
        total: 0,
        error: 'Failed to fetch saved events',
      };
    }

    // -------------------------------------------------------------------------
    // 5. TRANSFORM RESULTS
    // -------------------------------------------------------------------------

    const now = new Date().toISOString();

    // Transform to HeartedEvent format
    const events: HeartedEvent[] = (data || [])
      .filter((heart: Record<string, unknown>) => {
        // Only include hearts with valid published events
        const event = heart.events as Record<string, unknown> | null;
        if (!event) return false;
        if (event.status !== 'published') return false;

        // Filter past events if requested
        if (!includePast) {
          const eventDate = event.instance_date as string;
          if (eventDate < now.slice(0, 10)) return false;
        }

        return true;
      })
      .map((heart: Record<string, unknown>) => {
        const event = heart.events as Record<string, unknown>;
        const category = event.category as { name: string; slug: string } | null;
        const location = event.location as { name: string; city: string } | null;
        const organizer = event.organizer as { name: string; slug: string } | null;

        return {
          heart_id: heart.id as string,
          user_id: userId,
          hearted_at: heart.created_at as string,
          event_id: event.id as string,
          title: event.title as string,
          slug: event.slug as string,
          instance_date: event.instance_date as string,
          start_datetime: event.start_datetime as string,
          end_datetime: event.end_datetime as string | null,
          image_url: event.image_url as string | null,
          short_description: event.short_description as string | null,
          is_free: event.is_free as boolean,
          price_low: event.price_low as number | null,
          price_high: event.price_high as number | null,
          status: event.status as string,
          heart_count: (event.heart_count as number) || 0,
          category_name: category?.name || null,
          category_slug: category?.slug || null,
          location_name: location?.name || null,
          location_city: location?.city || null,
          organizer_name: organizer?.name || null,
          organizer_slug: organizer?.slug || null,
        };
      });

    // -------------------------------------------------------------------------
    // 6. RETURN RESULTS
    // -------------------------------------------------------------------------

    timer.success(`Fetched ${events.length} hearts`, {
      metadata: { total: count || 0 },
    });

    return {
      success: true,
      events,
      total: count || events.length,
    };
  } catch (error) {
    timer.error('Unexpected error', error);
    return {
      success: false,
      events: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Unexpected error',
    };
  }
}

// ============================================================================
// HELPER: GET HEART IDS ONLY
// ============================================================================

/**
 * Get just the event IDs a user has hearted (for quick checks)
 *
 * @example
 * ```ts
 * const heartedIds = await getHeartedEventIds('user-123');
 * const isHearted = heartedIds.includes(eventId);
 * ```
 */
export async function getHeartedEventIds(userId: string): Promise<string[]> {
  const logger2 = createLogger('GetHeartedIds');

  try {
    if (!userId) return [];

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('hearts')
      .select('event_id')
      .eq('user_id', userId);

    if (error) {
      logger2.error('Failed to fetch hearted IDs', error);
      return [];
    }

    return (data || []).map((h) => h.event_id);
  } catch (error) {
    logger2.error('Unexpected error', error);
    return [];
  }
}
