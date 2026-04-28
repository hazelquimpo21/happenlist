/**
 * Series & collection section
 * ============================
 * Bundles three structurally different surfaces that all relate to "how
 * this event is connected to other events":
 *
 *   1. SeriesManagementPanel — make recurring / attach / detach
 *   2. SeriesOccurrencesScope — when in a series, scope subsequent saves
 *   3. ParentEventPicker — link as a child of a Collection parent
 *   4. CollectionChildrenPanel — manage children if this IS a Collection
 *
 * @module components/superadmin/event-edit-form/sections/series-collection-section
 */
'use client';

import { Layers } from 'lucide-react';
import { ParentEventPicker } from '@/components/admin/parent-event-picker';
import { CollectionChildrenPanel } from '@/components/admin/collection-children-panel';
import { SeriesManagementPanel } from '../series-management-panel';
import { SeriesOccurrencesScope } from '../series-occurrences-scope';
import type { OccurrenceScope } from '../helpers';
import type { SectionBaseProps } from './types';

interface Props extends SectionBaseProps {
  eventId: string;
  seriesId: string | null | undefined;
  seriesSequence: number | null | undefined;
  startDatetime: string | null | undefined;
  occurrenceScope: OccurrenceScope;
  setOccurrenceScope: (next: OccurrenceScope) => void;
  childEventCount: number;
  initialParentEvent: { id: string; title: string; slug: string } | null;
}

export function SeriesCollectionSection({
  formState,
  setFormState,
  eventId,
  seriesId,
  seriesSequence,
  startDatetime,
  occurrenceScope,
  setOccurrenceScope,
  childEventCount,
  initialParentEvent,
}: Props) {
  return (
    <div className="space-y-5">
      <SeriesManagementPanel
        eventId={eventId}
        seriesId={seriesId}
        seriesSequence={seriesSequence}
        startDatetime={startDatetime}
      />

      {seriesId && (
        <SeriesOccurrencesScope
          seriesId={seriesId}
          value={occurrenceScope}
          onChange={setOccurrenceScope}
        />
      )}

      <div className="space-y-2 pt-3 border-t border-mist/60">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-magenta" />
          <p className="text-sm font-medium text-ink">Parent event</p>
        </div>
        <p className="text-xs text-zinc">
          Link this to a Collection parent (festival, season, conference). Children
          are hidden from the main feed and display on the parent&apos;s page.
        </p>
        <ParentEventPicker
          value={formState.parent_event_id}
          currentEventId={eventId}
          initialParent={initialParentEvent}
          onChange={(nextId) =>
            setFormState((prev) => ({ ...prev, parent_event_id: nextId }))
          }
        />
        {childEventCount > 0 && (
          <p className="text-xs text-magenta">
            This event has{' '}
            <span className="font-semibold">{childEventCount}</span>{' '}
            {childEventCount === 1 ? 'child' : 'children'} — it&apos;s a Collection parent.
          </p>
        )}
      </div>

      <CollectionChildrenPanel
        parentEventId={eventId}
        initialChildCount={childEventCount}
      />
    </div>
  );
}
