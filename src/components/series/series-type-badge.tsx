/**
 * SERIES TYPE BADGE
 * =================
 * Visual badge indicating the type of series.
 *
 * Types: class, camp, workshop, recurring, festival, season
 */

import {
  GraduationCap,
  Tent,
  Wrench,
  Repeat,
  PartyPopper,
  Calendar,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSeriesTypeInfo } from '@/types';
import type { SeriesType } from '@/lib/supabase/types';

// ============================================================================
// ICON MAP
// ============================================================================

/**
 * Maps series type to Lucide icon component.
 */
const SERIES_TYPE_ICONS: Record<SeriesType, LucideIcon> = {
  class: GraduationCap,
  camp: Tent,
  workshop: Wrench,
  recurring: Repeat,
  festival: PartyPopper,
  season: Calendar,
};

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface SeriesTypeBadgeProps {
  /** Series type */
  type: string;
  /** Badge size */
  size?: 'sm' | 'md' | 'lg';
  /** Show icon */
  showIcon?: boolean;
  /** Show label text */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Badge showing the series type with icon and label.
 *
 * @example Basic usage
 * ```tsx
 * <SeriesTypeBadge type="class" />
 * ```
 *
 * @example Icon only (compact)
 * ```tsx
 * <SeriesTypeBadge type="recurring" showLabel={false} />
 * ```
 *
 * @example Large with custom class
 * ```tsx
 * <SeriesTypeBadge type="festival" size="lg" className="shadow-md" />
 * ```
 */
export function SeriesTypeBadge({
  type,
  size = 'md',
  showIcon = true,
  showLabel = true,
  className,
}: SeriesTypeBadgeProps) {
  // Get type info (falls back to 'class' if unknown type)
  const typeInfo = getSeriesTypeInfo(type);
  const Icon = SERIES_TYPE_ICONS[type as SeriesType] || GraduationCap;

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        'bg-warm-white/90 backdrop-blur-sm',
        typeInfo.badgeColor,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {showLabel && <span>{typeInfo.label}</span>}
    </span>
  );
}

// ============================================================================
// HELPER EXPORTS
// ============================================================================

/**
 * Get just the icon component for a series type.
 * Useful for custom layouts.
 */
export function getSeriesTypeIcon(type: string): LucideIcon {
  return SERIES_TYPE_ICONS[type as SeriesType] || GraduationCap;
}
