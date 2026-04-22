/**
 * =============================================================================
 * TRENDING EVENT FETCHERS — feeds for the homepage TabbedDiscovery panel
 * =============================================================================
 *
 * Three thin wrappers over getEvents() that return the lists used by the
 * Popular / New / This weekend tabs. Each returns the top N upcoming events
 * filtered to a rolling window and sorted appropriately.
 *
 * Design choices (per B1 plan, 2026-04-22):
 *   - Popular uses `heart_count DESC` (existing `popular` sort in getEvents).
 *     event_views is still baking (was sparse as of 2026-04-13); once it hits
 *     volume we can introduce a trending-by-views sort. The intermediate rank
 *     `hearts DESC, created_at DESC` is handled server-side by the `popular`
 *     sort + the date filter.
 *   - New uses `newest` (created_at DESC) within the next 30 days — excludes
 *     events that are already past, which would otherwise dominate a pure
 *     created_at sort on a freshly-scraped batch.
 *   - Weekend uses the shorthand date range from when-shorthands.ts.
 *
 * All three collapse series: the homepage doesn't want a series clogging the
 * tab with one event repeated 20 times.
 *
 * Cross-file coupling:
 *   - src/data/events/get-events.ts — the underlying query
 *   - src/components/homepage/tabbed-discovery.tsx — UI consumer
 *   - src/components/events/filters/b1/when-shorthands.ts — weekend range
 * =============================================================================
 */

import { getEvents } from './get-events';
import type { EventCard } from '@/types';
import { shorthandToRange } from '@/components/events/filters/b1/when-shorthands';

/** Add N days to a Date without mutating. */
function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Popular: top events by hearts in a rolling 14-day future window.
 * Falls back to a wider window if the curated window returns too few rows
 * (useful early in the data lifecycle when heart counts are sparse).
 */
export async function getPopularEvents(limit = 4): Promise<EventCard[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = addDays(today, 13);

  const primary = await getEvents({
    dateRange: { start: toYmd(today), end: toYmd(end) },
    page: 1,
    limit,
    orderBy: 'popular',
    collapseSeries: true,
  });

  if (primary.events.length >= limit) {
    console.log(`[trending:popular] returned ${primary.events.length} events (14-day window)`);
    return primary.events;
  }

  console.log(
    `[trending:popular] primary returned ${primary.events.length}, falling back to newest`
  );
  // Fallback: newest upcoming (30 days). Keeps the tab populated while hearts
  // data is still sparse — better to show ANY list than an empty slot.
  const fallback = await getEvents({
    dateRange: { start: toYmd(today), end: toYmd(addDays(today, 29)) },
    page: 1,
    limit,
    orderBy: 'newest',
    collapseSeries: true,
  });
  return fallback.events;
}

/**
 * New: most recently added events in the next 30 days.
 * Filters out past events so a newly-scraped concert from last week doesn't
 * land at the top of "New".
 */
export async function getNewEvents(limit = 4): Promise<EventCard[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = addDays(today, 29);

  const { events } = await getEvents({
    dateRange: { start: toYmd(today), end: toYmd(end) },
    page: 1,
    limit,
    orderBy: 'newest',
    collapseSeries: true,
  });
  console.log(`[trending:new] returned ${events.length} events`);
  return events;
}

/**
 * This weekend: uses the same "this-weekend" shorthand the When popover
 * computes. Single source of truth for what "weekend" means.
 */
export async function getThisWeekendEvents(limit = 4): Promise<EventCard[]> {
  const range = shorthandToRange('this-weekend');
  const { events } = await getEvents({
    dateRange: { start: range.dateFrom, end: range.dateTo },
    page: 1,
    limit,
    orderBy: 'date-asc',
    collapseSeries: true,
  });
  console.log(
    `[trending:weekend] returned ${events.length} events for ${range.dateFrom}..${range.dateTo}`
  );
  return events;
}
