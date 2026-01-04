/**
 * 🦸 SUPERADMIN RESTORE EVENT API
 * ================================
 * POST /api/superadmin/events/[id]/restore
 *
 * Restores a soft-deleted event back to its previous state.
 *
 * 🔐 SECURITY:
 * - Requires superadmin authentication
 * - Action is logged to audit trail
 *
 * @module api/superadmin/events/[id]/restore
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadminAuth } from '@/lib/auth';
import { superadminRestoreEvent } from '@/data/superadmin';
import { superadminLogger } from '@/lib/utils/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Restore a soft-deleted event.
 *
 * No request body required - just POST to this endpoint.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { id: eventId } = await context.params;

  const timer = superadminLogger.time('POST /api/superadmin/events/[id]/restore', {
    action: 'superadmin_restore',
    entityType: 'event',
    entityId: eventId,
  });

  try {
    // 🔐 Verify superadmin auth
    let session;
    try {
      session = await requireSuperadminAuth();
    } catch (authError) {
      timer.error('Superadmin auth failed', authError);
      return NextResponse.json(
        {
          success: false,
          error: '🔐 Superadmin access required',
          message: 'You do not have permission to restore events',
        },
        { status: 403 }
      );
    }

    superadminLogger.info('🦸 Restoring deleted event', {
      entityType: 'event',
      entityId: eventId,
      adminEmail: session.email,
    });

    // ♻️ Execute the restore
    const result = await superadminRestoreEvent(eventId, session.email);

    if (!result.success) {
      timer.error('Restore failed', undefined, { metadata: { error: result.error } });
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: result.message,
        },
        { status: 400 }
      );
    }

    timer.success('Event restored successfully');

    return NextResponse.json({
      success: true,
      message: result.message,
      eventId: result.eventId,
      timestamp: result.timestamp,
    });
  } catch (error) {
    timer.error('Unexpected error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while restoring the event',
      },
      { status: 500 }
    );
  }
}
