/**
 * When section
 * =============
 * Date, time, all-day flag, weekly hours (for ongoing/single events).
 * Extracted from event-edit-form/index.tsx (Phase B).
 *
 * @module components/superadmin/event-edit-form/sections/when-section
 */
'use client';

import { FieldRow, inputClass } from '@/components/admin/form-shell';
import { HoursEditor } from '@/components/admin/hours-editor';
import type { SectionBaseProps } from './types';

export function WhenSection({ formState, setFormState, resetStatus }: SectionBaseProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow label="Start date & time" htmlFor="start_datetime">
          <input
            type="datetime-local"
            id="start_datetime"
            name="start_datetime"
            value={formState.start_datetime}
            onChange={(e) => {
              setFormState((p) => ({ ...p, start_datetime: e.target.value }));
              resetStatus();
            }}
            className={inputClass}
          />
        </FieldRow>

        <FieldRow label="End date & time" htmlFor="end_datetime" hint="(optional)">
          <input
            type="datetime-local"
            id="end_datetime"
            name="end_datetime"
            value={formState.end_datetime}
            onChange={(e) => {
              setFormState((p) => ({ ...p, end_datetime: e.target.value }));
              resetStatus();
            }}
            className={inputClass}
          />
        </FieldRow>
      </div>

      <p className="text-xs text-zinc -mt-2">
        Times stored in <span className="font-mono text-ink">America/Chicago</span>.
      </p>

      <label className="flex items-center gap-3 cursor-pointer pt-1">
        <input
          type="checkbox"
          name="is_all_day"
          checked={formState.is_all_day}
          onChange={(e) => {
            setFormState((p) => ({ ...p, is_all_day: e.target.checked }));
            resetStatus();
          }}
          className="w-4 h-4 rounded border-mist text-blue focus:ring-2 focus:ring-blue/30"
        />
        <span className="text-sm text-ink">This is an all-day event</span>
      </label>

      <div className="pt-3 border-t border-mist/60">
        <HoursEditor
          value={formState.hours}
          onChange={(next) => {
            setFormState((p) => ({ ...p, hours: next }));
            resetStatus();
          }}
        />
      </div>
    </div>
  );
}
