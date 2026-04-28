'use client';

/**
 * SUPERADMIN VENUE EDIT FORM
 * ==========================
 * Dual-mode form for venues (`locations` table).
 * Scaffolding (status, save/delete, notes, modal) lives in entity-form-shell;
 * this file is only the venue-specific fields + state.
 */

import { useState } from 'react';
import {
  FormStatusBar,
  FormActions,
  NotesField,
  DeleteConfirmModal,
  useEntityForm,
  buildStringDiff,
} from './entity-form-shell';

// ============================================================================
// TYPES
// ============================================================================

export interface VenueFormData {
  id?: string;
  name: string;
  slug?: string;
  description: string | null;
  address_line: string | null;
  address_line_2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  venue_type: string;
  website_url: string | null;
  phone: string | null;
  image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_active: boolean;
}

type Props =
  | { mode: 'edit'; venue: VenueFormData & { id: string; slug: string } }
  | { mode: 'create'; venue?: undefined };

// `venue_type` options pulled from existing DB free-form values — keep
// in sync with scraper's vocab if it tightens.
const VENUE_TYPE_OPTIONS = ['venue', 'indoor', 'outdoor', 'restaurant', 'bar', 'park', 'other'];

const EMPTY_FORM: VenueFormData = {
  name: '',
  description: '',
  address_line: '',
  address_line_2: '',
  city: '',
  state: 'WI',
  postal_code: '',
  venue_type: 'venue',
  website_url: '',
  phone: '',
  image_url: '',
  meta_title: '',
  meta_description: '',
  is_active: true,
};

// ============================================================================
// FORM
// ============================================================================

export function SuperadminVenueEditForm(props: Props) {
  const isCreate = props.mode === 'create';
  const initial: VenueFormData = isCreate
    ? EMPTY_FORM
    : {
        id: props.venue.id,
        slug: props.venue.slug,
        name: props.venue.name || '',
        description: props.venue.description || '',
        address_line: props.venue.address_line || '',
        address_line_2: props.venue.address_line_2 || '',
        city: props.venue.city || '',
        state: props.venue.state || '',
        postal_code: props.venue.postal_code || '',
        venue_type: props.venue.venue_type || 'venue',
        website_url: props.venue.website_url || '',
        phone: props.venue.phone || '',
        image_url: props.venue.image_url || '',
        meta_title: props.venue.meta_title || '',
        meta_description: props.venue.meta_description || '',
        is_active: props.venue.is_active,
      };

  const [state, setState] = useState<VenueFormData>(initial);
  const [baseline, setBaseline] = useState<VenueFormData>(initial);

  const controller = useEntityForm<VenueFormData>(
    {
      kind: 'venue',
      mode: props.mode,
      entityId: !isCreate ? props.venue.id : undefined,
      entityName: !isCreate ? props.venue.name : undefined,
      buildCreatePayload: (s) => ({
        name: s.name.trim(),
        description: s.description || null,
        address_line: s.address_line || null,
        address_line_2: s.address_line_2 || null,
        city: s.city.trim(),
        state: s.state || null,
        postal_code: s.postal_code || null,
        venue_type: s.venue_type || 'venue',
        website_url: s.website_url || null,
        phone: s.phone || null,
        image_url: s.image_url || null,
        meta_title: s.meta_title || null,
        meta_description: s.meta_description || null,
      }),
      buildUpdateDiff: (s) =>
        buildStringDiff(
          baseline as unknown as Record<string, unknown>,
          {
            name: s.name,
            description: s.description,
            address_line: s.address_line,
            address_line_2: s.address_line_2,
            city: s.city,
            state: s.state,
            postal_code: s.postal_code,
            venue_type: s.venue_type,
            website_url: s.website_url,
            phone: s.phone,
            image_url: s.image_url,
            meta_title: s.meta_title,
            meta_description: s.meta_description,
            is_active: s.is_active,
          },
          { nonNullable: ['name', 'city', 'venue_type'] }
        ),
      onAfterSave: () => setBaseline(state),
    },
    state
  );

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setState((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    controller.resetStatus();
  };

  // City is required by `locations.city NOT NULL`. In edit mode existing rows
  // always have a city, so we only need to guard the create path.
  const handleSave = async () => {
    if (isCreate && !state.city.trim()) {
      controller.setError('City is required for a new venue.');
      return;
    }
    await controller.save();
  };

  return (
    <div className="space-y-6">
      <FormStatusBar status={controller.status} message={controller.message} />

      <div className="bg-pure border border-mist rounded-lg p-6 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-ink mb-2">
            Venue Name <span className="text-red-600">*</span>
          </label>
          <input
            id="name"
            name="name"
            value={state.name}
            onChange={onChange}
            required
            className="w-full px-4 py-2 border border-mist rounded-lg focus:border-blue focus:ring-2 focus:ring-blue/30 outline-none"
          />
          {isCreate && <p className="text-xs text-zinc mt-1">Slug is auto-generated from the name.</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-ink mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={state.description || ''}
            onChange={onChange}
            rows={4}
            className="w-full px-4 py-2 border border-mist rounded-lg focus:border-blue focus:ring-2 focus:ring-blue/30 outline-none resize-y"
          />
        </div>

        <div>
          <label htmlFor="address_line" className="block text-sm font-medium text-ink mb-2">
            Address Line 1
          </label>
          <input
            id="address_line"
            name="address_line"
            value={state.address_line || ''}
            onChange={onChange}
            className="w-full px-4 py-2 border border-mist rounded-lg focus:border-blue focus:ring-2 focus:ring-blue/30 outline-none"
          />
        </div>
        <div>
          <label htmlFor="address_line_2" className="block text-sm font-medium text-ink mb-2">
            Address Line 2
          </label>
          <input
            id="address_line_2"
            name="address_line_2"
            value={state.address_line_2 || ''}
            onChange={onChange}
            className="w-full px-4 py-2 border border-mist rounded-lg focus:border-blue focus:ring-2 focus:ring-blue/30 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-ink mb-2">
              City <span className="text-red-600">*</span>
            </label>
            <input
              id="city"
              name="city"
              value={state.city}
              onChange={onChange}
              required
              className="w-full px-4 py-2 border border-mist rounded-lg focus:border-blue focus:ring-2 focus:ring-blue/30 outline-none"
            />
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-ink mb-2">
              State
            </label>
            <input
              id="state"
              name="state"
              value={state.state || ''}
              onChange={onChange}
              className="w-full px-4 py-2 border border-mist rounded-lg focus:border-blue focus:ring-2 focus:ring-blue/30 outline-none"
            />
          </div>
          <div>
            <label htmlFor="postal_code" className="block text-sm font-medium text-ink mb-2">
              Postal Code
            </label>
            <input
              id="postal_code"
              name="postal_code"
              value={state.postal_code || ''}
              onChange={onChange}
              className="w-full px-4 py-2 border border-mist rounded-lg focus:border-blue focus:ring-2 focus:ring-blue/30 outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="venue_type" className="block text-sm font-medium text-ink mb-2">
            Venue Type
          </label>
          <select
            id="venue_type"
            name="venue_type"
            value={state.venue_type}
            onChange={onChange}
            className="w-full px-4 py-2 border border-mist rounded-lg focus:border-blue focus:ring-2 focus:ring-blue/30 outline-none bg-white"
          >
            {VENUE_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="website_url" className="block text-sm font-medium text-ink mb-2">
              Website URL
            </label>
            <input
              type="url"
              id="website_url"
              name="website_url"
              value={state.website_url || ''}
              onChange={onChange}
              className="w-full px-4 py-2 border border-mist rounded-lg focus:border-blue focus:ring-2 focus:ring-blue/30 outline-none"
              placeholder="https://..."
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-ink mb-2">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={state.phone || ''}
              onChange={onChange}
              className="w-full px-4 py-2 border border-mist rounded-lg focus:border-blue focus:ring-2 focus:ring-blue/30 outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="image_url" className="block text-sm font-medium text-ink mb-2">
            Image URL
          </label>
          <input
            type="url"
            id="image_url"
            name="image_url"
            value={state.image_url || ''}
            onChange={onChange}
            className="w-full px-4 py-2 border border-mist rounded-lg focus:border-blue focus:ring-2 focus:ring-blue/30 outline-none"
            placeholder="https://..."
          />
        </div>

        <div className="p-4 bg-white/50 rounded-lg border border-mist/50">
          <p className="text-sm font-medium text-ink mb-3">SEO</p>
          <div className="space-y-4">
            <div>
              <label htmlFor="meta_title" className="block text-xs text-zinc mb-1">
                Meta Title
              </label>
              <input
                id="meta_title"
                name="meta_title"
                value={state.meta_title || ''}
                onChange={onChange}
                className="w-full px-3 py-2 border border-mist rounded-lg focus:border-blue focus:ring-2 focus:ring-blue/30 outline-none text-sm"
              />
            </div>
            <div>
              <label htmlFor="meta_description" className="block text-xs text-zinc mb-1">
                Meta Description
              </label>
              <textarea
                id="meta_description"
                name="meta_description"
                value={state.meta_description || ''}
                onChange={onChange}
                rows={2}
                className="w-full px-3 py-2 border border-mist rounded-lg focus:border-blue focus:ring-2 focus:ring-blue/30 outline-none text-sm resize-none"
              />
            </div>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="is_active"
            checked={state.is_active}
            onChange={onChange}
            className="w-5 h-5 rounded border-mist text-blue focus:ring-blue"
          />
          <span className="text-sm text-ink">Active (visible on site)</span>
        </label>

        <NotesField mode={props.mode} value={controller.notes} onChange={controller.setNotes} />
      </div>

      <FormActions
        mode={props.mode}
        entityLabel="Venue"
        status={controller.status}
        onSave={handleSave}
        onRequestDelete={!isCreate ? controller.openDeleteConfirm : undefined}
      />

      {!isCreate && (
        <DeleteConfirmModal
          open={controller.showDeleteConfirm}
          entityLabel="Venue"
          entityName={props.venue.name}
          reason={controller.deleteReason}
          onReasonChange={controller.setDeleteReason}
          onCancel={controller.closeDeleteConfirm}
          onConfirm={controller.confirmDelete}
          busy={controller.status === 'saving'}
        />
      )}
    </div>
  );
}
