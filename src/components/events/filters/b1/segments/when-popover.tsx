/**
 * WHEN POPOVER — B1 picker
 * ========================
 * 2-column layout per spec:
 *   Left: Quick picks (2×3 grid of shorthand buttons)
 *   Right: Time of day chips + info card showing the interpreted range
 *
 * "Pick dates" opens a pair of native date inputs below the quick-pick grid.
 * Mobile: the two columns stack vertically.
 *
 * Controlled — the parent owns the FilterState slice (dateFrom, dateTo,
 * timeOfDay). We only issue onChange patches.
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import {
  WHEN_SHORTHANDS,
  WHEN_SHORTHAND_LABELS,
  shorthandToRange,
  rangeToShorthand,
  formatRangeForCard,
  type WhenShorthand,
} from '../when-shorthands';
import {
  TIME_OF_DAY_VALUES,
  TIME_OF_DAY_LABELS,
  TIME_OF_DAY_RANGE_LABELS,
} from '@/lib/constants/time-of-day';

interface WhenPatch {
  dateFrom?: string;
  dateTo?: string;
  timeOfDay?: string[];
}

interface WhenPopoverProps {
  dateFrom: string | undefined;
  dateTo: string | undefined;
  timeOfDay: string[];
  onChange: (patch: WhenPatch) => void;
}

export function WhenPopover({ dateFrom, dateTo, timeOfDay, onChange }: WhenPopoverProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const activeShorthand: WhenShorthand | null = rangeToShorthand(dateFrom, dateTo);
  const hasCustomRange = !activeShorthand && !!(dateFrom || dateTo);

  const selectShorthand = (s: WhenShorthand) => {
    if (activeShorthand === s) {
      // Toggle off — clear the range
      onChange({ dateFrom: undefined, dateTo: undefined });
      return;
    }
    const r = shorthandToRange(s);
    onChange({ dateFrom: r.dateFrom, dateTo: r.dateTo });
    setCustomOpen(false);
  };

  const toggleTimeOfDay = (bucket: string) => {
    const next = timeOfDay.includes(bucket)
      ? timeOfDay.filter((t) => t !== bucket)
      : [...timeOfDay, bucket];
    onChange({ timeOfDay: next });
  };

  const cardLabel = (() => {
    if (activeShorthand) return WHEN_SHORTHAND_LABELS[activeShorthand];
    if (dateFrom && dateTo) return 'Custom range';
    if (dateFrom) return `From ${dateFrom}`;
    if (dateTo) return `Until ${dateTo}`;
    return 'Anytime';
  })();
  const cardSub = (() => {
    if (dateFrom && dateTo) return formatRangeForCard(dateFrom, dateTo);
    if (activeShorthand) {
      const r = shorthandToRange(activeShorthand);
      return formatRangeForCard(r.dateFrom, r.dateTo);
    }
    return 'Any date works';
  })();

  return (
    <div className="rounded-2xl border border-mist bg-pure p-6 shadow-[0_20px_50px_rgba(2,2,3,0.14),0_2px_8px_rgba(2,2,3,0.06)]">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Column 1 — Quick picks */}
        <div>
          <div className="mb-3 text-[12px] font-bold uppercase tracking-[0.06em] text-zinc">
            Quick picks
          </div>
          <div className="grid grid-cols-2 gap-2">
            {WHEN_SHORTHANDS.map((s) => {
              const on = activeShorthand === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => selectShorthand(s)}
                  aria-pressed={on}
                  className={cn(
                    'rounded-xl border px-3.5 py-2.5 text-left text-[14px] font-semibold transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue',
                    on
                      ? 'border-ink bg-ink text-pure'
                      : 'border-mist bg-pure text-ink hover:border-ink/40'
                  )}
                >
                  {WHEN_SHORTHAND_LABELS[s]}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setCustomOpen((v) => !v)}
              aria-pressed={customOpen || hasCustomRange}
              className={cn(
                'rounded-xl border px-3.5 py-2.5 text-left text-[14px] font-semibold transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue',
                customOpen || hasCustomRange
                  ? 'border-ink bg-ink text-pure'
                  : 'border-mist bg-pure text-ink hover:border-ink/40'
              )}
            >
              Pick dates
            </button>
          </div>

          {(customOpen || hasCustomRange) && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc">
                From
                <input
                  type="date"
                  value={dateFrom ?? ''}
                  onChange={(e) => onChange({ dateFrom: e.target.value || undefined })}
                  className="rounded-lg border border-mist bg-pure px-3 py-2 text-[13px] font-medium text-ink focus:outline-none focus:ring-2 focus:ring-blue"
                />
              </label>
              <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc">
                To
                <input
                  type="date"
                  value={dateTo ?? ''}
                  onChange={(e) => onChange({ dateTo: e.target.value || undefined })}
                  className="rounded-lg border border-mist bg-pure px-3 py-2 text-[13px] font-medium text-ink focus:outline-none focus:ring-2 focus:ring-blue"
                />
              </label>
            </div>
          )}
        </div>

        {/* Column 2 — Time of day + info card */}
        <div>
          <div className="mb-3 text-[12px] font-bold uppercase tracking-[0.06em] text-zinc">
            Time of day
          </div>
          <div className="flex flex-wrap gap-2">
            {TIME_OF_DAY_VALUES.map((bucket) => {
              const on = timeOfDay.includes(bucket);
              return (
                <button
                  key={bucket}
                  type="button"
                  onClick={() => toggleTimeOfDay(bucket)}
                  aria-pressed={on}
                  title={TIME_OF_DAY_RANGE_LABELS[bucket]}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue',
                    on
                      ? 'border-ink bg-ink text-pure'
                      : 'border-mist bg-pure text-ink hover:border-ink/40'
                  )}
                >
                  {TIME_OF_DAY_LABELS[bucket]}
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl bg-ice p-3.5 text-[13px] text-ink">
            <div className="font-bold">{cardLabel}</div>
            <div className="text-zinc">{cardSub}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
