/**
 * CATEGORY POPOVER — B1 picker
 * ============================
 * Multi-select chip list of all 15 categories, rendered in canonical display
 * order (category-order.ts). Each chip: color dot + name + count (count
 * hidden when 0 / unknown). Selected state fills with the category's color
 * and flips the dot to white.
 *
 * Controlled — takes category slugs + the active category slug, calls back
 * with the new selection. Single-select semantics (matches the existing
 * FilterState.category field).
 */

'use client';

import { cn } from '@/lib/utils/cn';
import { getCategoryColor } from '@/lib/constants/category-colors';
import { sortCategoriesByDisplayOrder } from '@/lib/constants/category-order';

export interface CategoryPopoverItem {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

interface CategoryPopoverProps {
  categories: readonly CategoryPopoverItem[];
  active: string | undefined;
  onChange: (slug: string | undefined) => void;
}

export function CategoryPopover({ categories, active, onChange }: CategoryPopoverProps) {
  const ordered = sortCategoriesByDisplayOrder(categories, (c) => c.slug);

  return (
    <div className="rounded-2xl border border-mist bg-pure p-6 shadow-[0_20px_50px_rgba(2,2,3,0.14),0_2px_8px_rgba(2,2,3,0.06)]">
      <div className="mb-3 text-[12px] font-bold uppercase tracking-[0.06em] text-zinc">
        Pick a category
      </div>
      <div className="flex flex-wrap gap-2">
        {ordered.map((cat) => {
          const on = active === cat.slug;
          const color = getCategoryColor(cat.slug);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onChange(on ? undefined : cat.slug)}
              aria-pressed={on}
              className={cn(
                'inline-flex items-center gap-[7px] rounded-full px-3.5 py-2',
                'text-[13px] font-semibold transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                on ? 'shadow-sm' : 'bg-pure text-ink border border-mist hover:border-ink/40'
              )}
              style={
                on
                  ? {
                      backgroundColor: color.bg,
                      borderColor: color.bg,
                      color: color.text,
                      borderWidth: 1,
                      borderStyle: 'solid',
                      ['--tw-ring-color' as string]: color.bg,
                    }
                  : undefined
              }
            >
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: on ? color.text : color.bg }}
              />
              <span>{cat.name}</span>
              {typeof cat.count === 'number' && cat.count > 0 && (
                <span className={cn('text-[11px]', on ? 'opacity-80' : 'text-zinc')}>
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
