/**
 * =============================================================================
 * PRICE TIERS — cost-based filter buckets for event discovery
 * =============================================================================
 *
 * Defines the price tier filter options used in the FilterDrawer and query
 * layer. Each tier maps to a predicate against `price_low`, `is_free`, or
 * `price_type` columns in the events table.
 *
 * Key design decisions:
 *   - "free" uses `is_free = true`, NOT `price_low = 0` (some free events
 *     have null price_low).
 *   - "under_10" is INCLUSIVE of free events — people searching for cheap
 *     stuff want free options too.
 *   - "donation" matches `price_type = 'donation'` (not a numeric range).
 *   - Events with NULL price_low are NOT excluded from browse — they just
 *     won't match any specific tier filter.
 *
 * Cross-file coupling:
 *   - src/data/events/get-events.ts — builds Supabase predicates per tier
 *   - src/components/events/filters/filter-drawer.tsx — renders chip UI
 *   - src/components/events/filters/empty-filter-state.tsx — label lookup
 *   - src/components/events/filters/types.ts — FilterState.priceTier field
 *   - src/types/filters.ts — EventQueryParams.priceTier field
 *
 * If you add a tier:
 *   1. Add it to PRICE_TIERS below
 *   2. Add the predicate case in get-events.ts `buildPriceTierPredicate()`
 *   3. The UI picks it up automatically from the array
 * =============================================================================
 */

/**
 * A single price tier definition.
 *
 * @property slug        URL-safe identifier, used as the `priceTier` query-param value.
 * @property label       Human-readable label rendered on the chip.
 * @property description Tooltip / a11y text.
 * @property icon        Lucide icon name for visual identification.
 * @property range       Numeric range for documentation; actual predicate logic
 *                       lives in get-events.ts (some tiers use boolean/enum checks).
 */
export interface PriceTier {
  slug: string;
  label: string;
  description: string;
  icon: string;
  range: { min?: number; max?: number } | null;
}

/**
 * All price tiers, in display order.
 *
 * Order is intentional: free → cheapest → most expensive → donation.
 */
export const PRICE_TIERS: PriceTier[] = [
  {
    slug: 'free',
    label: 'Free',
    description: 'No cost to attend',
    icon: 'Gift',
    range: null, // Uses is_free = true
  },
  {
    slug: 'under_10',
    label: 'Under $10',
    description: 'Budget-friendly (includes free events)',
    icon: 'Coins',
    range: { max: 10 },
  },
  {
    slug: '10_to_25',
    label: '$10 – $25',
    description: 'Mid-range pricing',
    icon: 'Ticket',
    range: { min: 10, max: 25 },
  },
  {
    slug: '25_to_50',
    label: '$25 – $50',
    description: 'Premium events',
    icon: 'BadgeDollarSign',
    range: { min: 25, max: 50 },
  },
  {
    slug: 'over_50',
    label: '$50+',
    description: 'High-end experiences',
    icon: 'Gem',
    range: { min: 50 },
  },
  {
    slug: 'donation',
    label: 'Donation-based',
    description: 'Pay what you can',
    icon: 'HeartHandshake',
    range: null, // Uses price_type = 'donation'
  },
];

/** Set of valid tier slugs for runtime validation. */
const VALID_SLUGS = new Set(PRICE_TIERS.map((t) => t.slug));

/** Type guard: is this string a valid price tier slug? */
export function isPriceTierSlug(value: string): boolean {
  return VALID_SLUGS.has(value);
}

/** Look up a single tier by slug. Returns undefined for unknown slugs. */
export function getPriceTier(slug: string): PriceTier | undefined {
  return PRICE_TIERS.find((t) => t.slug === slug);
}

/**
 * Look up multiple tiers by slug array.
 * Returns tiers in canonical display order (matching PRICE_TIERS order).
 */
export function getPriceTiers(slugs: string[]): PriceTier[] {
  return PRICE_TIERS.filter((t) => slugs.includes(t.slug));
}
