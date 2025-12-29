/**
 * CATEGORY GRID COMPONENT
 * =======================
 * Grid of category links for homepage.
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
 * Grid of category links.
 *
 * @example
 * <CategoryGrid categories={categories} />
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

        return (
          <Link
            key={category.id}
            href={buildCategoryUrl(category)}
            className={cn(
              'flex flex-col items-center justify-center',
              'p-4 rounded-lg',
              'bg-warm-white border border-sand',
              'hover:border-coral hover:shadow-card',
              'transition-all duration-base',
              'group'
            )}
          >
            <div
              className={cn(
                'w-12 h-12 rounded-full',
                'flex items-center justify-center',
                'bg-sand/50 text-stone',
                'group-hover:bg-coral-light group-hover:text-coral',
                'transition-all duration-base'
              )}
            >
              <IconComponent className="w-6 h-6" />
            </div>
            <span className="mt-3 text-body-sm font-medium text-charcoal text-center">
              {category.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
