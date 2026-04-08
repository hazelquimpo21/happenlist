/**
 * BULK DELETE SERIES API ROUTE
 * ==============================
 * POST /api/superadmin/series/bulk-delete
 *
 * Deletes (cancels) one or more series and detaches all their events.
 * Events are NOT deleted — they become orphans.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadminAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperadminAuth();
    const supabase = await createClient();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const { seriesIds, deleteEvents = false } = body as {
      seriesIds: string[];
      /** If true, soft-delete enclosed events. If false (default), detach them. */
      deleteEvents?: boolean;
    };

    if (!Array.isArray(seriesIds) || seriesIds.length === 0) {
      return NextResponse.json({ success: false, error: 'seriesIds is required' }, { status: 400 });
    }

    let totalAffected = 0;
    const deleted: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const seriesId of seriesIds) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: events } = await (supabase as any)
        .from('events')
        .select('id')
        .eq('series_id', seriesId)
        .is('deleted_at', null);

      if (events && events.length > 0) {
        if (deleteEvents) {
          // Soft-delete the events and detach from series (so FK doesn't block series delete)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: softDeleteError } = await (supabase as any)
            .from('events')
            .update({
              deleted_at: new Date().toISOString(),
              status: 'rejected',
              series_id: null,
              is_series_instance: false,
              series_sequence: null,
            })
            .eq('series_id', seriesId);

          if (softDeleteError) {
            failed.push({ id: seriesId, error: `Failed to delete events: ${softDeleteError.message}` });
            continue;
          }
        } else {
          // Detach events — they become orphans
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: detachError } = await (supabase as any)
            .from('events')
            .update({
              series_id: null,
              is_series_instance: false,
              series_sequence: null,
            })
            .eq('series_id', seriesId);

          if (detachError) {
            failed.push({ id: seriesId, error: `Failed to detach events: ${detachError.message}` });
            continue;
          }
        }
        totalAffected += events.length;
      }

      // Hard-delete the series row (it's just a grouping record)
      const { error: deleteError } = await supabase
        .from('series')
        .delete()
        .eq('id', seriesId);

      if (deleteError) {
        failed.push({ id: seriesId, error: deleteError.message });
      } else {
        deleted.push(seriesId);
      }
    }

    const eventAction = deleteEvents ? 'deleted' : 'detached';

    // Audit log
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_audit_log').insert({
      action: 'superadmin_bulk_delete_series',
      entity_type: 'series',
      entity_id: deleted[0] || seriesIds[0],
      admin_email: session.email,
      changes: {
        deleted_series_ids: deleted,
        failed_series_ids: failed.map(f => f.id),
        events_affected: totalAffected,
        events_action: eventAction,
      },
      notes: `Deleted ${deleted.length} series, ${eventAction} ${totalAffected} events${failed.length ? `. ${failed.length} failed.` : ''}`,
    });

    return NextResponse.json({
      success: true,
      deleted,
      failed,
      eventsAffected: totalAffected,
      eventsAction: eventAction,
      message: `Deleted ${deleted.length} series (${totalAffected} events ${eventAction})${failed.length ? ` — ${failed.length} failed` : ''}`,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('access required')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Unexpected error in bulk-delete-series:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
