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
} from 'lucide-react';
import { StatusBadgeSelect } from './status-badge-select';
import { useAdminEdit } from '@/hooks/use-admin-edit';
import type { AdminToolbarEvent } from './admin-toolbar';
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
    status: event.status || 'draft',
    notes: '',
  });

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
    if (formState.is_free !== event.is_free) {
      updates.is_free = formState.is_free;
    }
    if (!formState.is_free && formState.price_type !== 'free') {
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
        formState.notes || 'Quick edit update'
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
