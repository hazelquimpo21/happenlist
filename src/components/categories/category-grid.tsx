/**
 * CATEGORY GRID COMPONENT
 * =======================
 * Color-blocked category cards for the homepage.
 * Each card uses the category's identity color for background and accent.
 */

import Link from 'next/link';
import {
  Music,
  Palette,
  Users,
  UtensilsCrossed,
  Dumbbell,
  Moon,
  Heart,
  GraduationCap,
  PartyPopper,
  Clapperboard,
  LucideIcon,
} from 'lucide-react';
import { buildCategoryUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { getCategoryColor } from '@/lib/constants/category-colors';
import type { Category } from '@/types';

// Map category icon names to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  Music: Music,
  Palette: Palette,
  Users: Users,
  UtensilsCrossed: UtensilsCrossed,
  Dumbbell: Dumbbell,
  Moon: Moon,
  Heart: Heart,
  GraduationCap: GraduationCap,
  PartyPopper: PartyPopper,
  Clapperboard: Clapperboard,
};

interface CategoryGridProps {
  /** Categories to display */
  categories: Category[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Color-blocked category cards grid.
 * Each card has a full tinted background and bold left border
 * in the category's identity color.
 */
export function CategoryGrid({ categories, className }: CategoryGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4',
        className
      )}
    >
      {categories.map((category) => {
        const IconComponent = ICON_MAP[category.icon || ''] || Music;
        const colors = getCategoryColor(category.slug);

        return (
          <Link
            key={category.id}
            href={buildCategoryUrl(category)}
            className={cn(
              'flex items-center gap-3',
              'p-4 rounded-lg',
              'border-l-4',
              'hover:shadow-card-lifted hover:-translate-y-1',
              'transition-all duration-base',
              'group'
            )}
            style={{
              backgroundColor: colors.light,
              borderLeftColor: colors.accent,
            }}
          >
            <div
              className="flex-shrink-0"
              style={{ color: colors.accent }}
            >
              <IconComponent className="w-8 h-8" />
            </div>
            <span className="font-semibold text-ink text-body-sm">
              {category.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
