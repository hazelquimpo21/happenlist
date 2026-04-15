/**
 * =============================================================================
 * GET SIGNALS CALIBRATION — aggregate stats from signal_reviews
 * =============================================================================
 *
 * Powers /admin/signals-calibration. Pulls every signal_reviews row and
 * groups in JS — table is small (one row per click; admin volume is light).
 * If row count ever exceeds ~10k, switch to a Postgres aggregation function.
 *
 * Returns:
 *   - per-dimension counts of looks_right / flagged / override + agreement %
 *   - top reviewers by review count
 *   - recent activity (newest 20 reviews with event title)
 *
 * Cross-file coupling:
 *   - src/app/admin/signals-calibration/page.tsx — sole consumer
 *   - src/data/admin/signal-reviews-types.ts — ReviewDimension union
 * =============================================================================
 */

import { createClient } from '@/lib/supabase/server';
import { adminDataLogger } from '@/lib/utils/logger';
import type { ReviewDimension, ReviewVerdict, SignalReview } from './signal-reviews-types';

export interface DimensionStats {
  dimension: ReviewDimension;
  total: number;
  looksRight: number;
  flagged: number;
  overrides: number;
  /** looksRight / total — null if total is zero. */
  agreementRate: number | null;
}

export interface ReviewerStats {
  reviewer: string;
  total: number;
  looksRight: number;
  flagged: number;
  overrides: number;
}

export interface CalibrationActivityRow extends SignalReview {
  /** Joined from events.title at fetch time so the page can deep-link. */
  event_title: string | null;
  event_slug: string | null;
}

export interface CalibrationData {
  totalReviews: number;
  uniqueEvents: number;
  uniqueReviewers: number;
  perDimension: DimensionStats[];
  perReviewer: ReviewerStats[];
  recentActivity: CalibrationActivityRow[];
  /** Generated at fetch time; cache busts via the page's force-dynamic. */
  generatedAt: string;
}

const ALL_DIMENSIONS: readonly ReviewDimension[] = [
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

export async function getSignalsCalibration(): Promise<CalibrationData> {
  const timer = adminDataLogger.time('getSignalsCalibration');
  const supabase = await createClient();

  // Fetch every review (admin volume is small). For recent activity we also
  // join the event title — Supabase embedded select handles this in one
  // round trip.
  const { data, error } = await supabase
    .from('signal_reviews')
    .select(`
      id, event_id, dimension, reviewer, verdict, note, reviewed_at,
      event:events(title, slug)
    `)
    .order('reviewed_at', { ascending: false });

  if (error) {
    timer.error('Failed to fetch reviews', error);
    throw error;
  }

  // Cast: generated Database types don't know about signal_reviews.
  type RowWithEvent = SignalReview & {
    event: { title: string | null; slug: string | null } | null;
  };
  const rows = (data ?? []) as unknown as RowWithEvent[];

  // ── Per-dimension stats ─────────────────────────────────────────────
  const dimMap = new Map<ReviewDimension, DimensionStats>();
  for (const dim of ALL_DIMENSIONS) {
    dimMap.set(dim, {
      dimension: dim,
      total: 0,
      looksRight: 0,
      flagged: 0,
      overrides: 0,
      agreementRate: null,
    });
  }

  // ── Per-reviewer stats ──────────────────────────────────────────────
  const reviewerMap = new Map<string, ReviewerStats>();

  // ── Unique-set trackers ─────────────────────────────────────────────
  const eventSet = new Set<string>();
  const reviewerSet = new Set<string>();

  for (const r of rows) {
    eventSet.add(r.event_id);
    reviewerSet.add(r.reviewer);

    // Defensive: an unknown dimension (vocab drift, manual SQL insert) is
    // bucketed but doesn't crash. ALL_DIMENSIONS pre-seeds the known set;
    // unknowns get their own entry.
    if (!dimMap.has(r.dimension)) {
      dimMap.set(r.dimension, {
        dimension: r.dimension,
        total: 0,
        looksRight: 0,
        flagged: 0,
        overrides: 0,
        agreementRate: null,
      });
    }
    const dimRow = dimMap.get(r.dimension)!;
    dimRow.total += 1;
    if (r.verdict === 'looks_right') dimRow.looksRight += 1;
    else if (r.verdict === 'flagged') dimRow.flagged += 1;
    else if (r.verdict === 'override') dimRow.overrides += 1;

    let revRow = reviewerMap.get(r.reviewer);
    if (!revRow) {
      revRow = {
        reviewer: r.reviewer,
        total: 0,
        looksRight: 0,
        flagged: 0,
        overrides: 0,
      };
      reviewerMap.set(r.reviewer, revRow);
    }
    revRow.total += 1;
    if (r.verdict === 'looks_right') revRow.looksRight += 1;
    else if (r.verdict === 'flagged') revRow.flagged += 1;
    else if (r.verdict === 'override') revRow.overrides += 1;
  }

  // Compute agreement rate per dimension. Definition: looksRight / total.
  // A reviewer's flag or override = disagreement, so the inverse measures
  // how often the AI was correct out of the gate. Includes overrides as
  // disagreements because the reviewer felt the AI's value was wrong
  // enough to manually replace it.
  for (const stats of dimMap.values()) {
    stats.agreementRate = stats.total > 0 ? stats.looksRight / stats.total : null;
  }

  // Sort dimensions to put low-agreement ones first (they need attention).
  // Dimensions with no data sink to the bottom.
  const perDimension = Array.from(dimMap.values()).sort((a, b) => {
    if (a.total === 0 && b.total === 0) return 0;
    if (a.total === 0) return 1;
    if (b.total === 0) return -1;
    return (a.agreementRate ?? 0) - (b.agreementRate ?? 0);
  });

  const perReviewer = Array.from(reviewerMap.values()).sort((a, b) => b.total - a.total);

  // Recent activity — first 20 (already newest-first from query)
  const recentActivity: CalibrationActivityRow[] = rows.slice(0, 20).map((r) => ({
    id: r.id,
    event_id: r.event_id,
    dimension: r.dimension,
    reviewer: r.reviewer,
    verdict: r.verdict,
    note: r.note,
    reviewed_at: r.reviewed_at,
    event_title: r.event?.title ?? null,
    event_slug: r.event?.slug ?? null,
  }));

  timer.success(
    `Loaded ${rows.length} reviews across ${eventSet.size} events / ${reviewerSet.size} reviewers`,
  );

  return {
    totalReviews: rows.length,
    uniqueEvents: eventSet.size,
    uniqueReviewers: reviewerSet.size,
    perDimension,
    perReviewer,
    recentActivity,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Helper for the page to format an agreement rate as a colored band label.
 * Pure — usable from any client component. Bands match what a reviewer would
 * intuit: green ≥75%, amber 50-75%, red <50%, gray for n/a.
 */
export function agreementBand(
  rate: number | null,
): { label: string; tone: 'green' | 'amber' | 'red' | 'gray' } {
  if (rate === null) return { label: 'n/a', tone: 'gray' };
  const pct = Math.round(rate * 100);
  if (pct >= 75) return { label: `${pct}%`, tone: 'green' };
  if (pct >= 50) return { label: `${pct}%`, tone: 'amber' };
  return { label: `${pct}%`, tone: 'red' };
}

// Re-export verdict typing so the page doesn't need to import from two places.
export type { ReviewVerdict };
