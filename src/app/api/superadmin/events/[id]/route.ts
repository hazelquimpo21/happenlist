/**
 * 🦸 SUPERADMIN EVENT API ROUTE
 * =============================
 * PATCH /api/superadmin/events/[id] - Edit any event
 * DELETE /api/superadmin/events/[id] - Delete any event
 *
 * These endpoints allow superadmins to edit or delete ANY event,
 * regardless of who created it.
 *
 * 🔐 SECURITY:
 * - Requires superadmin authentication
 * - All actions are logged to audit trail
 *
 * @module api/superadmin/events/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadminAuth } from '@/lib/auth';
import { superadminEditEvent, superadminDeleteEvent } from '@/data/superadmin';
import { superadminLogger } from '@/lib/utils/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ============================================================================
// ✏️ PATCH - Edit Event
// ============================================================================

/**
 * Edit any event as superadmin.
 *
 * @example Request body:
 * ```json
 * {
 *   "updates": {
 *     "title": "Updated Event Title",
 *     "description": "New description..."
 *   },
 *   "notes": "Fixed typo in event title"
 * }
 * ```
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id: eventId } = await context.params;

  const timer = superadminLogger.time('PATCH /api/superadmin/events/[id]', {
    action: 'superadmin_edit',
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
          message: 'You do not have permission to edit this event',
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
          message: 'Expected JSON with "updates" object',
        },
        { status: 400 }
      );
    }

    const { updates, notes } = body;

    // Validate updates
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      timer.error('No updates provided');
      return NextResponse.json(
        {
          success: false,
          error: 'No updates provided',
          message: 'Please provide at least one field to update',
        },
        { status: 400 }
      );
    }

    superadminLogger.info('🦸 Processing event edit', {
      entityType: 'event',
      entityId: eventId,
      adminEmail: session.email,
      metadata: {
        fields: Object.keys(updates),
        hasNotes: !!notes,
      },
    });

    // ✏️ Execute the edit
    const result = await superadminEditEvent({
      eventId,
      adminEmail: session.email,
      updates,
      notes,
    });

    if (!result.success) {
      timer.error('Edit failed', undefined, { metadata: { error: result.error } });
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: result.message,
        },
        { status: 400 }
      );
    }

    timer.success('Event edited successfully');

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
        message: 'An unexpected error occurred while editing the event',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// 🗑️ DELETE - Delete Event
// ============================================================================

/**
 * Delete any event as superadmin (soft delete by default).
 *
 * @example Request body:
 * ```json
 * {
 *   "reason": "Spam event reported by users",
 *   "hardDelete": false
 * }
 * ```
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id: eventId } = await context.params;

  const timer = superadminLogger.time('DELETE /api/superadmin/events/[id]', {
    action: 'superadmin_soft_delete',
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
          message: 'You do not have permission to delete this event',
        },
        { status: 403 }
      );
    }

    // 📝 Parse request body
    let body = { reason: 'No reason provided', hardDelete: false };
    try {
      const parsed = await request.json();
      body = { ...body, ...parsed };
    } catch {
      // Body is optional for DELETE, use defaults
    }

    const { reason, hardDelete } = body;

    superadminLogger.info('🦸 Processing event deletion', {
      entityType: 'event',
      entityId: eventId,
      adminEmail: session.email,
      metadata: {
        reason,
        hardDelete,
      },
    });

    // 🗑️ Execute the delete
    const result = await superadminDeleteEvent({
      eventId,
      adminEmail: session.email,
      reason,
      hardDelete,
    });

    if (!result.success) {
      timer.error('Delete failed', undefined, { metadata: { error: result.error } });
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: result.message,
        },
        { status: 400 }
      );
    }

    timer.success(`Event ${hardDelete ? 'permanently' : 'soft'} deleted`);

    return NextResponse.json({
      success: true,
      message: result.message,
      eventId: result.eventId,
      timestamp: result.timestamp,
      wasHardDelete: hardDelete,
    });
  } catch (error) {
    timer.error('Unexpected error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while deleting the event',
      },
      { status: 500 }
    );
  }
}
