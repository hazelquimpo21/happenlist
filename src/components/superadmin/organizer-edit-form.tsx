'use client';

/**
 * SUPERADMIN ORGANIZER EDIT FORM
 * ==============================
 * Form for superadmins to edit organizer details.
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrganizerData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  email: string | null;
  phone: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_active: boolean;
}

interface OrganizerEditFormProps {
  organizer: OrganizerData;
}

type FormStatus = 'idle' | 'saving' | 'saved' | 'error';

export function SuperadminOrganizerEditForm({ organizer }: OrganizerEditFormProps) {
  const router = useRouter();

  const [formState, setFormState] = useState({
    name: organizer.name || '',
    description: organizer.description || '',
    logo_url: organizer.logo_url || '',
    website_url: organizer.website_url || '',
    email: organizer.email || '',
    phone: organizer.phone || '',
    meta_title: organizer.meta_title || '',
    meta_description: organizer.meta_description || '',
    is_active: organizer.is_active,
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

      if (formState.name !== organizer.name) updates.name = formState.name;
      if (formState.description !== (organizer.description || '')) updates.description = formState.description || null;
      if (formState.logo_url !== (organizer.logo_url || '')) updates.logo_url = formState.logo_url || null;
      if (formState.website_url !== (organizer.website_url || '')) updates.website_url = formState.website_url || null;
      if (formState.email !== (organizer.email || '')) updates.email = formState.email || null;
      if (formState.phone !== (organizer.phone || '')) updates.phone = formState.phone || null;
      if (formState.meta_title !== (organizer.meta_title || '')) updates.meta_title = formState.meta_title || null;
      if (formState.meta_description !== (organizer.meta_description || '')) updates.meta_description = formState.meta_description || null;
      if (formState.is_active !== organizer.is_active) updates.is_active = formState.is_active;

      if (Object.keys(updates).length === 0) {
        setStatus('idle');
        setStatusMessage('No changes to save');
        return;
      }

      const response = await fetch(`/api/superadmin/organizers/${organizer.id}`, {
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
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-charcoal mb-2">
            Organizer Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formState.name}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-charcoal mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formState.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-4 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none resize-y"
          />
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formState.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none"
              placeholder="contact@example.com"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-charcoal mb-2">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formState.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none"
            />
          </div>
        </div>

        {/* URLs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="website_url" className="block text-sm font-medium text-charcoal mb-2">
              Website URL
            </label>
            <input
              type="url"
              id="website_url"
              name="website_url"
              value={formState.website_url}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none"
              placeholder="https://..."
            />
          </div>
          <div>
            <label htmlFor="logo_url" className="block text-sm font-medium text-charcoal mb-2">
              Logo URL
            </label>
            <input
              type="url"
              id="logo_url"
              name="logo_url"
              value={formState.logo_url}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none"
              placeholder="https://..."
            />
          </div>
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

        {/* Active Status */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="is_active"
            checked={formState.is_active}
            onChange={handleInputChange}
            className="w-5 h-5 rounded border-sand text-coral focus:ring-coral"
          />
          <span className="text-sm text-charcoal">Active (visible on site)</span>
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

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={status === 'saving'}
          className="flex items-center gap-2 text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
          Deactivate Organizer
        </Button>

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
                Deactivate Organizer
              </h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="p-1 hover:bg-sand/50 rounded-lg"
              >
                <X className="w-5 h-5 text-stone" />
              </button>
            </div>

            <p className="text-stone mb-4">
              This will hide <strong>{organizer.name}</strong> from the site.
              The organizer can be reactivated later.
            </p>

            <div className="mb-4">
              <label htmlFor="deleteReason" className="block text-sm font-medium text-charcoal mb-2">
                Reason <span className="text-red-600">*</span>
              </label>
              <textarea
                id="deleteReason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-sand rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none"
                placeholder="Why are you deactivating this organizer?"
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
                  setStatusMessage('Deactivating...');
                  try {
                    const response = await fetch(`/api/superadmin/organizers/${organizer.id}`, {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ reason: deleteReason }),
                    });
                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(errorData.error || 'Failed to deactivate');
                    }
                    setStatus('saved');
                    setStatusMessage('Organizer deactivated successfully');
                    setShowDeleteConfirm(false);
                    router.refresh();
                  } catch (error) {
                    setStatus('error');
                    setStatusMessage(error instanceof Error ? error.message : 'Failed to deactivate');
                  }
                }}
                disabled={!deleteReason.trim() || status === 'saving'}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {status === 'saving' ? 'Deactivating...' : 'Deactivate'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
