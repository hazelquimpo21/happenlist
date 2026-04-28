/**
 * Danger tab — wraps the existing SeriesDangerZone.
 * Thin pass-through. The danger zone owns its own three confirmation
 * flows (cancel-only, cancel+cascade, delete+cascade).
 *
 * @module components/superadmin/series-edit-form/tabs/danger-tab
 */
'use client';

import { SeriesDangerZone } from '../../series-danger-zone';

interface Props {
  seriesId: string;
  seriesTitle: string;
  seriesStatus: string;
  seriesDeleted: boolean;
  totalEventsCount: number;
  activeEventsCount: number;
}

export function DangerTab(props: Props) {
  return <SeriesDangerZone {...props} />;
}
