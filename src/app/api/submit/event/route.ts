/**
 * EVENT SUBMISSION API ROUTE
 * ============================
 * API route for submitting an event for review.
 *
 * POST /api/submit/event - Submit event for review
 */

import { NextRequest, NextResponse } from 'next/server';
import { submitEvent } from '@/data/submit';
import { getSession } from '@/lib/auth';
import { createLogger } from '@/lib/utils/logger';
import { validateAllSteps } from '@/types/submission';

const logger = createLogger('API.Submit');

// ============================================================================
// POST - Submit Event
// ============================================================================

export async function POST(request: NextRequest) {
  const timer = logger.time('POST /api/submit/event');

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
    const { draftId, draftData, seriesDraftData } = body;

    // Validate the draft data
    if (!draftData) {
      timer.error('Missing draft data');
      return NextResponse.json(
        {
          success: false,
          error: 'Event data is required',
        },
        { status: 400 }
      );
    }

    // Validate all required steps
    const validation = validateAllSteps(draftData);

    if (!validation.valid) {
      timer.error('Validation failed', new Error('Missing required fields'));

      // Format error messages
      const errorMessages: string[] = [];
      for (const [step, errors] of Object.entries(validation.stepErrors)) {
        errorMessages.push(`Step ${step}: ${errors.join(', ')}`);
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Please complete all required fields',
          validationErrors: validation.stepErrors,
          message: errorMessages.join('; '),
        },
        { status: 400 }
      );
    }

    // Submit the event
    const result = await submitEvent({
      draftId,
      draftData,
      seriesDraftData,
      userEmail: session.email,
      userName: session.name || undefined,
    });

    if (!result.success) {
      timer.error('Failed to submit event', new Error(result.error));
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    timer.success(`Event submitted: ${result.eventId}`);

    return NextResponse.json({
      success: true,
      eventId: result.eventId,
      seriesId: result.seriesId,
      locationId: result.locationId,
      message: 'Your event has been submitted for review! 🎉',
    });
  } catch (error) {
    timer.error('Unexpected error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}
