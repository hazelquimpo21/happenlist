/**
 * SERIES SKELETON COMPONENTS
 * ==========================
 * Loading placeholder skeletons for series cards.
 * Matches the structure of real cards for smooth loading.
 */

import { Card, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';

// ============================================================================
// CARD SKELETON
// ============================================================================

interface SeriesCardSkeletonProps {
  /** Variant to match SeriesCard */
  variant?: 'default' | 'compact' | 'featured';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Loading skeleton for SeriesCard.
 * Matches the layout of the real card.
 *
 * @example
 * ```tsx
 * <SeriesCardSkeleton />
 * <SeriesCardSkeleton variant="compact" />
 * ```
 */
export function SeriesCardSkeleton({
  variant = 'default',
  className,
}: SeriesCardSkeletonProps) {
  // Match aspect ratios from SeriesCard
  const aspectRatio = {
    default: 'aspect-video',
    compact: 'aspect-[4/3]',
    featured: 'aspect-[3/2]',
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Image placeholder */}
      <Skeleton className={cn('w-full', aspectRatio[variant])} />

      {/* Content placeholder */}
      <div className="p-4 space-y-2">
        {/* Date line */}
        <Skeleton className="h-4 w-24" />

        {/* Title (2 lines for default, 1 for compact) */}
        <Skeleton className="h-5 w-full" />
        {variant !== 'compact' && <Skeleton className="h-5 w-3/4" />}

        {/* Location */}
        <Skeleton className="h-4 w-32" />

        {/* Session info */}
        <Skeleton className="h-4 w-28" />

        {/* Price */}
        <Skeleton className="h-5 w-16" />
      </div>
    </Card>
  );
}

// ============================================================================
// GRID SKELETON
// ============================================================================

interface SeriesGridSkeletonProps {
  /** Number of skeleton cards */
  count?: number;
  /** Card variant */
  variant?: 'default' | 'compact' | 'featured';
  /** Number of columns */
  columns?: 2 | 3 | 4;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Loading skeleton for SeriesGrid.
 *
 * @example
 * ```tsx
 * <SeriesGridSkeleton count={8} />
 * ```
 */
export function SeriesGridSkeleton({
  count = 8,
  variant = 'default',
  columns,
  className,
}: SeriesGridSkeletonProps) {
  const gridCols = columns
    ? getFixedColumns(columns)
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <div className={cn('grid gap-6', gridCols, className)}>
      {Array.from({ length: count }).map((_, index) => (
        <SeriesCardSkeleton key={index} variant={variant} />
      ))}
    </div>
  );
}

// Helper
function getFixedColumns(count: 2 | 3 | 4): string {
  switch (count) {
    case 2:
      return 'grid-cols-1 sm:grid-cols-2';
    case 3:
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    case 4:
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  }
}

// ============================================================================
// DETAIL PAGE SKELETON
// ============================================================================

/**
 * Loading skeleton for series detail page.
 *
 * @example
 * ```tsx
 * <SeriesDetailSkeleton />
 * ```
 */
export function SeriesDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero section */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Image */}
        <Skeleton className="aspect-video rounded-lg" />

        {/* Content */}
        <div className="space-y-4">
          {/* Type badge */}
          <Skeleton className="h-6 w-20 rounded-full" />

          {/* Title */}
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />

          {/* Meta info */}
          <div className="space-y-2 pt-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-40" />
          </div>

          {/* Price */}
          <Skeleton className="h-8 w-24" />

          {/* CTA button */}
          <Skeleton className="h-12 w-full max-w-xs rounded-full" />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Events section */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 items-center p-4 border rounded-lg">
              <Skeleton className="h-12 w-12 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
