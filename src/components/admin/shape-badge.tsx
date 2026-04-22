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

import { Calendar, Repeat, Layers, Clock } from 'lucide-react';
import { getEventShape } from '@/lib/events/shape';
import { isHours } from '@/lib/events/hours-schema';

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

  const { icon, label, sub, bg, text } = (() => {
    if (shape === 'collection') {
      const isParent = (childEventCount ?? 0) > 0;
      return {
        icon: <Layers className="w-4 h-4" />,
        label: 'Collection',
        sub: isParent ? `${childEventCount} children` : 'Child of another event',
        bg: 'bg-pink-100',
        text: 'text-pink-800',
      };
    }
    if (shape === 'recurring') {
      return {
        icon: <Repeat className="w-4 h-4" />,
        label: 'Recurring',
        sub: 'Part of a series',
        bg: 'bg-purple-100',
        text: 'text-purple-800',
      };
    }
    if (hasHours) {
      return {
        icon: <Clock className="w-4 h-4" />,
        label: 'Single · Ongoing',
        sub: 'Always-on with weekly hours',
        bg: 'bg-teal-100',
        text: 'text-teal-800',
      };
    }
    return {
      icon: <Calendar className="w-4 h-4" />,
      label: 'Single',
      sub: 'One date, one event',
      bg: 'bg-blue-100',
      text: 'text-blue-800',
    };
  })();

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
        {icon}
        {label}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${bg} ${text}`}>
      {icon}
      <div className="flex flex-col">
        <span className="text-sm font-semibold leading-tight">{label}</span>
        <span className="text-xs opacity-80 leading-tight">{sub}</span>
      </div>
    </div>
  );
}
