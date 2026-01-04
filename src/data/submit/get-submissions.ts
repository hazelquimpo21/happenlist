/**
 * GET USER SUBMISSIONS
 * =====================
 * Query functions for retrieving a user's submitted events.
 *
 * @module data/submit/get-submissions
 */

import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import type { MySubmission, EventStatus } from '@/types/submission';

const logger = createLogger('Submit');

// ============================================================================
// TYPES
// ============================================================================

export interface GetSubmissionsParams {
  userEmail: string;
  status?: EventStatus | EventStatus[];
  limit?: number;
  offset?: number;
}

export interface SubmissionsResult {
  success: boolean;
  submissions?: MySubmission[];
  total?: number;
  error?: string;
}

// ============================================================================
// GET USER SUBMISSIONS
// ============================================================================

/**
 * Get all submissions for a user
 *
 * @param params - Query parameters
 * @returns List of user's submitted events
 *
 * @example
 * ```ts
 * const result = await getUserSubmissions({
 *   userEmail: 'user@example.com',
 *   status: ['pending_review', 'published']
 * });
 * ```
 */
export async function getUserSubmissions(
  params: GetSubmissionsParams
): Promise<SubmissionsResult> {
  const { userEmail, status, limit = 50, offset = 0 } = params;

  const timer = logger.time('getUserSubmissions', {
    metadata: { userEmail, status },
  });

  try {
    const supabase = await createClient();

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('v_my_submissions')
      .select('*', { count: 'exact' })
      .eq('submitted_by_email', userEmail);

    // Filter by status if provided
    if (status) {
      if (Array.isArray(status)) {
        query = query.in('status', status);
      } else {
        query = query.eq('status', status);
      }
    }

    // Order and paginate
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      timer.error('Failed to get submissions', error);
      return { success: false, error: error.message };
    }

    timer.success(`Found ${data?.length || 0} submissions (total: ${count})`);

    return {
      success: true,
      submissions: data || [],
      total: count || 0,
    };
  } catch (error) {
    timer.error('Unexpected error', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// GET SINGLE SUBMISSION
// ============================================================================

/**
 * Get a single submission by ID
 *
 * @param eventId - Event ID
 * @param userEmail - User's email (for ownership verification)
 * @returns Single submission or null
 */
export async function getSubmissionById(
  eventId: string,
  userEmail: string
): Promise<{ success: boolean; submission?: MySubmission; error?: string }> {
  const timer = logger.time('getSubmissionById', {
    entityType: 'event',
    entityId: eventId,
  });

  try {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('v_my_submissions')
      .select('*')
      .eq('id', eventId)
      .eq('submitted_by_email', userEmail)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        timer.error('Submission not found');
        return { success: false, error: 'Submission not found' };
      }
      timer.error('Failed to get submission', error);
      return { success: false, error: error.message };
    }

    timer.success('Submission found');

    return {
      success: true,
      submission: data,
    };
  } catch (error) {
    timer.error('Unexpected error', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// GET SUBMISSION COUNTS BY STATUS
// ============================================================================

/**
 * Get counts of submissions grouped by status
 *
 * @param userEmail - User's email
 * @returns Object with counts by status
 */
export async function getSubmissionCounts(
  userEmail: string
): Promise<{
  success: boolean;
  counts?: Record<EventStatus, number>;
  total?: number;
  error?: string;
}> {
  const timer = logger.time('getSubmissionCounts', {
    metadata: { userEmail },
  });

  try {
    const supabase = await createClient();

    // Get all submissions to count by status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('events')
      .select('status')
      .eq('submitted_by_email', userEmail)
      .is('deleted_at', null);

    if (error) {
      timer.error('Failed to get submission counts', error);
      return { success: false, error: error.message };
    }

    // Count by status
    const counts: Record<EventStatus, number> = {
      draft: 0,
      pending_review: 0,
      changes_requested: 0,
      published: 0,
      rejected: 0,
      cancelled: 0,
      postponed: 0,
    };

    for (const row of data || []) {
      const status = row.status as EventStatus;
      if (status in counts) {
        counts[status]++;
      }
    }

    const total = data?.length || 0;

    timer.success(`Counted ${total} submissions`);

    return {
      success: true,
      counts,
      total,
    };
  } catch (error) {
    timer.error('Unexpected error', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// GET PENDING SUBMISSIONS (needs action)
// ============================================================================

/**
 * Get submissions that need user action (changes requested)
 *
 * @param userEmail - User's email
 * @returns Submissions needing action
 */
export async function getSubmissionsNeedingAction(
  userEmail: string
): Promise<SubmissionsResult> {
  return getUserSubmissions({
    userEmail,
    status: 'changes_requested',
    limit: 20,
  });
}

// ============================================================================
// GET RECENT SUBMISSIONS
// ============================================================================

/**
 * Get most recent submissions (for dashboard)
 *
 * @param userEmail - User's email
 * @param limit - Max number to return
 * @returns Recent submissions
 */
export async function getRecentSubmissions(
  userEmail: string,
  limit: number = 5
): Promise<SubmissionsResult> {
  return getUserSubmissions({
    userEmail,
    limit,
  });
}
