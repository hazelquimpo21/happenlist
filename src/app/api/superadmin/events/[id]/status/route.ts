/**
 * 🦸 SUPERADMIN CHANGE STATUS API
 * ================================
 * POST /api/superadmin/events/[id]/status
 *
 * Changes the status of any event directly.
 *
 * Available statuses:
 * - draft: Not yet submitted
 * - pending_review: Awaiting admin review
 * - changes_requested: Admin requested changes
 * - published: Live and visible
 * - rejected: Not accepted
 * - cancelled: Event cancelled
 *
 * 🔐 SECURITY:
 * - Requires superadmin authentication
 * - Action is logged to audit trail
 *
 * @module api/superadmin/events/[id]/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadminAuth } from '@/lib/auth';
import { superadminChangeStatus } from '@/data/superadmin';
import { superadminLogger } from '@/lib/utils/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Valid event statuses
const VALID_STATUSES = [
  'draft',
  'pending_review',
  'changes_requested',
  'published',
  'rejected',
  'cancelled',
];

/**
 * Change event status.
 *
 * @example Request body:
 * ```json
 * {
 *   "status": "published",
 *   "notes": "Manually publishing event after review"
 * }
 * ```
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { id: eventId } = await context.params;

  const timer = superadminLogger.time('POST /api/superadmin/events/[id]/status', {
    action: 'superadmin_status_change',
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
          message: 'You do not have permission to change event status',
        },
        { status: 403 }
      );
    }

    // 📝 Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      timer.error('Invalid JSON body', parseError);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          message: 'Expected JSON with "status" field',
        },
        { status: 400 }
      );
    }

    const { status, notes } = body;

    // Validate status
    if (!status || typeof status !== 'string') {
      timer.error('No status provided');
      return NextResponse.json(
        {
          success: false,
          error: 'Status is required',
          message: 'Please provide a valid status',
          validStatuses: VALID_STATUSES,
        },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      timer.error('Invalid status', undefined, { metadata: { status } });
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status',
          message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
          validStatuses: VALID_STATUSES,
        },
        { status: 400 }
      );
    }

    superadminLogger.info('🦸 Changing event status', {
      entityType: 'event',
      entityId: eventId,
      adminEmail: session.email,
      metadata: {
        newStatus: status,
        hasNotes: !!notes,
      },
    });

    // 🔄 Execute the status change
    const result = await superadminChangeStatus({
      eventId,
      adminEmail: session.email,
      newStatus: status,
      notes,
    });

    if (!result.success) {
      timer.error('Status change failed', undefined, { metadata: { error: result.error } });
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: result.message,
        },
        { status: 400 }
      );
    }

    timer.success(`Status changed to ${status}`);

    return NextResponse.json({
      success: true,
      message: result.message,
      eventId: result.eventId,
      newStatus: status,
      timestamp: result.timestamp,
    });
  } catch (error) {
    timer.error('Unexpected error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while changing status',
      },
      { status: 500 }
    );
  }
}
