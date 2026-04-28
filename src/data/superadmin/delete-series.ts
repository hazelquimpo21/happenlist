/**
 * SUPERADMIN: CANCEL OR DELETE SERIES (with optional event cascade)
 * =================================================================
 * Two distinct destructive actions on a series:
 *
 *   - mode='cancel':  set status='cancelled' (events that get cascaded
 *                     also get status='cancelled'). Communicates to users
 *                     that the thing isn't happening — row stays visible
 *                     in archives, may render with a "cancelled" badge.
 *
 *   - mode='delete':  set deleted_at=now() (events that get cascaded
 *                     also get deleted_at=now()). Soft-erases — public
 *                     and admin queries filter deleted_at IS NULL so
 *                     the row vanishes from every surface.
 *
 * cascadeEvents controls whether attached non-cancelled, non-deleted child
 * events get the same treatment. When true:
 *   - Children are touched first, then the series, so an interruption
 *     leaves the series alive (recoverable) instead of orphaning live
 *     children under a dead series.
 *
 * Reversibility: both actions are soft. Restore via SQL flipping status
 * back to 'published' or deleted_at back to NULL.
 *
 * Coupling:
 *   - DELETE /api/superadmin/series/[id] dispatches on body.mode + body.cascadeEvents.
 *   - The events_series_start_datetime_uniq partial index excludes
 *     status='cancelled' rows; recreate-after-cancel is conflict-free.
 *   - Public/admin series queries must filter deleted_at IS NULL — see
 *     src/data/series/* and src/data/admin/get-admin-series.ts.
 *
 * @module data/superadmin/delete-series
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/auth';
import { superadminLogger } from '@/lib/utils/logger';
import type { SuperadminActionResult } from './superadmin-event-actions';

export type DeleteSeriesMode = 'cancel' | 'delete';

export interface DeleteSeriesParams {
  seriesId: string;
  adminEmail: string;
  reason: string;
  mode: DeleteSeriesMode;
  /**
   * If true, the same destructive transition is applied to every attached
   * non-cancelled, non-deleted child event.
   */
  cascadeEvents: boolean;
}

export interface DeleteSeriesResult extends SuperadminActionResult {
  /** Number of child events touched (cancelled or deleted, matching mode). */
  eventsAffected?: number;
  mode?: DeleteSeriesMode;
  cascadeEvents?: boolean;
}

/**
 * Soft-cancel or soft-delete a series, optionally cascading to attached events.
 */
export async function superadminCancelOrDeleteSeries(
  params: DeleteSeriesParams
): Promise<DeleteSeriesResult> {
  const { seriesId, adminEmail, reason, mode, cascadeEvents } = params;
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

  const timer = superadminLogger.time(`superadminSeries_${mode}`, {
    action: `superadmin_${mode}_series`,
    entityType: 'series',
    entityId: seriesId,
    adminEmail,
    metadata: { cascadeEvents },
  });

  // The transition we apply to a row.
  // - cancel → status='cancelled'
  // - delete → deleted_at=timestamp (status untouched so a later
  //            restore can put it back to whatever it was)
  const seriesPatch: Record<string, unknown> =
    mode === 'cancel'
      ? { status: 'cancelled', updated_at: timestamp }
      : { deleted_at: timestamp, updated_at: timestamp };

  const eventsPatch: Record<string, unknown> =
    mode === 'cancel'
      ? { status: 'cancelled', updated_at: timestamp }
      : { deleted_at: timestamp, updated_at: timestamp };

  try {
    const supabase = createAdminClient();

    // Existence + audit context
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: series, error: fetchError } = await (supabase as any)
      .from('series')
      .select('id, title, status, deleted_at')
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

    let eventsAffected = 0;

    // Cascade children first (so an interruption leaves the series alive).
    // We only touch rows that aren't already in the target state.
    if (cascadeEvents) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q = (supabase as any)
        .from('events')
        .update(eventsPatch)
        .eq('series_id', seriesId);

      // Don't double-touch rows that are already cancelled / deleted.
      q = mode === 'cancel'
        ? q.neq('status', 'cancelled').is('deleted_at', null)
        : q.is('deleted_at', null);

      const { data: cancelledRows, error: eventsError } = await q.select('id');

      if (eventsError) {
        timer.error('cascade events update failed', eventsError);
        return {
          success: false,
          message: 'Failed to update attached events',
          error: eventsError.message,
          timestamp,
        };
      }

      eventsAffected = cancelledRows?.length ?? 0;
    }

    // Apply the series row transition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: seriesError } = await (supabase as any)
      .from('series')
      .update(seriesPatch)
      .eq('id', seriesId);

    if (seriesError) {
      timer.error('series update failed', seriesError);
      return {
        success: false,
        message: cascadeEvents
          ? `Failed to ${mode} series (children were ${mode === 'cancel' ? 'cancelled' : 'deleted'} — restore via SQL if needed)`
          : `Failed to ${mode} series`,
        error: seriesError.message,
        timestamp,
        eventsAffected,
        mode,
        cascadeEvents,
      };
    }

    // Single audit row for the whole operation.
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('admin_audit_log').insert({
        action: `superadmin_${mode}_series${cascadeEvents ? '_cascade' : ''}`,
        entity_type: 'series',
        entity_id: seriesId,
        admin_email: adminEmail,
        changes: {
          mode,
          cascade_events: cascadeEvents,
          series_title: (series as { title?: string }).title ?? null,
          previous_status: (series as { status?: string }).status ?? null,
          previous_deleted_at:
            (series as { deleted_at?: string | null }).deleted_at ?? null,
          events_affected: eventsAffected,
        },
        notes:
          reason ||
          `${mode === 'cancel' ? 'Cancelled' : 'Deleted'} series${
            cascadeEvents ? ` and ${eventsAffected} attached event${eventsAffected === 1 ? '' : 's'}` : ''
          }`,
      });
    } catch (auditErr) {
      // Don't fail the whole operation if audit insert fails — log and continue.
      console.error('[delete-series] audit log insert failed:', auditErr);
    }

    timer.success(`series ${mode} (cascade=${cascadeEvents}, events=${eventsAffected})`, {
      metadata: { seriesId, mode, cascadeEvents, eventsAffected },
    });

    const verb = mode === 'cancel' ? 'Cancelled' : 'Deleted';
    return {
      success: true,
      message: cascadeEvents
        ? `${verb} series and ${eventsAffected} attached event${eventsAffected === 1 ? '' : 's'}`
        : `${verb} series`,
      eventId: seriesId,
      timestamp,
      eventsAffected,
      mode,
      cascadeEvents,
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
