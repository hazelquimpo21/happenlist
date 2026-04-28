/**
 * System section
 * ===============
 * Status select + audit notes textarea. Status is also surfaced in the
 * sticky command bar — this section is where the operator can read the
 * full status hint and add a longer audit note.
 *
 * @module components/superadmin/event-edit-form/sections/system-section
 */
'use client';

import { ChevronDown } from 'lucide-react';
import { FieldRow, inputClass } from '@/components/admin/form-shell';
import {
  STATUS_ORDER,
  STATUS_META,
  type EventStatus,
} from '@/lib/constants/admin-status-palette';

interface Props {
  status: string;
  onStatusChange: (next: string) => void;
  notes: string;
  onNotesChange: (next: string) => void;
}

export function SystemSection({ status, onStatusChange, notes, onNotesChange }: Props) {
  const meta = STATUS_META[status as EventStatus] ?? STATUS_META.draft;

  return (
    <div className="space-y-5">
      <FieldRow
        label="Event status"
        htmlFor="status"
        helper={meta.hint}
      >
        <div className="relative">
          <select
            id="status"
            name="status"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className={`${inputClass} appearance-none pr-10`}
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc pointer-events-none" />
        </div>
      </FieldRow>

      <FieldRow
        label="Audit note"
        htmlFor="notes"
        hint="(optional)"
        helper="Stored in the audit log alongside this edit."
      >
        <textarea
          id="notes"
          name="notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={2}
          className={`${inputClass} resize-none`}
          placeholder="What changed and why?"
        />
      </FieldRow>
    </div>
  );
}
