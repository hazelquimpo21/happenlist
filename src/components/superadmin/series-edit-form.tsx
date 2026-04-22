'use client';

/**
 * SUPERADMIN SERIES EDIT FORM
 * ===========================
 * Form for superadmins to edit series/class details.
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RecurrenceNaturalInput } from './recurrence-natural-input';
import type { SeriesRow } from '@/types/series';
import type { RecurrenceRule } from '@/lib/supabase/types';

interface SeriesEditFormProps {
  series: SeriesRow;
}

type FormStatus = 'idle' | 'saving' | 'saved' | 'error';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'cancelled', label: 'Cancelled' },
];

const SERIES_TYPES = [
  { value: 'class', label: 'Class' },
  { value: 'camp', label: 'Camp' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'recurring', label: 'Recurring' },
  { value: 'festival', label: 'Festival' },
  { value: 'season', label: 'Season' },
];

const PRICE_TYPES = [
  { value: 'free', label: 'Free' },
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'range', label: 'Price Range' },
  { value: 'varies', label: 'Varies' },
  { value: 'per_session', label: 'Per Session' },
];

export function SuperadminSeriesEditForm({ series }: SeriesEditFormProps) {
  const router = useRouter();

  const [formState, setFormState] = useState({
    title: series.title || '',
    description: series.description || '',
    short_description: series.short_description || '',
    series_type: series.series_type || 'class',
    status: series.status || 'draft',
    price_type: series.price_type || 'free',
    price_low: series.price_low?.toString() || '',
    price_high: series.price_high?.toString() || '',
    is_free: series.is_free,
    registration_url: series.registration_url || '',
    image_url: series.image_url || '',
    meta_title: series.meta_title || '',
    meta_description: series.meta_description || '',
    is_featured: series.is_featured ?? false,
  });

  const [status, setStatus] = useState<FormStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

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

  const handleSave = async () => {
    setStatus('saving');
    setStatusMessage('Saving changes...');

    try {
      const updates: Record<string, unknown> = {};

      if (formState.title !== series.title) updates.title = formState.title;
      if (formState.description !== (series.description || '')) updates.description = formState.description || null;
      if (formState.short_description !== (series.short_description || '')) updates.short_description = formState.short_description || null;
      if (formState.series_type !== series.series_type) updates.series_type = formState.series_type;
      if (formState.status !== series.status) updates.status = formState.status;
      if (formState.price_type !== series.price_type) updates.price_type = formState.price_type;
      // Note: is_free is a generated column (computed from price_type) — do not include in updates
      if (formState.registration_url !== (series.registration_url || '')) updates.registration_url = formState.registration_url || null;
      if (formState.image_url !== (series.image_url || '')) updates.image_url = formState.image_url || null;
      if (formState.meta_title !== (series.meta_title || '')) updates.meta_title = formState.meta_title || null;
      if (formState.meta_description !== (series.meta_description || '')) updates.meta_description = formState.meta_description || null;
      if (formState.is_featured !== series.is_featured) updates.is_featured = formState.is_featured;

      // Price
      if (formState.price_type !== 'free') {
        const priceLow = formState.price_low ? parseFloat(formState.price_low) : null;
        const priceHigh = formState.price_high ? parseFloat(formState.price_high) : null;
        if (priceLow !== series.price_low) updates.price_low = priceLow;
        if (priceHigh !== series.price_high) updates.price_high = priceHigh;
      }

      if (Object.keys(updates).length === 0) {
        setStatus('idle');
        setStatusMessage('No changes to save');
        return;
      }

      const response = await fetch(`/api/superadmin/series/${series.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates, notes: notes || 'Superadmin edit' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save changes');
      }

      setStatus('saved');
      setStatusMessage('Changes saved successfully!');
      setNotes('');
      router.refresh();
    } catch (error) {
      console.error('Save error:', error);
      setStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Failed to save changes');
    }
  };

  return (
    <div className="space-y-6">
      {/* Status bar */}
      {status !== 'idle' && (
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
          <span className={`text-sm font-medium ${
            status === 'saving' ? 'text-amber-800' : status === 'saved' ? 'text-emerald' : 'text-red-800'
          }`}>
            {statusMessage}
          </span>
        </div>
      )}

      {/* Form */}
      <div className="bg-pure border border-mist rounded-lg p-6 space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-ink mb-2">
            Series Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formState.title}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none"
          />
        </div>

        {/* Short Description */}
        <div>
          <label htmlFor="short_description" className="block text-sm font-medium text-ink mb-2">
            Short Description <span className="text-zinc font-normal">(max 160 chars)</span>
          </label>
          <textarea
            id="short_description"
            name="short_description"
            value={formState.short_description}
            onChange={handleInputChange}
            rows={2}
            maxLength={160}
            className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none resize-none"
          />
          <p className="text-xs text-zinc mt-1">{formState.short_description.length}/160</p>
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
          />
        </div>

        {/* Type and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="series_type" className="block text-sm font-medium text-ink mb-2">
              Series Type
            </label>
            <div className="relative">
              <select
                id="series_type"
                name="series_type"
                value={formState.series_type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none appearance-none pr-10"
              >
                {SERIES_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc pointer-events-none" />
            </div>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-ink mb-2">
              Status
            </label>
            <div className="relative">
              <select
                id="status"
                name="status"
                value={formState.status}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none appearance-none pr-10"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="price_type" className="block text-sm font-medium text-ink mb-2">
              Price Type
            </label>
            <div className="relative">
              <select
                id="price_type"
                name="price_type"
                value={formState.price_type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none appearance-none pr-10"
              >
                {PRICE_TYPES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc pointer-events-none" />
            </div>
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
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Registration URL */}
        <div>
          <label htmlFor="registration_url" className="block text-sm font-medium text-ink mb-2">
            Registration URL
          </label>
          <input
            type="url"
            id="registration_url"
            name="registration_url"
            value={formState.registration_url}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none"
            placeholder="https://..."
          />
        </div>

        {/* Image URL */}
        <div>
          <label htmlFor="image_url" className="block text-sm font-medium text-ink mb-2">
            Image URL
          </label>
          <input
            type="url"
            id="image_url"
            name="image_url"
            value={formState.image_url}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none"
            placeholder="https://..."
          />
        </div>

        {/* SEO */}
        <div className="p-4 bg-white/50 rounded-lg border border-mist/50">
          <p className="text-sm font-medium text-ink mb-3">SEO</p>
          <div className="space-y-4">
            <div>
              <label htmlFor="meta_title" className="block text-xs text-zinc mb-1">
                Meta Title
              </label>
              <input
                type="text"
                id="meta_title"
                name="meta_title"
                value={formState.meta_title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none text-sm"
              />
            </div>
            <div>
              <label htmlFor="meta_description" className="block text-xs text-zinc mb-1">
                Meta Description
              </label>
              <textarea
                id="meta_description"
                name="meta_description"
                value={formState.meta_description}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none text-sm resize-none"
              />
            </div>
          </div>
        </div>

        {/* Featured */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="is_featured"
            checked={formState.is_featured}
            onChange={handleInputChange}
            className="w-5 h-5 rounded border-mist text-blue focus:ring-blue"
          />
          <span className="text-sm text-ink">Featured series</span>
        </label>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-ink mb-2">
            Edit Notes <span className="text-zinc font-normal">(for audit log)</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none resize-none"
            placeholder="Why are you making these changes?"
          />
        </div>
      </div>

      {/* Recurrence editor — separate block with its own save so the NL
          parser can write recurrence_rule without requiring the operator to
          also touch price/description/etc. */}
      <RecurrenceSection
        seriesId={series.id}
        currentRule={series.recurrence_rule as RecurrenceRule | null}
        startDate={series.start_date}
        onSaved={() => router.refresh()}
      />

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={status === 'saving'}
          className="flex items-center gap-2 text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
          Cancel Series
        </Button>

        <Button
          onClick={handleSave}
          disabled={status === 'saving'}
          className="flex items-center gap-2 bg-blue hover:bg-blue/90 text-white px-6"
        >
          <Save className="w-4 h-4" />
          {status === 'saving' ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Delete confirmation modal (see bottom of file for RecurrenceSection) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-4">
          <div className="bg-pure rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-body text-xl text-ink flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                Cancel Series
              </h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="p-1 hover:bg-cloud/50 rounded-lg"
              >
                <X className="w-5 h-5 text-zinc" />
              </button>
            </div>

            <p className="text-zinc mb-4">
              This will mark <strong>{series.title}</strong> as cancelled.
              The series can be republished later by changing the status.
            </p>

            <div className="mb-4">
              <label htmlFor="deleteReason" className="block text-sm font-medium text-ink mb-2">
                Reason <span className="text-red-600">*</span>
              </label>
              <textarea
                id="deleteReason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-mist rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none"
                placeholder="Why are you cancelling this series?"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!deleteReason.trim()) return;
                  setStatus('saving');
                  setStatusMessage('Cancelling series...');
                  try {
                    const response = await fetch(`/api/superadmin/series/${series.id}`, {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ reason: deleteReason }),
                    });
                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(errorData.error || 'Failed to cancel series');
                    }
                    setStatus('saved');
                    setStatusMessage('Series cancelled successfully');
                    setShowDeleteConfirm(false);
                    router.refresh();
                  } catch (error) {
                    setStatus('error');
                    setStatusMessage(error instanceof Error ? error.message : 'Failed to cancel series');
                  }
                }}
                disabled={!deleteReason.trim() || status === 'saving'}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {status === 'saving' ? 'Cancelling...' : 'Cancel Series'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// RECURRENCE SECTION
// ============================================================================
// Split out so the NL parser can write recurrence_rule independently of the
// main series form's "Save Changes" button. Uses the same PATCH route as the
// rest of the form.
// ----------------------------------------------------------------------------

interface RecurrenceSectionProps {
  seriesId: string;
  currentRule: RecurrenceRule | null;
  startDate: string | null;
  onSaved: () => void;
}

function RecurrenceSection({ seriesId, currentRule, startDate, onSaved }: RecurrenceSectionProps) {
  const [pendingRule, setPendingRule] = useState<RecurrenceRule | null>(null);
  const [pendingLabel, setPendingLabel] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const applyPending = async () => {
    if (!pendingRule) return;
    setSaveStatus('saving');
    setErrorMsg(null);
    try {
      const response = await fetch(`/api/superadmin/series/${seriesId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: { recurrence_rule: pendingRule },
          notes: `Recurrence updated via NL parser: "${pendingLabel}"`,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Failed (${response.status})`);
      }
      setSaveStatus('saved');
      setPendingRule(null);
      setPendingLabel('');
      onSaved();
    } catch (err) {
      setSaveStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Network error');
    }
  };

  return (
    <div className="bg-pure border border-mist rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-ink">Recurrence</h3>
        <p className="text-sm text-zinc mt-1">
          Current pattern:{' '}
          {currentRule
            ? <code className="text-xs bg-cloud px-1.5 py-0.5 rounded">{JSON.stringify(currentRule)}</code>
            : <span className="italic text-silver">None set</span>}
        </p>
      </div>

      <RecurrenceNaturalInput
        startDate={startDate}
        onParsed={({ rule, description }) => {
          setPendingRule(rule);
          setPendingLabel(description);
          setSaveStatus('idle');
          setErrorMsg(null);
        }}
      />

      {pendingRule && (
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-mist">
          <div className="text-sm text-zinc">
            Ready to save: <strong className="text-ink">{pendingLabel}</strong>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => { setPendingRule(null); setPendingLabel(''); }}
              disabled={saveStatus === 'saving'}
            >
              Discard
            </Button>
            <Button onClick={applyPending} disabled={saveStatus === 'saving'}>
              {saveStatus === 'saving' ? 'Saving…' : 'Save recurrence'}
            </Button>
          </div>
        </div>
      )}

      {saveStatus === 'saved' && (
        <p className="text-sm text-emerald">Recurrence saved.</p>
      )}
      {saveStatus === 'error' && errorMsg && (
        <p className="text-sm text-red-700">{errorMsg}</p>
      )}
    </div>
  );
}
