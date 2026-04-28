/**
 * Where section
 * ==============
 * Venue picker. Owns no state — wraps the existing VenuePicker which
 * fetches and renders the search UI. The form's `selectedVenue` state
 * lives in index.tsx because handleSave diffs against location_id.
 *
 * @module components/superadmin/event-edit-form/sections/where-section
 */
'use client';

import { VenuePicker } from '../venue-picker';
import type { VenueSearchResult } from '../helpers';

interface Props {
  selectedVenue: VenueSearchResult | null;
  onChange: (next: VenueSearchResult | null) => void;
}

export function WhereSection({ selectedVenue, onChange }: Props) {
  return <VenuePicker initialVenue={selectedVenue} onChange={onChange} />;
}
