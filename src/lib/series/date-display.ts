/**
 * SERIES SCHEDULE DISPLAY
 * =======================
 * Helpers for formatting a series' date range correctly when the series
 * is open-ended (i.e. recurrence_rule.end_type === 'never').
 *
 * Why this exists:
 *   For open-ended recurring series, `series.end_date` is just the latest
 *   *materialized* instance date, not a real end. Displaying it as
 *   "Apr 1 – May 4" reads as "this series ends May 4" — but really the
 *   nightly extend-recurring-series cron will keep adding more dates.
 *   We render those series differently: "From Apr 1 · scheduled thru May 4"
 *   on admin surfaces, and just the recurrence text on public surfaces.
 *
 * Coupling:
 *   - `isSeriesOpenEnded` is the single source-of-truth for the open-ended
 *     classification. Cron skip rules in
 *     src/app/api/cron/extend-recurring-series/route.ts use the same
 *     end_type='never' inference; keep these in sync if either changes.
 *   - The `is_open_ended` field on SeriesCard / AdminSeriesCard is the
 *     pre-computed version of this for the lightweight card payloads,
 *     since those types don't carry the full recurrence_rule.
 *
 * @module lib/series/date-display
 */

import { formatDateRange } from '@/lib/utils/dates';
import { format } from 'date-fns';

/**
 * Inputs that decide how to label the date range. We accept the rule as
 * `unknown` because:
 *   - On the server, it's a JSONB blob shaped like RecurrenceRule.
 *   - Some rows have legacy or partial rules (no end_type). Default those
 *     to "open-ended" — better to under-promise an end than to imply one.
 */
export interface SeriesScheduleInput {
  start_date: string | null | undefined;
  end_date: string | null | undefined;
  recurrence_rule?: unknown;
}

/**
 * True when the series' recurrence rule indicates no fixed end.
 * Treats missing/malformed rules with a recurrence_rule object as open-ended,
 * which is the safer default. Series with no recurrence_rule at all
 * (Collections, Singles) are NOT open-ended — their end_date is real.
 */
export function isSeriesOpenEnded(rule: unknown): boolean {
  if (!rule || typeof rule !== 'object') return false;
  const endType = (rule as { end_type?: string }).end_type;
  return !endType || endType === 'never';
}

/**
 * Pretty-print a single ISO date in "MMM d" form using the local timezone
 * the rest of the app uses (Chicago via toMKE), via formatDateRange's "From"
 * fallback path which is already TZ-correct.
 */
function formatSingle(date: string): string {
  // formatDateRange(date, undefined) → "From MMM d" — strip the prefix.
  return formatDateRange(date, undefined).replace(/^From\s+/, '');
}

/**
 * Date label appropriate for ADMIN surfaces (worklists, admin grids).
 * Open-ended series get an explicit "scheduled thru" so admins can see
 * the materialization horizon and decide whether to extend.
 *
 * @example bounded series:    "Apr 1 – May 4"
 * @example bounded same-day:  "Apr 1"
 * @example open-ended:        "From Apr 1 · scheduled thru May 4"
 * @example open-ended, no end: "From Apr 1"
 */
export function buildAdminScheduleLabel(input: SeriesScheduleInput): string | null {
  const { start_date, end_date } = input;
  if (!start_date && !end_date) return null;

  const openEnded = isSeriesOpenEnded(input.recurrence_rule);

  if (!openEnded) {
    return formatDateRange(start_date ?? undefined, end_date ?? undefined) || null;
  }

  if (!start_date) return null;
  if (!end_date || end_date === start_date) {
    return `From ${formatSingle(start_date)}`;
  }
  return `From ${formatSingle(start_date)} · scheduled thru ${formatSingle(end_date)}`;
}

/**
 * Date label appropriate for PUBLIC surfaces (series cards, detail header).
 * Open-ended series return null — the caller is expected to show the
 * recurrence text ("Every Wednesday at 7pm") instead, which is more
 * useful to a reader than a moving "scheduled thru" horizon.
 */
export function buildPublicScheduleLabel(input: SeriesScheduleInput): string | null {
  if (isSeriesOpenEnded(input.recurrence_rule)) return null;
  const { start_date, end_date } = input;
  if (!start_date && !end_date) return null;
  return formatDateRange(start_date ?? undefined, end_date ?? undefined) || null;
}

// Re-export format util in case downstream needs it; keeps imports focused.
export { format };
