/**
 * EXTEND SERIES INSTANCES
 * =======================
 * Per-series wrapper around materializeFutureInstances. Decides:
 *   - whether to run (buffer gate) based on call site,
 *   - what date to anchor on (day after the latest existing instance),
 *   - what template to clone (the latest existing instance),
 *   - what end conditions to honor (count, date, MAX cap).
 *
 * Two call sites:
 *   - GET /api/cron/extend-recurring-series (gateOnBuffer=true): only extend
 *     when fewer than MIN_RECURRING_BUFFER future instances remain.
 *   - PATCH /api/superadmin/series/[id] (gateOnBuffer=false): always run
 *     after the operator changes recurrence_rule, so they get immediate
 *     materialization feedback.
 *
 * Coupling:
 *   - Insertion goes through src/data/series/materialize-instances.ts.
 *   - End-condition heuristics mirror what the helper interprets — keep
 *     RecurrenceRule semantics consistent across the two files.
 *
 * @module data/series/extend-series
 */

import { materializeFutureInstances } from './materialize-instances';
import {
  MIN_RECURRING_BUFFER,
  MAX_RECURRING_GENERATION,
} from '@/lib/constants/series-limits';
import type { RecurrenceRule } from '@/lib/supabase/types';

export type ExtendSeriesStatus =
  | 'extended'         // generated 1+ new instances
  | 'sufficient'       // futureCount >= buffer; nothing to do (gateOnBuffer=true only)
  | 'exhausted_count'  // hit end_count
  | 'exhausted_date'   // past end_date
  | 'at_max_cap'       // hit MAX_RECURRING_GENERATION
  | 'no_template'      // series has zero existing instances to clone from
  | 'no_rule'          // series has no recurrence_rule
  | 'error';

export interface ExtendSeriesInput {
  id: string;
  title: string;
  recurrence_rule: RecurrenceRule | null | unknown;
  // end_date carried from the series row in case the rule lacks an end_date
  // but the row was capped manually at some point. Currently unused — kept
  // for future use.
  end_date?: string | null;
}

export interface ExtendSeriesOptions {
  /**
   * If true, skip when futureCount >= MIN_RECURRING_BUFFER.
   * Cron uses this; the interactive PATCH route does not.
   */
  gateOnBuffer?: boolean;
  /**
   * Source label written to events.source. Must satisfy events_source_check.
   * Admin-driven paths use 'manual'; cron uses 'api'. Defaults to 'manual'.
   */
  source?: 'manual' | 'scraper' | 'user_submission' | 'api' | 'import';
}

export interface ExtendSeriesResult {
  seriesId: string;
  title: string;
  status: ExtendSeriesStatus;
  futureCount: number;
  generated: number;
  reason?: string;
}

/**
 * Top up a single series' instance set per its recurrence_rule.
 * Idempotent: pre-filtering inside materializeFutureInstances skips dates
 * already present, and the partial unique index on
 * (series_id, start_datetime) is the DB backstop.
 */
export async function extendSeriesInstances(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  series: ExtendSeriesInput,
  options: ExtendSeriesOptions = {}
): Promise<ExtendSeriesResult> {
  const { gateOnBuffer = false, source = 'manual' } = options;

  const rule = series.recurrence_rule as RecurrenceRule | null;
  if (!rule || !(rule as Partial<RecurrenceRule>).frequency) {
    return {
      seriesId: series.id,
      title: series.title,
      status: 'no_rule',
      futureCount: 0,
      generated: 0,
      reason: 'series has no usable recurrence_rule',
    };
  }

  const todayIso = new Date().toISOString();

  // Count future, non-cancelled instances
  const { count: futureCount, error: countErr } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('series_id', series.id)
    .neq('status', 'cancelled')
    .gte('start_datetime', todayIso);

  if (countErr) {
    return {
      seriesId: series.id,
      title: series.title,
      status: 'error',
      futureCount: 0,
      generated: 0,
      reason: countErr.message,
    };
  }

  const future = futureCount ?? 0;

  if (gateOnBuffer && future >= MIN_RECURRING_BUFFER) {
    return {
      seriesId: series.id,
      title: series.title,
      status: 'sufficient',
      futureCount: future,
      generated: 0,
    };
  }

  // Total non-cancelled count, for end_count + cap checks
  const { count: totalCount } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('series_id', series.id)
    .neq('status', 'cancelled');
  const total = totalCount ?? 0;

  if (rule.end_type === 'count' && rule.end_count && total >= rule.end_count) {
    return {
      seriesId: series.id,
      title: series.title,
      status: 'exhausted_count',
      futureCount: future,
      generated: 0,
      reason: `total ${total} >= end_count ${rule.end_count}`,
    };
  }

  if (total >= MAX_RECURRING_GENERATION) {
    return {
      seriesId: series.id,
      title: series.title,
      status: 'at_max_cap',
      futureCount: future,
      generated: 0,
      reason: `total ${total} >= MAX ${MAX_RECURRING_GENERATION}`,
    };
  }

  // Find latest existing non-cancelled instance — used as both template and anchor.
  // (We anchor on day-after-latest so the rule generates net-new dates.)
  const { data: latestRows, error: latestErr } = await supabase
    .from('events')
    .select('*')
    .eq('series_id', series.id)
    .neq('status', 'cancelled')
    .not('instance_date', 'is', null)
    .order('instance_date', { ascending: false })
    .limit(1);

  if (latestErr) {
    return {
      seriesId: series.id,
      title: series.title,
      status: 'error',
      futureCount: future,
      generated: 0,
      reason: latestErr.message,
    };
  }

  const latest = latestRows?.[0];
  if (!latest) {
    return {
      seriesId: series.id,
      title: series.title,
      status: 'no_template',
      futureCount: future,
      generated: 0,
      reason: 'series has no existing instances to clone',
    };
  }

  if (rule.end_type === 'date' && rule.end_date && latest.instance_date >= rule.end_date) {
    return {
      seriesId: series.id,
      title: series.title,
      status: 'exhausted_date',
      futureCount: future,
      generated: 0,
      reason: `latest ${latest.instance_date} >= end_date ${rule.end_date}`,
    };
  }

  // Anchor on the day AFTER latest so the rule produces net-new dates only.
  const anchor = new Date(latest.instance_date + 'T00:00:00');
  anchor.setDate(anchor.getDate() + 1);
  const anchorDate = anchor.toISOString().split('T')[0];

  // Next sequence number
  const { data: maxSeqRows } = await supabase
    .from('events')
    .select('series_sequence')
    .eq('series_id', series.id)
    .order('series_sequence', { ascending: false, nullsFirst: false })
    .limit(1);
  const startingSequence = (maxSeqRows?.[0]?.series_sequence ?? 0) + 1;

  const result = await materializeFutureInstances(supabase, {
    seriesId: series.id,
    recurrenceRule: rule,
    fromDate: anchorDate,
    template: latest,
    startingSequence,
    excludeFromDate: false,
    source,
  });

  if (result.error) {
    return {
      seriesId: series.id,
      title: series.title,
      status: 'error',
      futureCount: future,
      generated: 0,
      reason: result.error,
    };
  }

  // Refresh series end_date if we extended forward
  if (result.generatedDates.length > 0) {
    const newLast = result.generatedDates[result.generatedDates.length - 1];
    await supabase
      .from('series')
      .update({
        end_date: newLast,
        total_sessions: total + result.generatedCount,
      })
      .eq('id', series.id);
  }

  return {
    seriesId: series.id,
    title: series.title,
    status: result.hitMaxCap ? 'at_max_cap' : (result.generatedCount > 0 ? 'extended' : 'sufficient'),
    futureCount: future,
    generated: result.generatedCount,
  };
}
