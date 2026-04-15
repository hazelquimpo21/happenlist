/**
 * =============================================================================
 * EmptyFilterState — shown on /events when filters return zero results
 * =============================================================================
 *
 * Goal: don't dead-end the user. The default empty state ("No events found")
 * is fine for "no events match a search query", but when the cause is over-
 * filtering, the user needs to *see* what they have on so they can peel one
 * off without re-tracing the whole filter trail.
 *
 * Renders one removable chip per active filter. Each chip's "×" calls
 * useFilterState's removeOne() — which calls router.replace and re-fetches.
 *
 * Uses metadata maps from the canonical constants files to render real
 * labels (not raw slugs):
 *   - INTEREST_PRESETS → preset.label
 *   - TIME_OF_DAY_LABELS
 *   - GOOD_FOR_TAGS → tag.label
 *   - VIBE_TAGS / NOISE_LEVELS → title-cased
 *
 * Cross-file coupling:
 *   - filter-chip.tsx (the X-button chip variant)
 *   - use-filter-state.ts (removeOne, clearAll)
 *   - All vocabularies: interest-presets.ts, time-of-day.ts, good-for.ts,
 *     vocabularies.ts
 * =============================================================================
 */

'use client';

import { SearchX } from 'lucide-react';
import { getInterestPreset } from '@/lib/constants/interest-presets';
import { getNeighborhood } from '@/lib/constants/milwaukee-neighborhoods';
import { getPriceTier } from '@/lib/constants/price-tiers';
import { getAgeGroup } from '@/lib/constants/age-groups';
import { TIME_OF_DAY_LABELS, type TimeOfDay } from '@/lib/constants/time-of-day';
import {
  ACCESSIBILITY_TAG_LABELS,
  isAccessibilityTag,
} from '@/lib/constants/vocabularies';
import { getGoodForTag } from '@/types/good-for';
import { useFilterState } from './use-filter-state';
import { FilterChip } from './filter-chip';
import type { FilterState } from './types';
import { hasAnyActive } from './types';

interface EmptyFilterStateProps {
  /** Used to render category chips with a real name. */
  categoryNameById: Record<string, string>;
  /** Used to render membership-org chips with a real name. */
  membershipOrgNameById: Record<string, string>;
}

function vibeLabel(slug: string): string {
  return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface ActiveChip {
  key: string;
  label: string;
  onRemove: () => void;
}

/**
 * Build the list of active filter chips from FilterState.
 *
 * Order matches the FilterBar/FilterDrawer reading order so the empty state
 * feels organized rather than random.
 */
function buildActiveChips(
  state: FilterState,
  removeOne: ReturnType<typeof useFilterState>['removeOne'],
  setSingle: ReturnType<typeof useFilterState>['setSingle'],
  toggleBool: ReturnType<typeof useFilterState>['toggleBool'],
  categoryNameById: Record<string, string>,
  membershipOrgNameById: Record<string, string>
): ActiveChip[] {
  const chips: ActiveChip[] = [];

  if (state.category) {
    chips.push({
      key: `category-${state.category}`,
      label: categoryNameById[state.category] ?? state.category,
      onRemove: () => setSingle('category', undefined),
    });
  }

  if (state.interestPreset) {
    const preset = getInterestPreset(state.interestPreset);
    chips.push({
      key: `preset-${state.interestPreset}`,
      label: preset?.label ?? state.interestPreset,
      onRemove: () => setSingle('interestPreset', undefined),
    });
  }

  for (const slug of state.goodFor) {
    const tag = getGoodForTag(slug);
    chips.push({
      key: `goodFor-${slug}`,
      label: tag?.label ?? slug,
      onRemove: () => removeOne('goodFor', slug),
    });
  }

  for (const bucket of state.timeOfDay) {
    chips.push({
      key: `tod-${bucket}`,
      label: TIME_OF_DAY_LABELS[bucket as TimeOfDay] ?? bucket,
      onRemove: () => removeOne('timeOfDay', bucket),
    });
  }

  for (const slug of state.priceTier) {
    const tier = getPriceTier(slug);
    chips.push({
      key: `price-${slug}`,
      label: tier?.label ?? slug,
      onRemove: () => removeOne('priceTier', slug),
    });
  }

  for (const slug of state.ageGroup) {
    const group = getAgeGroup(slug);
    chips.push({
      key: `age-${slug}`,
      label: group?.label ?? slug,
      onRemove: () => removeOne('ageGroup', slug),
    });
  }

  // Accessibility (Stage 2) — narrow defensively in case a stale URL carries
  // a vocab value we've since removed; the label-lookup would otherwise be
  // undefined.
  for (const tag of state.accessibility) {
    if (!isAccessibilityTag(tag)) continue;
    chips.push({
      key: `a11y-${tag}`,
      label: ACCESSIBILITY_TAG_LABELS[tag],
      onRemove: () => removeOne('accessibility', tag),
    });
  }

  if (state.isFree) {
    chips.push({ key: 'free', label: 'Free', onRemove: () => toggleBool('isFree') });
  }

  if (state.vibeTag) {
    chips.push({
      key: `vibe-${state.vibeTag}`,
      label: vibeLabel(state.vibeTag),
      onRemove: () => setSingle('vibeTag', undefined),
    });
  }

  if (state.noiseLevel) {
    chips.push({
      key: `noise-${state.noiseLevel}`,
      label: `Noise: ${vibeLabel(state.noiseLevel)}`,
      onRemove: () => setSingle('noiseLevel', undefined),
    });
  }

  if (state.accessType) {
    chips.push({
      key: `access-${state.accessType}`,
      label: vibeLabel(state.accessType),
      onRemove: () => setSingle('accessType', undefined),
    });
  }

  const boolToggles: Array<[keyof FilterState, string]> = [
    ['soloFriendly', 'Solo-friendly'],
    ['beginnerFriendly', 'Beginner-friendly'],
    ['noTicketsNeeded', 'No tickets'],
    ['dropInOk', 'Drop-in OK'],
    ['familyFriendly', 'Family-friendly'],
    ['hasMemberBenefits', 'Member pricing'],
  ];
  for (const [key, label] of boolToggles) {
    if (state[key]) {
      chips.push({ key: `bool-${key}`, label, onRemove: () => toggleBool(key) });
    }
  }

  if (state.membershipOrgId) {
    chips.push({
      key: `org-${state.membershipOrgId}`,
      label: membershipOrgNameById[state.membershipOrgId] ?? 'Membership org',
      onRemove: () => setSingle('membershipOrgId', undefined),
    });
  }

  // Geo / neighborhood filter
  if (state.neighborhood || (state.nearLat != null && state.nearLng != null)) {
    const hood = state.neighborhood ? getNeighborhood(state.neighborhood) : null;
    const label = state.neighborhood === 'my-location'
      ? 'Near me'
      : hood
        ? `Near ${hood.label}`
        : 'Nearby';
    chips.push({
      key: 'geo',
      label,
      onRemove: () => removeOne('neighborhood'),
    });
  }

  return chips;
}

export function EmptyFilterState({
  categoryNameById,
  membershipOrgNameById,
}: EmptyFilterStateProps) {
  const { state, removeOne, setSingle, toggleBool, clearAll } = useFilterState();

  // Caller decides when to render us — but be safe: if nothing is active,
  // fall back to a generic empty message rather than rendering an empty list.
  const anyActive = hasAnyActive(state);

  if (!anyActive) {
    return (
      <div className="text-center py-16 px-4">
        <SearchX className="w-12 h-12 mx-auto text-silver mb-4" aria-hidden="true" />
        <h3 className="font-body text-h3 text-ink mb-2">No events found</h3>
        <p className="text-body text-zinc max-w-md mx-auto">
          Check back soon for upcoming events.
        </p>
      </div>
    );
  }

  const chips = buildActiveChips(
    state,
    removeOne,
    setSingle,
    toggleBool,
    categoryNameById,
    membershipOrgNameById
  );

  return (
    <div className="text-center py-16 px-4 max-w-2xl mx-auto">
      <SearchX className="w-12 h-12 mx-auto text-silver mb-4" aria-hidden="true" />
      <h3 className="font-body text-h3 text-ink mb-2">
        No events match these filters
      </h3>
      <p className="text-body text-zinc mb-6">
        Try removing one to broaden your search.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        {chips.map((chip) => (
          <FilterChip
            key={chip.key}
            label={chip.label}
            active
            size="sm"
            onRemove={chip.onRemove}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={clearAll}
        className="text-body-sm font-semibold text-blue hover:text-blue-dark focus-visible:outline-none focus-visible:underline"
      >
        Clear all filters
      </button>
    </div>
  );
}
