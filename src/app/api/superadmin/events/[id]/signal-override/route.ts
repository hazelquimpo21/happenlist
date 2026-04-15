/**
 * =============================================================================
 * POST /api/superadmin/events/[id]/signal-override — write a per-dimension override
 * =============================================================================
 *
 * Superadmin-only. Merges into events.signal_overrides without clobbering
 * other dimensions, AND writes a verdict='override' row to signal_reviews so
 * the audit trail records who set what.
 *
 * Why a dedicated endpoint instead of reusing PATCH /api/superadmin/events/[id]?
 * - Race-safe: PATCH would require client-side read-modify-write of the
 *   whole signal_overrides JSONB. The setSignalOverride helper still does
 *   that read-modify-write server-side, but at least the read happens in the
 *   same request as the write — no risk of two reviewers stomping each
 *   other based on data fetched at different times.
 * - Coupled audit: every override should produce a signal_review row. Doing
 *   that consistently from a generic PATCH means filtering for "this PATCH
 *   touched signal_overrides" — fragile.
 *
 * Cross-file coupling:
 *   - src/data/admin/signal-reviews.ts — setSignalOverride
 *   - src/components/superadmin/signals-review-panel.tsx — caller
 * =============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadminAuth } from '@/lib/auth';
import { setSignalOverride } from '@/data/admin';
import type { ReviewDimension, SignalOverrideValue } from '@/data/admin';
import { superadminLogger } from '@/lib/utils/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const VALID_DIMENSIONS: readonly ReviewDimension[] = [
  'accessibility',
  'sensory',
  'leave_with',
  'social_mode',
  'energy_needed',
  'social_intensity',
  'structure',
  'commitment',
  'spend_level',
];

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: eventId } = await context.params;

  let session;
  try {
    session = await requireSuperadminAuth();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Superadmin access required' },
      { status: 403 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const { dimension, value, note } = body ?? {};

  if (!VALID_DIMENSIONS.includes(dimension)) {
    return NextResponse.json(
      { success: false, error: `Invalid dimension: ${dimension}` },
      { status: 400 },
    );
  }

  // value is intentionally permissive — the dimension dictates the shape.
  // The data-layer helper writes whatever the client sends; if the client
  // sends garbage, the JSONB column accepts it and the public reader's
  // type-guards catch it. No structural validation here on purpose; tighten
  // if a specific dimension grows abuse risk.

  try {
    await setSignalOverride({
      eventId,
      dimension,
      value: value as SignalOverrideValue,
      reviewer: session.email,
      note: typeof note === 'string' ? note : null,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    superadminLogger.error('Failed to set signal override', err);
    return NextResponse.json(
      { success: false, error: 'Failed to set override' },
      { status: 500 },
    );
  }
}
