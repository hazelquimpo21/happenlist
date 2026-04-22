/**
 * =============================================================================
 * PICKER BAR — B1 archive filter bar wrapper (client)
 * =============================================================================
 *
 * Server-mounted from /events/page.tsx. Owns:
 *   - useFilterState wiring (URL <-> FilterState)
 *   - Rendering the SegmentedPicker with an onPatch callback
 *   - Rendering the MoreDrawer to the right of the picker
 *   - The search input (left of the picker)
 *   - The WithKidsExpander (sub-row when a with-kids preset is active)
 *   - The SavedKidsBanner (welcome-back banner for returning parents)
 *
 * Hero variant lives in the homepage composition (page.tsx) and uses the
 * same SegmentedPicker with variant="hero" — not this component.
 *
 * Cross-file coupling:
 *   - segmented-picker.tsx — renders the actual pill
 *   - more-drawer.tsx — the "More" button
 *   - ../use-filter-state.ts — URL state
 *   - ../with-kids-expander.tsx — age-bucket sub-row
 *   - ../saved-kids-banner.tsx — welcome-back
 * =============================================================================
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useFilterState } from '../use-filter-state';
import { countActiveFilters } from '../types';
import { WithKidsExpander } from '../with-kids-expander';
import { SavedKidsBanner } from '../saved-kids-banner';
import { WITH_KIDS_PRESET_ID } from '@/lib/constants/interest-presets';
import { SegmentedPicker } from './segmented-picker';
import { MoreDrawer, type MoreDrawerMembershipOrg } from './more-drawer';
import type { CategoryPopoverItem } from './segments/category-popover';

interface PickerBarProps {
  categories: readonly CategoryPopoverItem[];
  membershipOrgs: readonly MoreDrawerMembershipOrg[];
  /** Total matching events — drives the CTA label ("Show 89 events"). */
  totalResults: number;
}

export function PickerBar({ categories, membershipOrgs, totalResults }: PickerBarProps) {
  const router = useRouter();
  const { state, patch, setSingle } = useFilterState();
  const [searchDraft, setSearchDraft] = useState(state.q ?? '');

  // The picker segments cover: category, when (dateFrom/dateTo + timeOfDay),
  // good-for (interestPreset), budget (priceTier + isFree). Everything else
  // (accessibility, sensory, leaveWith, socialMode, energyNeeded, price-tier
  // long-tail, ageGroup, quickToggles, vibe, noise, accessType, neighborhood,
  // membership) counts toward the More badge. We subtract the picker-covered
  // fields from the total active count so the badge is accurate.
  const total = countActiveFilters(state);
  const pickerCovered =
    (state.category ? 1 : 0) +
    (state.dateFrom || state.dateTo ? 1 : 0) +
    state.timeOfDay.length +
    (state.interestPreset ? 1 : 0) +
    // priceTier is counted as its array length in countActiveFilters; but the
    // Budget segment also writes priceTier. Subtract only when priceTier[]
    // collapses to a single Budget tile (so More doesn't double-count the
    // budget selection). When priceTier is drawer-set (custom), we keep the
    // badge rising.
    (state.priceTier.length > 0 &&
    (state.priceTier.length === 1 ||
      state.priceTier.every((t) =>
        ['free', 'under_10', '10_to_25', '25_to_50', 'over_50'].includes(t)
      ))
      ? state.priceTier.length
      : 0);
  // Clamp at zero — defensive against math drift when new filters get added.
  const moreBadge = Math.max(0, total - pickerCovered);

  const withKidsActive = state.interestPreset === WITH_KIDS_PRESET_ID;

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSingle('q', searchDraft.trim() || undefined);
  };

  return (
    <div className="sticky top-16 md:top-18 z-30 border-b border-mist bg-pure">
      <div className="mx-auto max-w-7xl px-4 py-4 space-y-3">
        <SavedKidsBanner />

        {/* Row 1: search + picker + more */}
        <div className="flex items-center gap-2.5">
          <form onSubmit={onSearchSubmit} className="relative flex-shrink-0 w-[240px] hidden md:block">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onBlur={onSearchSubmit}
              placeholder="Search events"
              aria-label="Search events"
              className={cn(
                'w-full rounded-full border border-mist bg-cloud py-2.5 pl-9 pr-3',
                'font-body text-[13px] text-ink placeholder:text-zinc',
                'focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue'
              )}
            />
          </form>

          <div className="min-w-0 flex-1">
            <SegmentedPicker
              variant="inline"
              state={state}
              categories={categories}
              onPatch={patch}
              ctaLabel={`Show ${totalResults}`}
              onCtaClick={() => router.refresh()}
              rightSlot={
                <MoreDrawer membershipOrgs={membershipOrgs} activeCount={moreBadge} />
              }
            />
          </div>
        </div>

        {/* Mobile search — below the picker for narrow viewports */}
        <form onSubmit={onSearchSubmit} className="relative md:hidden">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onBlur={onSearchSubmit}
            placeholder="Search events"
            aria-label="Search events"
            className="w-full rounded-full border border-mist bg-cloud py-2.5 pl-9 pr-3 font-body text-[13px] text-ink placeholder:text-zinc focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue"
          />
        </form>

        {withKidsActive && <WithKidsExpander />}
      </div>
    </div>
  );
}
