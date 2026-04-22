/**
 * GOOD-FOR POPOVER — B1 picker
 * ============================
 * Single row of pill buttons for the occasion-framed presets ("Date night",
 * "With kids", etc.). Single-select via FilterState.interestPreset. We
 * intentionally do NOT surface raw `goodFor[]` multi-select here — that lives
 * in the "More" drawer, where the full audience taxonomy can spread out
 * without overwhelming the picker.
 *
 * If a preset is picked, the archive's existing `resolveInterestPresetGoodFor`
 * on the server expands the preset into a goodFor union — so the query stays
 * accurate while the picker stays simple.
 */

'use client';

import { cn } from '@/lib/utils/cn';
import { INTEREST_PRESETS } from '@/lib/constants/interest-presets';

interface GoodForPopoverProps {
  activePreset: string | undefined;
  onChange: (presetId: string | undefined) => void;
}

export function GoodForPopover({ activePreset, onChange }: GoodForPopoverProps) {
  return (
    <div className="rounded-2xl border border-mist bg-pure p-6 shadow-[0_20px_50px_rgba(2,2,3,0.14),0_2px_8px_rgba(2,2,3,0.06)]">
      <div className="mb-3 text-[12px] font-bold uppercase tracking-[0.06em] text-zinc">
        {'Who\u2019s it for?'}
      </div>
      <div className="flex flex-wrap gap-2">
        {INTEREST_PRESETS.map((preset) => {
          const on = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(on ? undefined : preset.id)}
              aria-pressed={on}
              title={preset.description}
              className={cn(
                'rounded-full border px-4 py-2.5 text-[14px] font-semibold transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue',
                on
                  ? 'border-ink bg-ink text-pure'
                  : 'border-mist bg-pure text-ink hover:border-ink/40'
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
