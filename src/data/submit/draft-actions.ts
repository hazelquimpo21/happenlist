/**
 * DRAFT ACTIONS
 * ==============
 * Server actions for creating, updating, and managing event drafts.
 *
 * Drafts allow users to save their progress and return later.
 * They expire after 30 days if not submitted.
 *
 * @module data/submit/draft-actions
 */

import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import type { EventDraftData, EventDraft, SeriesDraftData } from '@/types/submission';

const logger = createLogger('Submit');

// ============================================================================
// TYPES
// ============================================================================

export interface CreateDraftParams {
  userId: string;
  userEmail: string;
  userName?: string;
  draftData?: EventDraftData;
  seriesDraftData?: SeriesDraftData;
}

export interface UpdateDraftParams {
  draftId: string;
  draftData?: EventDraftData;
  seriesDraftData?: SeriesDraftData;
  currentStep?: number;
  completedSteps?: number[];
}

export interface DraftResult {
  success: boolean;
  draft?: EventDraft;
  error?: string;
}

// ============================================================================
// CREATE DRAFT
// ============================================================================

/**
 * Create a new event draft
 *
 * @param params - Draft creation parameters
 * @returns Created draft or error
 *
 * @example
 * ```ts
 * const result = await createDraft({
 *   userId: session.id,
 *   userEmail: session.email,
 *   draftData: { title: 'My Event' }
 * });
 * ```
 */
export async function createDraft(params: CreateDraftParams): Promise<DraftResult> {
  const { userId, userEmail, userName, draftData, seriesDraftData } = params;

  const timer = logger.time('createDraft', {
    action: 'draft_created',
    metadata: { userEmail },
  });

  try {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('event_drafts')
      .insert({
        user_id: userId,
        user_email: userEmail,
        user_name: userName || null,
        draft_data: draftData || {},
        series_draft_data: seriesDraftData || null,
        current_step: 1,
        completed_steps: [],
      })
      .select()
      .single();

    if (error) {
      timer.error('Failed to create draft', error);
      return { success: false, error: error.message };
    }

    timer.success(`Draft created: ${data.id}`);

    return {
      success: true,
      draft: transformDraft(data),
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
// UPDATE DRAFT
// ============================================================================

/**
 * Update an existing draft
 *
 * @param params - Update parameters
 * @returns Updated draft or error
 *
 * @example
 * ```ts
 * const result = await updateDraft({
 *   draftId: draft.id,
 *   draftData: { ...draft.draft_data, title: 'Updated Title' },
 *   currentStep: 2,
 *   completedSteps: [1]
 * });
 * ```
 */
export async function updateDraft(params: UpdateDraftParams): Promise<DraftResult> {
  const { draftId, draftData, seriesDraftData, currentStep, completedSteps } = params;

  const timer = logger.time('updateDraft', {
    action: 'draft_updated',
    entityType: 'draft',
    entityId: draftId,
  });

  try {
    const supabase = await createClient();

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};

    if (draftData !== undefined) {
      updateData.draft_data = draftData;
    }

    if (seriesDraftData !== undefined) {
      updateData.series_draft_data = seriesDraftData;
    }

    if (currentStep !== undefined) {
      updateData.current_step = currentStep;
    }

    if (completedSteps !== undefined) {
      updateData.completed_steps = completedSteps;
    }

    // Always update updated_at
    updateData.updated_at = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('event_drafts')
      .update(updateData)
      .eq('id', draftId)
      .select()
      .single();

    if (error) {
      timer.error('Failed to update draft', error);
      return { success: false, error: error.message };
    }

    timer.success(`Draft updated: step ${currentStep || data.current_step}`);

    return {
      success: true,
      draft: transformDraft(data),
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
// GET DRAFT
// ============================================================================

/**
 * Get a single draft by ID
 *
 * @param draftId - Draft ID
 * @returns Draft or null if not found
 */
export async function getDraft(draftId: string): Promise<DraftResult> {
  const timer = logger.time('getDraft', {
    action: 'draft_loaded',
    entityType: 'draft',
    entityId: draftId,
  });

  try {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('event_drafts')
      .select('*')
      .eq('id', draftId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        timer.error('Draft not found');
        return { success: false, error: 'Draft not found' };
      }
      timer.error('Failed to get draft', error);
      return { success: false, error: error.message };
    }

    timer.success('Draft loaded');

    return {
      success: true,
      draft: transformDraft(data),
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
// GET USER DRAFTS
// ============================================================================

/**
 * Get all drafts for a user
 *
 * @param userEmail - User's email address
 * @returns List of drafts
 */
export async function getUserDrafts(
  userEmail: string
): Promise<{ success: boolean; drafts?: EventDraft[]; error?: string }> {
  const timer = logger.time('getUserDrafts', {
    metadata: { userEmail },
  });

  try {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('event_drafts')
      .select('*')
      .eq('user_email', userEmail)
      .is('submitted_event_id', null) // Only unsubmitted drafts
      .order('updated_at', { ascending: false });

    if (error) {
      timer.error('Failed to get user drafts', error);
      return { success: false, error: error.message };
    }

    timer.success(`Found ${data?.length || 0} drafts`);

    return {
      success: true,
      drafts: (data || []).map(transformDraft),
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
// DELETE DRAFT
// ============================================================================

/**
 * Delete a draft
 *
 * @param draftId - Draft ID
 * @returns Success status
 */
export async function deleteDraft(
  draftId: string
): Promise<{ success: boolean; error?: string }> {
  const timer = logger.time('deleteDraft', {
    action: 'draft_deleted',
    entityType: 'draft',
    entityId: draftId,
  });

  try {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('event_drafts')
      .delete()
      .eq('id', draftId);

    if (error) {
      timer.error('Failed to delete draft', error);
      return { success: false, error: error.message };
    }

    timer.success('Draft deleted');

    return { success: true };
  } catch (error) {
    timer.error('Unexpected error', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// TRANSFORM HELPER
// ============================================================================

/**
 * Transform database row to EventDraft type
 */
function transformDraft(data: Record<string, unknown>): EventDraft {
  return {
    id: data.id as string,
    user_id: data.user_id as string,
    user_email: data.user_email as string,
    user_name: (data.user_name as string) || null,
    draft_data: (data.draft_data as EventDraftData) || {},
    series_draft_data: (data.series_draft_data as SeriesDraftData) || null,
    current_step: (data.current_step as number) || 1,
    completed_steps: (data.completed_steps as number[]) || [],
    submitted_event_id: (data.submitted_event_id as string) || null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
    expires_at: data.expires_at as string,
  };
}
