/**
 * =============================================================================
 * Signal-review types — client-safe (no server imports)
 * =============================================================================
 *
 * Lives in its own file because src/data/admin/signal-reviews.ts imports
 * from @/lib/supabase/server (which uses next/headers — server-only). The
 * SignalsReviewPanel client component needs these types but cannot pull in
 * the server module without breaking the client bundle.
 *
 * Server consumers should import from './signal-reviews' (which re-exports
 * these too); client consumers should import from './signal-reviews-types'
 * directly.
 * =============================================================================
 */

export type ReviewVerdict = 'looks_right' | 'flagged' | 'override';

export type ReviewDimension =
  | 'accessibility'
  | 'sensory'
  | 'leave_with'
  | 'social_mode'
  | 'energy_needed'
  | 'social_intensity'
  | 'structure'
  | 'commitment'
  | 'spend_level';

export interface SignalReview {
  id: string;
  event_id: string;
  dimension: ReviewDimension;
  reviewer: string;
  verdict: ReviewVerdict;
  note: string | null;
  reviewed_at: string;
}

/**
 * Loose value shape for per-dimension overrides — different dimensions take
 * different shapes. The override endpoint passes this through as JSONB.
 */
export type SignalOverrideValue =
  | string
  | string[]
  | number
  | { value: number; confidence?: 'high' | 'medium' | 'low'; evidence?: string }
  | null;

/**
 * Pick the most recent verdict per dimension. Pure function — safe to call
 * from anywhere. Input must already be sorted newest-first (the server-side
 * fetcher does that).
 */
export function latestVerdictByDimension(
  reviews: readonly SignalReview[],
): Partial<Record<ReviewDimension, SignalReview>> {
  const out: Partial<Record<ReviewDimension, SignalReview>> = {};
  for (const r of reviews) {
    if (!out[r.dimension]) out[r.dimension] = r;
  }
  return out;
}
