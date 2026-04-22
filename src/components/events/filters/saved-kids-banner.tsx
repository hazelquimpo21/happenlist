/**
 * =============================================================================
 * SavedKidsBanner — "welcome back — here are your kids' events" banner
 * =============================================================================
 *
 * Appears at the top of the filter bar when localStorage has a saved kid-age
 * selection AND that selection isn't already active in the URL.
 *
 * One-tap "Apply" sets interestPreset=with-kids + ageGroup[] to the saved
 * slugs, so the page reloads showing the parent's kid-appropriate events
 * without requiring them to re-pick anything.
 *
 * "Clear" wipes the localStorage entry so the banner won't appear again
 * until the parent opts back in through the With Kids expander.
 *
 * Why opt-in apply instead of auto-apply on page load?
 *   - Silent filtering is surprising UX. A parent who shares a friend a link
 *     like "/events" expects the friend to see the feed as filtered, not
 *     their own invisible kid filter. The banner makes the state visible and
 *     deliberate.
 *   - It also gives a clean "Clear" affordance — otherwise the parent would
 *     have to dig through filter chips to understand why their feed is
 *     narrower than expected.
 *
 * Cross-file coupling:
 *   - filter-bar.tsx — renders this above the rows
 *   - kid-ages-storage.ts — load + clear
 *   - use-filter-state.ts — setState to apply
 *   - src/lib/constants/age-groups.ts — AGE_GROUPS for nice labels
 *   - src/lib/constants/interest-presets.ts — WITH_KIDS_PRESET_ID
 * =============================================================================
 */

'use client';

import { useEffect, useState } from 'react';
import { X, Users } from 'lucide-react';
import { AGE_GROUPS } from '@/lib/constants/age-groups';
import { WITH_KIDS_PRESET_ID } from '@/lib/constants/interest-presets';
import { useFilterState } from './use-filter-state';
import { loadSavedKidAges, clearSavedKidAges, type SavedKidAges } from './kid-ages-storage';

function labelForSlug(slug: string): string {
  const group = AGE_GROUPS.find((g) => g.slug === slug);
  return group?.label ?? slug;
}

export function SavedKidsBanner() {
  const { state, setState } = useFilterState();
  const [saved, setSaved] = useState<SavedKidAges | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setSaved(loadSavedKidAges());
  }, []);

  // Hide if nothing saved, dismissed for this session, or the saved filter is
  // already active in the URL (no value in nagging when the feed already
  // reflects the saved choice).
  if (!saved || dismissed) return null;
  const alreadyApplied =
    state.interestPreset === WITH_KIDS_PRESET_ID &&
    saved.ageGroups.every((s) => state.ageGroup.includes(s));
  if (alreadyApplied) return null;

  const labels = saved.ageGroups.map(labelForSlug);
  const suffixLabel = saved.includeAllAges ? ' + all-ages events' : '';

  const apply = () => {
    const managed = new Set<string>([...saved.ageGroups, ...(saved.includeAllAges ? ['all_ages'] : [])]);
    // Preserve any non-managed age values the URL already carries.
    const preservedAges = state.ageGroup.filter(
      (s) => !['families_young_kids', 'elementary', 'teens', 'all_ages'].includes(s)
    );
    setState({
      ...state,
      interestPreset: WITH_KIDS_PRESET_ID,
      ageGroup: [...preservedAges, ...Array.from(managed)],
    });
  };

  const clear = () => {
    clearSavedKidAges();
    setSaved(null);
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-full border border-blue/20 bg-blue/5 text-body-sm text-ink flex-wrap"
      role="region"
      aria-label="Saved kid-age filter"
    >
      <Users className="w-4 h-4 text-blue flex-shrink-0" aria-hidden="true" />
      <span className="flex-1 min-w-0">
        <span className="font-semibold text-blue">Welcome back.</span>{' '}
        <span className="text-zinc">
          You saved filters for{' '}
          <span className="text-ink font-medium">{labels.join(' + ')}</span>
          {suffixLabel && <span className="text-zinc">{suffixLabel}</span>}
          .
        </span>
      </span>
      <button
        type="button"
        onClick={apply}
        className="px-3.5 py-1 rounded-full bg-blue text-pure font-semibold text-xs hover:bg-blue-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-1"
      >
        Apply
      </button>
      <button
        type="button"
        onClick={clear}
        className="text-xs text-zinc hover:text-ink underline decoration-zinc/40 underline-offset-2"
      >
        Clear
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="p-1 -mr-1 rounded-full text-zinc hover:bg-ink/5"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
