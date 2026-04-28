'use client';

/**
 * SUPERADMIN MEMBERSHIP ORG EDIT FORM
 * ===================================
 * Dual-mode form for `membership_organizations`.
 * Fields: name, slug (edit-only), description, website_url, logo_url,
 * organizer_id (dropdown), is_active.
 *
 * The organizers list for the picker comes from the server (passed in via
 * the `organizers` prop) — avoids a client fetch round-trip on mount.
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
import type { PickerOrganizer } from '@/data/admin/get-organizers-for-picker';

export interface MembershipOrgFormData {
  id?: string;
  name: string;
  slug?: string;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  organizer_id: string | null;
  is_active: boolean;
}

type Props =
  | {
      mode: 'edit';
      membershipOrg: MembershipOrgFormData & { id: string; slug: string };
      organizers: PickerOrganizer[];
    }
  | { mode: 'create'; membershipOrg?: undefined; organizers: PickerOrganizer[] };

const EMPTY_FORM: MembershipOrgFormData = {
  name: '',
  description: '',
  website_url: '',
  logo_url: '',
  organizer_id: null,
  is_active: true,
};

export function SuperadminMembershipOrgEditForm(props: Props) {
  const isCreate = props.mode === 'create';
  const initial: MembershipOrgFormData = isCreate
    ? EMPTY_FORM
    : {
        id: props.membershipOrg.id,
        slug: props.membershipOrg.slug,
        name: props.membershipOrg.name || '',
        description: props.membershipOrg.description || '',
        website_url: props.membershipOrg.website_url || '',
        logo_url: props.membershipOrg.logo_url || '',
        organizer_id: props.membershipOrg.organizer_id,
        is_active: props.membershipOrg.is_active,
      };

  const [state, setState] = useState<MembershipOrgFormData>(initial);
  const [baseline, setBaseline] = useState<MembershipOrgFormData>(initial);

  const controller = useEntityForm<MembershipOrgFormData>(
    {
      kind: 'membership_org',
      mode: props.mode,
      entityId: !isCreate ? props.membershipOrg.id : undefined,
      entityName: !isCreate ? props.membershipOrg.name : undefined,
      buildCreatePayload: (s) => ({
        name: s.name.trim(),
        description: s.description || null,
        website_url: s.website_url || null,
        logo_url: s.logo_url || null,
        organizer_id: s.organizer_id || null,
      }),
      buildUpdateDiff: (s) =>
        buildStringDiff(
          baseline as unknown as Record<string, unknown>,
          {
            name: s.name,
            description: s.description,
            website_url: s.website_url,
            logo_url: s.logo_url,
            organizer_id: s.organizer_id,
            is_active: s.is_active,
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
    setState((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox' ? checked : name === 'organizer_id' ? value || null : value,
    }));
    controller.resetStatus();
  };

  return (
    <div className="space-y-6">
      <FormStatusBar status={controller.status} message={controller.message} />

      <div className="bg-pure border border-mist rounded-lg p-6 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-ink mb-2">
            Organization Name <span className="text-red-600">*</span>
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
          <label htmlFor="organizer_id" className="block text-sm font-medium text-ink mb-2">
            Linked Organizer
          </label>
          <select
            id="organizer_id"
            name="organizer_id"
            value={state.organizer_id || ''}
            onChange={onChange}
            className="w-full px-4 py-2 border border-mist rounded-lg focus:border-blue focus:ring-2 focus:ring-blue/30 outline-none bg-white"
          >
            <option value="">— None —</option>
            {props.organizers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
                {o.is_membership_org ? ' (membership org)' : ''}
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc mt-1">
            Optional. Connects this membership bundle to an organizer record.
          </p>
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
              placeholder="https://..."
              className="w-full px-4 py-2 border border-mist rounded-lg focus:border-blue focus:ring-2 focus:ring-blue/30 outline-none"
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
              placeholder="https://..."
              className="w-full px-4 py-2 border border-mist rounded-lg focus:border-blue focus:ring-2 focus:ring-blue/30 outline-none"
            />
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
        entityLabel="Membership Org"
        status={controller.status}
        onSave={controller.save}
        onRequestDelete={!isCreate ? controller.openDeleteConfirm : undefined}
      />

      {!isCreate && (
        <DeleteConfirmModal
          open={controller.showDeleteConfirm}
          entityLabel="Membership Org"
          entityName={props.membershipOrg.name}
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
