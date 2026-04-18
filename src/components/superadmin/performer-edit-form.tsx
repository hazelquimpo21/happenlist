'use client';

/**
 * SUPERADMIN PERFORMER EDIT FORM
 * ==============================
 * Dual-mode. Performer fields: name, slug (edit-only), bio, genre,
 * image_url, website_url, is_active.
 *
 * `is_active` was added in migration 20260418_1200 — any performer row
 * that predates it defaults to true (column default).
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

export interface PerformerFormData {
  id?: string;
  name: string;
  slug?: string;
  bio: string | null;
  genre: string | null;
  image_url: string | null;
  website_url: string | null;
  is_active: boolean;
}

type Props =
  | { mode: 'edit'; performer: PerformerFormData & { id: string; slug: string } }
  | { mode: 'create'; performer?: undefined };

const EMPTY_FORM: PerformerFormData = {
  name: '',
  bio: '',
  genre: '',
  image_url: '',
  website_url: '',
  is_active: true,
};

export function SuperadminPerformerEditForm(props: Props) {
  const isCreate = props.mode === 'create';
  const initial: PerformerFormData = isCreate
    ? EMPTY_FORM
    : {
        id: props.performer.id,
        slug: props.performer.slug,
        name: props.performer.name || '',
        bio: props.performer.bio || '',
        genre: props.performer.genre || '',
        image_url: props.performer.image_url || '',
        website_url: props.performer.website_url || '',
        is_active: props.performer.is_active,
      };

  const [state, setState] = useState<PerformerFormData>(initial);
  const [baseline, setBaseline] = useState<PerformerFormData>(initial);

  const controller = useEntityForm<PerformerFormData>(
    {
      kind: 'performer',
      mode: props.mode,
      entityId: !isCreate ? props.performer.id : undefined,
      entityName: !isCreate ? props.performer.name : undefined,
      buildCreatePayload: (s) => ({
        name: s.name.trim(),
        bio: s.bio || null,
        genre: s.genre || null,
        image_url: s.image_url || null,
        website_url: s.website_url || null,
      }),
      buildUpdateDiff: (s) =>
        buildStringDiff(
          baseline as unknown as Record<string, unknown>,
          {
            name: s.name,
            bio: s.bio,
            genre: s.genre,
            image_url: s.image_url,
            website_url: s.website_url,
            is_active: s.is_active,
          },
          { nonNullable: ['name'] }
        ),
      onAfterSave: () => setBaseline(state),
    },
    state
  );

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
            Performer Name <span className="text-red-600">*</span>
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
          <label htmlFor="genre" className="block text-sm font-medium text-ink mb-2">
            Genre
          </label>
          <input
            id="genre"
            name="genre"
            value={state.genre || ''}
            onChange={onChange}
            placeholder="Jazz, Indie Rock, Folk..."
            className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none"
          />
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-ink mb-2">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            value={state.bio || ''}
            onChange={onChange}
            rows={6}
            className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none resize-y"
          />
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
              className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none"
            />
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
              placeholder="https://..."
              className="w-full px-4 py-2 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none"
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
        entityLabel="Performer"
        status={controller.status}
        onSave={controller.save}
        onRequestDelete={!isCreate ? controller.openDeleteConfirm : undefined}
      />

      {!isCreate && (
        <DeleteConfirmModal
          open={controller.showDeleteConfirm}
          entityLabel="Performer"
          entityName={props.performer.name}
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
