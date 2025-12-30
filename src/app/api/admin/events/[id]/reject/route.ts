/**
 * REJECT EVENT API ROUTE
 * =======================
 * POST /api/admin/events/[id]/reject
 *
 * Rejects an event with a reason.
 */

import { NextRequest, NextResponse } from 'next/server';
import { rejectEvent } from '@/data/admin';
import { adminApiLogger } from '@/lib/utils/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: eventId } = await context.params;
  const timer = adminApiLogger.time('POST /api/admin/events/[id]/reject', {
    action: 'event_rejected',
    entityType: 'event',
    entityId: eventId,
  });

  try {
    // Parse request body
    const body = await request.json();
    const { reason, notes } = body;

    // Validate required fields
    if (!reason || typeof reason !== 'string') {
      adminApiLogger.warn('Missing rejection reason', { entityType: 'event', entityId: eventId });
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // TODO: In production, get the admin email from the authenticated session
    // For now, we'll use a placeholder
    const adminEmail = 'admin@happenlist.com';

    adminApiLogger.info('Rejecting event', {
      entityType: 'event',
      entityId: eventId,
      adminEmail,
      metadata: { reason, hasNotes: !!notes },
    });

    // Reject the event
    const result = await rejectEvent({
      eventId,
      adminEmail,
      reason,
      notes,
    });

    if (!result.success) {
      timer.error('Failed to reject event', undefined, {
        metadata: { error: result.error },
      });
      return NextResponse.json(
        { error: result.error || result.message },
        { status: 400 }
      );
    }

    timer.success('Event rejected successfully');

    return NextResponse.json({
      success: true,
      message: result.message,
      eventId: result.eventId,
    });
  } catch (error) {
    timer.error('Unexpected error rejecting event', error);

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
