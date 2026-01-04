/**
 * HEART BUTTON COMPONENT
 * ======================
 * A toggle button for saving/unsaving (hearting) events.
 *
 * Features:
 *   - Optimistic updates for instant feedback
 *   - Beautiful animation on toggle
 *   - Shows heart count (optional)
 *   - Auth-aware (prompts login if not authenticated)
 *   - Multiple sizes for different contexts
 *
 * @example Basic usage
 * ```tsx
 * <HeartButton eventId={event.id} />
 * ```
 *
 * @example With count
 * ```tsx
 * <HeartButton
 *   eventId={event.id}
 *   initialHearted={event.userHasHearted}
 *   initialCount={event.heart_count}
 *   showCount
 * />
 * ```
 *
 * @module components/hearts/heart-button
 */

'use client';

import { Heart } from 'lucide-react';
import { useHeart } from '@/hooks/use-heart';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Size variants for the heart button
 */
export type HeartButtonSize = 'sm' | 'md' | 'lg';

/**
 * Props for HeartButton component
 */
export interface HeartButtonProps {
  /** The event to heart/unheart */
  eventId: string;

  /** Is the event initially hearted? (from server) */
  initialHearted?: boolean;

  /** Initial heart count (from server) */
  initialCount?: number;

  /** Show the heart count number? */
  showCount?: boolean;

  /** Button size */
  size?: HeartButtonSize;

  /** Additional CSS classes */
  className?: string;

  /** Called when heart state changes */
  onToggle?: (hearted: boolean) => void;
}

// ============================================================================
// SIZE STYLES
// ============================================================================

const SIZE_STYLES: Record<HeartButtonSize, { button: string; icon: string; text: string }> = {
  sm: {
    button: 'p-1.5 gap-1',
    icon: 'w-4 h-4',
    text: 'text-xs',
  },
  md: {
    button: 'p-2 gap-1.5',
    icon: 'w-5 h-5',
    text: 'text-sm',
  },
  lg: {
    button: 'p-2.5 gap-2',
    icon: 'w-6 h-6',
    text: 'text-base',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Heart button for saving/unsaving events
 */
export function HeartButton({
  eventId,
  initialHearted = false,
  initialCount = 0,
  showCount = true,
  size = 'md',
  className,
  onToggle,
}: HeartButtonProps) {
  // ---------------------------------------------------------------------------
  // HOOKS
  // ---------------------------------------------------------------------------

  const { isHearted, heartCount, isLoading, toggleHeart } = useHeart({
    eventId,
    initialHearted,
    initialCount,
    onToggle,
  });

  // ---------------------------------------------------------------------------
  // STYLES
  // ---------------------------------------------------------------------------

  const sizeStyles = SIZE_STYLES[size];

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <button
      type="button"
      onClick={(e) => {
        // Prevent click from bubbling to parent (e.g., card link)
        e.preventDefault();
        e.stopPropagation();
        toggleHeart();
      }}
      disabled={isLoading}
      aria-label={isHearted ? 'Remove from saved events' : 'Save this event'}
      aria-pressed={isHearted}
      className={cn(
        // Base styles
        'inline-flex items-center justify-center rounded-full',
        'transition-all duration-200 ease-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',

        // Size styles
        sizeStyles.button,

        // State styles
        isHearted
          ? 'bg-coral/10 text-coral hover:bg-coral/20'
          : 'bg-white/80 text-stone hover:text-coral hover:bg-coral/10',

        // Loading animation
        isLoading && 'animate-pulse',

        // Custom classes
        className
      )}
    >
      {/* Heart Icon */}
      <Heart
        className={cn(
          sizeStyles.icon,
          'transition-transform duration-200',

          // Filled when hearted
          isHearted && 'fill-current',

          // Scale effect on hover
          'group-hover:scale-110',

          // Animation when toggling
          isLoading && 'animate-pulse'
        )}
      />

      {/* Heart Count */}
      {showCount && heartCount > 0 && (
        <span
          className={cn(
            sizeStyles.text,
            'font-medium tabular-nums',
            isHearted ? 'text-coral' : 'text-stone'
          )}
        >
          {formatHeartCount(heartCount)}
        </span>
      )}
    </button>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format heart count for display
 * - Under 1000: show exact number
 * - 1000+: show as "1.2k"
 */
function formatHeartCount(count: number): string {
  if (count < 1000) {
    return count.toString();
  }

  const thousands = count / 1000;
  if (thousands < 10) {
    return `${thousands.toFixed(1)}k`;
  }

  return `${Math.floor(thousands)}k`;
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

/**
 * A minimal heart button for tight spaces (just icon, no padding)
 */
export function HeartButtonCompact({
  eventId,
  initialHearted = false,
  className,
}: {
  eventId: string;
  initialHearted?: boolean;
  className?: string;
}) {
  const { isHearted, isLoading, toggleHeart } = useHeart({
    eventId,
    initialHearted,
    initialCount: 0,
  });

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleHeart();
      }}
      disabled={isLoading}
      aria-label={isHearted ? 'Remove from saved' : 'Save event'}
      aria-pressed={isHearted}
      className={cn(
        'p-1 rounded-full transition-colors',
        isHearted ? 'text-coral' : 'text-stone hover:text-coral',
        isLoading && 'opacity-50',
        className
      )}
    >
      <Heart
        className={cn(
          'w-5 h-5',
          isHearted && 'fill-current'
        )}
      />
    </button>
  );
}
