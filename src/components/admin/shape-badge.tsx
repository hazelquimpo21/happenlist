/**
 * SHAPE BADGE — live display of an event's derived shape.
 *
 * Pure display component. Given the current DB signals, shows one of four
 * pills: Single · Single (Ongoing) · Recurring · Collection.
 *
 * Used by: SuperadminEventEditForm (top of form), admin event list
 * (inline hint), import preview (detection result).
 *
 * Shape is NEVER a user choice — it emerges from field state. See
 * /CLAUDE.md → "Event Shapes — Canonical Model".
 */

'use client';

import { getEventShape } from '@/lib/events/shape';
import { isHours } from '@/lib/events/hours-schema';
import { getShapeMeta } from '@/lib/constants/admin-shape-palette';

interface Props {
  seriesId?: string | null;
  parentEventId?: string | null;
  childEventCount?: number | null;
  hours?: unknown;
  /** Compact variant for list rows; default variant is wider with copy. */
  compact?: boolean;
}

export function ShapeBadge({
  seriesId,
  parentEventId,
  childEventCount,
  hours,
  compact = false,
}: Props) {
  const shape = getEventShape({
    series_id: seriesId,
    parent_event_id: parentEventId,
    child_event_count: childEventCount,
  });
  const hasHours = shape === 'single' && isHours(hours);

  // Map the runtime shape (single | recurring | collection) + hours flag to
  // the canonical 4-key palette in admin-shape-palette.ts.
  const meta = (() => {
    if (shape === 'collection') {
      const isParent = (childEventCount ?? 0) > 0;
      const m = getShapeMeta('collection');
      return {
        ...m,
        sub: isParent ? `${childEventCount} children` : 'Child of another event',
      };
    }
    if (shape === 'recurring') return { ...getShapeMeta('recurring'), sub: 'Part of a series' };
    if (hasHours) return { ...getShapeMeta('single_ongoing'), sub: 'Always-on with weekly hours' };
    return { ...getShapeMeta('single'), sub: 'One date, one event' };
  })();

  const Icon = meta.icon;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${meta.pill}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {meta.label}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${meta.pill}`}>
      <Icon className="w-4 h-4" />
      <div className="flex flex-col">
        <span className="text-sm font-semibold leading-tight">{meta.label}</span>
        <span className="text-xs opacity-80 leading-tight">{meta.sub}</span>
      </div>
    </div>
  );
}
