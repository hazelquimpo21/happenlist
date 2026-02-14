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
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SeriesData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  series_type: string;
  status: string;
  price_type: string;
  price_low: number | null;
  price_high: number | null;
  is_free: boolean;
  registration_url: string | null;
  image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_featured: boolean;
}

interface SeriesEditFormProps {
  series: SeriesData;
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
    is_featured: series.is_featured,
  });

  const [status, setStatus] = useState<FormStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [notes, setNotes] = useState('');

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
      if (formState.is_free !== series.is_free) updates.is_free = formState.is_free;
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
              ? 'bg-sage/10 border border-sage/30'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {status === 'saving' && <Clock className="w-5 h-5 text-amber-600 animate-spin" />}
          {status === 'saved' && <CheckCircle className="w-5 h-5 text-sage" />}
          {status === 'error' && <AlertTriangle className="w-5 h-5 text-red-600" />}
          <span className={`text-sm font-medium ${
            status === 'saving' ? 'text-amber-800' : status === 'saved' ? 'text-sage' : 'text-red-800'
          }`}>
            {statusMessage}
          </span>
        </div>
      )}

      {/* Form */}
      <div className="bg-warm-white border border-sand rounded-lg p-6 space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-charcoal mb-2">
            Series Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formState.title}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none"
          />
        </div>

        {/* Short Description */}
        <div>
          <label htmlFor="short_description" className="block text-sm font-medium text-charcoal mb-2">
            Short Description <span className="text-stone font-normal">(max 160 chars)</span>
          </label>
          <textarea
            id="short_description"
            name="short_description"
            value={formState.short_description}
            onChange={handleInputChange}
            rows={2}
            maxLength={160}
            className="w-full px-4 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none resize-none"
          />
          <p className="text-xs text-stone mt-1">{formState.short_description.length}/160</p>
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
          />
        </div>

        {/* Type and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="series_type" className="block text-sm font-medium text-charcoal mb-2">
              Series Type
            </label>
            <div className="relative">
              <select
                id="series_type"
                name="series_type"
                value={formState.series_type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none appearance-none pr-10"
              >
                {SERIES_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone pointer-events-none" />
            </div>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-charcoal mb-2">
              Status
            </label>
            <div className="relative">
              <select
                id="status"
                name="status"
                value={formState.status}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none appearance-none pr-10"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="price_type" className="block text-sm font-medium text-charcoal mb-2">
              Price Type
            </label>
            <div className="relative">
              <select
                id="price_type"
                name="price_type"
                value={formState.price_type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none appearance-none pr-10"
              >
                {PRICE_TYPES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone pointer-events-none" />
            </div>
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
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Registration URL */}
        <div>
          <label htmlFor="registration_url" className="block text-sm font-medium text-charcoal mb-2">
            Registration URL
          </label>
          <input
            type="url"
            id="registration_url"
            name="registration_url"
            value={formState.registration_url}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none"
            placeholder="https://..."
          />
        </div>

        {/* Image URL */}
        <div>
          <label htmlFor="image_url" className="block text-sm font-medium text-charcoal mb-2">
            Image URL
          </label>
          <input
            type="url"
            id="image_url"
            name="image_url"
            value={formState.image_url}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none"
            placeholder="https://..."
          />
        </div>

        {/* SEO */}
        <div className="p-4 bg-cream/50 rounded-lg border border-sand/50">
          <p className="text-sm font-medium text-charcoal mb-3">SEO</p>
          <div className="space-y-4">
            <div>
              <label htmlFor="meta_title" className="block text-xs text-stone mb-1">
                Meta Title
              </label>
              <input
                type="text"
                id="meta_title"
                name="meta_title"
                value={formState.meta_title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none text-sm"
              />
            </div>
            <div>
              <label htmlFor="meta_description" className="block text-xs text-stone mb-1">
                Meta Description
              </label>
              <textarea
                id="meta_description"
                name="meta_description"
                value={formState.meta_description}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none text-sm resize-none"
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
            className="w-5 h-5 rounded border-sand text-coral focus:ring-coral"
          />
          <span className="text-sm text-charcoal">Featured series</span>
        </label>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-charcoal mb-2">
            Edit Notes <span className="text-stone font-normal">(for audit log)</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none resize-none"
            placeholder="Why are you making these changes?"
          />
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={status === 'saving'}
          className="flex items-center gap-2 bg-coral hover:bg-coral/90 text-white px-6"
        >
          <Save className="w-4 h-4" />
          {status === 'saving' ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
