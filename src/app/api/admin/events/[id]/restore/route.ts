/**
 * RESTORE EVENT API ROUTE
 * =========================
 * API route for admins to restore a soft-deleted event.
 *
 * POST /api/admin/events/[id]/restore
 */

import { NextResponse } from 'next/server';
import { restoreEvent } from '@/data/admin/event-actions';
import { requireAdminAuth } from '@/lib/auth';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('API.Admin');

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ============================================================================
// POST - Restore Event
// ============================================================================

export async function POST(_request: Request, { params }: RouteParams) {
  const { id: eventId } = await params;
  const timer = logger.time(`POST /api/admin/events/${eventId}/restore`);

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

    // Restore the event
    const result = await restoreEvent(eventId, session.email);

    if (!result.success) {
      timer.error('Failed to restore event', new Error(result.error));
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    timer.success('Event restored');

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
