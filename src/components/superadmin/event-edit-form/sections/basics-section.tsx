/**
 * Basics section
 * ===============
 * Title, image, short description, full description, category.
 * Extracted from event-edit-form/index.tsx as part of the Phase B
 * structural pass.
 *
 * @module components/superadmin/event-edit-form/sections/basics-section
 */
'use client';

import { ChevronDown } from 'lucide-react';
import { FieldRow, inputClass } from '@/components/admin/form-shell';
import { FieldHeuristicFlag } from '../../field-heuristic-flag';
import { EventImageEditor } from '../../event-image-editor';
import { checkField } from '@/lib/admin/field-heuristics';
import type { SectionBaseProps } from './types';

interface Props extends SectionBaseProps {
  eventId: string;
  categories: { id: string; name: string; slug: string; icon: string | null }[];
}

export function BasicsSection({
  formState,
  setFormState,
  resetStatus,
  heuristicEvent,
  eventId,
  categories,
}: Props) {
  return (
    <div className="space-y-5">
      <FieldRow
        label="Event title"
        htmlFor="title"
        labelRight={<FieldHeuristicFlag flag={checkField(heuristicEvent, 'title')} />}
      >
        <input
          type="text"
          id="title"
          name="title"
          value={formState.title}
          onChange={(e) => {
            setFormState((p) => ({ ...p, title: e.target.value }));
            resetStatus();
          }}
          className={inputClass}
          placeholder="Enter event title…"
        />
      </FieldRow>

      <div className="rounded-lg border border-mist/60 bg-cloud/40 p-3">
        <EventImageEditor
          eventId={eventId}
          value={formState.image_url}
          onChange={(next) => {
            setFormState((p) => ({ ...p, image_url: next }));
            resetStatus();
          }}
        />
      </div>

      <FieldRow
        label="Short description"
        htmlFor="short_description"
        hint="(for cards, max 160 chars)"
        labelRight={
          <FieldHeuristicFlag flag={checkField(heuristicEvent, 'short_description')} />
        }
        helper={`${formState.short_description.length}/160 characters`}
      >
        <textarea
          id="short_description"
          name="short_description"
          value={formState.short_description}
          onChange={(e) => {
            setFormState((p) => ({ ...p, short_description: e.target.value }));
            resetStatus();
          }}
          rows={2}
          maxLength={160}
          className={`${inputClass} resize-none`}
          placeholder="Brief description for event cards…"
        />
      </FieldRow>

      <FieldRow label="Full description" htmlFor="description">
        <textarea
          id="description"
          name="description"
          value={formState.description}
          onChange={(e) => {
            setFormState((p) => ({ ...p, description: e.target.value }));
            resetStatus();
          }}
          rows={6}
          className={`${inputClass} resize-y`}
          placeholder="Full event description…"
        />
      </FieldRow>

      {categories.length > 0 && (
        <FieldRow
          label="Category"
          htmlFor="category_id"
          labelRight={<FieldHeuristicFlag flag={checkField(heuristicEvent, 'category')} />}
        >
          <div className="relative">
            <select
              id="category_id"
              name="category_id"
              value={formState.category_id}
              onChange={(e) => {
                setFormState((p) => ({ ...p, category_id: e.target.value }));
                resetStatus();
              }}
              className={`${inputClass} appearance-none pr-10`}
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc pointer-events-none" />
          </div>
        </FieldRow>
      )}
    </div>
  );
}
