/**
 * =============================================================================
 * SEGMENT VALUE FORMATTERS — value-line + accent color per segment
 * =============================================================================
 *
 * Each segment in the B1 picker shows a two-line pill: a label (uppercase)
 * and a value. The value line is computed from FilterState — this module
 * owns that computation.
 *
 * Returns { text, hasValue, accent } for each segment, where:
 *   - text: the string to display (never empty — falls back to placeholder)
 *   - hasValue: whether a selection is active (drives bold vs regular weight)
 *   - accent: optional CSS color for the leading dot + icon tint
 *
 * Cross-file coupling:
 *   - segmented-picker.tsx — renders the returned values
 *   - Spec uses blue for "Tonight", emerald for "Free", category color
 *     for Category's first-selected
 * =============================================================================
 */

import type { FilterState } from '../types';
import { getCategoryColor } from '@/lib/constants/category-colors';
import { getInterestPreset, INTEREST_PRESETS } from '@/lib/constants/interest-presets';
import { getGoodForTag } from '@/types/good-for';
import {
  rangeToShorthand,
  WHEN_SHORTHAND_LABELS,
  formatRangeForCard,
} from './when-shorthands';
import {
  TIME_OF_DAY_LABELS,
  type TimeOfDay,
  isTimeOfDay,
} from '@/lib/constants/time-of-day';
import { priceTiersToBudget, getBudgetTier } from '@/lib/constants/budget-tiers';
import type { SegmentId } from '@/lib/filters/b1-segments';

export interface SegmentDisplay {
  text: string;
  hasValue: boolean;
  accent?: string;
}

const HL_BLUE = '#008bd2';
const HL_EMERALD = '#009768';

/** Look up a category slug → display name via the provided lookup. */
type CategoryLookup = (slug: string) => string | undefined;

/**
 * Build the category segment value:
 *   - 0 selected → "Any category" (placeholder)
 *   - 1 selected → category name, accented in its color
 *   - 2+ selected → "Music, Food & Drink…" with first category's accent
 */
function categoryValue(
  state: FilterState,
  lookupCategoryName: CategoryLookup,
  placeholder: string
): SegmentDisplay {
  if (!state.category) return { text: placeholder, hasValue: false };
  const name = lookupCategoryName(state.category) ?? state.category;
  const accent = getCategoryColor(state.category).accent;
  return { text: name, hasValue: true, accent };
}

/**
 * When segment — handles 3 cases:
 *   1. timeOfDay only (no date range) → "Tonight" if evening+late_night,
 *      or the chip labels joined
 *   2. date range matches a shorthand → shorthand label
 *   3. custom date range → formatted range
 *   4. Nothing set → "Anytime"
 *
 * Tonight = evening bucket only (most common case for "what's happening
 * right now") gets the blue accent per spec. Other time-of-day states
 * render without accent.
 */
function whenValue(state: FilterState, placeholder: string): SegmentDisplay {
  const hasDate = !!(state.dateFrom || state.dateTo);
  const hasTod = state.timeOfDay.length > 0;

  if (!hasDate && !hasTod) return { text: placeholder, hasValue: false };

  // "Tonight" shortcut — evening only, no date
  if (!hasDate && state.timeOfDay.length === 1 && state.timeOfDay[0] === 'evening') {
    return { text: 'Tonight', hasValue: true, accent: HL_BLUE };
  }

  const parts: string[] = [];
  if (hasDate) {
    const shorthand = rangeToShorthand(state.dateFrom, state.dateTo);
    if (shorthand) {
      parts.push(WHEN_SHORTHAND_LABELS[shorthand]);
    } else if (state.dateFrom && state.dateTo) {
      parts.push(formatRangeForCard(state.dateFrom, state.dateTo));
    } else if (state.dateFrom) {
      parts.push(`From ${state.dateFrom}`);
    } else if (state.dateTo) {
      parts.push(`Until ${state.dateTo}`);
    }
  }
  if (hasTod) {
    const labels = state.timeOfDay
      .filter(isTimeOfDay)
      .map((b) => TIME_OF_DAY_LABELS[b as TimeOfDay]);
    parts.push(labels.join(', '));
  }

  return { text: parts.join(' · '), hasValue: true };
}

/**
 * Good-for segment:
 *   - interest preset set → preset label
 *   - good_for array → first tag label + " +N more" when multiple
 *   - nothing → "Anything"
 */
function goodForValue(state: FilterState, placeholder: string): SegmentDisplay {
  if (state.interestPreset) {
    const preset = getInterestPreset(state.interestPreset);
    if (preset) return { text: preset.label, hasValue: true };
  }
  if (state.goodFor.length === 0) return { text: placeholder, hasValue: false };
  const first = getGoodForTag(state.goodFor[0]);
  const firstLabel = first?.label ?? state.goodFor[0];
  if (state.goodFor.length === 1) return { text: firstLabel, hasValue: true };
  return { text: `${firstLabel} +${state.goodFor.length - 1}`, hasValue: true };
}

/**
 * Budget segment:
 *   - priceTier matches a B1 tile → tile label ("Free" gets emerald accent)
 *   - priceTier custom (set from drawer, not a single tile) → "Price: N selected"
 *   - nothing → "Any price"
 */
function budgetValue(state: FilterState, placeholder: string): SegmentDisplay {
  if (state.priceTier.length === 0) return { text: placeholder, hasValue: false };
  const budget = priceTiersToBudget(state.priceTier);
  if (budget) {
    const tier = getBudgetTier(budget)!;
    const accent = tier.accent === 'emerald' ? HL_EMERALD : undefined;
    return { text: tier.label, hasValue: true, accent };
  }
  // Drawer-set priceTier that doesn't collapse to a single tile
  return {
    text: state.priceTier.length === 1 ? 'Custom price' : `${state.priceTier.length} price tiers`,
    hasValue: true,
  };
}

/**
 * Single entry point — dispatches to the right formatter.
 */
export function getSegmentDisplay(
  segmentId: SegmentId,
  state: FilterState,
  options: {
    lookupCategoryName: CategoryLookup;
    placeholder: string;
  }
): SegmentDisplay {
  switch (segmentId) {
    case 'category':
      return categoryValue(state, options.lookupCategoryName, options.placeholder);
    case 'when':
      return whenValue(state, options.placeholder);
    case 'good-for':
      return goodForValue(state, options.placeholder);
    case 'budget':
      return budgetValue(state, options.placeholder);
  }
}

// Re-export for tests / debugging.
export const _internals = {
  categoryValue,
  whenValue,
  goodForValue,
  budgetValue,
  INTEREST_PRESETS,
};
