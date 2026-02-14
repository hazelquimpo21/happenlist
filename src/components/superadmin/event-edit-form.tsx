'use client';

/**
 * SUPERADMIN EVENT EDIT FORM
 * =============================
 * A comprehensive form for superadmins to edit any event.
 *
 * Features:
 * - Edit all event fields (title, description, dates, pricing, links, etc.)
 * - Change venue via search (cross-links to locations DB)
 * - Change organizer via search (cross-links to organizers DB)
 * - Change category via dropdown (cross-links to categories DB)
 * - External links (website, Instagram, Facebook, registration)
 * - Good For audience tags
 * - Apply changes to all series occurrences
 * - Change event status directly
 * - Delete/restore events
 * - Audit trail display
 *
 * @module components/superadmin/event-edit-form
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Save,
  Trash2,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronDown,
  X,
  MapPin,
  Search,
  Star,
  Loader2,
  User,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GOOD_FOR_TAGS } from '@/types';
import type { AdminEventDetails } from '@/data/admin/get-admin-event';

// ============================================================================
// TYPES
// ============================================================================

interface EventEditFormProps {
  event: AdminEventDetails;
  categories?: { id: string; name: string; slug: string; icon: string | null }[];
  onSuccess?: () => void;
}

type FormStatus = 'idle' | 'saving' | 'saved' | 'error';

interface VenueSearchResult {
  id: string;
  name: string;
  address_line: string | null;
  city: string;
  state: string | null;
  venue_type: string;
  category: string | null;
  rating: number | null;
  review_count: number;
  latitude: number | null;
  longitude: number | null;
  similarity_score?: number;
}

interface OrganizerSearchResult {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
}

interface FormState {
  title: string;
  description: string;
  short_description: string;
  start_datetime: string;
  end_datetime: string;
  is_all_day: boolean;
  price_type: string;
  price_low: string;
  price_high: string;
  is_free: boolean;
  ticket_url: string;
  // External links
  website_url: string;
  instagram_url: string;
  facebook_url: string;
  registration_url: string;
  // Audience
  good_for: string[];
  // Category
  category_id: string;
  // Status
  status: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'bg-stone/20 text-stone' },
  { value: 'pending_review', label: 'Pending Review', color: 'bg-amber-100 text-amber-800' },
  { value: 'changes_requested', label: 'Changes Requested', color: 'bg-orange-100 text-orange-800' },
  { value: 'published', label: 'Published', color: 'bg-sage/20 text-sage' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-stone/30 text-stone' },
];

const PRICE_TYPES = [
  { value: 'free', label: 'Free' },
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'range', label: 'Price Range' },
  { value: 'varies', label: 'Varies' },
  { value: 'donation', label: 'Donation' },
  { value: 'per_session', label: 'Per Session' },
];

// ============================================================================
// COMPONENT
// ============================================================================

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
    category_id: event.category_id || '',
    status: event.status || 'draft',
  });

  // UI state
  const [status, setStatus] = useState<FormStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [notes, setNotes] = useState('');
  type OccurrenceScope = 'single' | 'all' | 'future';
  const [occurrenceScope, setOccurrenceScope] = useState<OccurrenceScope>('single');

  // Venue state
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
  const [venueQuery, setVenueQuery] = useState('');
  const [venueResults, setVenueResults] = useState<VenueSearchResult[]>([]);
  const [isSearchingVenue, setIsSearchingVenue] = useState(false);
  const [showVenueSearch, setShowVenueSearch] = useState(false);

  // Organizer state
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
  const [organizerQuery, setOrganizerQuery] = useState('');
  const [organizerResults, setOrganizerResults] = useState<OrganizerSearchResult[]>([]);
  const [isSearchingOrganizer, setIsSearchingOrganizer] = useState(false);
  const [showOrganizerSearch, setShowOrganizerSearch] = useState(false);

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================

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
  // VENUE SEARCH
  // ============================================================================

  const handleVenueSearch = useCallback(async (query: string) => {
    setVenueQuery(query);

    if (query.length < 2) {
      setVenueResults([]);
      return;
    }

    setIsSearchingVenue(true);

    try {
      const response = await fetch(
        `/api/submit/venues/search?q=${encodeURIComponent(query)}&limit=10`
      );
      const result = await response.json();

      if (result.success) {
        setVenueResults(result.venues);
      } else {
        setVenueResults([]);
      }
    } catch {
      setVenueResults([]);
    } finally {
      setIsSearchingVenue(false);
    }
  }, []);

  const selectVenue = useCallback((venue: VenueSearchResult) => {
    setSelectedVenue(venue);
    setShowVenueSearch(false);
    setVenueQuery('');
    setVenueResults([]);
    resetStatus();
  }, [resetStatus]);

  const clearVenue = useCallback(() => {
    setSelectedVenue(null);
    resetStatus();
  }, [resetStatus]);

  // ============================================================================
  // ORGANIZER SEARCH
  // ============================================================================

  const handleOrganizerSearch = useCallback(async (query: string) => {
    setOrganizerQuery(query);

    if (query.length < 2) {
      setOrganizerResults([]);
      return;
    }

    setIsSearchingOrganizer(true);

    try {
      const response = await fetch(
        `/api/submit/organizers/search?q=${encodeURIComponent(query)}&limit=10`
      );
      const result = await response.json();

      if (result.success) {
        setOrganizerResults(result.organizers);
      } else {
        setOrganizerResults([]);
      }
    } catch {
      setOrganizerResults([]);
    } finally {
      setIsSearchingOrganizer(false);
    }
  }, []);

  const selectOrganizer = useCallback((organizer: OrganizerSearchResult) => {
    setSelectedOrganizer(organizer);
    setShowOrganizerSearch(false);
    setOrganizerQuery('');
    setOrganizerResults([]);
    resetStatus();
  }, [resetStatus]);

  const clearOrganizer = useCallback(() => {
    setSelectedOrganizer(null);
    resetStatus();
  }, [resetStatus]);

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

      setTimeout(() => {
        router.push('/admin/events');
      }, 1500);
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

  const isDeleted = !!event.reviewed_at && event.status === 'rejected';

  return (
    <div className="space-y-6">
      {/* Status bar */}
      {status !== 'idle' && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            status === 'saving'
              ? 'bg-amber-50 border border-amber-200'
              : status === 'saved'
              ? 'bg-sage/10 border border-sage/30'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {status === 'saving' && <Clock className="w-5 h-5 text-amber-600 animate-spin" />}
          {status === 'saved' && <CheckCircle className="w-5 h-5 text-sage" />}
          {status === 'error' && <AlertTriangle className="w-5 h-5 text-red-600" />}
          <span
            className={`text-sm font-medium ${
              status === 'saving' ? 'text-amber-800' : status === 'saved' ? 'text-sage' : 'text-red-800'
            }`}
          >
            {statusMessage}
          </span>
        </div>
      )}

      {/* Form */}
      <div className="bg-warm-white border border-sand rounded-lg p-6 space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-charcoal mb-2">
            Event Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formState.title}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none"
            placeholder="Enter event title..."
          />
        </div>

        {/* Short Description */}
        <div>
          <label htmlFor="short_description" className="block text-sm font-medium text-charcoal mb-2">
            Short Description
            <span className="text-stone font-normal ml-2">(for cards, max 160 chars)</span>
          </label>
          <textarea
            id="short_description"
            name="short_description"
            value={formState.short_description}
            onChange={handleInputChange}
            rows={2}
            maxLength={160}
            className="w-full px-4 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none resize-none"
            placeholder="Brief description for event cards..."
          />
          <p className="text-xs text-stone mt-1">
            {formState.short_description.length}/160 characters
          </p>
        </div>

        {/* Full Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-charcoal mb-2">
            Full Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formState.description}
            onChange={handleInputChange}
            rows={6}
            className="w-full px-4 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none resize-y"
            placeholder="Full event description..."
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_datetime" className="block text-sm font-medium text-charcoal mb-2">
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              id="start_datetime"
              name="start_datetime"
              value={formState.start_datetime}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none"
            />
          </div>

          <div>
            <label htmlFor="end_datetime" className="block text-sm font-medium text-charcoal mb-2">
              End Date & Time
              <span className="text-stone font-normal ml-2">(optional)</span>
            </label>
            <input
              type="datetime-local"
              id="end_datetime"
              name="end_datetime"
              value={formState.end_datetime}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none"
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
            className="w-5 h-5 rounded border-sand text-coral focus:ring-coral"
          />
          <span className="text-sm text-charcoal">This is an all-day event</span>
        </label>

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="price_type" className="block text-sm font-medium text-charcoal mb-2">
              Price Type
            </label>
            <select
              id="price_type"
              name="price_type"
              value={formState.price_type}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none"
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
                <label htmlFor="price_low" className="block text-sm font-medium text-charcoal mb-2">
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
                  className="w-full px-4 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none"
                  placeholder="0.00"
                />
              </div>

              {formState.price_type === 'range' && (
                <div>
                  <label htmlFor="price_high" className="block text-sm font-medium text-charcoal mb-2">
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
                    className="w-full px-4 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none"
                    placeholder="0.00"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Ticket URL */}
        <div>
          <label htmlFor="ticket_url" className="block text-sm font-medium text-charcoal mb-2">
            Ticket URL
            <span className="text-stone font-normal ml-2">(optional)</span>
          </label>
          <input
            type="url"
            id="ticket_url"
            name="ticket_url"
            value={formState.ticket_url}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none"
            placeholder="https://..."
          />
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* EXTERNAL LINKS */}
        {/* ------------------------------------------------------------------ */}
        <div className="p-4 bg-cream/50 rounded-lg border border-sand/50">
          <p className="text-sm font-medium text-charcoal mb-3">
            External Links <span className="text-stone font-normal">(optional)</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="website_url" className="block text-xs text-stone mb-1">
                Event Website
              </label>
              <input
                type="url"
                id="website_url"
                name="website_url"
                value={formState.website_url}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none text-sm"
                placeholder="https://myevent.com"
              />
            </div>
            <div>
              <label htmlFor="registration_url" className="block text-xs text-stone mb-1">
                Registration / RSVP URL
              </label>
              <input
                type="url"
                id="registration_url"
                name="registration_url"
                value={formState.registration_url}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none text-sm"
                placeholder="https://rsvp.example.com"
              />
            </div>
            <div>
              <label htmlFor="instagram_url" className="block text-xs text-stone mb-1">
                Instagram
              </label>
              <input
                type="url"
                id="instagram_url"
                name="instagram_url"
                value={formState.instagram_url}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none text-sm"
                placeholder="https://instagram.com/event"
              />
            </div>
            <div>
              <label htmlFor="facebook_url" className="block text-xs text-stone mb-1">
                Facebook Event
              </label>
              <input
                type="url"
                id="facebook_url"
                name="facebook_url"
                value={formState.facebook_url}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none text-sm"
                placeholder="https://facebook.com/events/123"
              />
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* GOOD FOR AUDIENCE TAGS */}
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
                    resetStatus();
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
        {/* CATEGORY */}
        {/* ------------------------------------------------------------------ */}
        {categories.length > 0 && (
          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-charcoal mb-2">
              Category
            </label>
            <div className="relative">
              <select
                id="category_id"
                name="category_id"
                value={formState.category_id}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none appearance-none pr-10"
              >
                <option value="">No category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone pointer-events-none" />
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* VENUE / LOCATION */}
        {/* ------------------------------------------------------------------ */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            Venue / Location
          </label>

          {selectedVenue && !showVenueSearch && (
            <div className="p-4 bg-sage/10 border border-sage/30 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-sage mt-0.5" />
                  <div>
                    <p className="font-medium text-charcoal">{selectedVenue.name}</p>
                    <p className="text-sm text-stone">
                      {selectedVenue.address_line && `${selectedVenue.address_line}, `}
                      {selectedVenue.city}
                      {selectedVenue.state && `, ${selectedVenue.state}`}
                    </p>
                    {selectedVenue.rating && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-stone">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>{selectedVenue.rating.toFixed(1)}</span>
                        {selectedVenue.review_count > 0 && (
                          <span className="text-stone/60">({selectedVenue.review_count})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowVenueSearch(true)}
                    className="text-sm text-coral hover:text-coral/80"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={clearVenue}
                    className="text-sm text-stone hover:text-charcoal"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {!selectedVenue && !showVenueSearch && (
            <button
              type="button"
              onClick={() => setShowVenueSearch(true)}
              className="w-full p-4 border border-dashed border-sand rounded-lg hover:border-coral hover:bg-coral/5 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sand rounded-lg">
                  <MapPin className="w-5 h-5 text-stone" />
                </div>
                <div>
                  <p className="font-medium text-charcoal">No venue selected</p>
                  <p className="text-sm text-stone">Click to search and select a venue</p>
                </div>
              </div>
            </button>
          )}

          {showVenueSearch && (
            <div className="p-4 bg-cream rounded-lg border border-sand space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-charcoal">Search Venues</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowVenueSearch(false);
                    setVenueQuery('');
                    setVenueResults([]);
                  }}
                  className="text-sm text-stone hover:text-charcoal"
                >
                  Cancel
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
                <input
                  type="text"
                  value={venueQuery}
                  onChange={(e) => handleVenueSearch(e.target.value)}
                  placeholder="Type venue name or address..."
                  className="w-full pl-10 pr-10 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none"
                  autoFocus
                />
                {isSearchingVenue && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone animate-spin" />
                )}
              </div>

              {venueResults.length > 0 && (
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {venueResults.map((venue) => (
                    <button
                      key={venue.id}
                      type="button"
                      onClick={() => selectVenue(venue)}
                      className="w-full flex items-start justify-between p-3 rounded-lg border border-sand bg-warm-white hover:border-coral hover:bg-coral/5 transition-all text-left"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-charcoal truncate">{venue.name}</p>
                        <p className="text-sm text-stone truncate">
                          {venue.address_line && `${venue.address_line}, `}
                          {venue.city}
                          {venue.state && `, ${venue.state}`}
                        </p>
                        {venue.rating && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-stone">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span>{venue.rating.toFixed(1)}</span>
                            {venue.review_count > 0 && (
                              <span className="text-stone/60">({venue.review_count})</span>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-xs bg-sand text-stone px-2 py-0.5 rounded capitalize flex-shrink-0 ml-2">
                        {venue.category || venue.venue_type}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {venueQuery.length >= 2 && !isSearchingVenue && venueResults.length === 0 && (
                <div className="p-3 bg-sand/30 rounded-lg text-center">
                  <p className="text-sm text-stone">No venues found for &quot;{venueQuery}&quot;</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* ORGANIZER */}
        {/* ------------------------------------------------------------------ */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            Organizer
          </label>

          {selectedOrganizer && !showOrganizerSearch && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-charcoal">{selectedOrganizer.name}</p>
                    {selectedOrganizer.website_url && (
                      <p className="text-sm text-stone truncate max-w-[250px]">
                        {selectedOrganizer.website_url}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowOrganizerSearch(true)}
                    className="text-sm text-coral hover:text-coral/80"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={clearOrganizer}
                    className="text-sm text-stone hover:text-charcoal"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {!selectedOrganizer && !showOrganizerSearch && (
            <button
              type="button"
              onClick={() => setShowOrganizerSearch(true)}
              className="w-full p-4 border border-dashed border-sand rounded-lg hover:border-coral hover:bg-coral/5 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sand rounded-lg">
                  <User className="w-5 h-5 text-stone" />
                </div>
                <div>
                  <p className="font-medium text-charcoal">No organizer selected</p>
                  <p className="text-sm text-stone">Click to search and select an organizer</p>
                </div>
              </div>
            </button>
          )}

          {showOrganizerSearch && (
            <div className="p-4 bg-cream rounded-lg border border-sand space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-charcoal">Search Organizers</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowOrganizerSearch(false);
                    setOrganizerQuery('');
                    setOrganizerResults([]);
                  }}
                  className="text-sm text-stone hover:text-charcoal"
                >
                  Cancel
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
                <input
                  type="text"
                  value={organizerQuery}
                  onChange={(e) => handleOrganizerSearch(e.target.value)}
                  placeholder="Type organizer name..."
                  className="w-full pl-10 pr-10 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none"
                  autoFocus
                />
                {isSearchingOrganizer && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone animate-spin" />
                )}
              </div>

              {organizerResults.length > 0 && (
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {organizerResults.map((org) => (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => selectOrganizer(org)}
                      className="w-full flex items-start gap-3 p-3 rounded-lg border border-sand bg-warm-white hover:border-coral hover:bg-coral/5 transition-all text-left"
                    >
                      <User className="w-4 h-4 text-stone mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-charcoal truncate">{org.name}</p>
                        {org.website_url && (
                          <p className="text-xs text-stone truncate">{org.website_url}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {organizerQuery.length >= 2 && !isSearchingOrganizer && organizerResults.length === 0 && (
                <div className="p-3 bg-sand/30 rounded-lg text-center">
                  <p className="text-sm text-stone">No organizers found for &quot;{organizerQuery}&quot;</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* SERIES OCCURRENCES */}
        {/* ------------------------------------------------------------------ */}
        {event.series_id && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Layers className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">Part of a Series</p>
                <p className="text-sm text-blue-700 mt-0.5">
                  Choose which occurrences to apply shared field changes to
                  (title, description, pricing, venue, organizer, category, links, tags).
                </p>
                <div className="mt-3 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="occurrenceScope" value="single"
                      checked={occurrenceScope === 'single'} onChange={() => setOccurrenceScope('single')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-blue-800">This occurrence only</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="occurrenceScope" value="all"
                      checked={occurrenceScope === 'all'} onChange={() => setOccurrenceScope('all')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-blue-800">All occurrences in this series</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="occurrenceScope" value="future"
                      checked={occurrenceScope === 'future'} onChange={() => setOccurrenceScope('future')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-blue-800">This and future occurrences</span>
                  </label>
                </div>
                {occurrenceScope !== 'single' && (
                  <p className="text-xs text-blue-600 mt-2">
                    Date/time changes will NOT be applied to other occurrences.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-charcoal mb-2">
            Event Status
          </label>
          <div className="relative">
            <select
              id="status"
              name="status"
              value={formState.status}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none appearance-none pr-10"
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone pointer-events-none" />
          </div>
        </div>

        {/* Notes for audit log */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-charcoal mb-2">
            Edit Notes
            <span className="text-stone font-normal ml-2">(for audit log)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none resize-none"
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
          className="flex items-center gap-2 bg-coral hover:bg-coral/90 text-white px-6"
        >
          <Save className="w-4 h-4" />
          {status === 'saving' ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-4">
          <div className="bg-warm-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl text-charcoal flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                Delete Event
              </h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="p-1 hover:bg-sand/50 rounded-lg"
              >
                <X className="w-5 h-5 text-stone" />
              </button>
            </div>

            <p className="text-stone mb-4">
              Are you sure you want to delete &quot;<strong>{event.title}</strong>&quot;?
              This action can be undone by restoring the event later.
            </p>

            <div className="mb-4">
              <label htmlFor="deleteReason" className="block text-sm font-medium text-charcoal mb-2">
                Reason for deletion <span className="text-red-600">*</span>
              </label>
              <textarea
                id="deleteReason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-sand rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none"
                placeholder="Why are you deleting this event?"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={!deleteReason.trim() || status === 'saving'}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {status === 'saving' ? 'Deleting...' : 'Delete Event'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDateTimeLocal(dateString: string): string {
  const date = new Date(dateString);
  return format(date, "yyyy-MM-dd'T'HH:mm");
}
