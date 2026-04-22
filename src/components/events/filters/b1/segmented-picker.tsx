/**
 * =============================================================================
 * SEGMENTED PICKER — B1 core component
 * =============================================================================
 *
 * A single pill containing 4 segments (Category · When · Good for · Budget)
 * + a CTA button. Clicking a segment opens its popover directly below the
 * pill; only one popover open at a time; click same segment or outside to
 * close.
 *
 * Two variants:
 *   - "hero" (homepage) — rounded 999px, shadow `0 10px 40px rgba(...)`,
 *     centered inline-flex, larger CTA label.
 *   - "inline" (archive) — no outer shadow, full-width flex, rounded pill,
 *     count CTA reads "Show N".
 *
 * Controlled component: takes FilterState + handlers, calls the right
 * patches back through `onPatch` (a partial-merge updater) or `onReset`.
 *
 * The picker uses a local `openSeg` state for which popover is open;
 * everything else is derived from props. On outside click (document
 * pointerdown outside the wrapper), it auto-closes.
 *
 * Cross-file coupling:
 *   - segments/*-popover.tsx — opened per segment
 *   - segment-value.ts — computes the value line
 *   - b1-segments.ts — declares the 4 segments
 *   - types.ts — FilterState shape
 * =============================================================================
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import type { FilterState } from '../types';
import { SEGMENTS, type SegmentId } from '@/lib/filters/b1-segments';
import { getSegmentDisplay } from './segment-value';
import {
  IconTag,
  IconClock,
  IconSparkles,
  IconWallet,
  IconSearch,
} from './picker-icons';
import { CategoryPopover, type CategoryPopoverItem } from './segments/category-popover';
import { WhenPopover } from './segments/when-popover';
import { GoodForPopover } from './segments/good-for-popover';
import { BudgetPopover } from './segments/budget-popover';

type Variant = 'hero' | 'inline';

interface SegmentedPickerProps {
  variant: Variant;
  state: FilterState;
  categories: readonly CategoryPopoverItem[];
  /** Merge a partial FilterState patch into the current state. */
  onPatch: (patch: Partial<FilterState>) => void;
  /** CTA label — "Find events" on hero, "Show N" with a count on archive. */
  ctaLabel: string;
  /** Called when the CTA button is clicked. */
  onCtaClick?: () => void;
  /** Slot rendered to the right of the picker pill (e.g. "More" button). */
  rightSlot?: React.ReactNode;
}

const ICON_BY_SEGMENT: Record<SegmentId, (props: { size?: number }) => JSX.Element> = {
  'category': IconTag,
  'when': IconClock,
  'good-for': IconSparkles,
  'budget': IconWallet,
};

export function SegmentedPicker({
  variant,
  state,
  categories,
  onPatch,
  ctaLabel,
  onCtaClick,
  rightSlot,
}: SegmentedPickerProps) {
  const [openSeg, setOpenSeg] = useState<SegmentId | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Close on outside pointerdown. We watch the whole wrapper (picker + popover)
  // so clicks inside the popover don't close it. Escape also closes.
  useEffect(() => {
    if (!openSeg) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpenSeg(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenSeg(null);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [openSeg]);

  const lookupCategoryName = useCallback(
    (slug: string) => categories.find((c) => c.slug === slug)?.name,
    [categories]
  );

  const isHero = variant === 'hero';

  return (
    <div
      ref={wrapperRef}
      className={cn(
        'w-full',
        isHero && 'flex flex-col items-center'
      )}
    >
      <div className={cn('relative z-[25]', isHero ? 'inline-flex' : 'flex w-full')}>
        {/* Picker pill + CTA */}
        <div
          className={cn(
            'flex items-stretch rounded-full border border-mist bg-pure p-1.5',
            isHero
              ? 'shadow-[0_10px_40px_rgba(2,2,3,0.10)]'
              : 'shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex-1 min-w-0'
          )}
        >
          {SEGMENTS.map((seg, i) => {
            const Icon = ICON_BY_SEGMENT[seg.id];
            const display = getSegmentDisplay(seg.id, state, {
              lookupCategoryName,
              placeholder: seg.placeholder,
            });
            const isOpen = openSeg === seg.id;
            return (
              <div key={seg.id} className={cn('flex items-stretch', !isHero && 'flex-1 min-w-0')}>
                {i > 0 && (
                  <div aria-hidden="true" className="my-2.5 w-px bg-mist" />
                )}
                <button
                  type="button"
                  onClick={() => setOpenSeg(isOpen ? null : seg.id)}
                  aria-haspopup="dialog"
                  aria-expanded={isOpen}
                  aria-label={seg.ariaLabel}
                  className={cn(
                    // Inner segment corners: first rounds left, last rounds right,
                    // middle stays square so adjacent segments don't render as
                    // individual stadium pills inside the outer container.
                    'flex flex-col justify-center px-5 py-2 text-left transition-colors',
                    i === 0 && 'rounded-l-full',
                    i === SEGMENTS.length - 1 && 'rounded-r-full',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue',
                    isOpen ? 'bg-cloud' : 'hover:bg-cloud/60',
                    !isHero && 'min-w-0 flex-1'
                  )}
                >
                  <span
                    className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-zinc"
                  >
                    <span style={{ color: display.accent ?? '#71717A' }}>
                      <Icon size={14} />
                    </span>
                    {seg.label}
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 flex items-center gap-1.5 text-[14px] truncate',
                      display.hasValue ? 'font-bold text-ink' : 'font-medium text-zinc'
                    )}
                  >
                    {display.hasValue && display.accent && (
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: display.accent }}
                      />
                    )}
                    <span className="truncate">{display.text}</span>
                  </span>
                </button>
              </div>
            );
          })}

          <button
            type="button"
            onClick={onCtaClick}
            className={cn(
              'ml-1.5 flex items-center gap-1.5 rounded-full bg-blue px-5 text-[14px] font-bold text-pure transition-colors hover:bg-blue-dark',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2',
              'whitespace-nowrap'
            )}
          >
            <IconSearch size={15} />
            {ctaLabel}
          </button>
        </div>

        {rightSlot && <div className="ml-2 flex items-center">{rightSlot}</div>}
      </div>

      {/* Popover — anchored BELOW the picker in DOM order, centered under hero
          variant or stretched full-width under inline variant */}
      {openSeg && (
        <div
          role="dialog"
          aria-label={`${openSeg} filter`}
          className={cn(
            'relative z-[40] mt-3',
            isHero ? 'w-full max-w-[720px]' : 'w-full'
          )}
        >
          {openSeg === 'category' && (
            <CategoryPopover
              categories={categories}
              active={state.category}
              onChange={(slug) => onPatch({ category: slug })}
            />
          )}
          {openSeg === 'when' && (
            <WhenPopover
              dateFrom={state.dateFrom}
              dateTo={state.dateTo}
              timeOfDay={state.timeOfDay}
              onChange={(patch) => onPatch(patch)}
            />
          )}
          {openSeg === 'good-for' && (
            <GoodForPopover
              activePreset={state.interestPreset}
              onChange={(id) => onPatch({ interestPreset: id })}
            />
          )}
          {openSeg === 'budget' && (
            <BudgetPopover
              priceTier={state.priceTier}
              onChange={(next) =>
                // Keep legacy isFree in lockstep — clearing Free removes both
                onPatch({
                  priceTier: next,
                  isFree: next.includes('free'),
                })
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
