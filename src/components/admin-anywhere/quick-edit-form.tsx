'use client';

/**
 * QUICK EDIT FORM
 * ===============
 * Form fields for quick event editing.
 *
 * Editable fields:
 * - Title
 * - Short description
 * - Full description
 * - Start/end datetime
 * - Pricing (type, low, high, free)
 * - Ticket URL
 * - Status
 * - Edit notes (for audit log)
 *
 * @module components/admin-anywhere/quick-edit-form
 */

import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Save,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  MapPin,
  User,
  Search,
  Layers,
} from 'lucide-react';
import { StatusBadgeSelect } from './status-badge-select';
import { useAdminEdit } from '@/hooks/use-admin-edit';
import type { AdminToolbarEvent } from './admin-toolbar';
import { GOOD_FOR_TAGS } from '@/types';
import { createLogger } from '@/lib/utils/logger';

// ============================================================================
// LOGGER
// ============================================================================

const logger = createLogger('QuickEditForm');

// ============================================================================
// TYPES
// ============================================================================

interface QuickEditFormProps {
  /** Event data to edit */
  event: AdminToolbarEvent;
  /** Callback when save is successful */
  onSaveSuccess: () => void;
  /** Callback when cancel is clicked */
  onCancel: () => void;
}

/**
 * Form state for quick edit
 */
interface FormState {
  title: string;
  short_description: string;
  description: string;
  start_datetime: string;
  end_datetime: string;
  is_all_day: boolean;
  price_type: string;
  price_low: string;
  price_high: string;
  is_free: boolean;
  ticket_url: string;
  // External links (added 2026-01-06)
  website_url: string;
  instagram_url: string;
  facebook_url: string;
  registration_url: string;
  // Good For audience tags
  good_for: string[];
  status: string;
  notes: string;
}

// ============================================================================
// PRICE TYPES
// ============================================================================

const PRICE_TYPES = [
  { value: 'free', label: 'Free' },
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'range', label: 'Price Range' },
  { value: 'varies', label: 'Varies' },
  { value: 'donation', label: 'Donation / Pay What You Can' },
];

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format a date string for datetime-local input
 */
function formatDateTimeLocal(dateString: string | null): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return format(date, "yyyy-MM-dd'T'HH:mm");
  } catch {
    return '';
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * QuickEditForm - Form fields for quick event editing
 *
 * Contains all the editable fields in a compact layout.
 * Uses the useAdminEdit hook for API calls.
 *
 * @example
 * ```tsx
 * <QuickEditForm
 *   event={event}
 *   onSaveSuccess={() => router.refresh()}
 *   onCancel={() => setIsOpen(false)}
 * />
 * ```
 */
export function QuickEditForm({
  event,
  onSaveSuccess,
  onCancel,
}: QuickEditFormProps) {
  // -------------------------------------------------------------------------
  // FORM STATE
  // -------------------------------------------------------------------------

  const [formState, setFormState] = useState<FormState>({
    title: event.title || '',
    short_description: event.short_description || '',
    description: event.description || '',
    start_datetime: formatDateTimeLocal(event.start_datetime),
    end_datetime: formatDateTimeLocal(event.end_datetime),
    is_all_day: event.is_all_day || false,
    price_type: event.price_type || 'free',
    price_low: event.price_low?.toString() || '',
    price_high: event.price_high?.toString() || '',
    is_free: event.is_free || false,
    ticket_url: event.ticket_url || '',
    // External links
    website_url: event.website_url || '',
    instagram_url: event.instagram_url || '',
    facebook_url: event.facebook_url || '',
    registration_url: event.registration_url || '',
    // Good For audience tags
    good_for: event.good_for || [],
    status: event.status || 'draft',
    notes: '',
  });

  // Venue state
  const [selectedVenue, setSelectedVenue] = useState(event.location);
  const [venueQuery, setVenueQuery] = useState('');
  const [venueResults, setVenueResults] = useState<{ id: string; name: string; address_line: string | null; city: string; state: string | null; venue_type: string }[]>([]);
  const [isSearchingVenue, setIsSearchingVenue] = useState(false);
  const [showVenueSearch, setShowVenueSearch] = useState(false);

  // Organizer state
  const [selectedOrganizer, setSelectedOrganizer] = useState(event.organizer);
  const [organizerQuery, setOrganizerQuery] = useState('');
  const [organizerResults, setOrganizerResults] = useState<{ id: string; name: string; slug: string; website_url: string | null }[]>([]);
  const [isSearchingOrganizer, setIsSearchingOrganizer] = useState(false);
  const [showOrganizerSearch, setShowOrganizerSearch] = useState(false);

  // Series occurrence scope
  type OccurrenceScope = 'single' | 'all' | 'future';
  const [occurrenceScope, setOccurrenceScope] = useState<OccurrenceScope>('single');

  // -------------------------------------------------------------------------
  // API HOOK
  // -------------------------------------------------------------------------

  const { updateEvent, updateStatus, deleteEvent, isLoading, error, success } =
    useAdminEdit(event.id);

  // -------------------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------------------

  /**
   * Handle input changes
   */
  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const { name, value, type } = e.target;
      const checked = (e.target as HTMLInputElement).checked;

      setFormState((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    },
    []
  );

  /**
   * Handle status change (from StatusBadgeSelect)
   */
  const handleStatusChange = useCallback((newStatus: string) => {
    setFormState((prev) => ({ ...prev, status: newStatus }));
  }, []);

  /**
   * Handle venue search
   */
  const handleVenueSearch = useCallback(async (query: string) => {
    setVenueQuery(query);
    if (query.length < 2) { setVenueResults([]); return; }
    setIsSearchingVenue(true);
    try {
      const res = await fetch(`/api/submit/venues/search?q=${encodeURIComponent(query)}&limit=8`);
      const data = await res.json();
      if (data.success) setVenueResults(data.venues);
      else setVenueResults([]);
    } catch { setVenueResults([]); }
    finally { setIsSearchingVenue(false); }
  }, []);

  /**
   * Handle organizer search
   */
  const handleOrganizerSearch = useCallback(async (query: string) => {
    setOrganizerQuery(query);
    if (query.length < 2) { setOrganizerResults([]); return; }
    setIsSearchingOrganizer(true);
    try {
      const res = await fetch(`/api/submit/organizers/search?q=${encodeURIComponent(query)}&limit=8`);
      const data = await res.json();
      if (data.success) setOrganizerResults(data.organizers);
      else setOrganizerResults([]);
    } catch { setOrganizerResults([]); }
    finally { setIsSearchingOrganizer(false); }
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.info('Submitting quick edit form');

    // Build updates object with only changed fields
    const updates: Record<string, unknown> = {};

    if (formState.title !== event.title) {
      updates.title = formState.title;
    }
    if (formState.short_description !== (event.short_description || '')) {
      updates.short_description = formState.short_description;
    }
    if (formState.description !== (event.description || '')) {
      updates.description = formState.description;
    }

    // Handle datetime
    if (formState.start_datetime) {
      const newStartDatetime = new Date(formState.start_datetime).toISOString();
      if (newStartDatetime !== event.start_datetime) {
        updates.start_datetime = newStartDatetime;
        updates.instance_date = formState.start_datetime.split('T')[0];
      }
    }

    if (formState.end_datetime) {
      const newEndDatetime = new Date(formState.end_datetime).toISOString();
      if (newEndDatetime !== event.end_datetime) {
        updates.end_datetime = newEndDatetime;
      }
    }

    if (formState.is_all_day !== event.is_all_day) {
      updates.is_all_day = formState.is_all_day;
    }

    // Handle pricing
    if (formState.price_type !== event.price_type) {
      updates.price_type = formState.price_type;
    }
    // is_free is auto-computed from price_type (generated column)
    if (formState.price_type !== 'free') {
      const priceLow = formState.price_low
        ? parseFloat(formState.price_low)
        : null;
      const priceHigh = formState.price_high
        ? parseFloat(formState.price_high)
        : null;

      if (priceLow !== event.price_low) updates.price_low = priceLow;
      if (priceHigh !== event.price_high) updates.price_high = priceHigh;
    }

    if (formState.ticket_url !== (event.ticket_url || '')) {
      updates.ticket_url = formState.ticket_url;
    }

    // Handle external links
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

    // Handle good_for
    const originalGoodFor = (event.good_for || []).slice().sort().join(',');
    const newGoodFor = formState.good_for.slice().sort().join(',');
    if (newGoodFor !== originalGoodFor) {
      updates.good_for = formState.good_for;
    }

    // Handle venue change
    const currentLocationId = event.location_id || null;
    const newLocationId = selectedVenue?.id || null;
    if (newLocationId !== currentLocationId) {
      updates.location_id = newLocationId;
    }

    // Handle organizer change
    const currentOrganizerId = event.organizer_id || null;
    const newOrganizerId = selectedOrganizer?.id || null;
    if (newOrganizerId !== currentOrganizerId) {
      updates.organizer_id = newOrganizerId;
    }

    // Handle status change separately
    const statusChanged = formState.status !== event.status;
    const fieldsChanged = Object.keys(updates).length > 0;

    if (!statusChanged && !fieldsChanged) {
      logger.debug('No changes to save');
      return;
    }

    let success = true;

    // Update status if changed
    if (statusChanged) {
      const statusResult = await updateStatus(
        formState.status,
        formState.notes || `Status changed to ${formState.status}`
      );
      if (!statusResult) {
        success = false;
      }
    }

    // Update other fields if changed
    if (fieldsChanged && success) {
      const updateResult = await updateEvent(
        updates,
        formState.notes || 'Quick edit update',
        event.series_id && occurrenceScope !== 'single' ? occurrenceScope : undefined
      );
      if (!updateResult) {
        success = false;
      }
    }

    if (success) {
      logger.success('Event updated successfully');
      onSaveSuccess();
    }
  };

  /**
   * Handle delete
   */
  const handleDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${event.title}"?\n\nThis can be undone from the admin panel.`
      )
    ) {
      return;
    }

    const reason = window.prompt('Reason for deletion (optional):') || '';
    const result = await deleteEvent(reason);

    if (result) {
      onSaveSuccess();
    }
  };

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------

  const showPriceFields =
    !formState.is_free &&
    formState.price_type !== 'free' &&
    formState.price_type !== 'varies';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ------------------------------------------------------------------ */}
      {/* Status messages */}
      {/* ------------------------------------------------------------------ */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-sage/20 border border-sage/30 rounded-lg text-sage text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>Changes saved successfully!</span>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Title */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-charcoal mb-1.5"
        >
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formState.title}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none"
          placeholder="Event title..."
          required
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Short Description */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <label
          htmlFor="short_description"
          className="block text-sm font-medium text-charcoal mb-1.5"
        >
          Short Description
          <span className="text-stone font-normal ml-1">(for cards)</span>
        </label>
        <textarea
          id="short_description"
          name="short_description"
          value={formState.short_description}
          onChange={handleChange}
          rows={2}
          maxLength={160}
          className="w-full px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none resize-none"
          placeholder="Brief description..."
        />
        <p className="text-xs text-stone mt-1">
          {formState.short_description.length}/160 characters
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Full Description */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-charcoal mb-1.5"
        >
          Full Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formState.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none resize-y"
          placeholder="Detailed event description..."
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Date & Time */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="start_datetime"
            className="block text-sm font-medium text-charcoal mb-1.5"
          >
            Start
          </label>
          <input
            type="datetime-local"
            id="start_datetime"
            name="start_datetime"
            value={formState.start_datetime}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="end_datetime"
            className="block text-sm font-medium text-charcoal mb-1.5"
          >
            End <span className="text-stone font-normal">(optional)</span>
          </label>
          <input
            type="datetime-local"
            id="end_datetime"
            name="end_datetime"
            value={formState.end_datetime}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none text-sm"
          />
        </div>
      </div>

      {/* All Day checkbox */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          name="is_all_day"
          checked={formState.is_all_day}
          onChange={handleChange}
          className="w-4 h-4 rounded border-sand text-coral focus:ring-coral"
        />
        <span className="text-sm text-charcoal">All-day event</span>
      </label>

      {/* ------------------------------------------------------------------ */}
      {/* Pricing */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <label
          htmlFor="price_type"
          className="block text-sm font-medium text-charcoal mb-1.5"
        >
          Pricing
        </label>
        <div className="flex items-center gap-3">
          <select
            id="price_type"
            name="price_type"
            value={formState.price_type}
            onChange={handleChange}
            className="flex-1 px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none"
          >
            {PRICE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="is_free"
              checked={formState.is_free}
              onChange={handleChange}
              className="w-4 h-4 rounded border-sand text-sage focus:ring-sage"
            />
            <span className="text-sm text-charcoal">Free</span>
          </label>
        </div>

        {showPriceFields && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label
                htmlFor="price_low"
                className="block text-xs text-stone mb-1"
              >
                {formState.price_type === 'range' ? 'Min Price' : 'Price'} ($)
              </label>
              <input
                type="number"
                id="price_low"
                name="price_low"
                value={formState.price_low}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none"
                placeholder="0.00"
              />
            </div>
            {formState.price_type === 'range' && (
              <div>
                <label
                  htmlFor="price_high"
                  className="block text-xs text-stone mb-1"
                >
                  Max Price ($)
                </label>
                <input
                  type="number"
                  id="price_high"
                  name="price_high"
                  value={formState.price_high}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none"
                  placeholder="0.00"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Ticket URL */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <label
          htmlFor="ticket_url"
          className="block text-sm font-medium text-charcoal mb-1.5"
        >
          Ticket URL <span className="text-stone font-normal">(optional)</span>
        </label>
        <input
          type="url"
          id="ticket_url"
          name="ticket_url"
          value={formState.ticket_url}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none"
          placeholder="https://tickets.example.com"
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* External Links */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-4 bg-cream/50 rounded-lg border border-sand/50">
        <p className="text-sm font-medium text-charcoal mb-3">
          🔗 External Links <span className="text-stone font-normal">(optional)</span>
        </p>
        <div className="space-y-3">
          {/* Website URL */}
          <div>
            <label
              htmlFor="website_url"
              className="block text-xs text-stone mb-1"
            >
              🌐 Event Website
            </label>
            <input
              type="url"
              id="website_url"
              name="website_url"
              value={formState.website_url}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none text-sm"
              placeholder="https://myevent.com"
            />
          </div>

          {/* Registration URL */}
          <div>
            <label
              htmlFor="registration_url"
              className="block text-xs text-stone mb-1"
            >
              📝 Registration / RSVP URL
            </label>
            <input
              type="url"
              id="registration_url"
              name="registration_url"
              value={formState.registration_url}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none text-sm"
              placeholder="https://rsvp.example.com"
            />
          </div>

          {/* Instagram URL */}
          <div>
            <label
              htmlFor="instagram_url"
              className="block text-xs text-stone mb-1"
            >
              📸 Instagram
            </label>
            <input
              type="url"
              id="instagram_url"
              name="instagram_url"
              value={formState.instagram_url}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none text-sm"
              placeholder="https://instagram.com/event"
            />
          </div>

          {/* Facebook URL */}
          <div>
            <label
              htmlFor="facebook_url"
              className="block text-xs text-stone mb-1"
            >
              📘 Facebook Event
            </label>
            <input
              type="url"
              id="facebook_url"
              name="facebook_url"
              value={formState.facebook_url}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none text-sm"
              placeholder="https://facebook.com/events/123"
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Good For Tags */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-4 bg-cream/50 rounded-lg border border-sand/50">
        <p className="text-sm font-medium text-charcoal mb-3">
          Good For <span className="text-stone font-normal">(select all that apply)</span>
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
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isSelected
                    ? `${tag.color} ring-2 ring-offset-1 ring-current`
                    : 'bg-sand/50 text-stone hover:bg-sand'
                }`}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
        {formState.good_for.length > 0 && (
          <p className="text-xs text-stone mt-2">
            {formState.good_for.length} selected
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Venue / Location */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-3 bg-cream/50 rounded-lg border border-sand/50">
        <p className="text-sm font-medium text-charcoal mb-2">
          Venue / Location
        </p>

        {selectedVenue && !showVenueSearch && (
          <div className="flex items-start justify-between gap-2 p-2 bg-sage/10 border border-sage/30 rounded-lg">
            <div className="flex items-start gap-2 min-w-0">
              <MapPin className="w-4 h-4 text-sage mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-charcoal truncate">{selectedVenue.name}</p>
                <p className="text-xs text-stone truncate">
                  {selectedVenue.address_line && `${selectedVenue.address_line}, `}
                  {selectedVenue.city}
                  {selectedVenue.state && `, ${selectedVenue.state}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button type="button" onClick={() => setShowVenueSearch(true)} className="text-xs text-coral hover:text-coral/80">Change</button>
              <button type="button" onClick={() => setSelectedVenue(null)} className="text-xs text-stone hover:text-charcoal">Clear</button>
            </div>
          </div>
        )}

        {!selectedVenue && !showVenueSearch && (
          <button type="button" onClick={() => setShowVenueSearch(true)}
            className="w-full p-2 border border-dashed border-sand rounded-lg hover:border-coral hover:bg-coral/5 transition-colors text-left text-sm text-stone">
            No venue selected - click to search
          </button>
        )}

        {showVenueSearch && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone">Search venues</span>
              <button type="button" onClick={() => { setShowVenueSearch(false); setVenueQuery(''); setVenueResults([]); }} className="text-xs text-stone hover:text-charcoal">Cancel</button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone" />
              <input type="text" value={venueQuery} onChange={(e) => handleVenueSearch(e.target.value)} placeholder="Type venue name..."
                className="w-full pl-8 pr-8 py-1.5 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none text-sm" autoFocus />
              {isSearchingVenue && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone animate-spin" />}
            </div>
            {venueResults.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {venueResults.map((v) => (
                  <button key={v.id} type="button" onClick={() => { setSelectedVenue(v as typeof selectedVenue); setShowVenueSearch(false); setVenueQuery(''); setVenueResults([]); }}
                    className="w-full p-2 rounded-lg border border-sand bg-warm-white hover:border-coral text-left text-sm">
                    <p className="font-medium text-charcoal truncate">{v.name}</p>
                    <p className="text-xs text-stone truncate">{v.address_line && `${v.address_line}, `}{v.city}</p>
                  </button>
                ))}
              </div>
            )}
            {venueQuery.length >= 2 && !isSearchingVenue && venueResults.length === 0 && (
              <p className="text-xs text-stone text-center py-2">No venues found</p>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Organizer */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-3 bg-cream/50 rounded-lg border border-sand/50">
        <p className="text-sm font-medium text-charcoal mb-2">
          Organizer
        </p>

        {selectedOrganizer && !showOrganizerSearch && (
          <div className="flex items-start justify-between gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2 min-w-0">
              <User className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-charcoal truncate">{selectedOrganizer.name}</p>
                {selectedOrganizer.website_url && (
                  <p className="text-xs text-stone truncate">{selectedOrganizer.website_url}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button type="button" onClick={() => setShowOrganizerSearch(true)} className="text-xs text-coral hover:text-coral/80">Change</button>
              <button type="button" onClick={() => setSelectedOrganizer(null)} className="text-xs text-stone hover:text-charcoal">Clear</button>
            </div>
          </div>
        )}

        {!selectedOrganizer && !showOrganizerSearch && (
          <button type="button" onClick={() => setShowOrganizerSearch(true)}
            className="w-full p-2 border border-dashed border-sand rounded-lg hover:border-coral hover:bg-coral/5 transition-colors text-left text-sm text-stone">
            No organizer selected - click to search
          </button>
        )}

        {showOrganizerSearch && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone">Search organizers</span>
              <button type="button" onClick={() => { setShowOrganizerSearch(false); setOrganizerQuery(''); setOrganizerResults([]); }} className="text-xs text-stone hover:text-charcoal">Cancel</button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone" />
              <input type="text" value={organizerQuery} onChange={(e) => handleOrganizerSearch(e.target.value)} placeholder="Type organizer name..."
                className="w-full pl-8 pr-8 py-1.5 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none text-sm" autoFocus />
              {isSearchingOrganizer && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone animate-spin" />}
            </div>
            {organizerResults.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {organizerResults.map((o) => (
                  <button key={o.id} type="button" onClick={() => { setSelectedOrganizer(o as typeof selectedOrganizer); setShowOrganizerSearch(false); setOrganizerQuery(''); setOrganizerResults([]); }}
                    className="w-full flex items-start gap-2 p-2 rounded-lg border border-sand bg-warm-white hover:border-coral text-left text-sm">
                    <User className="w-3.5 h-3.5 text-stone mt-0.5 flex-shrink-0" />
                    <p className="font-medium text-charcoal truncate">{o.name}</p>
                  </button>
                ))}
              </div>
            )}
            {organizerQuery.length >= 2 && !isSearchingOrganizer && organizerResults.length === 0 && (
              <p className="text-xs text-stone text-center py-2">No organizers found</p>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Category (read-only in quick edit, shows current) */}
      {/* ------------------------------------------------------------------ */}
      {event.category && (
        <div className="p-3 bg-cream/50 rounded-lg border border-sand/50">
          <p className="text-sm font-medium text-charcoal mb-1">Category</p>
          <p className="text-sm text-stone">{event.category.name} <span className="text-xs">(use Full Edit to change)</span></p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Series Occurrence Scope */}
      {/* ------------------------------------------------------------------ */}
      {event.series_id && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Layers className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">Part of a Series</p>
              {event.series_title && (
                <p className="text-xs text-blue-600">{event.series_title}</p>
              )}
              <div className="mt-2 space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="scope" value="single" checked={occurrenceScope === 'single'} onChange={() => setOccurrenceScope('single')}
                    className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500" />
                  <span className="text-xs text-blue-800">This occurrence only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="scope" value="all" checked={occurrenceScope === 'all'} onChange={() => setOccurrenceScope('all')}
                    className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500" />
                  <span className="text-xs text-blue-800">All occurrences in series</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="scope" value="future" checked={occurrenceScope === 'future'} onChange={() => setOccurrenceScope('future')}
                    className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500" />
                  <span className="text-xs text-blue-800">This and future occurrences</span>
                </label>
              </div>
              {occurrenceScope !== 'single' && (
                <p className="text-xs text-blue-600 mt-1.5">Date/time changes only apply to this occurrence.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Status */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1.5">
          Status
        </label>
        <StatusBadgeSelect
          value={formState.status}
          onChange={handleStatusChange}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Edit Notes */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-charcoal mb-1.5"
        >
          Edit Notes{' '}
          <span className="text-stone font-normal">(for audit log)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formState.notes}
          onChange={handleChange}
          rows={2}
          className="w-full px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none resize-none"
          placeholder="Why are you making these changes?"
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Action Buttons */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between pt-4 border-t border-sand">
        {/* Delete button */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>

        {/* Save/Cancel buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-stone hover:text-charcoal rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-coral hover:bg-coral/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
