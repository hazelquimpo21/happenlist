/**
 * Save handler for SuperadminEventEditForm
 * ==========================================
 * Pure business logic for diffing FormState vs. the original event and
 * issuing the right API calls. Extracted from index.tsx so the component
 * stays a thin orchestrator.
 *
 * Responsibilities:
 *   - Diff every editable field against the saved record
 *   - Convert local datetime strings → ISO at America/Chicago semantics
 *   - Parse numeric prices, treat empty strings as null
 *   - Order-insensitive compare for tag arrays
 *   - JSON compare for `hours`
 *   - Two HTTP calls in sequence: /status (when status changed), then /
 *
 * @module components/superadmin/event-edit-form/save-event-changes
 */
import type { AdminEventDetails } from '@/data/admin/get-admin-event';
import type { FormState, OccurrenceScope, VenueSearchResult, OrganizerSearchResult } from './helpers';

interface SaveContext {
  event: AdminEventDetails;
  formState: FormState;
  selectedVenue: VenueSearchResult | null;
  selectedOrganizer: OrganizerSearchResult | null;
  notes: string;
  occurrenceScope: OccurrenceScope;
}

export interface SaveOutcome {
  /** No-op outcome — nothing changed from the saved record. */
  noChanges: boolean;
  /** True if the new occurrenceScope applied the edit beyond a single instance. */
  appliedToSeries: boolean;
}

const arraysEqual = (a: string[], b: string[]) =>
  a.slice().sort().join(',') === b.slice().sort().join(',');

/**
 * Build the PATCH body for an event edit. Returns the updates record and
 * a hint about whether anything actually changed (vs the saved event).
 */
export function buildEventUpdates(ctx: SaveContext): {
  updates: Record<string, unknown>;
  statusChanged: boolean;
  hasFieldUpdates: boolean;
} {
  const { event, formState, selectedVenue, selectedOrganizer } = ctx;
  const updates: Record<string, unknown> = {};

  if (formState.title !== event.title) updates.title = formState.title;
  if (formState.description !== (event.description || '')) {
    updates.description = formState.description;
  }
  if (formState.short_description !== (event.short_description || '')) {
    updates.short_description = formState.short_description;
  }

  if (formState.start_datetime) {
    const newStart = new Date(formState.start_datetime).toISOString();
    if (newStart !== event.start_datetime) {
      updates.start_datetime = newStart;
      updates.instance_date = formState.start_datetime.split('T')[0];
    }
  }

  if (formState.end_datetime) {
    const newEnd = new Date(formState.end_datetime).toISOString();
    if (newEnd !== event.end_datetime) updates.end_datetime = newEnd;
  }

  if (formState.is_all_day !== event.is_all_day) {
    updates.is_all_day = formState.is_all_day;
  }
  if (formState.price_type !== event.price_type) {
    updates.price_type = formState.price_type;
  }
  if (formState.ticket_url !== (event.ticket_url || '')) {
    updates.ticket_url = formState.ticket_url;
  }

  if (formState.price_type !== 'free') {
    const priceLow = formState.price_low ? parseFloat(formState.price_low) : null;
    const priceHigh = formState.price_high ? parseFloat(formState.price_high) : null;
    if (priceLow !== event.price_low) updates.price_low = priceLow;
    if (priceHigh !== event.price_high) updates.price_high = priceHigh;
  }

  if (formState.website_url !== (event.website_url || '')) {
    updates.website_url = formState.website_url || null;
  }
  if (formState.instagram_url !== (event.instagram_url || '')) {
    updates.instagram_url = formState.instagram_url || null;
  }
  if (formState.facebook_url !== (event.facebook_url || '')) {
    updates.facebook_url = formState.facebook_url || null;
  }
  if (formState.registration_url !== (event.registration_url || '')) {
    updates.registration_url = formState.registration_url || null;
  }

  if (!arraysEqual(formState.good_for, event.good_for || [])) {
    updates.good_for = formState.good_for;
  }

  // Tagging-expansion fields. Empty UI value → null so the CHECK constraints
  // on social_mode / energy_needed don't trip.
  const evAccess = (event as { accessibility_tags?: string[] | null }).accessibility_tags || [];
  if (!arraysEqual(formState.accessibility_tags, evAccess)) {
    updates.accessibility_tags = formState.accessibility_tags;
  }
  const evSensory = (event as { sensory_tags?: string[] | null }).sensory_tags || [];
  if (!arraysEqual(formState.sensory_tags, evSensory)) {
    updates.sensory_tags = formState.sensory_tags;
  }
  const evLeaveWith = (event as { leave_with?: string[] | null }).leave_with || [];
  if (!arraysEqual(formState.leave_with, evLeaveWith)) {
    updates.leave_with = formState.leave_with;
  }
  const evSocial = (event as { social_mode?: string | null }).social_mode || '';
  if (formState.social_mode !== evSocial) {
    updates.social_mode = formState.social_mode || null;
  }
  const evEnergy = (event as { energy_needed?: string | null }).energy_needed || '';
  if (formState.energy_needed !== evEnergy) {
    updates.energy_needed = formState.energy_needed || null;
  }
  const evMusic = (event as { music_genres?: string[] | null }).music_genres || [];
  if (!arraysEqual(formState.music_genres, evMusic)) {
    updates.music_genres = formState.music_genres;
  }

  if (formState.image_url !== (event.image_url || '')) {
    updates.image_url = formState.image_url || null;
  }

  if (formState.category_id !== (event.category_id || '')) {
    updates.category_id = formState.category_id || null;
  }

  const currentLocationId = event.location_id || null;
  const newLocationId = selectedVenue?.id || null;
  if (newLocationId !== currentLocationId) updates.location_id = newLocationId;

  const currentOrganizerId = event.organizer_id || null;
  const newOrganizerId = selectedOrganizer?.id || null;
  if (newOrganizerId !== currentOrganizerId) updates.organizer_id = newOrganizerId;

  // Hours — JSON compare against stable stringification.
  const rawExistingHours = (event as { hours?: unknown }).hours ?? null;
  const existingHoursJson = rawExistingHours == null ? '' : JSON.stringify(rawExistingHours);
  const newHoursJson = formState.hours == null ? '' : JSON.stringify(formState.hours);
  if (existingHoursJson !== newHoursJson) updates.hours = formState.hours;

  const currentParentId =
    (event as { parent_event_id?: string | null }).parent_event_id || '';
  const nextParentId = formState.parent_event_id.trim();
  if (currentParentId !== nextParentId) {
    updates.parent_event_id = nextParentId || null;
  }

  return {
    updates,
    statusChanged: formState.status !== event.status,
    hasFieldUpdates: Object.keys(updates).length > 0,
  };
}

/**
 * Issue the actual save HTTP calls. Throws on non-OK response.
 */
export async function saveEventChanges(ctx: SaveContext): Promise<SaveOutcome> {
  const { event, formState, notes, occurrenceScope } = ctx;
  const { updates, statusChanged, hasFieldUpdates } = buildEventUpdates(ctx);

  if (!statusChanged && !hasFieldUpdates) {
    return { noChanges: true, appliedToSeries: false };
  }

  if (statusChanged) {
    const res = await fetch(`/api/superadmin/events/${event.id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: formState.status,
        notes: notes || `Status changed to ${formState.status}`,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || data.error || 'Failed to update status');
    }
  }

  if (hasFieldUpdates) {
    const res = await fetch(`/api/superadmin/events/${event.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        updates,
        notes: notes || 'Superadmin edit',
        ...(event.series_id && occurrenceScope !== 'single'
          ? { applyToSeries: true, occurrenceScope }
          : {}),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || data.error || 'Failed to save changes');
    }
  }

  return {
    noChanges: false,
    appliedToSeries: !!event.series_id && occurrenceScope !== 'single',
  };
}
