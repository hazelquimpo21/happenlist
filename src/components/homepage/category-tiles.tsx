/**
 * CATEGORY TILES
 * ==============
 * Bold full-color category cards with custom SVG icons.
 * Full saturated color background, white text + icon.
 *
 * Inspo: Trigger colored cards, Masterclass bold backgrounds
 */

import Link from 'next/link';
import { getCategoryColor } from '@/lib/constants/category-colors';
import { getCategoryIcon } from '@/components/icons/category-icons';
import { buildCategoryUrl } from '@/lib/utils';
import type { Category } from '@/types';

interface CategoryTilesProps {
  categories: Category[];
  className?: string;
}

export function CategoryTiles({ categories, className = '' }: CategoryTilesProps) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 ${className}`}>
      {categories.map((category) => {
        const colors = getCategoryColor(category.slug);
        const Icon = getCategoryIcon(category.icon || null);

        return (
          <Link
            key={category.id}
            href={buildCategoryUrl(category)}
            className="group block rounded-2xl p-5 transition-all duration-base hover:scale-[1.02] hover:shadow-card-hover"
            style={{ backgroundColor: colors.bg }}
          >
            <div className="mb-4" style={{ color: colors.text }}>
              <Icon className="w-8 h-8 opacity-90" />
            </div>
            <h3 className="text-h4 font-bold" style={{ color: colors.text }}>
              {category.name}
            </h3>
            {/* PLACEHOLDER: event count per category would go here
                e.g. "24 events" in text-pure/70 caption size */}
          </Link>
        );
      })}
    </div>
  );
}
