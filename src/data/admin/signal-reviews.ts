/**
 * =============================================================================
 * SIGNAL REVIEWS — admin data layer for tagging-expansion Stage 4
 * =============================================================================
 *
 * Reads + writes to:
 *   - signal_reviews (append-only audit trail)
 *   - events.signal_overrides (per-dimension reviewer overrides)
 *
 * The admin SignalsReviewPanel reads the latest review per dimension to show
 * the current verdict in the UI ("✓ marked correct by hazel@", "⚑ flagged…").
 * Overrides read directly from events.signal_overrides; the audit trail
 * records the override action for calibration metrics.
 *
 * Cross-file coupling:
 *   - src/components/superadmin/signals-review-panel.tsx — UI consumer
 *   - src/app/api/admin/signal-reviews/route.ts — review POST endpoint
 *   - src/app/api/superadmin/events/[id]/signal-override/route.ts — override
 *   - database migration 00020 — tables/columns referenced here
 * =============================================================================
 */

import { createClient } from '@/lib/supabase/server';
import { adminDataLogger } from '@/lib/utils/logger';
import type {
  ReviewVerdict,
  ReviewDimension,
  SignalReview,
  SignalOverrideValue,
} from './signal-reviews-types';

// Re-export for server-side callers that prefer the single barrel.
export type { ReviewVerdict, ReviewDimension, SignalReview, SignalOverrideValue };
export { latestVerdictByDimension } from './signal-reviews-types';

// -----------------------------------------------------------------------------
// READS
// -----------------------------------------------------------------------------

/**
 * Fetch every review for an event, newest first.
 *
 * The UI groups these client-side — typical event has at most 9 dimensions
 * × a handful of reviews each, so grouping in JS is fine and avoids needing
 * a `DISTINCT ON` SQL with ordering. If review counts ever explode, switch
 * to a server-side aggregate.
 */
export async function getSignalReviewsForEvent(
  eventId: string,
): Promise<SignalReview[]> {
  const timer = adminDataLogger.time('getSignalReviewsForEvent', {
    entityType: 'event',
    entityId: eventId,
  });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('signal_reviews')
    .select('*')
    .eq('event_id', eventId)
    .order('reviewed_at', { ascending: false });

  if (error) {
    timer.error('Failed to fetch signal reviews', error);
    throw error;
  }

  timer.success(`Fetched ${data?.length ?? 0} reviews`);
  // Cast: generated Database types don't know about signal_reviews yet.
  return (data as unknown as SignalReview[]) ?? [];
}

// latestVerdictByDimension is re-exported from ./signal-reviews-types above
// (pure helper; client-safe).

// -----------------------------------------------------------------------------
// WRITES — review verdict
// -----------------------------------------------------------------------------

interface CreateReviewParams {
  eventId: string;
  dimension: ReviewDimension;
  reviewer: string;
  verdict: ReviewVerdict;
  note?: string | null;
}

/**
 * Append a new review row. Append-only by design — re-clicking "Looks right"
 * after a flag stacks a new row, it doesn't overwrite. The latest row per
 * dimension is what the UI shows; older rows are the audit trail.
 */
export async function createSignalReview(
  params: CreateReviewParams,
): Promise<SignalReview> {
  const { eventId, dimension, reviewer, verdict, note } = params;
  const timer = adminDataLogger.time('createSignalReview', {
    entityType: 'event',
    entityId: eventId,
    metadata: { dimension, verdict },
  });

  const supabase = await createClient();
  // Cast through any: generated Database types don't include signal_reviews.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('signal_reviews')
    .insert({
      event_id: eventId,
      dimension,
      reviewer,
      verdict,
      note: note ?? null,
    })
    .select('*')
    .single();

  if (error) {
    timer.error('Failed to create review', error);
    throw error;
  }

  timer.success(`Created ${verdict} review for ${dimension}`);
  return data as unknown as SignalReview;
}

// -----------------------------------------------------------------------------
// WRITES — per-dimension override on events.signal_overrides
// -----------------------------------------------------------------------------

interface UpsertOverrideParams {
  eventId: string;
  dimension: ReviewDimension;
  value: SignalOverrideValue;
  /** Reviewer email — also writes a verdict='override' row for the audit trail. */
  reviewer: string;
  /** Optional note recorded on the audit row. */
  note?: string | null;
}

/**
 * Atomically write a per-dimension override into events.signal_overrides
 * AND record an audit row in signal_reviews.
 *
 * Slider dimensions land at signal_overrides.sliders.<dim> to mirror the
 * analyzer's shape; everything else is top-level signal_overrides.<dim>.
 *
 * Atomicity: the JSONB write goes through the set_signal_override_path RPC
 * (migration 00021) which uses Postgres jsonb_set inside a single UPDATE.
 * Without the RPC, two reviewers overriding different dimensions of the
 * same event in the same second would clobber each other (both read {},
 * second write overwrites first).
 *
 * Audit row: written AFTER the override succeeds. If the override fails,
 * no audit row is created. If the audit write fails (very rare), the
 * override is already committed and the caller sees an error — accept the
 * trade-off vs. wrapping both in a transaction (would require a more
 * elaborate RPC).
 */
export async function setSignalOverride(
  params: UpsertOverrideParams,
): Promise<void> {
  const { eventId, dimension, value, reviewer, note } = params;
  const timer = adminDataLogger.time('setSignalOverride', {
    entityType: 'event',
    entityId: eventId,
    metadata: { dimension },
  });

  const supabase = await createClient();

  const isSlider = ['social_intensity', 'structure', 'commitment', 'spend_level'].includes(
    dimension,
  );
  const path = isSlider ? ['sliders', dimension] : [dimension];

  // Atomic write via RPC — concurrent overrides on different dimensions
  // serialize at the row level via Postgres MVCC instead of clobbering.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: rpcErr } = await (supabase as any).rpc('set_signal_override_path', {
    p_event_id: eventId,
    p_path: path,
    p_value: value,  // postgrest serializes null → SQL NULL → "delete this key"
  });

  if (rpcErr) {
    timer.error('Failed to set override via RPC', rpcErr);
    throw rpcErr;
  }

  // Audit row — written AFTER the override succeeds.
  await createSignalReview({
    eventId,
    dimension,
    reviewer,
    verdict: 'override',
    note: note ?? `Set ${path.join('.')} = ${JSON.stringify(value)}`,
  });

  timer.success(`Set override for ${dimension}`);
}
