/**
 * =============================================================================
 * HOME HERO — B1 landing band with centered segmented picker
 * =============================================================================
 *
 * Full-bleed `bg-ice` band. Centered content: time-aware eyebrow + big H1
 * + subtitle + segmented picker. Clicking the CTA navigates to /events
 * with the currently-picked filters serialized into the URL.
 *
 * Unlike the archive picker (PickerBar), the home hero owns LOCAL state —
 * the homepage URL stays clean while the user dials in. URL serialization
 * happens only at navigation time.
 *
 * Cross-file coupling:
 *   - src/components/events/filters/b1/segmented-picker.tsx (hero variant)
 *   - src/components/events/filters/types.ts (FilterState + serializer)
 *   - src/app/events/page.tsx (destination)
 * =============================================================================
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SegmentedPicker } from '@/components/events/filters/b1/segmented-picker';
import {
  EMPTY_FILTER_STATE,
  serializeFiltersToParams,
  type FilterState,
} from '@/components/events/filters/types';
import type { CategoryPopoverItem } from '@/components/events/filters/b1/segments/category-popover';

interface HomeHeroProps {
  /** Count shown in the subtitle — "N events on right now". */
  eventCount: number;
  /** Categories for the Category popover. */
  categories: readonly CategoryPopoverItem[];
}

function computeGreetingEyebrow(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 5) return 'Happening in Milwaukee';
  if (h < 12) return 'This morning in Milwaukee';
  if (h < 17) return 'This afternoon in Milwaukee';
  return 'Tonight in Milwaukee';
}

export function HomeHero({ eventCount, categories }: HomeHeroProps) {
  const router = useRouter();
  const [state, setState] = useState<FilterState>(EMPTY_FILTER_STATE);

  const onPatch = (partial: Partial<FilterState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  };

  const onFind = () => {
    const params = serializeFiltersToParams(state);
    const qs = params.toString();
    router.push(qs ? `/events?${qs}` : '/events');
  };

  // Eyebrow uses a deterministic SSR default ("Happening in Milwaukee") and
  // only updates on the client after mount. This avoids a hydration mismatch
  // on a user-local time-of-day string (server and client may fall in
  // different "afternoon/evening" buckets).
  const [eyebrow, setEyebrow] = useState('Happening in Milwaukee');
  useEffect(() => {
    setEyebrow(computeGreetingEyebrow());
  }, []);

  return (
    <section className="bg-ice px-8 pb-10 pt-12">
      <div className="mx-auto max-w-[1100px] text-center">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-teal">
          {eyebrow}
        </p>
        <h1 className="mt-2.5 text-[44px] font-extrabold leading-[1] tracking-[-0.03em] text-ink md:text-[56px]">
          What are you in the mood for?
        </h1>
        <p className="mx-auto mt-3.5 max-w-[520px] text-[16px] text-zinc">
          {eventCount > 0
            ? `${eventCount} events on right now. Pick a mood — we\u2019ll do the rest.`
            : 'Pick a mood — we\u2019ll show you what\u2019s happening.'}
        </p>

        <div className="mt-7 flex justify-center">
          <SegmentedPicker
            variant="hero"
            state={state}
            categories={categories}
            onPatch={onPatch}
            ctaLabel="Find events"
            onCtaClick={onFind}
          />
        </div>
      </div>
    </section>
  );
}
