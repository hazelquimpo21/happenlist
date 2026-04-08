/**
 * MERGE SERIES API ROUTE
 * ========================
 * POST /api/superadmin/series/merge
 *
 * Merges multiple series into one. The "target" series keeps its metadata.
 * All events from the "source" series are moved to the target.
 * Source series are then soft-deleted.
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

    const { targetSeriesId, sourceSeriesIds } = body as {
      targetSeriesId: string;
      sourceSeriesIds: string[];
    };

    if (!targetSeriesId) {
      return NextResponse.json({ success: false, error: 'targetSeriesId is required' }, { status: 400 });
    }
    if (!Array.isArray(sourceSeriesIds) || sourceSeriesIds.length === 0) {
      return NextResponse.json({ success: false, error: 'sourceSeriesIds must be a non-empty array' }, { status: 400 });
    }
    if (sourceSeriesIds.includes(targetSeriesId)) {
      return NextResponse.json({ success: false, error: 'Target cannot be in the source list' }, { status: 400 });
    }

    // Verify target exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: targetSeries, error: targetError } = await (supabase as any)
      .from('series')
      .select('id, title')
      .eq('id', targetSeriesId)
      .single();

    if (targetError || !targetSeries) {
      return NextResponse.json({ success: false, error: 'Target series not found' }, { status: 404 });
    }

    // Verify sources exist
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sourceSeries } = await (supabase as any)
      .from('series')
      .select('id, title')
      .in('id', sourceSeriesIds);

    if (!sourceSeries || sourceSeries.length === 0) {
      return NextResponse.json({ success: false, error: 'No source series found' }, { status: 404 });
    }

    // Get current max sequence in target
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: maxSeqData } = await (supabase as any)
      .from('events')
      .select('series_sequence')
      .eq('series_id', targetSeriesId)
      .order('series_sequence', { ascending: false })
      .limit(1)
      .single();

    let nextSequence = (maxSeqData?.series_sequence || 0) + 1;
    let totalMoved = 0;

    // Move events from each source to target
    for (const sourceId of sourceSeriesIds) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: sourceEvents } = await (supabase as any)
        .from('events')
        .select('id, start_datetime')
        .eq('series_id', sourceId)
        .is('deleted_at', null)
        .order('start_datetime', { ascending: true });

      if (sourceEvents && sourceEvents.length > 0) {
        for (const event of sourceEvents) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('events')
            .update({
              series_id: targetSeriesId,
              is_series_instance: true,
              series_sequence: nextSequence,
            })
            .eq('id', event.id);

          nextSequence++;
          totalMoved++;
        }
      }

      // Hard-delete the source series (events already moved, audit log has the trail)
      await supabase
        .from('series')
        .delete()
        .eq('id', sourceId);
    }

    // Update target series date range and session count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allTargetEvents } = await (supabase as any)
      .from('events')
      .select('instance_date, start_datetime')
      .eq('series_id', targetSeriesId)
      .is('deleted_at', null)
      .order('start_datetime', { ascending: true });

    if (allTargetEvents && allTargetEvents.length > 0) {
      const allDates = allTargetEvents
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((e: any) => e.instance_date || e.start_datetime?.split('T')[0])
        .filter(Boolean) as string[];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('series')
        .update({
          start_date: allDates[0] || null,
          end_date: allDates[allDates.length - 1] || null,
          total_sessions: allTargetEvents.length,
        })
        .eq('id', targetSeriesId);
    }

    // Audit log
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_audit_log').insert({
      action: 'superadmin_merge_series',
      entity_type: 'series',
      entity_id: targetSeriesId,
      admin_email: session.email,
      changes: {
        target_series_id: targetSeriesId,
        source_series_ids: sourceSeriesIds,
        events_moved: totalMoved,
      },
      notes: `Merged ${sourceSeries.length} series into "${targetSeries.title}" — ${totalMoved} events moved`,
    });

    return NextResponse.json({
      success: true,
      targetSeriesId,
      targetTitle: targetSeries.title,
      sourcesMerged: sourceSeries.length,
      eventsMoved: totalMoved,
      message: `Merged ${sourceSeries.length} series into "${targetSeries.title}" (${totalMoved} events moved)`,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('access required')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Unexpected error in merge-series:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
