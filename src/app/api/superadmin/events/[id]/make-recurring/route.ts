/**
 * MAKE EVENT RECURRING API ROUTE
 * ===============================
 * POST /api/superadmin/events/[id]/make-recurring
 *
 * Creates a new recurring series from a standalone event, links the original
 * event as instance #1, and generates future instances from a recurrence rule.
 *
 * Coupling:
 *   - Insertion of children goes through src/data/series/materialize-instances.ts
 *     so this route, attach-series, and the extend-recurring-series cron all
 *     write rows the same way.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadminAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { generateSlug } from '@/lib/utils/slug';
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

    const { recurrenceRule } = body as { recurrenceRule: RecurrenceRule };

    if (!recurrenceRule || !recurrenceRule.frequency) {
      return NextResponse.json(
        { success: false, error: 'recurrenceRule with frequency is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch the original event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: event, error: fetchError } = await (supabase as any)
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (fetchError || !event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.series_id) {
      return NextResponse.json(
        { success: false, error: 'Event already belongs to a series' },
        { status: 400 }
      );
    }

    const firstDate = event.start_datetime?.split('T')[0];
    if (!firstDate) {
      return NextResponse.json(
        { success: false, error: 'Original event has no start date' },
        { status: 400 }
      );
    }

    // Create the series. attendance_mode defaults to whatever the event
    // implied (registration_url present → registered, else drop_in).
    const seriesSlug = generateSlug(event.title || 'recurring-series');
    const inferredAttendanceMode = event.registration_url ? 'registered' : 'drop_in';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: series, error: seriesError } = await (supabase as any)
      .from('series')
      .insert({
        title: event.title,
        slug: seriesSlug,
        description: event.description || null,
        short_description: event.short_description || null,
        series_type: 'recurring',
        category_id: event.category_id || null,
        location_id: event.location_id || null,
        organizer_id: event.organizer_id || null,
        price_type: event.price_type || null,
        price_low: event.price_low || null,
        price_high: event.price_high || null,
        registration_url: event.registration_url || null,
        image_url: event.image_url || null,
        status: event.status || 'published',
        attendance_mode: inferredAttendanceMode,
        recurrence_rule: recurrenceRule as unknown as Record<string, unknown>,
      })
      .select()
      .single();

    if (seriesError || !series) {
      return NextResponse.json(
        { success: false, error: `Failed to create series: ${seriesError?.message}` },
        { status: 500 }
      );
    }

    // Link the original event as instance #1.
    // Also backfill instance_date so series-detail queries that order by
    // instance_date don't see a NULL row floating ahead of everyone.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: linkError } = await (supabase as any)
      .from('events')
      .update({
        series_id: series.id,
        is_series_instance: true,
        series_sequence: 1,
        instance_date: firstDate,
      })
      .eq('id', eventId);

    if (linkError) {
      return NextResponse.json(
        { success: false, error: `Failed to link original event: ${linkError.message}` },
        { status: 500 }
      );
    }

    // Generate future instances via the shared helper. excludeFromDate=true
    // so we skip the original event's date (it's now instance #1).
    const result = await materializeFutureInstances(supabase, {
      seriesId: series.id,
      recurrenceRule,
      fromDate: firstDate,
      template: event,
      startingSequence: 2,
      excludeFromDate: true,
      source: 'manual',
    });

    if (result.error) {
      console.error('[make-recurring] materialize failed:', result.error);
      // Series + link still succeeded — surface the failure but don't roll back.
    }

    // Update series with date range across all linked events.
    const allDates = [firstDate, ...result.generatedDates].sort();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('series').update({
      start_date: allDates[0],
      end_date: allDates[allDates.length - 1],
      total_sessions: allDates.length,
    }).eq('id', series.id);

    // Audit log
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_audit_log').insert({
      action: 'superadmin_make_recurring',
      entity_type: 'event',
      entity_id: eventId,
      admin_email: session.email,
      changes: {
        series_id: series.id,
        recurrence_rule: recurrenceRule,
        events_generated: result.generatedCount,
        skipped_existing: result.skippedExisting.length,
        hit_max_cap: result.hitMaxCap,
      },
      notes: `Made event recurring: created series with ${result.generatedCount + 1} total events`,
    });

    return NextResponse.json({
      success: true,
      seriesId: series.id,
      eventCount: result.generatedCount + 1,
      hitMaxCap: result.hitMaxCap,
      message: `Created recurring series with ${result.generatedCount + 1} events`,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('access required')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }
    console.error('Unexpected error in make-recurring:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
