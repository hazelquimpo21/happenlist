/**
 * ADMIN EVENT ACTIONS
 * ====================
 * Actions for approving, rejecting, and updating events.
 *
 * NOTE: Some type assertions are used here because the database types
 * need to be regenerated after running the migration. Run the migration
 * first, then regenerate types with:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
 */

import { createClient } from '@/lib/supabase/server';
import { adminDataLogger, auditLogger } from '@/lib/utils/logger';
import type { Database } from '@/lib/supabase/types';

type EventUpdate = Database['public']['Tables']['events']['Update'];

// Event row type with any for dynamic access
interface EventRow {
  id: string;
  title: string;
  status: string;
  [key: string]: unknown;
}

export interface ApproveEventParams {
  eventId: string;
  adminEmail: string;
  notes?: string;
  updates?: Partial<EventUpdate>;
}

export interface RejectEventParams {
  eventId: string;
  adminEmail: string;
  reason: string;
  notes?: string;
}

export interface UpdateEventParams {
  eventId: string;
  adminEmail: string;
  updates: Partial<EventUpdate>;
  notes?: string;
}

export interface ActionResult {
  success: boolean;
  message: string;
  eventId?: string;
  error?: string;
}

/**
 * Approve an event and publish it
 */
export async function approveEvent(params: ApproveEventParams): Promise<ActionResult> {
  const { eventId, adminEmail, notes, updates } = params;

  const timer = adminDataLogger.time('approveEvent', {
    action: 'event_approved',
    entityType: 'event',
    entityId: eventId,
    adminEmail,
  });

  try {
    const supabase = await createClient();

    // First, get the current event data for audit log
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
        message: 'Event not found',
        error: fetchError?.message || 'Event not found',
      };
    }

    // Update the event
    const updateData = {
      ...updates,
      status: 'published',
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminEmail,
      review_notes: notes,
      published_at: new Date().toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('events')
      .update(updateData)
      .eq('id', eventId);

    if (updateError) {
      timer.error('Failed to approve event', updateError);
      return {
        success: false,
        message: 'Failed to approve event',
        error: updateError.message,
      };
    }

    // Log to audit trail
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('admin_audit_log').insert({
        action: 'event_approved',
        entity_type: 'event',
        entity_id: eventId,
        admin_email: adminEmail,
        changes: {
          before: { status: currentEvent.status },
          after: { status: 'published' },
          updates: updates || {},
        },
        notes: notes,
      });
    } catch (auditError) {
      // Log but don't fail the operation
      auditLogger.warn('Failed to log audit entry', { metadata: { error: auditError } });
    }

    timer.success(`Event approved: ${currentEvent.title}`);

    return {
      success: true,
      message: `Event "${currentEvent.title}" has been approved and published`,
      eventId,
    };
  } catch (error) {
    timer.error('Unexpected error approving event', error);
    return {
      success: false,
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Reject an event
 */
export async function rejectEvent(params: RejectEventParams): Promise<ActionResult> {
  const { eventId, adminEmail, reason, notes } = params;

  const timer = adminDataLogger.time('rejectEvent', {
    action: 'event_rejected',
    entityType: 'event',
    entityId: eventId,
    adminEmail,
  });

  try {
    const supabase = await createClient();

    // First, get the current event data
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
        message: 'Event not found',
        error: fetchError?.message || 'Event not found',
      };
    }

    // Update the event
    const updateData = {
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminEmail,
      review_notes: notes,
      rejection_reason: reason,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('events')
      .update(updateData)
      .eq('id', eventId);

    if (updateError) {
      timer.error('Failed to reject event', updateError);
      return {
        success: false,
        message: 'Failed to reject event',
        error: updateError.message,
      };
    }

    // Log to audit trail
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('admin_audit_log').insert({
        action: 'event_rejected',
        entity_type: 'event',
        entity_id: eventId,
        admin_email: adminEmail,
        changes: {
          before: { status: currentEvent.status },
          after: { status: 'rejected', rejection_reason: reason },
        },
        notes: notes,
      });
    } catch (auditError) {
      auditLogger.warn('Failed to log audit entry', { metadata: { error: auditError } });
    }

    timer.success(`Event rejected: ${currentEvent.title}`);

    return {
      success: true,
      message: `Event "${currentEvent.title}" has been rejected`,
      eventId,
    };
  } catch (error) {
    timer.error('Unexpected error rejecting event', error);
    return {
      success: false,
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update event details
 */
export async function updateAdminEvent(params: UpdateEventParams): Promise<ActionResult> {
  const { eventId, adminEmail, updates, notes } = params;

  const timer = adminDataLogger.time('updateAdminEvent', {
    action: 'event_edited',
    entityType: 'event',
    entityId: eventId,
    adminEmail,
  });

  try {
    const supabase = await createClient();

    // Get current event for audit log
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
        message: 'Event not found',
        error: fetchError?.message || 'Event not found',
      };
    }

    // Update the event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('events')
      .update(updates)
      .eq('id', eventId);

    if (updateError) {
      timer.error('Failed to update event', updateError);
      return {
        success: false,
        message: 'Failed to update event',
        error: updateError.message,
      };
    }

    // Build changes object for audit log
    const changes: Record<string, { before: unknown; after: unknown }> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (currentEvent[key] !== value) {
        changes[key] = {
          before: currentEvent[key],
          after: value,
        };
      }
    }

    // Log to audit trail
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('admin_audit_log').insert({
        action: 'event_edited',
        entity_type: 'event',
        entity_id: eventId,
        admin_email: adminEmail,
        changes,
        notes,
      });
    } catch (auditError) {
      auditLogger.warn('Failed to log audit entry', { metadata: { error: auditError } });
    }

    timer.success(`Event updated: ${currentEvent.title}`, {
      metadata: { changedFields: Object.keys(changes) },
    });

    return {
      success: true,
      message: `Event "${currentEvent.title}" has been updated`,
      eventId,
    };
  } catch (error) {
    timer.error('Unexpected error updating event', error);
    return {
      success: false,
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Bulk approve multiple events
 */
export async function bulkApproveEvents(
  eventIds: string[],
  adminEmail: string,
  notes?: string
): Promise<{ succeeded: string[]; failed: string[] }> {
  const timer = adminDataLogger.time('bulkApproveEvents', {
    action: 'event_approved',
    adminEmail,
    metadata: { count: eventIds.length },
  });

  const succeeded: string[] = [];
  const failed: string[] = [];

  for (const eventId of eventIds) {
    const result = await approveEvent({ eventId, adminEmail, notes });
    if (result.success) {
      succeeded.push(eventId);
    } else {
      failed.push(eventId);
    }
  }

  timer.success(`Bulk approved ${succeeded.length}/${eventIds.length} events`, {
    metadata: { succeeded: succeeded.length, failed: failed.length },
  });

  return { succeeded, failed };
}

/**
 * Bulk reject multiple events
 */
export async function bulkRejectEvents(
  eventIds: string[],
  adminEmail: string,
  reason: string,
  notes?: string
): Promise<{ succeeded: string[]; failed: string[] }> {
  const timer = adminDataLogger.time('bulkRejectEvents', {
    action: 'event_rejected',
    adminEmail,
    metadata: { count: eventIds.length },
  });

  const succeeded: string[] = [];
  const failed: string[] = [];

  for (const eventId of eventIds) {
    const result = await rejectEvent({ eventId, adminEmail, reason, notes });
    if (result.success) {
      succeeded.push(eventId);
    } else {
      failed.push(eventId);
    }
  }

  timer.success(`Bulk rejected ${succeeded.length}/${eventIds.length} events`, {
    metadata: { succeeded: succeeded.length, failed: failed.length },
  });

  return { succeeded, failed };
}
