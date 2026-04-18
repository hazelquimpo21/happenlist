'use client';

/**
 * SUPERADMIN ORGANIZER EDIT FORM
 * ==============================
 * Dual-mode form for organizers. Scaffolding (status, save/delete, notes,
 * modal) lives in entity-form-shell — this file is only fields + state.
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

export interface OrganizerFormData {
  id?: string;
  name: string;
  slug?: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  email: string | null;
  phone: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_membership_org: boolean;
}

type Props =
  | { mode: 'edit'; organizer: OrganizerFormData & { id: string; slug: string } }
  | { mode: 'create'; organizer?: undefined };

const EMPTY_FORM: OrganizerFormData = {
  name: '',
  description: '',
  logo_url: '',
  website_url: '',
  email: '',
  phone: '',
  meta_title: '',
  meta_description: '',
  is_active: true,
  is_verified: false,
  is_membership_org: false,
};

export function SuperadminOrganizerEditForm(props: Props) {
  const isCreate = props.mode === 'create';
  const initial: OrganizerFormData = isCreate
    ? EMPTY_FORM
    : {
        id: props.organizer.id,
        slug: props.organizer.slug,
        name: props.organizer.name || '',
        description: props.organizer.description || '',
        logo_url: props.organizer.logo_url || '',
        website_url: props.organizer.website_url || '',
        email: props.organizer.email || '',
        phone: props.organizer.phone || '',
        meta_title: props.organizer.meta_title || '',
        meta_description: props.organizer.meta_description || '',
        is_active: props.organizer.is_active,
        is_verified: !!props.organizer.is_verified,
        is_membership_org: !!props.organizer.is_membership_org,
      };

  const [state, setState] = useState<OrganizerFormData>(initial);
  // Mutable baseline for edit-mode diffing. Updated after each successful save
  // so the next PATCH only sends truly-changed fields.
  const [baseline, setBaseline] = useState<OrganizerFormData>(initial);

  const controller = useEntityForm<OrganizerFormData>(
    {
      kind: 'organizer',
      mode: props.mode,
      entityId: !isCreate ? props.organizer.id : undefined,
      entityName: !isCreate ? props.organizer.name : undefined,
      buildCreatePayload: (s) => ({
        name: s.name.trim(),
        description: s.description || null,
        logo_url: s.logo_url || null,
        website_url: s.website_url || null,
        email: s.email || null,
        phone: s.phone || null,
        meta_title: s.meta_title || null,
        meta_description: s.meta_description || null,
        is_verified: s.is_verified,
        is_membership_org: s.is_membership_org,
      }),
      buildUpdateDiff: (s) =>
        buildStringDiff(
          baseline as unknown as Record<string, unknown>,
          {
            name: s.name,
            description: s.description,
            logo_url: s.logo_url,
            website_url: s.website_url,
            email: s.email,
            phone: s.phone,
            meta_title: s.meta_title,
            meta_description: s.meta_description,
            is_active: s.is_active,
            is_verified: s.is_verified,
            is_membership_org: s.is_membership_org,
          },
          { nonNullable: ['name'] }
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

  return (
    <div className="space-y-6">
      <FormStatusBar status={controller.status} message={controller.message} />

      <div className="bg-pure border border-mist rounded-lg p-6 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-ink mb-2">
            Organizer Name <span className="text-red-600">*</span>
          </label>
          <input
            id="name"
            name="name"
            value={state.name}
            onChange={onChange}
            required
            className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none"
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
            className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none resize-y"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={state.email || ''}
              onChange={onChange}
              className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none"
              placeholder="contact@example.com"
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
              className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none"
            />
          </div>
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
              className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none"
              placeholder="https://..."
            />
          </div>
          <div>
            <label htmlFor="logo_url" className="block text-sm font-medium text-ink mb-2">
              Logo URL
            </label>
            <input
              type="url"
              id="logo_url"
              name="logo_url"
              value={state.logo_url || ''}
              onChange={onChange}
              className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none"
              placeholder="https://..."
            />
          </div>
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
                value={state.meta_description || ''}
                onChange={onChange}
                rows={2}
                className="w-full px-3 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none text-sm resize-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
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
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_verified"
              checked={state.is_verified}
              onChange={onChange}
              className="w-5 h-5 rounded border-mist text-blue focus:ring-blue"
            />
            <span className="text-sm text-ink">Verified</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_membership_org"
              checked={state.is_membership_org}
              onChange={onChange}
              className="w-5 h-5 rounded border-mist text-blue focus:ring-blue"
            />
            <span className="text-sm text-ink">Is a membership organization</span>
          </label>
        </div>

        <NotesField mode={props.mode} value={controller.notes} onChange={controller.setNotes} />
      </div>

      <FormActions
        mode={props.mode}
        entityLabel="Organizer"
        status={controller.status}
        onSave={controller.save}
        onRequestDelete={!isCreate ? controller.openDeleteConfirm : undefined}
      />

      {!isCreate && (
        <DeleteConfirmModal
          open={controller.showDeleteConfirm}
          entityLabel="Organizer"
          entityName={props.organizer.name}
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
