/**
 * HOURS SCHEMA — weekly availability for "ongoing" Singles.
 *
 * Stored on events.hours as JSONB. An event with `hours` set is a Single
 * with a wide date range acting as an always-on thing: museum exhibit,
 * happy hour, semester-long open studio. See:
 *   - /CLAUDE.md → "Event Shapes — Canonical Model"
 *   - /docs/event-shapes-onepager.md
 *
 * Used by: hours editor (admin, planned), event card renderer (display
 * "Open Tue–Fri 5–7pm"), scraper save path (populates when the source
 * describes weekly hours).
 *
 * Loose runtime validation here, not full Zod — we don't have Zod as a
 * dep yet. If we add Zod later, replace `isHours()` with a parsed schema
 * and keep the same exported type.
 */

/** Abbreviated weekday keys. Monday-first to match the admin UI convention. */
export const HOURS_DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type HoursDayKey = (typeof HOURS_DAY_KEYS)[number];

/** A single open window per day: [open, close] in 24-hour HH:MM. */
export type HoursRange = readonly [string, string];

/** The full weekly pattern. Missing keys = closed that day. Empty array = closed. */
export type Hours = {
  readonly [K in HoursDayKey]?: readonly HoursRange[];
};

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function isTime(v: unknown): v is string {
  return typeof v === 'string' && TIME_RE.test(v);
}

function isRange(v: unknown): v is HoursRange {
  return Array.isArray(v) && v.length === 2 && isTime(v[0]) && isTime(v[1]);
}

/**
 * Runtime check that an unknown value matches the Hours shape.
 * Returns false and logs on first violation. Safe to call with null.
 */
export function isHours(value: unknown): value is Hours {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  for (const [key, ranges] of Object.entries(value as Record<string, unknown>)) {
    if (!HOURS_DAY_KEYS.includes(key as HoursDayKey)) {
      console.warn(`[hours-schema] unknown day key "${key}"`);
      return false;
    }
    if (!Array.isArray(ranges)) return false;
    for (const r of ranges) {
      if (!isRange(r)) return false;
    }
  }
  return true;
}

/**
 * True if an event row should render as "ongoing" — wide date window with
 * a weekly pattern. Callers use this to pick display copy ("Open Tue–Fri
 * 5–7pm" vs "Tuesday 7pm").
 */
export function isOngoingSingle(event: {
  hours?: unknown;
  series_id?: string | null;
  parent_event_id?: string | null;
}): boolean {
  if (event.series_id || event.parent_event_id) return false;
  return isHours(event.hours);
}

/** Display-order list of [day, ranges] pairs for rendering. Monday-first. */
export function hoursToOrderedEntries(
  hours: Hours
): Array<[HoursDayKey, readonly HoursRange[]]> {
  const out: Array<[HoursDayKey, readonly HoursRange[]]> = [];
  for (const key of HOURS_DAY_KEYS) {
    const ranges = hours[key];
    if (ranges && ranges.length > 0) out.push([key, ranges]);
  }
  return out;
}
