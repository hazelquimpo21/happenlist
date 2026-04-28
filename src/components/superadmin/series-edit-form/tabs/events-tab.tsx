/**
 * Events tab — wraps the existing SeriesEventManager.
 * Thin pass-through. The manager owns its own load/add/remove flow.
 *
 * @module components/superadmin/series-edit-form/tabs/events-tab
 */
'use client';

import { SeriesEventManager } from '../../series-event-manager';

interface Props {
  seriesId: string;
}

export function EventsTab({ seriesId }: Props) {
  return <SeriesEventManager seriesId={seriesId} />;
}
