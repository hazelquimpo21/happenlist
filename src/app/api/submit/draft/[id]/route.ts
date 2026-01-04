/**
 * DRAFT BY ID API ROUTES
 * ========================
 * API routes for getting, updating, and deleting a specific draft.
 *
 * GET /api/submit/draft/[id] - Get a draft
 * PATCH /api/submit/draft/[id] - Update a draft
 * DELETE /api/submit/draft/[id] - Delete a draft
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDraft, updateDraft, deleteDraft } from '@/data/submit';
import { getSession } from '@/lib/auth';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('API.Submit');

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ============================================================================
// GET - Get Draft
// ============================================================================

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const timer = logger.time(`GET /api/submit/draft/${id}`);

  try {
    // Check authentication
    const { session, error: authError } = await getSession();

    if (authError || !session) {
      timer.error('Unauthorized');
      return NextResponse.json(
        { success: false, error: 'Please sign in to view this draft' },
        { status: 401 }
      );
    }

    // Get the draft
    const result = await getDraft(id);

    if (!result.success) {
      timer.error('Draft not found');
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 }
      );
    }

    // Verify ownership
    if (result.draft?.user_email !== session.email) {
      timer.error('Forbidden - not owner');
      return NextResponse.json(
        { success: false, error: 'You do not have access to this draft' },
        { status: 403 }
      );
    }

    timer.success('Draft retrieved');

    return NextResponse.json({
      success: true,
      draft: result.draft,
    });
  } catch (error) {
    timer.error('Unexpected error', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update Draft
// ============================================================================

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const timer = logger.time(`PATCH /api/submit/draft/${id}`);

  try {
    // Check authentication
    const { session, error: authError } = await getSession();

    if (authError || !session) {
      timer.error('Unauthorized');
      return NextResponse.json(
        { success: false, error: 'Please sign in to update this draft' },
        { status: 401 }
      );
    }

    // First verify ownership
    const draftResult = await getDraft(id);

    if (!draftResult.success) {
      timer.error('Draft not found');
      return NextResponse.json(
        { success: false, error: 'Draft not found' },
        { status: 404 }
      );
    }

    if (draftResult.draft?.user_email !== session.email) {
      timer.error('Forbidden - not owner');
      return NextResponse.json(
        { success: false, error: 'You do not have access to this draft' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { draftData, seriesDraftData, currentStep, completedSteps } = body;

    // Update the draft
    const result = await updateDraft({
      draftId: id,
      draftData,
      seriesDraftData,
      currentStep,
      completedSteps,
    });

    if (!result.success) {
      timer.error('Failed to update draft', new Error(result.error));
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    timer.success('Draft updated');

    return NextResponse.json({
      success: true,
      draft: result.draft,
    });
  } catch (error) {
    timer.error('Unexpected error', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete Draft
// ============================================================================

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const timer = logger.time(`DELETE /api/submit/draft/${id}`);

  try {
    // Check authentication
    const { session, error: authError } = await getSession();

    if (authError || !session) {
      timer.error('Unauthorized');
      return NextResponse.json(
        { success: false, error: 'Please sign in to delete this draft' },
        { status: 401 }
      );
    }

    // First verify ownership
    const draftResult = await getDraft(id);

    if (!draftResult.success) {
      timer.error('Draft not found');
      return NextResponse.json(
        { success: false, error: 'Draft not found' },
        { status: 404 }
      );
    }

    if (draftResult.draft?.user_email !== session.email) {
      timer.error('Forbidden - not owner');
      return NextResponse.json(
        { success: false, error: 'You do not have access to this draft' },
        { status: 403 }
      );
    }

    // Delete the draft
    const result = await deleteDraft(id);

    if (!result.success) {
      timer.error('Failed to delete draft', new Error(result.error));
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    timer.success('Draft deleted');

    return NextResponse.json({
      success: true,
      message: 'Draft deleted successfully',
    });
  } catch (error) {
    timer.error('Unexpected error', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
