/**
 * =============================================================================
 * TIME-OF-DAY BUCKETS
 * =============================================================================
 *
 * Filter dimension that groups events by the local hour they start. Lets the
 * user say "I want morning things" without picking exact times.
 *
 * Buckets (LOCAL hour, America/Chicago):
 *   - morning      → 5, 6, 7, 8, 9, 10, 11
 *   - afternoon    → 12, 13, 14, 15, 16
 *   - evening      → 17, 18, 19, 20
 *   - late_night   → 21, 22, 23, 0, 1   (wraps midnight)
 *
 * Hours 2, 3, 4 belong to no bucket — almost no events start then, and
 * picking which side to assign them to felt arbitrary. If a real event
 * starts at 3am, it falls outside every filter (acceptable for B1).
 *
 * ⚠️ TIMEZONE GOTCHA — read this before changing anything ⚠️
 *
 * `events.start_datetime` is stored in the database as `timestamptz` in UTC.
 * Milwaukee is America/Chicago, which is UTC-5 (CDT) or UTC-6 (CST). The DST
 * transition introduces a 1-hour shift twice a year.
 *
 * For SQL filtering, you MUST extract the hour in the LOCAL timezone:
 *
 *   EXTRACT(HOUR FROM start_datetime AT TIME ZONE 'America/Chicago')
 *
 * For JS filtering (current B1 implementation, post-fetch), use Intl with
 * an explicit `timeZone: 'America/Chicago'` — see `getLocalHourChicago()`.
 *
 * If you skip the timezone conversion, evening events (UTC 22-25 = local
 * 17-20 CDT or 16-19 CST) will land in the wrong bucket, and the filter
 * will silently return wrong results — the most embarrassing kind of bug.
 *
 * Why post-fetch JS filtering in B1?
 *   - PostgREST cannot filter on a computed expression (no raw SQL in
 *     supabase-js client filters). The two real options are (a) an RPC
 *     function and (b) a generated column — both require a migration.
 *   - B1's scope is the query layer, not migrations. View tracking +
 *     migrations land in B3. We can revisit time-of-day filtering as a
 *     generated column later if perf becomes a concern. For now, the
 *     filter runs in JS after the fetch, on the same page (typically <100
 *     events post-pagination), which is fast enough.
 *
 * The `getTimeOfDaySqlPredicate()` helper exists to document the SQL form
 * we'll move to when the migration lands. It is NOT used by get-events.ts
 * today — it's a forward-compatibility breadcrumb.
 *
 * Cross-file coupling:
 *   - src/data/events/get-events.ts imports `TimeOfDay` and the JS predicate
 *     to filter results post-fetch.
 *   - Future: src/lib/constants/time-of-day-sql.ts (or a migration) when we
 *     promote this to a server-side filter.
 * =============================================================================
 */

/** All time-of-day buckets, in display order. */
export const TIME_OF_DAY_VALUES = ['morning', 'afternoon', 'evening', 'late_night'] as const;

/** Union type for the four buckets. */
export type TimeOfDay = (typeof TIME_OF_DAY_VALUES)[number];

/**
 * Hours that belong to each bucket, in LOCAL America/Chicago time.
 *
 * Edges are inclusive on both sides. Hours 2-4 are intentionally absent
 * (see header comment). `late_night` wraps midnight: 21..23 + 0..1.
 */
export const TIME_OF_DAY_HOURS: Record<TimeOfDay, readonly number[]> = {
  morning: [5, 6, 7, 8, 9, 10, 11],
  afternoon: [12, 13, 14, 15, 16],
  evening: [17, 18, 19, 20],
  late_night: [21, 22, 23, 0, 1],
};

/** Human-readable labels for filter UI chips. */
export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  late_night: 'Late night',
};

/** Optional sublabels showing the hour range, for tooltips / a11y. */
export const TIME_OF_DAY_RANGE_LABELS: Record<TimeOfDay, string> = {
  morning: '5 am – noon',
  afternoon: '12 – 5 pm',
  evening: '5 – 9 pm',
  late_night: '9 pm – 2 am',
};

const TIME_OF_DAY_SET = new Set<string>(TIME_OF_DAY_VALUES);

/** Type guard for URL-param validation — drops invalid values defensively. */
export function isTimeOfDay(value: string): value is TimeOfDay {
  return TIME_OF_DAY_SET.has(value);
}

// -----------------------------------------------------------------------------
// JS PREDICATE (current implementation)
// -----------------------------------------------------------------------------

// Cached Intl formatter — constructing one is non-trivial, and we may call
// this thousands of times per request when filtering large result sets.
const CHICAGO_HOUR_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago',
  hour: 'numeric',
  hour12: false,
});

/**
 * Convert a UTC `timestamptz` string (or Date) to its LOCAL America/Chicago
 * hour (0–23). Handles DST automatically via the Intl API.
 *
 * Example: '2026-04-12T01:30:00Z' → 20 (8 pm CDT the prior evening)
 *
 * Returns NaN for unparseable input — caller should treat NaN as "no match".
 *
 * ⚠️ MIDNIGHT QUIRK: `Intl.DateTimeFormat('en-US', { hour: 'numeric',
 * hour12: false })` returns the string "24" for midnight rather than "0".
 * This is documented behavior of the en-US locale in 24-hour mode (since
 * "0" isn't a valid hour in 12-hour US time, the formatter avoids it).
 * We normalize with `% 24` so midnight comes back as 0, matching the
 * `late_night` bucket which expects 0..1 + 21..23. Without this normalization
 * the late_night wrap-around silently breaks for any event starting at
 * exactly midnight Chicago time.
 */
export function getLocalHourChicago(utcDatetime: string | Date): number {
  const date = typeof utcDatetime === 'string' ? new Date(utcDatetime) : utcDatetime;
  if (Number.isNaN(date.getTime())) return Number.NaN;

  const hourString = CHICAGO_HOUR_FORMATTER.format(date);
  const hour = Number.parseInt(hourString, 10);
  if (Number.isNaN(hour)) return Number.NaN;
  return hour % 24; // Normalize the en-US "24 == midnight" quirk → 0
}

/**
 * Test whether a UTC datetime falls into ANY of the requested buckets.
 *
 * - Empty `buckets` array → returns true (no filter applied).
 * - Invalid datetime → returns false (excluded from results).
 * - Multiple buckets → OR semantics (event matches if it's in any bucket).
 */
export function matchesTimeOfDay(
  utcDatetime: string | Date,
  buckets: readonly TimeOfDay[]
): boolean {
  if (buckets.length === 0) return true;
  const hour = getLocalHourChicago(utcDatetime);
  if (Number.isNaN(hour)) return false;

  for (const bucket of buckets) {
    if (TIME_OF_DAY_HOURS[bucket].includes(hour)) return true;
  }
  return false;
}

// -----------------------------------------------------------------------------
// SQL PREDICATE (forward-compatibility breadcrumb)
// -----------------------------------------------------------------------------

/**
 * Build the SQL predicate string for filtering by time-of-day on the server.
 *
 * NOT USED BY get-events.ts TODAY — see header comment for why we filter
 * post-fetch in B1. This helper exists so the future migration that promotes
 * time-of-day to a server-side filter (RPC function or generated column)
 * has a single source of truth for the predicate, and so any auditor can
 * see the canonical SQL form documented here.
 *
 * Example output for ['morning', 'evening']:
 *   EXTRACT(HOUR FROM start_datetime AT TIME ZONE 'America/Chicago')
 *     IN (5, 6, 7, 8, 9, 10, 11, 17, 18, 19, 20)
 *
 * Returns 'TRUE' for an empty bucket array (no filter).
 */
export function getTimeOfDaySqlPredicate(buckets: readonly TimeOfDay[]): string {
  if (buckets.length === 0) return 'TRUE';

  const hours = new Set<number>();
  for (const bucket of buckets) {
    for (const h of TIME_OF_DAY_HOURS[bucket]) {
      hours.add(h);
    }
  }
  const hourList = [...hours].sort((a, b) => a - b).join(', ');
  return `EXTRACT(HOUR FROM start_datetime AT TIME ZONE 'America/Chicago') IN (${hourList})`;
}
