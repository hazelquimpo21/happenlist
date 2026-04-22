/**
 * =============================================================================
 * WHEN SHORTHANDS — compute date ranges for B1 picker quick-pick tiles
 * =============================================================================
 *
 * The When popover offers 5 quick-pick tiles + a custom "Pick dates" option:
 *   Today · Tomorrow · This weekend · Next 7 days · Next 30 days · Pick dates
 *
 * Each quick-pick resolves to a concrete (dateFrom, dateTo) ISO date pair
 * (YYYY-MM-DD) before being written to the URL. This keeps the server query
 * pure — getEvents() only ever sees absolute dates, never the shorthand
 * label.
 *
 * We also need the REVERSE: given a (dateFrom, dateTo) pair, decide which
 * shorthand (if any) it represents. Used by the picker to hydrate selection
 * state from the URL.
 *
 * Timezone note — dates here are LOCAL (America/Chicago). "Today" means
 * today in Milwaukee, not UTC. We use plain Date math against local time
 * via toLocalYmd() which formats using the user's system timezone. That's
 * a small drift risk for users browsing from another timezone, but the app's
 * target audience is local to Milwaukee; acceptable for v1.
 *
 * Cross-file coupling:
 *   - segments/when-popover.tsx — UI consumer
 *   - segment-value.ts — uses labelFromRange() to format the picker value line
 * =============================================================================
 */

export type WhenShorthand =
  | 'today'
  | 'tomorrow'
  | 'this-weekend'
  | 'next-7-days'
  | 'next-30-days';

/** Format a Date to YYYY-MM-DD in local time. */
export function toLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Add N days to a Date without mutating the input. */
function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

/**
 * Return the coming Saturday/Sunday. If today IS Sat or Sun, return
 * today as the start (still counts as "this weekend") and the upcoming
 * Sunday as the end.
 */
function getThisWeekend(today: Date): { from: Date; to: Date } {
  const day = today.getDay(); // 0 Sun .. 6 Sat
  if (day === 0) {
    // Sunday — weekend is today only (Sat already past)
    return { from: today, to: today };
  }
  if (day === 6) {
    // Saturday — weekend is today + tomorrow
    return { from: today, to: addDays(today, 1) };
  }
  // Weekday — weekend is upcoming Sat..Sun
  const daysUntilSat = 6 - day;
  const sat = addDays(today, daysUntilSat);
  return { from: sat, to: addDays(sat, 1) };
}

/**
 * Compute the ISO date range for a given shorthand, relative to a reference
 * date (defaults to now). Returns { dateFrom, dateTo } strings.
 */
export function shorthandToRange(
  shorthand: WhenShorthand,
  now: Date = new Date()
): { dateFrom: string; dateTo: string } {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  switch (shorthand) {
    case 'today':
      return { dateFrom: toLocalYmd(today), dateTo: toLocalYmd(today) };
    case 'tomorrow': {
      const t = addDays(today, 1);
      return { dateFrom: toLocalYmd(t), dateTo: toLocalYmd(t) };
    }
    case 'this-weekend': {
      const w = getThisWeekend(today);
      return { dateFrom: toLocalYmd(w.from), dateTo: toLocalYmd(w.to) };
    }
    case 'next-7-days':
      return { dateFrom: toLocalYmd(today), dateTo: toLocalYmd(addDays(today, 6)) };
    case 'next-30-days':
      return { dateFrom: toLocalYmd(today), dateTo: toLocalYmd(addDays(today, 29)) };
  }
}

/**
 * Detect which shorthand (if any) the given date range represents, for
 * hydrating the UI selection. Returns null for custom ranges.
 *
 * Matches exactly — a range that happens to equal the "next 7 days" window
 * only because the user picked those dates manually still hydrates as the
 * shorthand (acceptable — user sees "Next 7 days" highlighted which is
 * still an accurate description of their range).
 */
export function rangeToShorthand(
  dateFrom: string | undefined,
  dateTo: string | undefined,
  now: Date = new Date()
): WhenShorthand | null {
  if (!dateFrom || !dateTo) return null;
  const candidates: WhenShorthand[] = [
    'today',
    'tomorrow',
    'this-weekend',
    'next-7-days',
    'next-30-days',
  ];
  for (const candidate of candidates) {
    const r = shorthandToRange(candidate, now);
    if (r.dateFrom === dateFrom && r.dateTo === dateTo) return candidate;
  }
  return null;
}

export const WHEN_SHORTHAND_LABELS: Record<WhenShorthand, string> = {
  'today': 'Today',
  'tomorrow': 'Tomorrow',
  'this-weekend': 'This weekend',
  'next-7-days': 'Next 7 days',
  'next-30-days': 'Next 30 days',
};

/** Ordered list for rendering the quick-pick tiles. */
export const WHEN_SHORTHANDS: readonly WhenShorthand[] = [
  'today',
  'tomorrow',
  'this-weekend',
  'next-7-days',
  'next-30-days',
] as const;

/**
 * Pretty-print a date range for the Time-of-day popover info card.
 * "Apr 25 – Apr 26" or "Apr 25" for single-day ranges.
 */
export function formatRangeForCard(dateFrom: string, dateTo: string): string {
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  const from = new Date(`${dateFrom}T00:00:00`);
  const to = new Date(`${dateTo}T00:00:00`);
  const fromStr = fmt.format(from);
  const toStr = fmt.format(to);
  if (fromStr === toStr) return fromStr;
  return `${fromStr} – ${toStr}`;
}
