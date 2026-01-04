/**
 * 🦸 SUPERADMIN EVENT ACTIONS
 * ===========================
 * Server-side actions for superadmin event management.
 *
 * Superadmins can:
 * ✅ Edit ANY event (regardless of owner)
 * ✅ Delete ANY event (soft delete with audit trail)
 * ✅ Restore deleted events
 * ✅ Change event status directly
 * ✅ Update all event fields
 *
 * 🔐 SECURITY:
 * - All actions verify superadmin status before execution
 * - All actions are logged to admin_audit_log
 * - Uses service role for database operations (bypasses RLS)
 *
 * @module data/superadmin/superadmin-event-actions
 */

import { createClient } from '@/lib/supabase/server';
import { requireSuperAdmin, isSuperAdmin } from '@/lib/auth';
import { superadminLogger } from '@/lib/utils/logger';
import type { Database } from '@/lib/supabase/types';

// Type definitions
type EventUpdate = Database['public']['Tables']['events']['Update'];

// ============================================================================
// 🏷️ TYPES
// ============================================================================

/**
 * Result of a superadmin action.
 */
export interface SuperadminActionResult {
  success: boolean;
  message: string;
  eventId?: string;
  error?: string;
  timestamp: string;
}

/**
 * Parameters for editing an event.
 */
export interface EditEventParams {
  eventId: string;
  adminEmail: string;
  updates: Partial<EventUpdate>;
  notes?: string;
}

/**
 * Parameters for deleting an event.
 */
export interface DeleteEventParams {
  eventId: string;
  adminEmail: string;
  reason: string;
  hardDelete?: boolean; // If true, permanently deletes (use with caution!)
}

/**
 * Parameters for changing event status.
 */
export interface ChangeStatusParams {
  eventId: string;
  adminEmail: string;
  newStatus: string;
  notes?: string;
}

// Helper type for event row
interface EventRow {
  id: string;
  title: string;
  status: string;
  deleted_at: string | null;
  [key: string]: unknown;
}

// ============================================================================
// ✏️ EDIT ANY EVENT
// ============================================================================

/**
 * Edit any event as superadmin.
 *
 * @param params - Edit parameters including eventId, updates, and admin info
 * @returns Action result with success/failure info
 *
 * @example
 * ```ts
 * const result = await superadminEditEvent({
 *   eventId: 'event-uuid',
 *   adminEmail: 'superadmin@example.com',
 *   updates: { title: 'Updated Title', description: 'New description' },
 *   notes: 'Fixed typo in title'
 * });
 * ```
 */
export async function superadminEditEvent(
  params: EditEventParams
): Promise<SuperadminActionResult> {
  const { eventId, adminEmail, updates, notes } = params;
  const timestamp = new Date().toISOString();

  // 🔐 Verify superadmin status
  try {
    requireSuperAdmin(adminEmail);
  } catch (error) {
    return {
      success: false,
      message: 'Unauthorized: Superadmin access required',
      error: 'Not a superadmin',
      timestamp,
    };
  }

  const timer = superadminLogger.time('superadminEditEvent', {
    action: 'superadmin_edit',
    entityType: 'event',
    entityId: eventId,
    adminEmail,
  });

  try {
    const supabase = await createClient();

    // 📋 Get current event data for audit log
    const { data, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    const currentEvent = data as EventRow | null;

    if (fetchError || !currentEvent) {
      timer.error('Event not found', fetchError);
      return {
        success: false,
        message: '❌ Event not found',
        error: fetchError?.message || 'Event does not exist',
        timestamp,
      };
    }

    // 📝 Build changes object for audit log
    const changes: Record<string, { before: unknown; after: unknown }> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (currentEvent[key] !== value) {
        changes[key] = {
          before: currentEvent[key],
          after: value,
        };
      }
    }

    // Skip update if no actual changes
    if (Object.keys(changes).length === 0) {
      superadminLogger.warn('No changes detected', { entityType: 'event', entityId: eventId });
      return {
        success: true,
        message: '⚠️ No changes to save',
        eventId,
        timestamp,
      };
    }

    // ✏️ Update the event
    const updateData = {
      ...updates,
      last_edited_at: timestamp,
      last_edited_by: adminEmail,
      edit_count: (currentEvent.edit_count as number || 0) + 1,
      updated_at: timestamp,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('events')
      .update(updateData)
      .eq('id', eventId);

    if (updateError) {
      timer.error('Failed to update event', updateError);
      return {
        success: false,
        message: '❌ Failed to update event',
        error: updateError.message,
        timestamp,
      };
    }

    // 📋 Log to audit trail
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('admin_audit_log').insert({
        action: 'superadmin_edit',
        entity_type: 'event',
        entity_id: eventId,
        admin_email: adminEmail,
        changes: {
          fields_changed: Object.keys(changes),
          details: changes,
        },
        notes: notes || `Superadmin edit: ${Object.keys(changes).join(', ')}`,
      });
    } catch (auditError) {
      superadminLogger.warn('⚠️ Failed to log audit entry', { metadata: { error: auditError } });
    }

    timer.success(`✅ Event updated: ${currentEvent.title}`, {
      metadata: { changedFields: Object.keys(changes) },
    });

    return {
      success: true,
      message: `✅ Event "${currentEvent.title}" updated successfully`,
      eventId,
      timestamp,
    };
  } catch (error) {
    timer.error('Unexpected error editing event', error);
    return {
      success: false,
      message: '❌ An unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp,
    };
  }
}

// ============================================================================
// 🗑️ DELETE ANY EVENT
// ============================================================================

/**
 * Delete any event as superadmin (soft delete by default).
 *
 * @param params - Delete parameters including eventId and reason
 * @returns Action result with success/failure info
 *
 * @example
 * ```ts
 * const result = await superadminDeleteEvent({
 *   eventId: 'event-uuid',
 *   adminEmail: 'superadmin@example.com',
 *   reason: 'Spam event - reported by multiple users'
 * });
 * ```
 */
export async function superadminDeleteEvent(
  params: DeleteEventParams
): Promise<SuperadminActionResult> {
  const { eventId, adminEmail, reason, hardDelete = false } = params;
  const timestamp = new Date().toISOString();

  // 🔐 Verify superadmin status
  try {
    requireSuperAdmin(adminEmail);
  } catch (error) {
    return {
      success: false,
      message: 'Unauthorized: Superadmin access required',
      error: 'Not a superadmin',
      timestamp,
    };
  }

  const timer = superadminLogger.time('superadminDeleteEvent', {
    action: hardDelete ? 'superadmin_hard_delete' : 'superadmin_soft_delete',
    entityType: 'event',
    entityId: eventId,
    adminEmail,
  });

  try {
    const supabase = await createClient();

    // 📋 Get event for audit log
    const { data, error: fetchError } = await supabase
      .from('events')
      .select('id, title, status')
      .eq('id', eventId)
      .single();

    const currentEvent = data as { id: string; title: string; status: string } | null;

    if (fetchError || !currentEvent) {
      timer.error('Event not found', fetchError);
      return {
        success: false,
        message: '❌ Event not found',
        error: fetchError?.message || 'Event does not exist',
        timestamp,
      };
    }

    if (hardDelete) {
      // ⚠️ HARD DELETE - Permanently removes from database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteError } = await (supabase as any)
        .from('events')
        .delete()
        .eq('id', eventId);

      if (deleteError) {
        timer.error('Failed to hard delete event', deleteError);
        return {
          success: false,
          message: '❌ Failed to delete event',
          error: deleteError.message,
          timestamp,
        };
      }

      // 📋 Log to audit trail (event is now gone, but we still log it)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('admin_audit_log').insert({
          action: 'superadmin_hard_delete',
          entity_type: 'event',
          entity_id: eventId,
          admin_email: adminEmail,
          changes: {
            event_title: currentEvent.title,
            previous_status: currentEvent.status,
          },
          notes: `HARD DELETE: ${reason}`,
        });
      } catch (auditError) {
        superadminLogger.warn('⚠️ Failed to log audit entry', { metadata: { error: auditError } });
      }

      timer.success(`🗑️ Event hard deleted: ${currentEvent.title}`);

      return {
        success: true,
        message: `🗑️ Event "${currentEvent.title}" permanently deleted`,
        eventId,
        timestamp,
      };
    } else {
      // 🔄 SOFT DELETE - Mark as deleted, can be restored
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('events')
        .update({
          deleted_at: timestamp,
          deleted_by: adminEmail,
          delete_reason: reason,
        })
        .eq('id', eventId);

      if (updateError) {
        timer.error('Failed to soft delete event', updateError);
        return {
          success: false,
          message: '❌ Failed to delete event',
          error: updateError.message,
          timestamp,
        };
      }

      // 📋 Log to audit trail
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('admin_audit_log').insert({
          action: 'superadmin_soft_delete',
          entity_type: 'event',
          entity_id: eventId,
          admin_email: adminEmail,
          changes: {
            before: { status: currentEvent.status, deleted_at: null },
            after: { deleted_at: timestamp },
          },
          notes: reason,
        });
      } catch (auditError) {
        superadminLogger.warn('⚠️ Failed to log audit entry', { metadata: { error: auditError } });
      }

      timer.success(`🗑️ Event soft deleted: ${currentEvent.title}`);

      return {
        success: true,
        message: `🗑️ Event "${currentEvent.title}" deleted (can be restored)`,
        eventId,
        timestamp,
      };
    }
  } catch (error) {
    timer.error('Unexpected error deleting event', error);
    return {
      success: false,
      message: '❌ An unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp,
    };
  }
}

// ============================================================================
// ♻️ RESTORE DELETED EVENT
// ============================================================================

/**
 * Restore a soft-deleted event as superadmin.
 *
 * @param eventId - ID of the event to restore
 * @param adminEmail - Email of the superadmin performing the action
 * @returns Action result with success/failure info
 */
export async function superadminRestoreEvent(
  eventId: string,
  adminEmail: string
): Promise<SuperadminActionResult> {
  const timestamp = new Date().toISOString();

  // 🔐 Verify superadmin status
  try {
    requireSuperAdmin(adminEmail);
  } catch (error) {
    return {
      success: false,
      message: 'Unauthorized: Superadmin access required',
      error: 'Not a superadmin',
      timestamp,
    };
  }

  const timer = superadminLogger.time('superadminRestoreEvent', {
    action: 'superadmin_restore',
    entityType: 'event',
    entityId: eventId,
    adminEmail,
  });

  try {
    const supabase = await createClient();

    // 📋 Get event for verification
    const { data, error: fetchError } = await supabase
      .from('events')
      .select('id, title, deleted_at')
      .eq('id', eventId)
      .single();

    const currentEvent = data as { id: string; title: string; deleted_at: string | null } | null;

    if (fetchError || !currentEvent) {
      timer.error('Event not found', fetchError);
      return {
        success: false,
        message: '❌ Event not found',
        error: fetchError?.message || 'Event does not exist',
        timestamp,
      };
    }

    if (!currentEvent.deleted_at) {
      superadminLogger.warn('Event is not deleted', { entityType: 'event', entityId: eventId });
      return {
        success: false,
        message: '⚠️ Event is not deleted',
        error: 'Cannot restore an event that is not deleted',
        timestamp,
      };
    }

    // ♻️ Restore the event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('events')
      .update({
        deleted_at: null,
        deleted_by: null,
        delete_reason: null,
      })
      .eq('id', eventId);

    if (updateError) {
      timer.error('Failed to restore event', updateError);
      return {
        success: false,
        message: '❌ Failed to restore event',
        error: updateError.message,
        timestamp,
      };
    }

    // 📋 Log to audit trail
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('admin_audit_log').insert({
        action: 'superadmin_restore',
        entity_type: 'event',
        entity_id: eventId,
        admin_email: adminEmail,
        changes: {
          before: { deleted_at: currentEvent.deleted_at },
          after: { deleted_at: null },
        },
        notes: 'Event restored by superadmin',
      });
    } catch (auditError) {
      superadminLogger.warn('⚠️ Failed to log audit entry', { metadata: { error: auditError } });
    }

    timer.success(`♻️ Event restored: ${currentEvent.title}`);

    return {
      success: true,
      message: `♻️ Event "${currentEvent.title}" restored successfully`,
      eventId,
      timestamp,
    };
  } catch (error) {
    timer.error('Unexpected error restoring event', error);
    return {
      success: false,
      message: '❌ An unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp,
    };
  }
}

// ============================================================================
// 🔄 CHANGE EVENT STATUS
// ============================================================================

/**
 * Change the status of any event as superadmin.
 *
 * @param params - Status change parameters
 * @returns Action result with success/failure info
 */
export async function superadminChangeStatus(
  params: ChangeStatusParams
): Promise<SuperadminActionResult> {
  const { eventId, adminEmail, newStatus, notes } = params;
  const timestamp = new Date().toISOString();

  // 🔐 Verify superadmin status
  try {
    requireSuperAdmin(adminEmail);
  } catch (error) {
    return {
      success: false,
      message: 'Unauthorized: Superadmin access required',
      error: 'Not a superadmin',
      timestamp,
    };
  }

  const timer = superadminLogger.time('superadminChangeStatus', {
    action: 'superadmin_status_change',
    entityType: 'event',
    entityId: eventId,
    adminEmail,
  });

  try {
    const supabase = await createClient();

    // 📋 Get current event
    const { data, error: fetchError } = await supabase
      .from('events')
      .select('id, title, status')
      .eq('id', eventId)
      .single();

    const currentEvent = data as { id: string; title: string; status: string } | null;

    if (fetchError || !currentEvent) {
      timer.error('Event not found', fetchError);
      return {
        success: false,
        message: '❌ Event not found',
        error: fetchError?.message || 'Event does not exist',
        timestamp,
      };
    }

    // Build update data based on new status
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updated_at: timestamp,
    };

    // Add published_at if publishing
    if (newStatus === 'published' && currentEvent.status !== 'published') {
      updateData.published_at = timestamp;
    }

    // 🔄 Update status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('events')
      .update(updateData)
      .eq('id', eventId);

    if (updateError) {
      timer.error('Failed to change status', updateError);
      return {
        success: false,
        message: '❌ Failed to change status',
        error: updateError.message,
        timestamp,
      };
    }

    // 📋 Log to audit trail
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('admin_audit_log').insert({
        action: 'superadmin_status_change',
        entity_type: 'event',
        entity_id: eventId,
        admin_email: adminEmail,
        changes: {
          before: { status: currentEvent.status },
          after: { status: newStatus },
        },
        notes: notes || `Status changed: ${currentEvent.status} → ${newStatus}`,
      });
    } catch (auditError) {
      superadminLogger.warn('⚠️ Failed to log audit entry', { metadata: { error: auditError } });
    }

    timer.success(`🔄 Status changed: ${currentEvent.title}`);

    return {
      success: true,
      message: `🔄 Event status changed: ${currentEvent.status} → ${newStatus}`,
      eventId,
      timestamp,
    };
  } catch (error) {
    timer.error('Unexpected error changing status', error);
    return {
      success: false,
      message: '❌ An unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp,
    };
  }
}

// ============================================================================
// 📊 BULK OPERATIONS
// ============================================================================

/**
 * Bulk delete events as superadmin.
 */
export async function superadminBulkDelete(
  eventIds: string[],
  adminEmail: string,
  reason: string
): Promise<{ succeeded: string[]; failed: string[] }> {
  // 🔐 Verify superadmin status first
  if (!isSuperAdmin(adminEmail)) {
    superadminLogger.warn('Bulk delete attempted by non-superadmin', {
      metadata: { adminEmail, count: eventIds.length },
    });
    return { succeeded: [], failed: eventIds };
  }

  const timer = superadminLogger.time('superadminBulkDelete', {
    action: 'superadmin_bulk_delete',
    adminEmail,
    metadata: { count: eventIds.length },
  });

  const succeeded: string[] = [];
  const failed: string[] = [];

  for (const eventId of eventIds) {
    const result = await superadminDeleteEvent({ eventId, adminEmail, reason });
    if (result.success) {
      succeeded.push(eventId);
    } else {
      failed.push(eventId);
    }
  }

  timer.success(`Bulk delete: ${succeeded.length}/${eventIds.length} succeeded`, {
    metadata: { succeeded: succeeded.length, failed: failed.length },
  });

  return { succeeded, failed };
}

/**
 * Bulk status change as superadmin.
 */
export async function superadminBulkChangeStatus(
  eventIds: string[],
  adminEmail: string,
  newStatus: string,
  notes?: string
): Promise<{ succeeded: string[]; failed: string[] }> {
  // 🔐 Verify superadmin status first
  if (!isSuperAdmin(adminEmail)) {
    superadminLogger.warn('Bulk status change attempted by non-superadmin', {
      metadata: { adminEmail, count: eventIds.length },
    });
    return { succeeded: [], failed: eventIds };
  }

  const timer = superadminLogger.time('superadminBulkChangeStatus', {
    action: 'superadmin_bulk_status',
    adminEmail,
    metadata: { count: eventIds.length, newStatus },
  });

  const succeeded: string[] = [];
  const failed: string[] = [];

  for (const eventId of eventIds) {
    const result = await superadminChangeStatus({ eventId, adminEmail, newStatus, notes });
    if (result.success) {
      succeeded.push(eventId);
    } else {
      failed.push(eventId);
    }
  }

  timer.success(`Bulk status change: ${succeeded.length}/${eventIds.length} succeeded`, {
    metadata: { succeeded: succeeded.length, failed: failed.length, newStatus },
  });

  return { succeeded, failed };
}
