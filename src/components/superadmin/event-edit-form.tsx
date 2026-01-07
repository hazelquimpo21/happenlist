'use client';

/**
 * 🦸 SUPERADMIN EVENT EDIT FORM
 * =============================
 * A comprehensive form for superadmins to edit any event.
 *
 * Features:
 * - Edit all event fields (title, description, dates, pricing, etc.)
 * - Change event status directly
 * - Delete/restore events
 * - Auto-save indicator
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AdminEventDetails } from '@/data/admin/get-admin-event';

// ============================================================================
// 🏷️ TYPES
// ============================================================================

interface EventEditFormProps {
  event: AdminEventDetails;
  onSuccess?: () => void;
}

type FormStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Venue search result from the API.
 */
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
  status: string;
}

// ============================================================================
// 📋 STATUS OPTIONS
// ============================================================================

const STATUS_OPTIONS = [
  { value: 'draft', label: '📝 Draft', color: 'bg-stone/20 text-stone' },
  { value: 'pending_review', label: '⏳ Pending Review', color: 'bg-amber-100 text-amber-800' },
  { value: 'changes_requested', label: '✏️ Changes Requested', color: 'bg-orange-100 text-orange-800' },
  { value: 'published', label: '✅ Published', color: 'bg-sage/20 text-sage' },
  { value: 'rejected', label: '❌ Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'cancelled', label: '🚫 Cancelled', color: 'bg-stone/30 text-stone' },
];

const PRICE_TYPES = [
  { value: 'free', label: 'Free' },
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'range', label: 'Price Range' },
  { value: 'varies', label: 'Varies' },
  { value: 'donation', label: 'Donation' },
];

// ============================================================================
// 🎨 COMPONENT
// ============================================================================

export function SuperadminEventEditForm({ event, onSuccess }: EventEditFormProps) {
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
    status: event.status || 'draft',
  });

  // UI state
  const [status, setStatus] = useState<FormStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [notes, setNotes] = useState('');

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

  // ============================================================================
  // 📝 FORM HANDLERS
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

    // Reset status when user makes changes
    if (status === 'saved' || status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  // ============================================================================
  // 🏛️ VENUE SEARCH
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
        console.log(`🏛️ [SuperadminForm] Found ${result.venues.length} venues for "${query}"`);
      } else {
        setVenueResults([]);
      }
    } catch (error) {
      console.error('🏛️ [SuperadminForm] Venue search failed:', error);
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
    // Reset status to allow saving
    if (status === 'saved' || status === 'error') {
      setStatus('idle');
    }
    console.log(`🏛️ [SuperadminForm] Selected venue: ${venue.name}`);
  }, [status]);

  const clearVenue = useCallback(() => {
    setSelectedVenue(null);
    if (status === 'saved' || status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  // ============================================================================
  // 💾 SAVE CHANGES
  // ============================================================================

  const handleSave = async () => {
    setStatus('saving');
    setStatusMessage('Saving changes...');

    try {
      // Build updates object with only changed fields
      const updates: Record<string, unknown> = {};

      if (formState.title !== event.title) updates.title = formState.title;
      if (formState.description !== (event.description || '')) updates.description = formState.description;
      if (formState.short_description !== (event.short_description || '')) updates.short_description = formState.short_description;

      // Handle datetime
      const newStartDatetime = new Date(formState.start_datetime).toISOString();
      if (newStartDatetime !== event.start_datetime) {
        updates.start_datetime = newStartDatetime;
        updates.instance_date = formState.start_datetime.split('T')[0];
      }

      if (formState.end_datetime) {
        const newEndDatetime = new Date(formState.end_datetime).toISOString();
        if (newEndDatetime !== event.end_datetime) updates.end_datetime = newEndDatetime;
      }

      if (formState.is_all_day !== event.is_all_day) updates.is_all_day = formState.is_all_day;
      if (formState.price_type !== event.price_type) updates.price_type = formState.price_type;
      if (formState.is_free !== event.is_free) updates.is_free = formState.is_free;
      if (formState.ticket_url !== (event.ticket_url || '')) updates.ticket_url = formState.ticket_url;

      // Handle price - only if not free
      if (!formState.is_free && formState.price_type !== 'free') {
        const priceLow = formState.price_low ? parseFloat(formState.price_low) : null;
        const priceHigh = formState.price_high ? parseFloat(formState.price_high) : null;

        if (priceLow !== event.price_low) updates.price_low = priceLow;
        if (priceHigh !== event.price_high) updates.price_high = priceHigh;
      }

      // Handle venue/location change
      const currentLocationId = event.location?.id || null;
      const newLocationId = selectedVenue?.id || null;
      if (newLocationId !== currentLocationId) {
        updates.location_id = newLocationId;
        console.log(`🏛️ [SuperadminForm] Venue changed: ${currentLocationId} → ${newLocationId}`);
      }

      // Check if there are any changes
      const venueChanged = newLocationId !== currentLocationId;
      if (Object.keys(updates).length === 0 && formState.status === event.status && !venueChanged) {
        setStatus('idle');
        setStatusMessage('No changes to save');
        return;
      }

      // If status changed, update it via status endpoint
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

      // If other fields changed, update via edit endpoint
      if (Object.keys(updates).length > 0) {
        const editResponse = await fetch(`/api/superadmin/events/${event.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            updates,
            notes: notes || 'Superadmin edit',
          }),
        });

        if (!editResponse.ok) {
          const errorData = await editResponse.json();
          throw new Error(errorData.message || 'Failed to save changes');
        }
      }

      setStatus('saved');
      setStatusMessage('✅ Changes saved successfully!');
      setNotes('');

      // Refresh the page data
      router.refresh();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('🦸 Save error:', error);
      setStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Failed to save changes');
    }
  };

  // ============================================================================
  // 🗑️ DELETE EVENT
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
          hardDelete: false, // Always soft delete from UI
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete event');
      }

      setStatus('saved');
      setStatusMessage('🗑️ Event deleted successfully!');
      setShowDeleteConfirm(false);

      // Redirect back to events list
      setTimeout(() => {
        router.push('/admin/events');
      }, 1500);
    } catch (error) {
      console.error('🦸 Delete error:', error);
      setStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Failed to delete event');
    }
  };

  // ============================================================================
  // ♻️ RESTORE EVENT
  // ============================================================================

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
      setStatusMessage('♻️ Event restored successfully!');

      // Refresh the page
      router.refresh();
    } catch (error) {
      console.error('🦸 Restore error:', error);
      setStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Failed to restore event');
    }
  };

  // ============================================================================
  // 🎨 RENDER
  // ============================================================================

  const isDeleted = !!event.reviewed_at && event.status === 'rejected'; // Approximation

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* STATUS BAR */}
      {/* ------------------------------------------------------------------ */}
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

      {/* ------------------------------------------------------------------ */}
      {/* FORM */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-warm-white border border-sand rounded-lg p-6 space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-charcoal mb-2">
            📝 Event Title
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
            📄 Short Description
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
            📜 Full Description
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
              🗓️ Start Date & Time
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
              ⏰ End Date & Time
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
          <span className="text-sm text-charcoal">🌞 This is an all-day event</span>
        </label>

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="price_type" className="block text-sm font-medium text-charcoal mb-2">
              💰 Price Type
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
            🎟️ Ticket URL
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
        {/* VENUE / LOCATION */}
        {/* ------------------------------------------------------------------ */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            🏛️ Venue / Location
          </label>

          {/* Selected Venue Display */}
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

          {/* No Venue Selected */}
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

          {/* Venue Search */}
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

              {/* Search Input */}
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

              {/* Search Results */}
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

              {/* No Results */}
              {venueQuery.length >= 2 && !isSearchingVenue && venueResults.length === 0 && (
                <div className="p-3 bg-sand/30 rounded-lg text-center">
                  <p className="text-sm text-stone">No venues found for &quot;{venueQuery}&quot;</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-charcoal mb-2">
            🏷️ Event Status
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
            📋 Edit Notes
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

      {/* ------------------------------------------------------------------ */}
      {/* ACTION BUTTONS */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Delete/Restore Button */}
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

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={status === 'saving'}
          className="flex items-center gap-2 bg-coral hover:bg-coral/90 text-white px-6"
        >
          <Save className="w-4 h-4" />
          {status === 'saving' ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------------ */}
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
// 🔧 HELPERS
// ============================================================================

/**
 * Format a date string to datetime-local input format
 */
function formatDateTimeLocal(dateString: string): string {
  const date = new Date(dateString);
  return format(date, "yyyy-MM-dd'T'HH:mm");
}
