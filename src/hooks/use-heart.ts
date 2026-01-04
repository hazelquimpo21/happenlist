/**
 * USE HEART HOOK
 * ==============
 * Client-side hook for managing heart state with optimistic updates.
 *
 * Features:
 *   - Optimistic UI updates (instant feedback)
 *   - Automatic rollback on error
 *   - Auth-aware (opens login if not authenticated)
 *   - Toast notifications for errors
 *
 * @example
 * ```tsx
 * function EventCard({ event }) {
 *   const { isHearted, heartCount, toggleHeart, isLoading } = useHeart({
 *     eventId: event.id,
 *     initialHearted: event.userHasHearted,
 *     initialCount: event.heart_count,
 *   });
 *
 *   return (
 *     <button onClick={toggleHeart} disabled={isLoading}>
 *       {isHearted ? '❤️' : '🤍'} {heartCount}
 *     </button>
 *   );
 * }
 * ```
 *
 * @module hooks/use-heart
 */

'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from './use-auth';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for the useHeart hook
 */
export interface UseHeartOptions {
  /** The event ID to manage heart state for */
  eventId: string;

  /** Is the event initially hearted? (from server) */
  initialHearted?: boolean;

  /** Initial heart count (from server) */
  initialCount?: number;

  /** Callback when heart state changes */
  onToggle?: (hearted: boolean) => void;
}

/**
 * Return value of the useHeart hook
 */
export interface UseHeartReturn {
  /** Is the event currently hearted? */
  isHearted: boolean;

  /** Current heart count */
  heartCount: number;

  /** Is the toggle request in progress? */
  isLoading: boolean;

  /** Toggle the heart state */
  toggleHeart: () => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing heart state with optimistic updates
 */
export function useHeart(options: UseHeartOptions): UseHeartReturn {
  const {
    eventId,
    initialHearted = false,
    initialCount = 0,
    onToggle,
  } = options;

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  const { session, isAuthenticated } = useAuth();
  const [isHearted, setIsHearted] = useState(initialHearted);
  const [heartCount, setHeartCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // TOGGLE HEART
  // ---------------------------------------------------------------------------

  const toggleHeart = useCallback(async () => {
    // -------------------------------------------------------------------------
    // 1. CHECK AUTH
    // -------------------------------------------------------------------------

    if (!isAuthenticated || !session) {
      // Show a friendly toast prompting login
      toast.error('Please sign in to save events', {
        description: 'Create an account to save your favorite events.',
        action: {
          label: 'Sign In',
          onClick: () => {
            // Navigate to login with redirect back
            window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          },
        },
      });
      return;
    }

    // -------------------------------------------------------------------------
    // 2. OPTIMISTIC UPDATE
    // -------------------------------------------------------------------------

    // Save previous state for potential rollback
    const wasHearted = isHearted;
    const previousCount = heartCount;

    // Immediately update UI (optimistic)
    setIsHearted(!wasHearted);
    setHeartCount((prev) => (wasHearted ? Math.max(0, prev - 1) : prev + 1));
    setIsLoading(true);

    // Notify callback
    onToggle?.(!wasHearted);

    // -------------------------------------------------------------------------
    // 3. MAKE API REQUEST
    // -------------------------------------------------------------------------

    try {
      const response = await fetch('/api/hearts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Request failed - rollback
        throw new Error(data.error || 'Failed to update');
      }

      // Update with actual server values (in case of race conditions)
      setIsHearted(data.hearted);
      setHeartCount(data.heartCount);

      // Show success feedback for adding (not removing)
      if (data.hearted) {
        toast.success('Event saved!', {
          description: 'View all your saved events in My Hearts.',
          duration: 2000,
        });
      }
    } catch (error) {
      // -----------------------------------------------------------------------
      // 4. ROLLBACK ON ERROR
      // -----------------------------------------------------------------------

      console.error('❤️ Heart toggle failed:', error);

      // Revert to previous state
      setIsHearted(wasHearted);
      setHeartCount(previousCount);

      // Notify callback of rollback
      onToggle?.(wasHearted);

      // Show error toast
      toast.error('Couldn\'t save event', {
        description: 'Please try again in a moment.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [eventId, isHearted, heartCount, isAuthenticated, session, onToggle]);

  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------

  return {
    isHearted,
    heartCount,
    isLoading,
    toggleHeart,
  };
}
