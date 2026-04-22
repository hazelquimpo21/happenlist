/**
 * HOURS EDITOR — weekly availability pattern for "ongoing" Singles.
 *
 * Controlled component. Given a Hours object (or null), renders a 7-day
 * grid with open/close time inputs per day. Supports multiple ranges per
 * day (e.g. lunch + dinner service), though the default row is one range.
 *
 * Used by: SuperadminEventEditForm. When populated, this event displays
 * as Single · Ongoing and the main feed excludes it unless
 * `includeLifestyle` is set.
 *
 * Shape contract: src/lib/events/hours-schema.ts. Stored as events.hours
 * JSONB.
 */

'use client';

import { useMemo } from 'react';
import { Plus, X, Clock } from 'lucide-react';
import { HOURS_DAY_KEYS, type Hours, type HoursDayKey, type HoursRange } from '@/lib/events/hours-schema';

interface Props {
  value: Hours | null;
  onChange: (next: Hours | null) => void;
}

const DAY_LABELS: Record<HoursDayKey, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
};

/** Deep-clone + patch a single day's ranges. */
function patchDay(hours: Hours | null, day: HoursDayKey, next: readonly HoursRange[] | undefined): Hours | null {
  const base: Record<string, readonly HoursRange[]> = {};
  for (const k of HOURS_DAY_KEYS) {
    const v = hours?.[k];
    if (v && v.length > 0) base[k] = v;
  }
  if (next && next.length > 0) base[day] = next;
  else delete base[day];
  if (Object.keys(base).length === 0) return null;
  return base as Hours;
}

export function HoursEditor({ value, onChange }: Props) {
  const enabled = value != null;

  // Stable list of days with their ranges (empty days missing from value
  // render as "Closed" with an "Add" button).
  const days = useMemo(() => {
    return HOURS_DAY_KEYS.map((key) => ({
      key,
      label: DAY_LABELS[key],
      ranges: value?.[key] ?? [],
    }));
  }, [value]);

  function toggle() {
    if (enabled) {
      onChange(null);
    } else {
      // Seed with Mon–Fri 9–5 as a sensible default; admin edits from there.
      onChange({
        mon: [['09:00', '17:00']],
        tue: [['09:00', '17:00']],
        wed: [['09:00', '17:00']],
        thu: [['09:00', '17:00']],
        fri: [['09:00', '17:00']],
      });
    }
  }

  function addRange(day: HoursDayKey) {
    const current = value?.[day] ?? [];
    onChange(patchDay(value, day, [...current, ['09:00', '17:00']]));
  }

  function updateRange(day: HoursDayKey, idx: number, which: 0 | 1, time: string) {
    const current = value?.[day] ?? [];
    const next = current.map((r, i): HoursRange => {
      if (i !== idx) return r;
      return which === 0 ? [time, r[1]] : [r[0], time];
    });
    onChange(patchDay(value, day, next));
  }

  function removeRange(day: HoursDayKey, idx: number) {
    const current = value?.[day] ?? [];
    const next = current.filter((_, i) => i !== idx);
    onChange(patchDay(value, day, next));
  }

  return (
    <div className="p-4 bg-teal-50/60 border border-teal-200/60 rounded-lg space-y-3">
      <div className="flex items-start gap-3">
        <Clock className="w-5 h-5 text-teal-700 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-teal-900">Weekly hours</p>
          <p className="text-xs text-teal-800/80 mt-0.5">
            For always-on events (museum exhibit, happy hour, ongoing class). Turn this on
            and the event renders as &ldquo;Open Tue–Fri 5–7pm&rdquo; instead of a single date.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={enabled}
            onChange={toggle}
            className="rounded border-teal-300"
          />
          <span className="text-teal-900">Enable</span>
        </label>
      </div>

      {enabled && (
        <div className="space-y-1 pt-2 border-t border-teal-200/60">
          {days.map(({ key, label, ranges }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-10 text-xs font-semibold text-teal-900">{label}</span>
              {ranges.length === 0 ? (
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs text-zinc italic">Closed</span>
                  <button
                    type="button"
                    onClick={() => addRange(key)}
                    className="ml-auto inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900"
                  >
                    <Plus className="w-3 h-3" />
                    Add hours
                  </button>
                </div>
              ) : (
                <div className="flex-1 space-y-1">
                  {ranges.map((r, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={r[0]}
                        onChange={(e) => updateRange(key, idx, 0, e.target.value)}
                        className="px-2 py-1 border border-teal-300 rounded text-sm bg-pure"
                      />
                      <span className="text-xs text-zinc">to</span>
                      <input
                        type="time"
                        value={r[1]}
                        onChange={(e) => updateRange(key, idx, 1, e.target.value)}
                        className="px-2 py-1 border border-teal-300 rounded text-sm bg-pure"
                      />
                      <button
                        type="button"
                        onClick={() => removeRange(key, idx)}
                        className="text-zinc hover:text-rose-600"
                        aria-label={`Remove ${label} hours ${idx + 1}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      {idx === ranges.length - 1 && (
                        <button
                          type="button"
                          onClick={() => addRange(key)}
                          className="ml-auto inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900"
                        >
                          <Plus className="w-3 h-3" />
                          Add range
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
