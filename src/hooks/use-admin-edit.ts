'use client';

/**
 * USE ADMIN EDIT HOOK
 * ===================
 * Hook for superadmin event editing operations.
 *
 * Provides methods for:
 * - Updating event fields
 * - Changing event status
 * - Deleting events (soft delete)
 * - Restoring deleted events
 *
 * All operations call the `/api/superadmin/events/[id]` endpoints.
 *
 * @module hooks/use-admin-edit
 */

import { useState, useCallback } from 'react';
import { createLogger } from '@/lib/utils/logger';

// ============================================================================
// LOGGER
// ============================================================================

const logger = createLogger('useAdminEdit');

// ============================================================================
// TYPES
// ============================================================================

/**
 * Return type of the useAdminEdit hook
 */
interface UseAdminEditReturn {
  /** Update event fields */
  updateEvent: (
    updates: Record<string, unknown>,
    notes?: string,
    occurrenceScope?: string
  ) => Promise<boolean>;

  /** Change event status */
  updateStatus: (status: string, notes?: string) => Promise<boolean>;

  /** Soft delete event */
  deleteEvent: (reason?: string) => Promise<boolean>;

  /** Restore a soft-deleted event */
  restoreEvent: () => Promise<boolean>;

  /** Loading state */
  isLoading: boolean;

  /** Error message (null if no error) */
  error: string | null;

  /** Success state (true after successful operation) */
  success: boolean;

  /** Clear error and success states */
  reset: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * useAdminEdit - Hook for superadmin event editing
 *
 * Provides async methods for editing, deleting, and restoring events.
 * Manages loading, error, and success states.
 *
 * @param eventId - The ID of the event to edit
 * @returns Object with edit methods and state
 *
 * @example
 * ```tsx
 * function EditForm({ eventId }) {
 *   const { updateEvent, isLoading, error, success } = useAdminEdit(eventId);
 *
 *   const handleSave = async () => {
 *     const result = await updateEvent(
 *       { title: 'New Title' },
 *       'Fixed typo in title'
 *     );
 *     if (result) {
 *       // Success!
 *     }
 *   };
 *
 *   return (
 *     <form>
 *       {error && <p className="error">{error}</p>}
 *       {success && <p className="success">Saved!</p>}
 *       <button onClick={handleSave} disabled={isLoading}>
 *         {isLoading ? 'Saving...' : 'Save'}
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useAdminEdit(eventId: string): UseAdminEditReturn {
  // -------------------------------------------------------------------------
  // STATE
  // -------------------------------------------------------------------------

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // -------------------------------------------------------------------------
  // RESET
  // -------------------------------------------------------------------------

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  // -------------------------------------------------------------------------
  // UPDATE EVENT
  // -------------------------------------------------------------------------

  /**
   * Update event fields
   *
   * @param updates - Object containing fields to update
   * @param notes - Optional notes for audit log
   * @returns true if successful, false if failed
   */
  const updateEvent = useCallback(
    async (
      updates: Record<string, unknown>,
      notes?: string,
      occurrenceScope?: string
    ): Promise<boolean> => {
      logger.info('Updating event', { eventId, fields: Object.keys(updates) });

      setIsLoading(true);
      setError(null);
      setSuccess(false);

      try {
        const response = await fetch(`/api/superadmin/events/${eventId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            updates,
            notes: notes || 'Superadmin edit',
            ...(occurrenceScope ? { applyToSeries: true, occurrenceScope } : {}),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMessage = data.message || 'Failed to update event';
          logger.error('Update failed', { error: errorMessage });
          setError(errorMessage);
          return false;
        }

        logger.success('Event updated successfully');
        setSuccess(true);
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Network error';
        logger.error('Update failed', { error: errorMessage });
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [eventId]
  );

  // -------------------------------------------------------------------------
  // UPDATE STATUS
  // -------------------------------------------------------------------------

  /**
   * Change event status
   *
   * @param status - New status value
   * @param notes - Optional notes for audit log
   * @returns true if successful, false if failed
   */
  const updateStatus = useCallback(
    async (status: string, notes?: string): Promise<boolean> => {
      logger.info('Updating event status', { eventId, status });

      setIsLoading(true);
      setError(null);
      setSuccess(false);

      try {
        const response = await fetch(
          `/api/superadmin/events/${eventId}/status`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status,
              notes: notes || `Status changed to ${status}`,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          const errorMessage = data.message || 'Failed to update status';
          logger.error('Status update failed', { error: errorMessage });
          setError(errorMessage);
          return false;
        }

        logger.success('Status updated successfully', { newStatus: status });
        setSuccess(true);
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Network error';
        logger.error('Status update failed', { error: errorMessage });
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [eventId]
  );

  // -------------------------------------------------------------------------
  // DELETE EVENT
  // -------------------------------------------------------------------------

  /**
   * Soft delete an event
   *
   * @param reason - Optional reason for deletion
   * @returns true if successful, false if failed
   */
  const deleteEvent = useCallback(
    async (reason?: string): Promise<boolean> => {
      logger.info('Deleting event', { eventId });

      setIsLoading(true);
      setError(null);
      setSuccess(false);

      try {
        const response = await fetch(`/api/superadmin/events/${eventId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: reason || 'Deleted by superadmin',
            hardDelete: false,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMessage = data.message || 'Failed to delete event';
          logger.error('Delete failed', { error: errorMessage });
          setError(errorMessage);
          return false;
        }

        logger.success('Event deleted successfully');
        setSuccess(true);
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Network error';
        logger.error('Delete failed', { error: errorMessage });
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [eventId]
  );

  // -------------------------------------------------------------------------
  // RESTORE EVENT
  // -------------------------------------------------------------------------

  /**
   * Restore a soft-deleted event
   *
   * @returns true if successful, false if failed
   */
  const restoreEvent = useCallback(async (): Promise<boolean> => {
    logger.info('Restoring event', { eventId });

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(
        `/api/superadmin/events/${eventId}/restore`,
        {
          method: 'POST',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || 'Failed to restore event';
        logger.error('Restore failed', { error: errorMessage });
        setError(errorMessage);
        return false;
      }

      logger.success('Event restored successfully');
      setSuccess(true);
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Network error';
      logger.error('Restore failed', { error: errorMessage });
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  // -------------------------------------------------------------------------
  // RETURN
  // -------------------------------------------------------------------------

  return {
    updateEvent,
    updateStatus,
    deleteEvent,
    restoreEvent,
    isLoading,
    error,
    success,
    reset,
  };
}
