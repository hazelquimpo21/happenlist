/**
 * SOFT DELETE API ROUTE
 * =======================
 * API route for admins to soft delete an event.
 *
 * POST /api/admin/events/[id]/delete
 */

import { NextRequest, NextResponse } from 'next/server';
import { softDeleteEvent } from '@/data/admin/event-actions';
import { requireAdminAuth } from '@/lib/auth';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('API.Admin');

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ============================================================================
// POST - Soft Delete
// ============================================================================

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: eventId } = await params;
  const timer = logger.time(`POST /api/admin/events/${eventId}/delete`);

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
    const { reason } = body;

    // Delete the event
    const result = await softDeleteEvent({
      eventId,
      adminEmail: session.email,
      reason,
    });

    if (!result.success) {
      timer.error('Failed to delete event', new Error(result.error));
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    timer.success('Event deleted');

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
