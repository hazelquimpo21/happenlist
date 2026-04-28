/**
 * Who section
 * ============
 * Organizer picker. Wraps OrganizerPicker; `selectedOrganizer` state
 * lives in the parent because handleSave diffs against organizer_id.
 *
 * @module components/superadmin/event-edit-form/sections/who-section
 */
'use client';

import { OrganizerPicker } from '../organizer-picker';
import type { OrganizerSearchResult } from '../helpers';

interface Props {
  selectedOrganizer: OrganizerSearchResult | null;
  onChange: (next: OrganizerSearchResult | null) => void;
}

export function WhoSection({ selectedOrganizer, onChange }: Props) {
  return <OrganizerPicker initialOrganizer={selectedOrganizer} onChange={onChange} />;
}
