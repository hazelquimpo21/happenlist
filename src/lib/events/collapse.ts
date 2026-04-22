/**
 * SERIES COLLAPSING — shared helpers.
 *
 * Extracted from src/data/events/get-events.ts so the logic is testable in
 * isolation and reusable from other data-layer paths (search, feed variants).
 *
 * Rule: any event with a `series_id` collapses to the soonest upcoming
 * instance per series. Collection children are excluded from the feed by
 * a separate filter upstream, so they never reach here.
 *
 * See /CLAUDE.md → "Event Shapes — Canonical Model" → "How collapsing works".
 *
 * If you add a new series_type that should NOT collapse, do it here (add to
 * NON_COLLAPSIBLE_SERIES_TYPES) — don't scatter the decision across files.
 */

import type { EventCard } from '@/types';
import type { RecurrenceRule } from '@/lib/supabase/types';

/**
 * Series types that must NOT collapse. Today empty — every series_type in
 * the DB is structurally a recurrence. Kept as a set for clarity and future
 * use (e.g. if we ever reintroduce a `festival` parent series that lists
 * each child date separately).
 */
const NON_COLLAPSIBLE_SERIES_TYPES = new Set<string>();

const DAY_LABELS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday',
] as const;

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Every day',
  weekly: 'Every week',
  biweekly: 'Every 2 weeks',
  monthly: 'Every month',
  yearly: 'Every year',
};

/**
 * Build a human-readable recurrence label from a series recurrence_rule JSON.
 * Examples: "Every Tuesday", "Every other Friday", "Monthly on the 15th".
 * Falls back to a generic label based on series_type if the rule is missing
 * or malformed — we still want to tell the user "this repeats."
 */
export function buildRecurrenceLabel(
  rule: Record<string, unknown> | null,
  seriesType: string | null
): string | null {
  if (!rule) {
    if (seriesType === 'class') return 'Ongoing class';
    if (seriesType === 'workshop') return 'Ongoing workshop';
    return 'Recurring';
  }

  const frequency = rule.frequency as RecurrenceRule['frequency'] | undefined;
  const daysOfWeek = rule.days_of_week as number[] | undefined;
  const dayOfMonth = rule.day_of_month as number | undefined;

  if (frequency === 'weekly' && daysOfWeek?.length === 1) {
    return `Every ${DAY_LABELS[daysOfWeek[0]]}`;
  }
  if (frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 1) {
    const dayNames = daysOfWeek.map((d) => DAY_LABELS[d]);
    return `Every ${dayNames.slice(0, -1).join(', ')} & ${dayNames[dayNames.length - 1]}`;
  }
  if (frequency === 'biweekly' && daysOfWeek?.length === 1) {
    return `Every other ${DAY_LABELS[daysOfWeek[0]]}`;
  }
  if (frequency === 'monthly' && dayOfMonth) {
    return `Monthly on the ${ordinal(dayOfMonth)}`;
  }

  return FREQUENCY_LABELS[frequency ?? ''] || 'Recurring';
}

/** True if an event (with a series_id + series_type) should collapse in feeds. */
export function isCollapsibleSeriesType(seriesType: string | null | undefined): boolean {
  if (!seriesType) return true; // default-on: anything with a series_id collapses
  return !NON_COLLAPSIBLE_SERIES_TYPES.has(seriesType);
}

/**
 * Collapse series instances: keep only the soonest event per series, annotate
 * with recurrence label + count of remaining dates. Events without a
 * `series_id` pass through unchanged.
 *
 * Assumes the input is already sorted by date ascending — the first event
 * per series is the representative.
 */
export function collapseSeriesInstances(events: EventCard[]): EventCard[] {
  const seriesGroups = new Map<string, EventCard[]>();
  const standalone: EventCard[] = [];

  for (const event of events) {
    const sid = event.series_id;
    if (!sid || !isCollapsibleSeriesType(event.series_type)) {
      standalone.push(event);
      continue;
    }

    const group = seriesGroups.get(sid);
    if (group) {
      group.push(event);
    } else {
      seriesGroups.set(sid, [event]);
    }
  }

  const collapsed: EventCard[] = [];
  for (const [, group] of seriesGroups) {
    const representative = { ...group[0] };
    representative.upcoming_count = group.length - 1;
    collapsed.push(representative);
  }

  const merged = [...standalone, ...collapsed];
  merged.sort((a, b) => {
    const da = a.instance_date || a.start_datetime;
    const db = b.instance_date || b.start_datetime;
    return da.localeCompare(db);
  });

  return merged;
}

function ordinal(n: number): string {
  const suffix = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
}
