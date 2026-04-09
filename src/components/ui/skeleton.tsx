/**
 * SKELETON COMPONENT
 * ==================
 * Loading placeholder with shimmer animation.
 */

import { cn } from '@/lib/utils';
import { CATEGORY_COLORS } from '@/lib/constants/category-colors';

interface SkeletonProps {
  /** Shape variant */
  variant?: 'text' | 'circular' | 'rectangular';
  /** Width (CSS value or number in pixels) */
  width?: string | number;
  /** Height (CSS value or number in pixels) */
  height?: string | number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Skeleton loading placeholder.
 *
 * @example
 * <Skeleton variant="text" width="100%" />
 *
 * @example
 * <Skeleton variant="rectangular" height={200} />
 *
 * @example
 * <Skeleton variant="circular" width={48} height={48} />
 */
export function Skeleton({
  variant = 'rectangular',
  width,
  height,
  className,
}: SkeletonProps) {
  // Variant styles
  const variantStyles = {
    text: 'rounded-md h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  // Convert numbers to pixels
  const widthStyle =
    typeof width === 'number' ? `${width}px` : width;
  const heightStyle =
    typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={cn(
        'skeleton', // Uses the shimmer animation from globals.css
        variantStyles[variant],
        className
      )}
      style={{
        width: widthStyle,
        height: heightStyle,
      }}
    />
  );
}

/**
 * Category accent colors for skeleton top borders.
 * Cycles through them for visual variety.
 */
const SKELETON_ACCENT_COLORS = [
  CATEGORY_COLORS.music.accent,
  CATEGORY_COLORS.arts.accent,
  CATEGORY_COLORS.food.accent,
  CATEGORY_COLORS.sports.accent,
  CATEGORY_COLORS.nightlife.accent,
  CATEGORY_COLORS.festivals.accent,
];

/**
 * Preset skeleton for event cards.
 * Matches the real EventCard layout: 3px colored top border,
 * image area, date line, title, venue, and price.
 */
export function EventCardSkeleton({ index = 0 }: { index?: number }) {
  const accentColor =
    SKELETON_ACCENT_COLORS[index % SKELETON_ACCENT_COLORS.length];

  return (
    <div
      className="bg-pure rounded-lg overflow-hidden shadow-card"
    >
      {/* Image placeholder with badge skeleton */}
      <div className="relative">
        <Skeleton variant="rectangular" className="w-full aspect-video" />
        {/* Category badge skeleton */}
        <div className="absolute top-3 left-3">
          <Skeleton
            variant="rectangular"
            width={72}
            height={24}
            className="rounded-full"
          />
        </div>
      </div>

      {/* Content — matches EventCard padding and spacing */}
      <div className="p-4">
        {/* Date line */}
        <Skeleton variant="text" width="35%" height={14} className="mb-1" />
        {/* Title */}
        <Skeleton variant="text" width="85%" height={22} className="mb-1" />
        {/* Venue with icon */}
        <div className="flex items-center gap-1 mb-2">
          <Skeleton variant="circular" width={12} height={12} />
          <Skeleton variant="text" width="55%" height={14} />
        </div>
        {/* Price pill */}
        <Skeleton
          variant="rectangular"
          width={48}
          height={22}
          className="rounded-full"
        />
      </div>
    </div>
  );
}
