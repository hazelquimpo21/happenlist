/**
 * SUPERADMIN: DELETE SERIES WITH INSTANCES
 * =========================================
 * Soft-cancels a series AND every non-cancelled child event in one shot.
 *
 * Why a dedicated module:
 *   superadminDeleteEntity handles single-row soft-delete for 5 entity
 *   types. Cascading to child events is series-specific and needs its
 *   own audit trail (count of children cancelled, reason). Isolating it
 *   keeps the generic helper simple.
 *
 * Reversibility:
 *   Soft-cancel sets status='cancelled' on series + events. Both can be
 *   restored via a SQL UPDATE flipping status back. No UI restore yet —
 *   if that pattern shows up, build it then.
 *
 * Coupling:
 *   - Used by DELETE /api/superadmin/series/[id] when body.cascadeEvents=true.
 *   - The events_series_start_datetime_uniq partial index excludes
 *     status='cancelled' rows, so re-creating the same series + dates
 *     after cancellation works without index conflicts.
 *
 * @module data/superadmin/delete-series
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/auth';
import { superadminLogger } from '@/lib/utils/logger';
import type { SuperadminActionResult } from './superadmin-event-actions';

export interface DeleteSeriesWithInstancesParams {
  seriesId: string;
  adminEmail: string;
  reason: string;
}

export interface DeleteSeriesWithInstancesResult extends SuperadminActionResult {
  /** Number of child events transitioned to cancelled. */
  eventsCancelled?: number;
}

export async function superadminDeleteSeriesWithInstances(
  params: DeleteSeriesWithInstancesParams
): Promise<DeleteSeriesWithInstancesResult> {
  const { seriesId, adminEmail, reason } = params;
  const timestamp = new Date().toISOString();

  try {
    requireSuperAdmin(adminEmail);
  } catch {
    return {
      success: false,
      message: 'Unauthorized: Superadmin access required',
      error: 'Not a superadmin',
      timestamp,
    };
  }

  const timer = superadminLogger.time('superadminDeleteSeriesWithInstances', {
    action: 'superadmin_cascade_delete_series',
    entityType: 'series',
    entityId: seriesId,
    adminEmail,
  });

  try {
    const supabase = createAdminClient();

    // Fetch series for audit + existence check.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: series, error: fetchError } = await (supabase as any)
      .from('series')
      .select('id, title, status')
      .eq('id', seriesId)
      .single();

    if (fetchError || !series) {
      timer.error('series not found', fetchError);
      return {
        success: false,
        message: 'Series not found',
        error: fetchError?.message || 'Series does not exist',
        timestamp,
      };
    }

    // Cancel all non-cancelled child events first. We do events before the
    // series itself so an interruption mid-flight leaves the series alive
    // (recoverable) instead of orphaning live children under a dead series.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cancelledRows, error: eventsError } = await (supabase as any)
      .from('events')
      .update({ status: 'cancelled', updated_at: timestamp })
      .eq('series_id', seriesId)
      .neq('status', 'cancelled')
      .select('id');

    if (eventsError) {
      timer.error('Failed to cancel child events', eventsError);
      return {
        success: false,
        message: 'Failed to cancel attached events',
        error: eventsError.message,
        timestamp,
      };
    }

    const eventsCancelled = cancelledRows?.length ?? 0;

    // Now cancel the series itself.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: seriesError } = await (supabase as any)
      .from('series')
      .update({ status: 'cancelled', updated_at: timestamp })
      .eq('id', seriesId);

    if (seriesError) {
      timer.error('Failed to cancel series', seriesError);
      return {
        success: false,
        message: 'Failed to cancel series (children were cancelled — restore them via SQL if needed)',
        error: seriesError.message,
        timestamp,
        eventsCancelled,
      };
    }

    // Single audit log row for the whole cascade.
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('admin_audit_log').insert({
        action: 'superadmin_cascade_delete_series',
        entity_type: 'series',
        entity_id: seriesId,
        admin_email: adminEmail,
        changes: {
          series_title: (series as { title?: string }).title ?? null,
          previous_status: (series as { status?: string }).status ?? null,
          events_cancelled: eventsCancelled,
        },
        notes: reason || `Cascade-cancelled series and ${eventsCancelled} attached events`,
      });
    } catch (auditErr) {
      // Don't fail the whole operation if audit insert fails — log and continue.
      console.error('[delete-series] audit log insert failed:', auditErr);
    }

    timer.success(`series + ${eventsCancelled} events cancelled`, {
      metadata: { seriesId, eventsCancelled },
    });

    return {
      success: true,
      message: `Cancelled series and ${eventsCancelled} attached event${eventsCancelled === 1 ? '' : 's'}`,
      eventId: seriesId,
      timestamp,
      eventsCancelled,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    timer.error('unexpected failure', error);
    return {
      success: false,
      message: 'Unexpected error',
      error: msg,
      timestamp,
    };
  }
}
