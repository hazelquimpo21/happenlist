/**
 * BULK EVENT ACTIONS API ROUTE
 * =============================
 * POST /api/admin/events/bulk
 *
 * Handles bulk operations on multiple events:
 *   - approve: Bulk approve pending events
 *   - reject: Bulk reject pending events
 *   - delete: Bulk soft-delete events (superadmin)
 *   - change_status: Bulk status change (superadmin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, requireSuperadminAuth } from '@/lib/auth';
import { bulkApproveEvents, bulkRejectEvents } from '@/data/admin';
import {
  superadminBulkDelete,
  superadminBulkChangeStatus,
  superadminBulkChangeCategory,
} from '@/data/superadmin';

type BulkAction = 'approve' | 'reject' | 'delete' | 'change_status' | 'change_category';

const VALID_ACTIONS: BulkAction[] = [
  'approve',
  'reject',
  'delete',
  'change_status',
  'change_category',
];

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { action, eventIds, reason, status, notes, categoryId } = body as {
      action: string;
      eventIds: string[];
      reason?: string;
      status?: string;
      notes?: string;
      categoryId?: string | null;
    };

    // Validate action
    if (!action || !VALID_ACTIONS.includes(action as BulkAction)) {
      return NextResponse.json(
        { success: false, error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate eventIds
    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'eventIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (eventIds.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Cannot process more than 100 events at once' },
        { status: 400 }
      );
    }

    // Route to appropriate handler
    switch (action as BulkAction) {
      case 'approve': {
        const session = await requireAdminAuth();
        const result = await bulkApproveEvents(eventIds, session.email, notes);
        return NextResponse.json({
          success: true,
          message: `Approved ${result.succeeded.length} events`,
          succeeded: result.succeeded,
          failed: result.failed,
        });
      }

      case 'reject': {
        if (!reason) {
          return NextResponse.json(
            { success: false, error: 'Rejection reason is required' },
            { status: 400 }
          );
        }
        const session = await requireAdminAuth();
        const result = await bulkRejectEvents(eventIds, session.email, reason, notes);
        return NextResponse.json({
          success: true,
          message: `Rejected ${result.succeeded.length} events`,
          succeeded: result.succeeded,
          failed: result.failed,
        });
      }

      case 'delete': {
        const session = await requireSuperadminAuth();
        const result = await superadminBulkDelete(eventIds, session.email, reason || 'Bulk delete');
        return NextResponse.json({
          success: true,
          message: `Deleted ${result.succeeded.length} events`,
          succeeded: result.succeeded,
          failed: result.failed,
        });
      }

      case 'change_status': {
        if (!status) {
          return NextResponse.json(
            { success: false, error: 'Target status is required' },
            { status: 400 }
          );
        }
        const session = await requireSuperadminAuth();
        const result = await superadminBulkChangeStatus(eventIds, session.email, status, notes);
        return NextResponse.json({
          success: true,
          message: `Updated ${result.succeeded.length} events to ${status}`,
          succeeded: result.succeeded,
          failed: result.failed,
        });
      }

      case 'change_category': {
        // categoryId is optional — pass null/empty to clear the category.
        const session = await requireSuperadminAuth();
        const result = await superadminBulkChangeCategory(
          eventIds,
          session.email,
          categoryId || null,
          notes
        );
        return NextResponse.json({
          success: true,
          message: categoryId
            ? `Assigned category to ${result.succeeded.length} events`
            : `Cleared category from ${result.succeeded.length} events`,
          succeeded: result.succeeded,
          failed: result.failed,
        });
      }
    }
  } catch (error) {
    // Auth errors throw — catch and return 403
    if (error instanceof Error && error.message.includes('access required')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }
    console.error('Unexpected error in bulk action:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
