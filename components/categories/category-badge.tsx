// ============================================================================
// 🏷️ HAPPENLIST - Category Badge Component
// ============================================================================
// Displays a category with its icon and color.
// Used on event cards and detail pages.
//
// Usage:
//   <CategoryBadge category={category} />
//   <CategoryBadge category={category} size="sm" />
// ============================================================================

import { cn } from '@/lib/utils/cn'
import type { Category } from '@/types'

// ============================================================================
// 📋 CategoryBadge Props
// ============================================================================

export interface CategoryBadgeProps {
  /** The category to display */
  category: Category
  /** Size variant */
  size?: 'sm' | 'md'
  /** Additional CSS classes */
  className?: string
}

// ============================================================================
// 🏷️ CategoryBadge Component
// ============================================================================

export function CategoryBadge({
  category,
  size = 'md',
  className,
}: CategoryBadgeProps) {
  // Apply category color as inline styles
  // The color is stored as a hex value in the database
  const colorStyles = category.color
    ? {
        backgroundColor: `${category.color}20`, // 20 = ~12% opacity
        color: category.color,
      }
    : undefined

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        // Fallback colors if no color specified
        !category.color && 'bg-background text-text-secondary',
        className
      )}
      style={colorStyles}
    >
      {category.name}
    </span>
  )
}
