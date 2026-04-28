'use client';

/**
 * SUPERADMIN EVENT EDIT FORM
 * =============================
 * A comprehensive form for superadmins to edit any event.
 *
 * SPLIT NOTE (2026-04-22): originally a single 1900-line file at
 * `event-edit-form.tsx`. Now broken into focused sub-components living in
 * this directory:
 *
 *   - ./helpers.ts                    constants, types (FormState, FormStatus,
 *                                     OccurrenceScope, VenueSearchResult,
 *                                     OrganizerSearchResult), formatDateTimeLocal
 *   - ./use-heuristic-event.ts        live HeuristicEvent snapshot hook
 *   - ./recheck-section.tsx           "Re-fetch from source" banner
 *   - ./signal-tags-panel.tsx         accessibility / sensory / leave_with /
 *                                     music genres + social_mode + energy_needed
 *   - ./venue-picker.tsx              venue search + selection (self-contained UI)
 *   - ./organizer-picker.tsx          organizer search + selection (self-contained UI)
 *   - ./series-management-panel.tsx   make-recurring / attach-series / detach-series
 *                                     state machine + handlers
 *   - ./series-occurrences-scope.tsx  scope selector (single / all / future)
 *   - ./delete-confirm-modal.tsx      delete confirmation modal
 *
 * The save-diff logic, status state, top-level layout, and the catch-all
 * field handlers (title, descriptions, dates, pricing, links, good_for,
 * category, status, notes, hours, parent_event_id, deletion/restore) stay
 * here.
 *
 * @module components/superadmin/event-edit-form
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Trash2,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EventImageEditor } from '../event-image-editor';
import { FieldHeuristicFlag } from '../field-heuristic-flag';
import { checkField } from '@/lib/admin/field-heuristics';
import { GOOD_FOR_TAGS } from '@/types';
import { ShapeBadge } from '@/components/admin/shape-badge';
import { HoursEditor } from '@/components/admin/hours-editor';
import { ParentEventPicker } from '@/components/admin/parent-event-picker';
import { CollectionChildrenPanel } from '@/components/admin/collection-children-panel';
import { isHours } from '@/lib/events/hours-schema';
import type { AdminEventDetails } from '@/data/admin/get-admin-event';
import {
  STATUS_OPTIONS,
  PRICE_TYPES,
  formatDateTimeLocal,
  type FormStatus,
  type OccurrenceScope,
  type FormState,
  type VenueSearchResult,
  type OrganizerSearchResult,
} from './helpers';
import { useHeuristicEvent } from './use-heuristic-event';
import { RecheckSection } from './recheck-section';
import { SignalTagsPanel } from './signal-tags-panel';
import { VenuePicker } from './venue-picker';
import { OrganizerPicker } from './organizer-picker';
import { SeriesManagementPanel } from './series-management-panel';
import { SeriesOccurrencesScope } from './series-occurrences-scope';
import { DeleteConfirmModal } from './delete-confirm-modal';

interface EventEditFormProps {
  event: AdminEventDetails;
  categories?: { id: string; name: string; slug: string; icon: string | null }[];
  onSuccess?: () => void;
}

export function SuperadminEventEditForm({ event, categories = [], onSuccess }: EventEditFormProps) {
  const router = useRouter();

  // Form state
  const [formState, setFormState] = useState<FormState>({
    title: event.title || '',
    description: event.description || '',
    short_description: event.short_description || '',
    start_datetime: event.start_datetime ? formatDateTimeLocal(event.start_datetime) : '',
    end_datetime: event.end_datetime ? formatDateTimeLocal(event.end_datetime) : '',
    is_all_day: event.is_all_day || false,
    price_type: event.price_type || 'free',
    price_low: event.price_low?.toString() || '',
    price_high: event.price_high?.toString() || '',
    is_free: event.is_free || false,
    ticket_url: event.ticket_url || '',
    website_url: event.website_url || '',
    instagram_url: event.instagram_url || '',
    facebook_url: event.facebook_url || '',
    registration_url: event.registration_url || '',
    good_for: event.good_for || [],
    accessibility_tags: ((event as { accessibility_tags?: string[] | null }).accessibility_tags) || [],
    sensory_tags: ((event as { sensory_tags?: string[] | null }).sensory_tags) || [],
    leave_with: ((event as { leave_with?: string[] | null }).leave_with) || [],
    social_mode: ((event as { social_mode?: string | null }).social_mode) || '',
    energy_needed: ((event as { energy_needed?: string | null }).energy_needed) || '',
    music_genres: ((event as { music_genres?: string[] | null }).music_genres) || [],
    image_url: event.image_url || '',
    category_id: event.category_id || '',
    status: event.status || 'draft',
    hours: (() => {
      const raw = (event as { hours?: unknown }).hours;
      return isHours(raw) ? raw : null;
    })(),
    parent_event_id: ((event as { parent_event_id?: string | null }).parent_event_id) || '',
  });

  const heuristicEvent = useHeuristicEvent(event, formState);

  // UI state
  const [status, setStatus] = useState<FormStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [justDeleted, setJustDeleted] = useState(false);
  const [notes, setNotes] = useState('');
  const [occurrenceScope, setOccurrenceScope] = useState<OccurrenceScope>('single');

  // Venue / organizer selection — owned here because handleSave diffs against
  // the original event.location_id / event.organizer_id. The pickers manage
  // their own search UI state and bubble selection changes via onChange.
  const [selectedVenue, setSelectedVenue] = useState<VenueSearchResult | null>(
    event.location
      ? {
          id: event.location.id,
          name: event.location.name,
          address_line: event.location.address_line,
          city: event.location.city,
          state: event.location.state,
          venue_type: event.location.venue_type,
          category: null,
          rating: null,
          review_count: 0,
          latitude: null,
          longitude: null,
        }
      : null
  );
  const [selectedOrganizer, setSelectedOrganizer] = useState<OrganizerSearchResult | null>(
    event.organizer
      ? {
          id: event.organizer.id,
          name: event.organizer.name,
          slug: event.organizer.slug,
          logo_url: event.organizer.logo_url,
          website_url: event.organizer.website_url,
          description: null,
        }
      : null
  );

  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (status === 'saved' || status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  const resetStatus = useCallback(() => {
    if (status === 'saved' || status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  // ============================================================================
  // SAVE CHANGES
  // ============================================================================

  const handleSave = async () => {
    setStatus('saving');
    setStatusMessage('Saving changes...');

    try {
      const updates: Record<string, unknown> = {};

      if (formState.title !== event.title) updates.title = formState.title;
      if (formState.description !== (event.description || '')) updates.description = formState.description;
      if (formState.short_description !== (event.short_description || '')) updates.short_description = formState.short_description;

      // Datetime
      if (formState.start_datetime) {
        const newStartDatetime = new Date(formState.start_datetime).toISOString();
        if (newStartDatetime !== event.start_datetime) {
          updates.start_datetime = newStartDatetime;
          updates.instance_date = formState.start_datetime.split('T')[0];
        }
      }

      if (formState.end_datetime) {
        const newEndDatetime = new Date(formState.end_datetime).toISOString();
        if (newEndDatetime !== event.end_datetime) updates.end_datetime = newEndDatetime;
      }

      if (formState.is_all_day !== event.is_all_day) updates.is_all_day = formState.is_all_day;
      if (formState.price_type !== event.price_type) updates.price_type = formState.price_type;
      if (formState.ticket_url !== (event.ticket_url || '')) updates.ticket_url = formState.ticket_url;

      // Price
      if (formState.price_type !== 'free') {
        const priceLow = formState.price_low ? parseFloat(formState.price_low) : null;
        const priceHigh = formState.price_high ? parseFloat(formState.price_high) : null;
        if (priceLow !== event.price_low) updates.price_low = priceLow;
        if (priceHigh !== event.price_high) updates.price_high = priceHigh;
      }

      // External links
      if (formState.website_url !== (event.website_url || '')) updates.website_url = formState.website_url || null;
      if (formState.instagram_url !== (event.instagram_url || '')) updates.instagram_url = formState.instagram_url || null;
      if (formState.facebook_url !== (event.facebook_url || '')) updates.facebook_url = formState.facebook_url || null;
      if (formState.registration_url !== (event.registration_url || '')) updates.registration_url = formState.registration_url || null;

      // Good For tags
      const originalGoodFor = (event.good_for || []).slice().sort().join(',');
      const newGoodFor = formState.good_for.slice().sort().join(',');
      if (newGoodFor !== originalGoodFor) {
        updates.good_for = formState.good_for;
      }

      // Tagging expansion (Stage 4) — array fields use sorted-join compare,
      // enums compare empty-string-as-null. Empty UI value → DB null so the
      // CHECK constraint on social_mode / energy_needed isn't tripped.
      const arrayDiffer = (a: string[], b: string[]) =>
        a.slice().sort().join(',') !== b.slice().sort().join(',');

      const evAccess = ((event as { accessibility_tags?: string[] | null }).accessibility_tags) || [];
      if (arrayDiffer(formState.accessibility_tags, evAccess)) {
        updates.accessibility_tags = formState.accessibility_tags;
      }

      const evSensory = ((event as { sensory_tags?: string[] | null }).sensory_tags) || [];
      if (arrayDiffer(formState.sensory_tags, evSensory)) {
        updates.sensory_tags = formState.sensory_tags;
      }

      const evLeaveWith = ((event as { leave_with?: string[] | null }).leave_with) || [];
      if (arrayDiffer(formState.leave_with, evLeaveWith)) {
        updates.leave_with = formState.leave_with;
      }

      const evSocialMode = ((event as { social_mode?: string | null }).social_mode) || '';
      if (formState.social_mode !== evSocialMode) {
        updates.social_mode = formState.social_mode || null;
      }

      const evEnergyNeeded = ((event as { energy_needed?: string | null }).energy_needed) || '';
      if (formState.energy_needed !== evEnergyNeeded) {
        updates.energy_needed = formState.energy_needed || null;
      }

      const evMusicGenres = ((event as { music_genres?: string[] | null }).music_genres) || [];
      if (arrayDiffer(formState.music_genres, evMusicGenres)) {
        updates.music_genres = formState.music_genres;
      }

      // Image
      if (formState.image_url !== (event.image_url || '')) {
        updates.image_url = formState.image_url || null;
      }

      // Category
      if (formState.category_id !== (event.category_id || '')) {
        updates.category_id = formState.category_id || null;
      }

      // Venue/location
      const currentLocationId = event.location_id || null;
      const newLocationId = selectedVenue?.id || null;
      if (newLocationId !== currentLocationId) {
        updates.location_id = newLocationId;
      }

      // Organizer
      const currentOrganizerId = event.organizer_id || null;
      const newOrganizerId = selectedOrganizer?.id || null;
      if (newOrganizerId !== currentOrganizerId) {
        updates.organizer_id = newOrganizerId;
      }

      // Event shape v4 — hours (Ongoing-Single signal) + parent_event_id
      // (Collection linkage). Compared against stable JSON for hours, string
      // for parent_event_id. Hours edits go through the HoursEditor component
      // which always emits Hours | null; we serialize to JSON only for diff.
      const rawExistingHours = (event as { hours?: unknown }).hours ?? null;
      const existingHoursJson = rawExistingHours == null ? '' : JSON.stringify(rawExistingHours);
      const newHoursJson = formState.hours == null ? '' : JSON.stringify(formState.hours);
      if (existingHoursJson !== newHoursJson) {
        updates.hours = formState.hours; // null or Hours object
      }

      const currentParentId = ((event as { parent_event_id?: string | null }).parent_event_id) || '';
      const nextParentId = formState.parent_event_id.trim();
      if (currentParentId !== nextParentId) {
        // Empty string → clear the FK; non-empty → expected to be a UUID.
        // Server-side FK constraint will reject bad values.
        updates.parent_event_id = nextParentId || null;
      }

      // Check if anything changed
      if (Object.keys(updates).length === 0 && formState.status === event.status) {
        setStatus('idle');
        setStatusMessage('No changes to save');
        return;
      }

      // Status change
      if (formState.status !== event.status) {
        const statusResponse = await fetch(`/api/superadmin/events/${event.id}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: formState.status,
            notes: notes || `Status changed to ${formState.status}`,
          }),
        });

        if (!statusResponse.ok) {
          const errorData = await statusResponse.json();
          throw new Error(errorData.message || 'Failed to update status');
        }
      }

      // Field updates
      if (Object.keys(updates).length > 0) {
        const editResponse = await fetch(`/api/superadmin/events/${event.id}`, {
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

        if (!editResponse.ok) {
          const errorData = await editResponse.json();
          throw new Error(errorData.message || 'Failed to save changes');
        }
      }

      setStatus('saved');
      setStatusMessage(event.series_id && occurrenceScope !== 'single'
        ? `Changes saved and applied to ${occurrenceScope === 'all' ? 'all' : 'this and future'} occurrences!`
        : 'Changes saved successfully!');
      setNotes('');

      router.refresh();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Save error:', error);
      setStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Failed to save changes');
    }
  };

  // ============================================================================
  // DELETE / RESTORE
  // ============================================================================

  const handleDelete = async () => {
    if (!deleteReason.trim()) {
      setStatusMessage('Please provide a reason for deletion');
      return;
    }

    setStatus('saving');
    setStatusMessage('Deleting event...');

    try {
      const response = await fetch(`/api/superadmin/events/${event.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: deleteReason,
          hardDelete: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete event');
      }

      setStatus('saved');
      setStatusMessage('Event deleted successfully!');
      setShowDeleteConfirm(false);
      setJustDeleted(true);

      setTimeout(() => {
        router.push('/admin/events');
      }, 2000);
    } catch (error) {
      console.error('Delete error:', error);
      setStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Failed to delete event');
    }
  };

  const handleRestore = async () => {
    setStatus('saving');
    setStatusMessage('Restoring event...');

    try {
      const response = await fetch(`/api/superadmin/events/${event.id}/restore`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to restore event');
      }

      setStatus('saved');
      setStatusMessage('Event restored successfully!');
      router.refresh();
    } catch (error) {
      console.error('Restore error:', error);
      setStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Failed to restore event');
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const isDeleted = !!event.deleted_at;

  // Supabase returns the joined count as `child_count: [{ count: N }]`; unwrap
  // defensively so missing/empty relationships degrade to 0.
  const childEventCount = (() => {
    const raw = (event as { child_count?: { count: number }[] | null }).child_count;
    return raw?.[0]?.count ?? 0;
  })();

  return (
    <div className="space-y-6">
      {/* Event shape — live-derived display. Never a user choice; it emerges
          from series_id / parent_event_id / child_event_count / hours. */}
      <div className="flex items-center justify-between bg-pure border border-mist rounded-lg p-3">
        <div className="text-xs text-zinc">Event shape</div>
        <ShapeBadge
          seriesId={(event as { series_id?: string | null }).series_id ?? null}
          parentEventId={formState.parent_event_id || null}
          childEventCount={childEventCount}
          hours={formState.hours}
        />
      </div>

      {/* Deletion success overlay */}
      {justDeleted && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center animate-in fade-in duration-300">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trash2 className="w-6 h-6 text-red-600" />
            <h3 className="font-body text-xl text-red-800 font-bold">Event Deleted</h3>
          </div>
          <p className="text-red-700 text-sm">
            &quot;{event.title}&quot; has been removed. Redirecting to events list...
          </p>
        </div>
      )}

      {/* Existing soft-deleted banner */}
      {isDeleted && !justDeleted && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <Trash2 className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">This event has been deleted</p>
            <p className="text-xs text-red-600 mt-0.5">You can restore it using the button below.</p>
          </div>
        </div>
      )}

      {/* Re-fetch from source (superadmin convenience) — only when we have a
          source_url to rescrape. Hidden on soft-deleted events since they can't
          be edited anyway. */}
      {!isDeleted && !justDeleted && (
        <RecheckSection eventId={event.id} sourceUrl={event.source_url} />
      )}

      {/* Status bar */}
      {status !== 'idle' && !justDeleted && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            status === 'saving'
              ? 'bg-amber-50 border border-amber-200'
              : status === 'saved'
              ? 'bg-emerald/10 border border-sage/30'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {status === 'saving' && <Clock className="w-5 h-5 text-amber-600 animate-spin" />}
          {status === 'saved' && <CheckCircle className="w-5 h-5 text-emerald" />}
          {status === 'error' && <AlertTriangle className="w-5 h-5 text-red-600" />}
          <span
            className={`text-sm font-medium ${
              status === 'saving' ? 'text-amber-800' : status === 'saved' ? 'text-emerald' : 'text-red-800'
            }`}
          >
            {statusMessage}
          </span>
        </div>
      )}

      {/* Form */}
      <div className="bg-pure border border-mist rounded-lg p-6 space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-ink mb-2">
            Event Title
            <FieldHeuristicFlag flag={checkField(heuristicEvent, 'title')} />
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formState.title}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none"
            placeholder="Enter event title..."
          />
        </div>

        {/* Image */}
        <div className="p-4 bg-white/50 rounded-lg border border-mist/50">
          <EventImageEditor
            eventId={event.id}
            value={formState.image_url}
            onChange={(next) => {
              setFormState((prev) => ({ ...prev, image_url: next }));
              resetStatus();
            }}
          />
        </div>

        {/* Short Description */}
        <div>
          <label htmlFor="short_description" className="block text-sm font-medium text-ink mb-2">
            Short Description
            <span className="text-zinc font-normal ml-2">(for cards, max 160 chars)</span>
            <FieldHeuristicFlag flag={checkField(heuristicEvent, 'short_description')} />
          </label>
          <textarea
            id="short_description"
            name="short_description"
            value={formState.short_description}
            onChange={handleInputChange}
            rows={2}
            maxLength={160}
            className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none resize-none"
            placeholder="Brief description for event cards..."
          />
          <p className="text-xs text-zinc mt-1">
            {formState.short_description.length}/160 characters
          </p>
        </div>

        {/* Full Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-ink mb-2">
            Full Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formState.description}
            onChange={handleInputChange}
            rows={6}
            className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none resize-y"
            placeholder="Full event description..."
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_datetime" className="block text-sm font-medium text-ink mb-2">
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              id="start_datetime"
              name="start_datetime"
              value={formState.start_datetime}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none"
            />
          </div>

          <div>
            <label htmlFor="end_datetime" className="block text-sm font-medium text-ink mb-2">
              End Date & Time
              <span className="text-zinc font-normal ml-2">(optional)</span>
            </label>
            <input
              type="datetime-local"
              id="end_datetime"
              name="end_datetime"
              value={formState.end_datetime}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none"
            />
          </div>
        </div>

        {/* All Day Checkbox */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="is_all_day"
            checked={formState.is_all_day}
            onChange={handleInputChange}
            className="w-5 h-5 rounded border-mist text-blue focus:ring-blue"
          />
          <span className="text-sm text-ink">This is an all-day event</span>
        </label>

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="price_type" className="block text-sm font-medium text-ink mb-2">
              Price Type
              <FieldHeuristicFlag flag={checkField(heuristicEvent, 'price')} />
            </label>
            <select
              id="price_type"
              name="price_type"
              value={formState.price_type}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none"
            >
              {PRICE_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {formState.price_type !== 'free' && formState.price_type !== 'varies' && (
            <>
              <div>
                <label htmlFor="price_low" className="block text-sm font-medium text-ink mb-2">
                  {formState.price_type === 'range' ? 'Min Price ($)' : 'Price ($)'}
                </label>
                <input
                  type="number"
                  id="price_low"
                  name="price_low"
                  value={formState.price_low}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none"
                  placeholder="0.00"
                />
              </div>

              {formState.price_type === 'range' && (
                <div>
                  <label htmlFor="price_high" className="block text-sm font-medium text-ink mb-2">
                    Max Price ($)
                  </label>
                  <input
                    type="number"
                    id="price_high"
                    name="price_high"
                    value={formState.price_high}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none"
                    placeholder="0.00"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Ticket URL */}
        <div>
          <label htmlFor="ticket_url" className="block text-sm font-medium text-ink mb-2">
            Ticket URL
            <span className="text-zinc font-normal ml-2">(optional)</span>
          </label>
          <input
            type="url"
            id="ticket_url"
            name="ticket_url"
            value={formState.ticket_url}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none"
            placeholder="https://..."
          />
        </div>

        {/* External Links */}
        <div className="p-4 bg-white/50 rounded-lg border border-mist/50">
          <p className="text-sm font-medium text-ink mb-3">
            External Links <span className="text-zinc font-normal">(optional)</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="website_url" className="block text-xs text-zinc mb-1">
                Event Website
              </label>
              <input
                type="url"
                id="website_url"
                name="website_url"
                value={formState.website_url}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none text-sm"
                placeholder="https://myevent.com"
              />
            </div>
            <div>
              <label htmlFor="registration_url" className="block text-xs text-zinc mb-1">
                Registration / RSVP URL
              </label>
              <input
                type="url"
                id="registration_url"
                name="registration_url"
                value={formState.registration_url}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none text-sm"
                placeholder="https://rsvp.example.com"
              />
            </div>
            <div>
              <label htmlFor="instagram_url" className="block text-xs text-zinc mb-1">
                Instagram
              </label>
              <input
                type="url"
                id="instagram_url"
                name="instagram_url"
                value={formState.instagram_url}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none text-sm"
                placeholder="https://instagram.com/event"
              />
            </div>
            <div>
              <label htmlFor="facebook_url" className="block text-xs text-zinc mb-1">
                Facebook Event
              </label>
              <input
                type="url"
                id="facebook_url"
                name="facebook_url"
                value={formState.facebook_url}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none text-sm"
                placeholder="https://facebook.com/events/123"
              />
            </div>
          </div>
        </div>

        {/* Good For */}
        <div className="p-4 bg-white/50 rounded-lg border border-mist/50">
          <p className="text-sm font-medium text-ink mb-3">
            Good For <span className="text-zinc font-normal">(select all that apply)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {GOOD_FOR_TAGS.map((tag) => {
              const isSelected = formState.good_for.includes(tag.slug);
              return (
                <button
                  key={tag.slug}
                  type="button"
                  onClick={() => {
                    setFormState((prev) => ({
                      ...prev,
                      good_for: isSelected
                        ? prev.good_for.filter((s) => s !== tag.slug)
                        : [...prev.good_for, tag.slug],
                    }));
                    resetStatus();
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isSelected
                      ? `${tag.color} ring-2 ring-offset-1 ring-current`
                      : 'bg-cloud/50 text-zinc hover:bg-cloud'
                  }`}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
          {formState.good_for.length > 0 && (
            <p className="text-xs text-zinc mt-2">
              {formState.good_for.length} selected
            </p>
          )}
        </div>

        {/* Tagging-expansion signal tags (Stage 4 manual editing) */}
        <SignalTagsPanel
          formState={formState}
          setFormState={setFormState}
          resetStatus={resetStatus}
        />

        {/* Category */}
        {categories.length > 0 && (
          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-ink mb-2">
              Category
              <FieldHeuristicFlag flag={checkField(heuristicEvent, 'category')} />
            </label>
            <div className="relative">
              <select
                id="category_id"
                name="category_id"
                value={formState.category_id}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none appearance-none pr-10"
              >
                <option value="">No category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc pointer-events-none" />
            </div>
          </div>
        )}

        {/* Venue */}
        <VenuePicker
          initialVenue={selectedVenue}
          onChange={(next) => {
            setSelectedVenue(next);
            resetStatus();
          }}
        />

        {/* Organizer */}
        <OrganizerPicker
          initialOrganizer={selectedOrganizer}
          onChange={(next) => {
            setSelectedOrganizer(next);
            resetStatus();
          }}
        />

        {/* Series management — Make Recurring / Attach / Detach */}
        <SeriesManagementPanel
          eventId={event.id}
          seriesId={event.series_id}
          seriesSequence={event.series_sequence}
          startDatetime={event.start_datetime}
        />

        {/* Series occurrences scope (only when in a series) */}
        {event.series_id && (
          <SeriesOccurrencesScope
            seriesId={event.series_id}
            value={occurrenceScope}
            onChange={setOccurrenceScope}
          />
        )}

        {/* Weekly hours — for always-on Singles (exhibits, happy hour) */}
        <HoursEditor
          value={formState.hours}
          onChange={(next) => setFormState((prev) => ({ ...prev, hours: next }))}
        />

        {/* Parent event — links this event as a child of a Collection parent */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-pink-600" />
            <p className="text-sm font-medium text-ink">Parent Event</p>
          </div>
          <p className="text-xs text-zinc">
            Link this to a Collection parent (festival, season, conference).
            Children are hidden from the main feed and display on the parent&apos;s page.
          </p>
          <ParentEventPicker
            value={formState.parent_event_id}
            currentEventId={event.id}
            initialParent={(() => {
              const raw = (event as { parent_event?: { id: string; title: string; slug: string } | null }).parent_event;
              return raw ?? null;
            })()}
            onChange={(nextId) => setFormState((prev) => ({ ...prev, parent_event_id: nextId }))}
          />
          {childEventCount > 0 && (
            <p className="text-xs text-pink-700">
              This event has <span className="font-semibold">{childEventCount}</span> {childEventCount === 1 ? 'child' : 'children'} — it&apos;s a Collection parent.
            </p>
          )}
        </div>

        {/* Collection children — inline manager. Writes (attach/detach) are
            immediate via PATCH, NOT part of this form's save cycle. */}
        <CollectionChildrenPanel
          parentEventId={event.id}
          initialChildCount={childEventCount}
        />

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-ink mb-2">
            Event Status
          </label>
          <div className="relative">
            <select
              id="status"
              name="status"
              value={formState.status}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none appearance-none pr-10"
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc pointer-events-none" />
          </div>
        </div>

        {/* Notes for audit log */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-ink mb-2">
            Edit Notes
            <span className="text-zinc font-normal ml-2">(for audit log)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none resize-none"
            placeholder="Why are you making these changes? (optional but helpful for records)"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isDeleted ? (
            <Button
              variant="secondary"
              onClick={handleRestore}
              disabled={status === 'saving'}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Restore Event
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={status === 'saving'}
              className="flex items-center gap-2 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete Event
            </Button>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={status === 'saving'}
          className="flex items-center gap-2 bg-blue hover:bg-blue/90 text-white px-6"
        >
          <Save className="w-4 h-4" />
          {status === 'saving' ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          eventTitle={event.title}
          deleteReason={deleteReason}
          onReasonChange={setDeleteReason}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          isSubmitting={status === 'saving'}
        />
      )}
    </div>
  );
}
