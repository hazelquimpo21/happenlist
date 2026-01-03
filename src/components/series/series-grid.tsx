/**
 * SERIES GRID COMPONENT
 * =====================
 * Responsive grid layout for displaying series cards.
 * Handles loading states and empty states.
 */

import { SeriesCard } from './series-card';
import { SeriesCardSkeleton } from './series-skeleton';
import { cn } from '@/lib/utils';
import type { SeriesCard as SeriesCardType } from '@/types';

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface SeriesGridProps {
  /** Array of series to display */
  series: SeriesCardType[];
  /** Show loading skeletons */
  loading?: boolean;
  /** Number of skeleton cards to show when loading */
  skeletonCount?: number;
  /** Message to show when no series found */
  emptyMessage?: string;
  /** Card variant */
  variant?: 'default' | 'compact' | 'featured';
  /** Number of columns (responsive by default) */
  columns?: 2 | 3 | 4;
  /** Show category badges on cards */
  showCategory?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Responsive grid for displaying series cards.
 *
 * @example Basic usage
 * ```tsx
 * <SeriesGrid series={seriesList} />
 * ```
 *
 * @example With loading state
 * ```tsx
 * <SeriesGrid series={[]} loading skeletonCount={8} />
 * ```
 *
 * @example Fixed columns
 * ```tsx
 * <SeriesGrid series={featured} columns={4} variant="featured" />
 * ```
 */
export function SeriesGrid({
  series,
  loading = false,
  skeletonCount = 8,
  emptyMessage = 'No series found',
  variant = 'default',
  columns,
  showCategory = false,
  className,
}: SeriesGridProps) {
  // Loading state: show skeletons
  if (loading) {
    return (
      <div
        className={cn(
          'grid gap-6',
          columns
            ? getFixedColumns(columns)
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
          className
        )}
      >
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <SeriesCardSkeleton key={index} variant={variant} />
        ))}
      </div>
    );
  }

  // Empty state: show message
  if (series.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <p className="text-stone text-body">{emptyMessage}</p>
      </div>
    );
  }

  // Grid layout
  return (
    <div
      className={cn(
        'grid gap-6',
        columns
          ? getFixedColumns(columns)
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}
    >
      {series.map((item) => (
        <SeriesCard
          key={item.id}
          series={item}
          variant={variant}
          showCategory={showCategory}
        />
      ))}
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get Tailwind grid-cols class for fixed column count.
 */
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
// FEATURED VARIANT
// ============================================================================

interface FeaturedSeriesGridProps {
  /** Featured series to display */
  series: SeriesCardType[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Special grid layout for featured series.
 * First item is large, others are smaller.
 *
 * @example
 * ```tsx
 * <FeaturedSeriesGrid series={featuredSeries} />
 * ```
 */
export function FeaturedSeriesGrid({
  series,
  className,
}: FeaturedSeriesGridProps) {
  if (series.length === 0) {
    return null;
  }

  const [first, ...rest] = series;

  return (
    <div className={cn('grid gap-6 lg:grid-cols-2', className)}>
      {/* Featured (large) card */}
      <SeriesCard series={first} variant="featured" showCategory />

      {/* Smaller cards */}
      {rest.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {rest.slice(0, 4).map((item) => (
            <SeriesCard key={item.id} series={item} variant="compact" />
          ))}
        </div>
      )}
    </div>
  );
}
