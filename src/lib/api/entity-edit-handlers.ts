/**
 * ENTITY EDIT / DELETE API HANDLERS
 * =================================
 * Shared PATCH + DELETE factories for `/api/superadmin/<entity>/[id]/route.ts`.
 *
 * Previously each entity's route had ~125 lines of near-duplicated code
 * (auth → body parse → call action → map response). Now each route is:
 *
 *   export const PATCH = patchEntityRoute('organizer');
 *   export const DELETE = deleteEntityRoute('organizer');
 *
 * Works for all SuperadminEntityType values (organizer, venue, performer,
 * membership_org, series). If you change these handlers, check that the
 * response shape is consumed identically across the five call sites.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadminAuth } from '@/lib/auth';
import {
  superadminEditEntity,
  superadminDeleteEntity,
  type SuperadminEntityType,
} from '@/data/superadmin';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export function patchEntityRoute(kind: SuperadminEntityType) {
  return async function PATCH(request: NextRequest, context: RouteContext) {
    const { id: entityId } = await context.params;

    let session;
    try {
      session = await requireSuperadminAuth();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Superadmin access required' },
        { status: 403 }
      );
    }

    let body: { updates?: Record<string, unknown>; notes?: string };
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
      entityType: kind,
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
  };
}

export function deleteEntityRoute(kind: SuperadminEntityType) {
  return async function DELETE(request: NextRequest, context: RouteContext) {
    const { id: entityId } = await context.params;

    let session;
    try {
      session = await requireSuperadminAuth();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Superadmin access required' },
        { status: 403 }
      );
    }

    let body: { reason?: string } = { reason: 'No reason provided' };
    try {
      const parsed = await request.json();
      if (parsed && typeof parsed === 'object') {
        body = { ...body, ...parsed };
      }
    } catch {
      // DELETE body is optional.
    }

    const result = await superadminDeleteEntity({
      entityId,
      entityType: kind,
      adminEmail: session.email,
      reason: body.reason || 'No reason provided',
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
  };
}
