/**
 * =============================================================================
 * POST /api/admin/signal-reviews — record a reviewer verdict
 * =============================================================================
 *
 * Looks-Right and Flag clicks from the SignalsReviewPanel land here. Override
 * clicks go through /api/superadmin/events/[id]/signal-override (which writes
 * the audit row internally) — DO NOT route override actions through here.
 *
 * Auth: any authenticated admin (not superadmin-gated). Marking a reading
 * "looks right" is read-only metadata and benefits from a wider reviewer
 * pool. Override is the destructive action and stays superadmin-only.
 *
 * Cross-file coupling:
 *   - src/data/admin/signal-reviews.ts — createSignalReview
 *   - src/components/superadmin/signals-review-panel.tsx — caller
 * =============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { createSignalReview } from '@/data/admin';
import type { ReviewDimension, ReviewVerdict } from '@/data/admin';
import { adminDataLogger } from '@/lib/utils/logger';

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

// 'override' is intentionally excluded — that path runs through the dedicated
// superadmin override endpoint, which writes the audit row itself.
const VALID_VERDICTS: readonly ReviewVerdict[] = ['looks_right', 'flagged'];

export async function POST(request: NextRequest) {
  let session;
  try {
    session = await requireAdminAuth();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Admin access required' },
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

  const { eventId, dimension, verdict, note } = body ?? {};

  if (typeof eventId !== 'string' || !eventId) {
    return NextResponse.json(
      { success: false, error: 'eventId is required' },
      { status: 400 },
    );
  }
  if (!VALID_DIMENSIONS.includes(dimension)) {
    return NextResponse.json(
      { success: false, error: `Invalid dimension: ${dimension}` },
      { status: 400 },
    );
  }
  if (!VALID_VERDICTS.includes(verdict)) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid verdict: ${verdict}. Use 'looks_right' or 'flagged'. Override goes through the dedicated endpoint.`,
      },
      { status: 400 },
    );
  }

  try {
    const review = await createSignalReview({
      eventId,
      dimension,
      verdict,
      reviewer: session.email,
      note: typeof note === 'string' ? note : null,
    });
    return NextResponse.json({ success: true, review });
  } catch (err) {
    adminDataLogger.error('Failed to create signal review', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create review' },
      { status: 500 },
    );
  }
}
