/**
 * ENTITY CREATE API HANDLER
 * =========================
 * Shared POST handler for `/api/superadmin/<entity>/route.ts`.
 *
 * Each entity's route.ts just calls:
 *
 *   export const POST = createEntityRoute('organizer', organizerCreateSchema);
 *
 * Concerns handled here once (so all four routes stay trivial):
 *   - Superadmin auth
 *   - JSON body parsing
 *   - Auto-slug from `name` via generateSlug()
 *   - Defaulting `is_active=true`
 *   - Per-entity value validation via the caller's `validate()`
 *   - Audit-logged creation via superadminCreateEntity()
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadminAuth } from '@/lib/auth';
import { superadminCreateEntity } from '@/data/superadmin';
import { generateSlug } from '@/lib/utils/slug';
import type { AdminEntityKind } from '@/lib/constants/admin-entities';

/**
 * Per-entity validator. Return `{ ok: true, values }` to proceed; each entity
 * has different required fields (venue needs `city`, etc.). Validators can
 * also normalize values (trim, coerce numeric, drop empty strings).
 */
export type EntityValidator = (raw: Record<string, unknown>) =>
  | { ok: true; values: Record<string, unknown> }
  | { ok: false; error: string };

/**
 * Universal entity-create route factory.
 */
export function createEntityRoute(kind: AdminEntityKind, validate: EntityValidator) {
  return async function POST(request: NextRequest) {
    let session;
    try {
      session = await requireSuperadminAuth();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Superadmin access required' },
        { status: 403 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Name is always required.
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const validated = validate(body);
    if (!validated.ok) {
      return NextResponse.json(
        { success: false, error: validated.error },
        { status: 400 }
      );
    }

    const notes = typeof body.notes === 'string' ? body.notes : undefined;

    // Auto-slug on create. Caller can override by passing `slug` in the body;
    // uniqueness is enforced by the DB.
    const slug =
      typeof body.slug === 'string' && body.slug.trim().length > 0
        ? generateSlug(body.slug.trim())
        : generateSlug(name);

    const values: Record<string, unknown> = {
      name,
      slug,
      is_active: true,
      ...validated.values,
    };

    const result = await superadminCreateEntity({
      entityType: kind,
      adminEmail: session.email,
      values,
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
      id: result.eventId,
      slug: result.slug,
      timestamp: result.timestamp,
    });
  };
}
