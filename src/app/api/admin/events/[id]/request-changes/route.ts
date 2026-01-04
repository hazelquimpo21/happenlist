/**
 * REQUEST CHANGES API ROUTE
 * ===========================
 * API route for admins to request changes on a submitted event.
 *
 * POST /api/admin/events/[id]/request-changes
 */

import { NextRequest, NextResponse } from 'next/server';
import { requestEventChanges } from '@/data/admin/event-actions';
import { requireAdminAuth } from '@/lib/auth';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('API.Admin');

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ============================================================================
// POST - Request Changes
// ============================================================================

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: eventId } = await params;
  const timer = logger.time(`POST /api/admin/events/${eventId}/request-changes`);

  try {
    // Check admin authentication
    let session;
    try {
      session = await requireAdminAuth();
    } catch {
      timer.error('Unauthorized');
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { message, notes } = body;

    // Validate message
    if (!message?.trim()) {
      timer.error('Missing change request message');
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide a message explaining what changes are needed',
        },
        { status: 400 }
      );
    }

    // Request changes
    const result = await requestEventChanges({
      eventId,
      adminEmail: session.email,
      message: message.trim(),
      notes,
    });

    if (!result.success) {
      timer.error('Failed to request changes', new Error(result.error));
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    timer.success('Changes requested');

    return NextResponse.json({
      success: true,
      message: result.message,
      eventId: result.eventId,
    });
  } catch (error) {
    timer.error('Unexpected error', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
