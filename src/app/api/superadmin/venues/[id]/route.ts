/**
 * SUPERADMIN VENUE API ROUTE
 * PATCH /api/superadmin/venues/[id] - Edit any venue
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadminAuth } from '@/lib/auth';
import { superadminEditEntity, superadminDeleteEntity } from '@/data/superadmin';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id: entityId } = await context.params;

  try {
    let session;
    try {
      session = await requireSuperadminAuth();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Superadmin access required' },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { updates, notes } = body;

    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No updates provided' },
        { status: 400 }
      );
    }

    const result = await superadminEditEntity({
      entityId,
      entityType: 'venue',
      adminEmail: session.email,
      updates,
      notes,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      entityId: result.eventId,
      timestamp: result.timestamp,
    });
  } catch (error) {
    console.error('Unexpected error editing venue:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id: entityId } = await context.params;

  try {
    let session;
    try {
      session = await requireSuperadminAuth();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Superadmin access required' },
        { status: 403 }
      );
    }

    let body = { reason: 'No reason provided' };
    try {
      const parsed = await request.json();
      body = { ...body, ...parsed };
    } catch {
      // Body is optional for DELETE
    }

    const result = await superadminDeleteEntity({
      entityId,
      entityType: 'venue',
      adminEmail: session.email,
      reason: body.reason,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      entityId: result.eventId,
      timestamp: result.timestamp,
    });
  } catch (error) {
    console.error('Unexpected error deleting venue:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
