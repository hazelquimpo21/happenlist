/**
 * =============================================================================
 * BUDGET TIERS — the 4 B1 segmented-picker budget tiles
 * =============================================================================
 *
 * The Budget segment in the B1 segmented picker shows 4 tiles:
 *   - Free / Under $10 / Under $25 / $25+
 *
 * These aren't a new filter dimension — they map onto the existing
 * `priceTier[]` query param (shipped Phase 2 B5 — see price-tiers.ts) which
 * has 6 fine-grained tiers. This file is the BRIDGE between the 4-tile UI
 * and the 6-tier query model.
 *
 * Why bridge instead of consolidate?
 *   - The drawer "More" surface still needs fine-grained tiers
 *     ($10–$25, $25–$50, $50+, donation). We don't want to regress that UX.
 *   - The B1 segmented picker deliberately simplifies to 4 tiles for the
 *     browse-first persona. Jamie doesn't want to pick "$10–$25".
 *   - Legacy `?free=true` URLs still round-trip: they hydrate the Budget
 *     segment as "Free", which re-serializes as `priceTier=free`.
 *
 * Cross-file coupling:
 *   - src/lib/constants/price-tiers.ts — underlying 6-tier taxonomy
 *   - src/components/events/filters/b1/segments/budget-popover.tsx — UI
 *   - src/components/events/filters/b1/bridges.ts — budgetToPriceTier() +
 *     priceTierToBudget() round-trip helpers
 *   - src/components/events/filters/types.ts — FilterState.priceTier (the
 *     canonical serialization; Budget is a UI-only concept)
 * =============================================================================
 */

import type { PriceTierSlug } from './price-tiers';

/**
 * A budget tile in the B1 picker.
 *
 * @property slug       UI-only identifier. Not persisted to URL — the URL
 *                      carries `priceTier[]` instead. Stable string so the
 *                      picker can render toggle state.
 * @property label      Human-readable tile label.
 * @property priceTiers The fine-grained `priceTier` slugs this tile expands
 *                      into when the user selects it. OR semantics at query
 *                      time (events matching ANY of these pass the filter).
 * @property accent     Optional accent color for the active state — Free gets
 *                      emerald per spec. Others use the default ink invert.
 */
export interface BudgetTier {
  slug: BudgetTierSlug;
  label: string;
  priceTiers: readonly PriceTierSlug[];
  accent?: 'emerald';
}

export type BudgetTierSlug = 'free' | 'under_10' | 'under_25' | 'over_25';

/**
 * Budget tiles in visual order — 4 equal squares in the popover.
 *
 * Mapping notes:
 *   - "Under $10" intentionally INCLUDES free (matches price-tiers.ts
 *     under_10 semantics — people hunting cheap want free too).
 *   - "Under $25" = $10–$25 tier only (free + under_10 are already covered
 *     by the cheaper tiles; no reason to double-match).
 *   - "$25+" = the top two tiers. Donation is NOT mapped here — donation
 *     is orthogonal (pay-what-you-can) and stays drawer-only.
 */
export const BUDGET_TIERS: readonly BudgetTier[] = [
  {
    slug: 'free',
    label: 'Free',
    priceTiers: ['free'],
    accent: 'emerald',
  },
  {
    slug: 'under_10',
    label: 'Under $10',
    priceTiers: ['under_10'],
  },
  {
    slug: 'under_25',
    label: 'Under $25',
    priceTiers: ['10_to_25'],
  },
  {
    slug: 'over_25',
    label: '$25+',
    priceTiers: ['25_to_50', 'over_50'],
  },
] as const;

const BY_SLUG = new Map<BudgetTierSlug, BudgetTier>(
  BUDGET_TIERS.map((b) => [b.slug, b])
);

/** O(1) lookup. Returns undefined for unknown slugs. */
export function getBudgetTier(slug: string): BudgetTier | undefined {
  return BY_SLUG.get(slug as BudgetTierSlug);
}

/**
 * Type guard — narrows a string to BudgetTierSlug.
 * Used to validate URL params before we trust them.
 */
export function isBudgetTierSlug(value: string): value is BudgetTierSlug {
  return BY_SLUG.has(value as BudgetTierSlug);
}

/**
 * BRIDGE: expand a Budget tile slug into the fine-grained priceTier slugs it
 * covers. Returns an empty array for unknown slugs (caller treats as "no
 * filter").
 *
 * Single source of truth for the UI→query conversion. The Budget popover
 * calls this when the user toggles a tile to compute the FilterState.priceTier
 * update.
 */
export function budgetToPriceTiers(slug: string): PriceTierSlug[] {
  const tier = BY_SLUG.get(slug as BudgetTierSlug);
  return tier ? [...tier.priceTiers] : [];
}

/**
 * BRIDGE: figure out which Budget tile (if any) the current priceTier[] state
 * corresponds to. Used to hydrate the picker segment from URL params.
 *
 * Returns the FIRST exact match: a set of priceTiers matches a Budget tile
 * iff every tier in the set appears in that tile's priceTiers AND every
 * tier in the tile appears in the set.
 *
 * Returns null if no tile matches exactly — e.g. user chose "$10–$25" from
 * the drawer, which doesn't map to a single Budget tile. In that case the
 * segment shows "Any price" and the drawer's choice is preserved in the URL.
 *
 * Note: legacy `isFree: true` is handled by the parser in types.ts — it
 * injects `priceTier=['free']` so this function catches it.
 */
export function priceTiersToBudget(priceTiers: readonly string[]): BudgetTierSlug | null {
  if (priceTiers.length === 0) return null;
  const selected = new Set(priceTiers);

  for (const tile of BUDGET_TIERS) {
    if (tile.priceTiers.length !== selected.size) continue;
    const everyMatches = tile.priceTiers.every((t) => selected.has(t));
    if (everyMatches) return tile.slug;
  }
  return null;
}
