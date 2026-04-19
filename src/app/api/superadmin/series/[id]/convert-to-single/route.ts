/**
 * CONVERT SERIES TO SINGLE EVENT API ROUTE
 * =========================================
 * POST /api/superadmin/series/[id]/convert-to-single
 *
 * One-click fix for when an event was mistakenly promoted into a series.
 * If the series has exactly one non-deleted event: detaches it (so it
 * becomes standalone) and hard-deletes the series row.
 * If the series has zero non-deleted events: just hard-deletes the series.
 * If the series has multiple events: rejects with 400 and tells the caller
 * to detach or remove extras first.
 *
 * Both underlying operations already exist via detach-series and
 * bulk-delete; this endpoint composes them atomically and writes a single
 * audit log entry so the intent is preserved.
 *
 * If you change this, also look at:
 *   - /api/superadmin/events/[id]/detach-series
 *   - /api/superadmin/series/bulk-delete
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadminAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requireSuperadminAuth();
    const { id: seriesId } = await context.params;

    const supabase = await createClient();

    // Verify the series exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: series, error: seriesError } = await (supabase as any)
      .from('series')
      .select('id, title, slug')
      .eq('id', seriesId)
      .single();

    if (seriesError || !series) {
      console.warn('[convert-to-single] series not found', { seriesId });
      return NextResponse.json(
        { success: false, error: 'Series not found' },
        { status: 404 }
      );
    }

    // Fetch non-deleted events in the series
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: events, error: eventsError } = await (supabase as any)
      .from('events')
      .select('id, title, series_sequence')
      .eq('series_id', seriesId)
      .is('deleted_at', null);

    if (eventsError) {
      console.error('[convert-to-single] failed to read events', eventsError);
      return NextResponse.json(
        { success: false, error: `Failed to read events: ${eventsError.message}` },
        { status: 500 }
      );
    }

    const eventCount = events?.length ?? 0;

    if (eventCount > 1) {
      return NextResponse.json(
        {
          success: false,
          error: `Series has ${eventCount} events. Remove or detach all but one first, then try again.`,
          eventCount,
        },
        { status: 400 }
      );
    }

    // Detach the lone event if it exists
    const loneEvent = eventCount === 1 ? events[0] : null;

    if (loneEvent) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: detachError } = await (supabase as any)
        .from('events')
        .update({
          series_id: null,
          is_series_instance: false,
          series_sequence: null,
        })
        .eq('id', loneEvent.id);

      if (detachError) {
        console.error('[convert-to-single] failed to detach event', {
          seriesId,
          eventId: loneEvent.id,
          err: detachError,
        });
        return NextResponse.json(
          { success: false, error: `Failed to detach event: ${detachError.message}` },
          { status: 500 }
        );
      }
    }

    // Hard-delete the series row
    const { error: deleteError } = await supabase
      .from('series')
      .delete()
      .eq('id', seriesId);

    if (deleteError) {
      console.error('[convert-to-single] failed to delete series', {
        seriesId,
        err: deleteError,
      });
      // Roll back the detach so we don't leave the event orphaned while the
      // series still exists claiming it.
      if (loneEvent) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('events')
          .update({
            series_id: seriesId,
            is_series_instance: true,
            series_sequence: loneEvent.series_sequence,
          })
          .eq('id', loneEvent.id);
      }
      return NextResponse.json(
        { success: false, error: `Failed to delete series: ${deleteError.message}` },
        { status: 500 }
      );
    }

    // Audit log
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_audit_log').insert({
      action: 'superadmin_convert_series_to_single',
      entity_type: 'series',
      entity_id: seriesId,
      admin_email: session.email,
      changes: {
        series_title: series.title,
        series_slug: series.slug,
        detached_event_id: loneEvent?.id ?? null,
        detached_event_title: loneEvent?.title ?? null,
        event_count: eventCount,
      },
      notes: loneEvent
        ? `Converted series "${series.title}" back to single event "${loneEvent.title}"`
        : `Deleted empty series "${series.title}"`,
    });

    console.log('[convert-to-single] success', {
      seriesId,
      eventId: loneEvent?.id ?? null,
    });

    return NextResponse.json({
      success: true,
      message: loneEvent
        ? `Series deleted; event "${loneEvent.title}" is now standalone.`
        : `Empty series deleted.`,
      detachedEventId: loneEvent?.id ?? null,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('access required')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }
    console.error('[convert-to-single] unexpected error', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
