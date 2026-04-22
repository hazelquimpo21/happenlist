/**
 * BUDGET POPOVER — B1 picker
 * ==========================
 * 4 large square tiles: Free / Under $10 / Under $25 / $25+
 *
 * Single-select (selecting a new tile replaces the previous choice). The
 * "Free" tile gets the emerald accent per spec; the others invert to ink.
 *
 * Bridge: each tile maps to a set of priceTier slugs via
 * `budgetToPriceTiers()` — we write priceTier[] to FilterState, not a
 * separate Budget field. Unknown drawer-set priceTier combinations fall
 * back to "no tile active" (the picker value line shows "Custom price").
 */

'use client';

import { cn } from '@/lib/utils/cn';
import {
  BUDGET_TIERS,
  budgetToPriceTiers,
  priceTiersToBudget,
  type BudgetTierSlug,
} from '@/lib/constants/budget-tiers';

interface BudgetPopoverProps {
  priceTier: string[];
  onChange: (nextPriceTier: string[]) => void;
}

export function BudgetPopover({ priceTier, onChange }: BudgetPopoverProps) {
  const active = priceTiersToBudget(priceTier);

  const pickTile = (slug: BudgetTierSlug) => {
    if (active === slug) {
      onChange([]);
      return;
    }
    onChange(budgetToPriceTiers(slug));
  };

  return (
    <div className="rounded-2xl border border-mist bg-pure p-6 shadow-[0_20px_50px_rgba(2,2,3,0.14),0_2px_8px_rgba(2,2,3,0.06)]">
      <div className="mb-3 text-[12px] font-bold uppercase tracking-[0.06em] text-zinc">
        Budget
      </div>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {BUDGET_TIERS.map((tile) => {
          const on = active === tile.slug;
          const isEmerald = tile.accent === 'emerald';
          return (
            <button
              key={tile.slug}
              type="button"
              onClick={() => pickTile(tile.slug)}
              aria-pressed={on}
              className={cn(
                'rounded-2xl border px-3 py-4 text-[16px] font-bold transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                on
                  ? isEmerald
                    ? 'border-emerald bg-emerald text-pure'
                    : 'border-ink bg-ink text-pure'
                  : 'border-mist bg-pure text-ink hover:border-ink/40'
              )}
              style={
                on && isEmerald
                  ? { ['--tw-ring-color' as string]: '#009768' }
                  : undefined
              }
            >
              {tile.label}
            </button>
          );
        })}
      </div>
      {priceTier.length > 0 && !active && (
        <p className="mt-3 text-[12px] text-zinc">
          Custom price range set from More filters. Pick a tile to replace it,
          or clear from the More drawer.
        </p>
      )}
    </div>
  );
}
