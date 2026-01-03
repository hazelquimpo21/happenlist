/**
 * SERIES LINK BADGE
 * =================
 * Badge shown on event cards when the event is part of a series.
 * Links to the parent series page.
 */

import Link from 'next/link';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSeriesTypeInfo } from '@/types';

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface SeriesLinkBadgeProps {
  /** Series slug for the link */
  seriesSlug: string;
  /** Series title for display */
  seriesTitle: string;
  /** Series type for styling */
  seriesType?: string;
  /** Sequence number within series (optional) */
  sequenceNumber?: number | null;
  /** Badge size */
  size?: 'sm' | 'md';
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Badge shown on event cards to indicate series membership.
 * Clicking navigates to the series page.
 *
 * @example Basic usage
 * ```tsx
 * <SeriesLinkBadge
 *   seriesSlug="pottery-101"
 *   seriesTitle="Pottery 101"
 *   seriesType="class"
 * />
 * ```
 *
 * @example With sequence number
 * ```tsx
 * <SeriesLinkBadge
 *   seriesSlug="yoga-foundations"
 *   seriesTitle="Yoga Foundations"
 *   seriesType="class"
 *   sequenceNumber={3}
 * />
 * ```
 */
export function SeriesLinkBadge({
  seriesSlug,
  seriesTitle,
  seriesType = 'class',
  sequenceNumber,
  size = 'sm',
  className,
}: SeriesLinkBadgeProps) {
  const typeInfo = getSeriesTypeInfo(seriesType);

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  };

  return (
    <Link
      href={`/series/${seriesSlug}`}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        'bg-sage/10 text-sage border border-sage/20',
        'hover:bg-sage/20 hover:border-sage/30 transition-colors',
        sizeClasses[size],
        className
      )}
      title={`Part of ${seriesTitle}`}
    >
      <Layers className={iconSizes[size]} />
      <span className="truncate max-w-[120px]">
        {sequenceNumber ? `#${sequenceNumber}` : typeInfo.label}
      </span>
    </Link>
  );
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

interface SeriesIndicatorProps {
  /** Series type for icon */
  seriesType?: string;
  /** Just show icon (no text) */
  iconOnly?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Compact series indicator (just icon + "Part of series").
 * Used when full badge is too large.
 *
 * @example
 * ```tsx
 * <SeriesIndicator seriesType="class" />
 * ```
 */
export function SeriesIndicator({
  seriesType = 'class',
  iconOnly = false,
  className,
}: SeriesIndicatorProps) {
  const typeInfo = getSeriesTypeInfo(seriesType);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sage text-xs',
        className
      )}
      title={`Part of a ${typeInfo.label.toLowerCase()}`}
    >
      <Layers className="w-3 h-3" />
      {!iconOnly && <span>Part of series</span>}
    </span>
  );
}
