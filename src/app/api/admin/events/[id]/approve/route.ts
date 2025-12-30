/**
 * APPROVE EVENT API ROUTE
 * ========================
 * POST /api/admin/events/[id]/approve
 *
 * Approves an event and publishes it.
 */

import { NextRequest, NextResponse } from 'next/server';
import { approveEvent } from '@/data/admin';
import { adminApiLogger } from '@/lib/utils/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: eventId } = await context.params;
  const timer = adminApiLogger.time('POST /api/admin/events/[id]/approve', {
    action: 'event_approved',
    entityType: 'event',
    entityId: eventId,
  });

  try {
    // Parse request body
    const body = await request.json();
    const { notes, updates } = body;

    // TODO: In production, get the admin email from the authenticated session
    // For now, we'll use a placeholder
    const adminEmail = 'admin@happenlist.com';

    adminApiLogger.info('Approving event', {
      entityType: 'event',
      entityId: eventId,
      adminEmail,
      metadata: { hasNotes: !!notes, hasUpdates: !!updates },
    });

    // Approve the event
    const result = await approveEvent({
      eventId,
      adminEmail,
      notes,
      updates,
    });

    if (!result.success) {
      timer.error('Failed to approve event', undefined, {
        metadata: { error: result.error },
      });
      return NextResponse.json(
        { error: result.error || result.message },
        { status: 400 }
      );
    }

    timer.success('Event approved successfully');

    return NextResponse.json({
      success: true,
      message: result.message,
      eventId: result.eventId,
    });
  } catch (error) {
    timer.error('Unexpected error approving event', error);

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
