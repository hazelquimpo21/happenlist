/**
 * SKELETON COMPONENT
 * ==================
 * Loading placeholder with shimmer animation.
 */

import { cn } from '@/lib/utils';

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
 * Preset skeleton for event cards.
 */
export function EventCardSkeleton() {
  return (
    <div className="bg-warm-white rounded-lg overflow-hidden shadow-card">
      {/* Image placeholder */}
      <Skeleton variant="rectangular" height={180} className="w-full" />

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Date */}
        <Skeleton variant="text" width="40%" />
        {/* Title */}
        <Skeleton variant="text" width="90%" height={24} />
        {/* Location */}
        <Skeleton variant="text" width="60%" />
        {/* Price */}
        <Skeleton variant="text" width="30%" />
      </div>
    </div>
  );
}
