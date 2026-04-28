/**
 * EVENT EDIT FORM — SERIES OCCURRENCES SCOPE SELECTOR
 * ====================================================
 * Radio scope selector that controls whether superadmin edits propagate to
 * sibling occurrences in a recurring series. Only rendered when the event is
 * already part of a series.
 *
 * Date/time edits always stay on the current row only — the parent form
 * enforces this; this component just shows the scope toggle + the inline
 * disclaimer when scope ≠ 'single'.
 *
 * Extracted from the original monolithic event-edit-form.tsx (2026-04-22 split).
 *
 * @module components/superadmin/event-edit-form/series-occurrences-scope
 */

'use client';

import { Layers } from 'lucide-react';
import type { OccurrenceScope } from './helpers';

interface SeriesOccurrencesScopeProps {
  seriesId: string;
  value: OccurrenceScope;
  onChange: (next: OccurrenceScope) => void;
}

export function SeriesOccurrencesScope({ seriesId, value, onChange }: SeriesOccurrencesScopeProps) {
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start gap-3">
        <Layers className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-blue-900">Part of a recurring series</p>
            <a
              href={`/admin/series/${seriesId}/edit`}
              className="text-xs text-blue-700 hover:text-blue-900 underline"
            >
              Edit the series →
            </a>
          </div>
          <p className="text-sm text-blue-800/90 mt-1">
            You&apos;re editing a single date in this series. Changes to title, description,
            pricing, venue, organizer, category, links, or tags can optionally propagate
            to sibling dates. <strong>Date/time edits always stay on this row only.</strong>
          </p>
          <div className="mt-3 space-y-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="radio" name="occurrenceScope" value="single"
                checked={value === 'single'} onChange={() => onChange('single')}
                className="w-4 h-4 mt-0.5 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-blue-900">
                <span className="font-medium">Just this date</span>
                <span className="block text-xs text-blue-700/80">Only this occurrence changes. Siblings untouched.</span>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="radio" name="occurrenceScope" value="all"
                checked={value === 'all'} onChange={() => onChange('all')}
                className="w-4 h-4 mt-0.5 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-blue-900">
                <span className="font-medium">This date + every other date in the series</span>
                <span className="block text-xs text-blue-700/80">Applies shared fields to all siblings.</span>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="radio" name="occurrenceScope" value="future"
                checked={value === 'future'} onChange={() => onChange('future')}
                className="w-4 h-4 mt-0.5 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-blue-900">
                <span className="font-medium">This date + all future dates</span>
                <span className="block text-xs text-blue-700/80">Past siblings stay as-is. New copy applies going forward.</span>
              </span>
            </label>
          </div>
          {value !== 'single' && (
            <p className="text-xs text-blue-800 mt-2 bg-blue-100 border border-blue-200 rounded px-2 py-1.5">
              ⓘ Date + time changes always stay on this row. To change the schedule for the whole series, use the series editor.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
