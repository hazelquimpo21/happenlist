/**
 * EVENT SHAPE — single source of truth.
 *
 * Every event in Happenlist is exactly one of three shapes: Single,
 * Recurring, Collection. See:
 *   - /CLAUDE.md → "Event Shapes — Canonical Model"
 *   - /docs/event-shapes-onepager.md
 *
 * Used by: get-events.ts (feed filter), EventCard (badge), admin shape
 * wizard (planned), scraper save path (save-event.ts).
 *
 * If you change these definitions, update both docs above AND the scraper
 * mirror in `happenlist_scraper/backend/lib/event-shapes.js` (planned).
 */

export type EventShape = 'single' | 'recurring' | 'collection';

/** Minimal event signal set needed to detect shape. */
export interface ShapeInput {
  series_id?: string | null;
  parent_event_id?: string | null;
  child_event_count?: number | null;
}

/**
 * Classify an event by its DB signals.
 *
 * Rules:
 *   - A row with `parent_event_id` set, or `child_event_count > 0`,
 *     belongs to a Collection (child or parent, respectively).
 *   - A row with `series_id` set is part of a Recurring group.
 *   - Otherwise it's a Single. "Ongoing" (exhibit, happy hour) is a
 *     Single variant — see `isOngoingSingle()` in hours-schema.ts.
 *
 * Collection takes precedence over Recurring because a child event
 * can both belong to a festival AND (in the future) be tied to a
 * recurring instance template. Today this overlap is not modeled but
 * the precedence matches the intended admin UX.
 */
export function getEventShape(input: ShapeInput): EventShape {
  if (input.parent_event_id) return 'collection';
  if ((input.child_event_count ?? 0) > 0) return 'collection';
  if (input.series_id) return 'recurring';
  return 'single';
}
