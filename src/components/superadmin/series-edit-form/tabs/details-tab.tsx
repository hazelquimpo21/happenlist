/**
 * Details tab — title, descriptions, type, status, pricing, links, SEO,
 * featured flag, audit notes.
 *
 * Owns its own Save Changes button at the bottom (each tab is an
 * independent surface). Series uses tabs rather than full-page save
 * because the four tabs hit different API paths.
 *
 * @module components/superadmin/series-edit-form/tabs/details-tab
 */
'use client';

import { ChevronDown, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FieldRow, inputClass } from '@/components/admin/form-shell';
import {
  SERIES_TYPES,
  SERIES_PRICE_TYPES,
  SERIES_STATUS_OPTIONS,
  type SeriesFormState,
} from '../helpers';

interface Props {
  formState: SeriesFormState;
  setFormState: React.Dispatch<React.SetStateAction<SeriesFormState>>;
  notes: string;
  setNotes: (next: string) => void;
  onSave: () => void;
  isSaving: boolean;
  isDirty: boolean;
  dirtyCount: number;
}

export function DetailsTab({
  formState,
  setFormState,
  notes,
  setNotes,
  onSave,
  isSaving,
  isDirty,
  dirtyCount,
}: Props) {
  const showPriceFields =
    formState.price_type !== 'free' && formState.price_type !== 'varies';
  const update = <K extends keyof SeriesFormState>(key: K, value: SeriesFormState[K]) =>
    setFormState((p) => ({ ...p, [key]: value }));

  return (
    <div className="space-y-5">
      <FieldRow label="Series title" htmlFor="title">
        <input
          type="text"
          id="title"
          value={formState.title}
          onChange={(e) => update('title', e.target.value)}
          className={inputClass}
        />
      </FieldRow>

      <FieldRow
        label="Short description"
        htmlFor="short_description"
        hint="(max 160 chars)"
        helper={`${formState.short_description.length}/160`}
      >
        <textarea
          id="short_description"
          value={formState.short_description}
          onChange={(e) => update('short_description', e.target.value)}
          rows={2}
          maxLength={160}
          className={`${inputClass} resize-none`}
        />
      </FieldRow>

      <FieldRow label="Full description" htmlFor="description">
        <textarea
          id="description"
          value={formState.description}
          onChange={(e) => update('description', e.target.value)}
          rows={6}
          className={`${inputClass} resize-y`}
        />
      </FieldRow>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow label="Series type" htmlFor="series_type">
          <SelectWrap>
            <select
              id="series_type"
              value={formState.series_type}
              onChange={(e) => update('series_type', e.target.value)}
              className={`${inputClass} appearance-none pr-10`}
            >
              {SERIES_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </SelectWrap>
        </FieldRow>
        <FieldRow label="Status" htmlFor="status">
          <SelectWrap>
            <select
              id="status"
              value={formState.status}
              onChange={(e) => update('status', e.target.value)}
              className={`${inputClass} appearance-none pr-10`}
            >
              {SERIES_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </SelectWrap>
        </FieldRow>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FieldRow label="Price type" htmlFor="price_type">
          <SelectWrap>
            <select
              id="price_type"
              value={formState.price_type}
              onChange={(e) => update('price_type', e.target.value)}
              className={`${inputClass} appearance-none pr-10`}
            >
              {SERIES_PRICE_TYPES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </SelectWrap>
        </FieldRow>
        {showPriceFields && (
          <>
            <FieldRow
              label={formState.price_type === 'range' ? 'Min price ($)' : 'Price ($)'}
              htmlFor="price_low"
            >
              <input
                type="number"
                id="price_low"
                value={formState.price_low}
                onChange={(e) => update('price_low', e.target.value)}
                min="0"
                step="0.01"
                className={inputClass}
              />
            </FieldRow>
            {formState.price_type === 'range' && (
              <FieldRow label="Max price ($)" htmlFor="price_high">
                <input
                  type="number"
                  id="price_high"
                  value={formState.price_high}
                  onChange={(e) => update('price_high', e.target.value)}
                  min="0"
                  step="0.01"
                  className={inputClass}
                />
              </FieldRow>
            )}
          </>
        )}
      </div>

      <FieldRow label="Registration URL" htmlFor="registration_url">
        <input
          type="url"
          id="registration_url"
          value={formState.registration_url}
          onChange={(e) => update('registration_url', e.target.value)}
          className={inputClass}
          placeholder="https://…"
        />
      </FieldRow>

      <FieldRow label="Image URL" htmlFor="image_url">
        <input
          type="url"
          id="image_url"
          value={formState.image_url}
          onChange={(e) => update('image_url', e.target.value)}
          className={inputClass}
          placeholder="https://…"
        />
      </FieldRow>

      <div className="rounded-lg border border-mist/60 bg-cloud/40 p-4 space-y-3">
        <p className="text-sm font-medium text-ink">SEO</p>
        <FieldRow label="Meta title" htmlFor="meta_title">
          <input
            type="text"
            id="meta_title"
            value={formState.meta_title}
            onChange={(e) => update('meta_title', e.target.value)}
            className={inputClass}
          />
        </FieldRow>
        <FieldRow label="Meta description" htmlFor="meta_description">
          <textarea
            id="meta_description"
            value={formState.meta_description}
            onChange={(e) => update('meta_description', e.target.value)}
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </FieldRow>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={formState.is_featured}
          onChange={(e) => update('is_featured', e.target.checked)}
          className="w-4 h-4 rounded border-mist text-blue focus:ring-2 focus:ring-blue/30"
        />
        <span className="text-sm text-ink">Featured series</span>
      </label>

      <FieldRow
        label="Audit note"
        htmlFor="notes"
        hint="(optional)"
        helper="Stored in the audit log alongside this edit."
      >
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={`${inputClass} resize-none`}
          placeholder="What changed and why?"
        />
      </FieldRow>

      <div className="flex justify-end pt-2 border-t border-mist">
        <Button
          onClick={onSave}
          disabled={isSaving || !isDirty}
          className="gap-1.5 bg-blue hover:bg-blue/90 text-white"
        >
          <Save className="w-4 h-4" />
          {isSaving
            ? 'Saving…'
            : dirtyCount > 0
            ? `Save (${dirtyCount})`
            : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}

function SelectWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc pointer-events-none" />
    </div>
  );
}
