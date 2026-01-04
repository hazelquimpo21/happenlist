/**
 * DRAFT API ROUTES
 * ==================
 * API routes for creating and listing event drafts.
 *
 * POST /api/submit/draft - Create a new draft
 * GET /api/submit/draft - List user's drafts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createDraft, getUserDrafts } from '@/data/submit';
import { getSession } from '@/lib/auth';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('API.Submit');

// ============================================================================
// POST - Create Draft
// ============================================================================

export async function POST(request: NextRequest) {
  const timer = logger.time('POST /api/submit/draft');

  try {
    // Check authentication
    const { session, error: authError } = await getSession();

    if (authError || !session) {
      timer.error('Unauthorized');
      return NextResponse.json(
        {
          success: false,
          error: 'Please sign in to submit an event',
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { draftData, seriesDraftData } = body;

    // Create the draft
    const result = await createDraft({
      userId: session.id,
      userEmail: session.email,
      userName: session.name || undefined,
      draftData,
      seriesDraftData,
    });

    if (!result.success) {
      timer.error('Failed to create draft', new Error(result.error));
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    timer.success('Draft created');

    return NextResponse.json({
      success: true,
      draft: result.draft,
    });
  } catch (error) {
    timer.error('Unexpected error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - List Drafts
// ============================================================================

export async function GET() {
  const timer = logger.time('GET /api/submit/draft');

  try {
    // Check authentication
    const { session, error: authError } = await getSession();

    if (authError || !session) {
      timer.error('Unauthorized');
      return NextResponse.json(
        {
          success: false,
          error: 'Please sign in to view your drafts',
        },
        { status: 401 }
      );
    }

    // Get user's drafts
    const result = await getUserDrafts(session.email);

    if (!result.success) {
      timer.error('Failed to get drafts', new Error(result.error));
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    timer.success(`Found ${result.drafts?.length || 0} drafts`);

    return NextResponse.json({
      success: true,
      drafts: result.drafts,
    });
  } catch (error) {
    timer.error('Unexpected error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
