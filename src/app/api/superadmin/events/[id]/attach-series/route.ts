/**
 * ATTACH EVENT TO SERIES API ROUTE
 * ==================================
 * POST /api/superadmin/events/[id]/attach-series
 *
 * Links a standalone event to an existing series. If the target series has a
 * recurrence_rule, also materializes future instances on the rule's schedule
 * starting from the day after the attached event — using that event as the
 * field template (price, image, links, etc.).
 *
 * Coupling:
 *   - All instance inserts go through src/data/series/materialize-instances.ts
 *     so attach-series, make-recurring, and the extend-recurring-series cron
 *     produce identical row shapes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadminAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { materializeFutureInstances } from '@/data/series/materialize-instances';
import type { RecurrenceRule } from '@/lib/supabase/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireSuperadminAuth();
    const { id: eventId } = await context.params;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { seriesId } = body as { seriesId: string };

    if (!seriesId) {
      return NextResponse.json(
        { success: false, error: 'seriesId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch the event in full — we need its fields as a template if the
    // target series is recurring.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: event, error: eventError } = await (supabase as any)
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.series_id) {
      return NextResponse.json(
        { success: false, error: 'Event already belongs to a series. Detach it first.' },
        { status: 400 }
      );
    }

    const eventDate = event.start_datetime?.split('T')[0];
    if (!eventDate) {
      return NextResponse.json(
        { success: false, error: 'Event has no start date' },
        { status: 400 }
      );
    }

    // Fetch the target series — need recurrence_rule to know whether to
    // materialize future instances.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: series, error: seriesError } = await (supabase as any)
      .from('series')
      .select('id, title, recurrence_rule, series_type')
      .eq('id', seriesId)
      .single();

    if (seriesError || !series) {
      return NextResponse.json(
        { success: false, error: 'Series not found' },
        { status: 404 }
      );
    }

    // Get max series_sequence so the attached event slots in after existing rows.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: maxSeqRows } = await (supabase as any)
      .from('events')
      .select('series_sequence')
      .eq('series_id', seriesId)
      .order('series_sequence', { ascending: false, nullsFirst: false })
      .limit(1);

    const maxSeq = maxSeqRows?.[0]?.series_sequence ?? 0;
    const nextSequence = maxSeq + 1;

    // Link the event to the series. Backfill instance_date so series-detail
    // ordering is consistent.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('events')
      .update({
        series_id: seriesId,
        is_series_instance: true,
        series_sequence: nextSequence,
        instance_date: event.instance_date || eventDate,
      })
      .eq('id', eventId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: `Failed to attach event: ${updateError.message}` },
        { status: 500 }
      );
    }

    // If the target series is recurring, materialize future instances using
    // the just-attached event as the template. The helper skips dates that
    // already exist in the series, so this is safe to call even if the series
    // already has children.
    let materializeResult: Awaited<ReturnType<typeof materializeFutureInstances>> | null = null;
    const recurrenceRule = series.recurrence_rule as RecurrenceRule | null;
    if (recurrenceRule && recurrenceRule.frequency) {
      materializeResult = await materializeFutureInstances(supabase, {
        seriesId,
        recurrenceRule,
        fromDate: eventDate,
        template: event,
        startingSequence: nextSequence + 1,
        excludeFromDate: true, // The attached event covers eventDate itself
        source: 'manual',
      });

      if (materializeResult.error) {
        console.error('[attach-series] materialize failed:', materializeResult.error);
        // Link succeeded; surface the issue but don't roll back.
      }

      // Refresh series.start_date / end_date / total_sessions to span the
      // new range. Read all current dates so we don't depend on prior values.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: allInstances } = await (supabase as any)
        .from('events')
        .select('instance_date')
        .eq('series_id', seriesId)
        .neq('status', 'cancelled')
        .not('instance_date', 'is', null)
        .order('instance_date', { ascending: true });

      const dates = (allInstances ?? [])
        .map((r: { instance_date: string }) => r.instance_date)
        .filter(Boolean);
      if (dates.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('series').update({
          start_date: dates[0],
          end_date: dates[dates.length - 1],
          total_sessions: dates.length,
        }).eq('id', seriesId);
      }
    }

    // Audit log
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_audit_log').insert({
      action: 'superadmin_attach_series',
      entity_type: 'event',
      entity_id: eventId,
      admin_email: session.email,
      changes: {
        series_id: seriesId,
        series_title: series.title,
        series_sequence: nextSequence,
        events_generated: materializeResult?.generatedCount ?? 0,
        skipped_existing: materializeResult?.skippedExisting.length ?? 0,
        hit_max_cap: materializeResult?.hitMaxCap ?? false,
      },
      notes: materializeResult
        ? `Attached "${event.title}" to "${series.title}" as #${nextSequence} and generated ${materializeResult.generatedCount} future instances`
        : `Attached "${event.title}" to "${series.title}" as #${nextSequence}`,
    });

    return NextResponse.json({
      success: true,
      seriesId,
      seriesSequence: nextSequence,
      eventsGenerated: materializeResult?.generatedCount ?? 0,
      hitMaxCap: materializeResult?.hitMaxCap ?? false,
      message: materializeResult && materializeResult.generatedCount > 0
        ? `Attached as #${nextSequence} · generated ${materializeResult.generatedCount} future instances`
        : `Attached to "${series.title}" as instance #${nextSequence}`,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('access required')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }
    console.error('Unexpected error in attach-series:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
