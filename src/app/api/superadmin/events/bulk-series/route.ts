/**
 * BULK SERIES API ROUTE
 * ======================
 * POST /api/superadmin/events/bulk-series
 *
 * Two modes:
 *   - auto_detect: AI analyzes selected events' dates to suggest a recurrence pattern
 *   - create_and_attach: creates or uses an existing series, attaches all selected events
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadminAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { detectRecurrencePattern } from '@/lib/ai/openai';
import { generateSlug } from '@/lib/utils/slug';
import type { EventForPatternDetect } from '@/lib/ai/openai';
import type { RecurrenceRule } from '@/lib/supabase/types';

type BulkSeriesMode = 'auto_detect' | 'create_and_attach';

export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperadminAuth();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { mode, eventIds } = body as {
      mode: BulkSeriesMode;
      eventIds: string[];
    };

    if (!mode || !['auto_detect', 'create_and_attach'].includes(mode)) {
      return NextResponse.json(
        { success: false, error: 'mode must be "auto_detect" or "create_and_attach"' },
        { status: 400 }
      );
    }

    if (!Array.isArray(eventIds) || eventIds.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 event IDs are required' },
        { status: 400 }
      );
    }

    if (eventIds.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Cannot process more than 100 events at once' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch all events
    const { data: events, error: fetchError } = await supabase
      .from('events')
      .select(`
        *,
        locations ( name )
      `)
      .in('id', eventIds)
      .order('start_datetime', { ascending: true });

    if (fetchError || !events || events.length === 0) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch events: ${fetchError?.message || 'No events found'}` },
        { status: 404 }
      );
    }

    // Filter out already-deleted events
    const activeEvents = events.filter(e => !e.deleted_at);
    if (activeEvents.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 non-deleted events are required' },
        { status: 400 }
      );
    }

    // ===== MODE: AUTO DETECT =====
    if (mode === 'auto_detect') {
      const eventsForAi: EventForPatternDetect[] = activeEvents.map(e => ({
        id: e.id,
        title: e.title,
        start_datetime: e.start_datetime,
        end_datetime: e.end_datetime,
        instance_date: e.instance_date,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        location_name: (e.locations as any)?.name || null,
      }));

      try {
        const pattern = await detectRecurrencePattern(eventsForAi);

        return NextResponse.json({
          success: true,
          mode: 'auto_detect',
          pattern,
          events: activeEvents.map(e => ({
            id: e.id,
            title: e.title,
            start_datetime: e.start_datetime,
            end_datetime: e.end_datetime,
            instance_date: e.instance_date,
            status: e.status,
          })),
        });
      } catch (aiError) {
        console.error('AI pattern detection failed:', aiError);
        return NextResponse.json(
          { success: false, error: `Pattern detection failed: ${aiError instanceof Error ? aiError.message : 'Unknown error'}` },
          { status: 500 }
        );
      }
    }

    // ===== MODE: CREATE AND ATTACH =====
    const {
      seriesData,
      existingSeriesId,
    } = body as {
      mode: 'create_and_attach';
      eventIds: string[];
      seriesData?: {
        title: string;
        series_type?: string;
        description?: string;
        recurrence_rule?: RecurrenceRule;
      };
      existingSeriesId?: string;
    };

    let seriesId: string;
    let seriesTitle: string;

    if (existingSeriesId) {
      // Attach to existing series
      const { data: series, error: seriesError } = await supabase
        .from('series')
        .select('id, title')
        .eq('id', existingSeriesId)
        .single();

      if (seriesError || !series) {
        return NextResponse.json(
          { success: false, error: 'Series not found' },
          { status: 404 }
        );
      }

      seriesId = series.id;
      seriesTitle = series.title;
    } else if (seriesData?.title) {
      // Create new series
      const firstEvent = activeEvents[0];
      const slug = generateSlug(seriesData.title);

      const { data: newSeries, error: createError } = await supabase
        .from('series')
        .insert({
          title: seriesData.title,
          slug,
          description: seriesData.description || null,
          series_type: seriesData.series_type || 'recurring',
          category_id: firstEvent.category_id || null,
          location_id: firstEvent.location_id || null,
          organizer_id: firstEvent.organizer_id || null,
          price_type: firstEvent.price_type || null,
          price_low: firstEvent.price_low || null,
          price_high: firstEvent.price_high || null,
          image_url: firstEvent.image_url || null,
          status: 'published',
          attendance_mode: 'drop_in',
          recurrence_rule: seriesData.recurrence_rule
            ? (seriesData.recurrence_rule as unknown as Record<string, unknown>)
            : null,
        })
        .select()
        .single();

      if (createError || !newSeries) {
        return NextResponse.json(
          { success: false, error: `Failed to create series: ${createError?.message}` },
          { status: 500 }
        );
      }

      seriesId = newSeries.id;
      seriesTitle = newSeries.title;
    } else {
      return NextResponse.json(
        { success: false, error: 'Either existingSeriesId or seriesData.title is required' },
        { status: 400 }
      );
    }

    // Get current max sequence in the series
    const { data: maxSeqData } = await supabase
      .from('events')
      .select('series_sequence')
      .eq('series_id', seriesId)
      .order('series_sequence', { ascending: false })
      .limit(1)
      .single();

    let nextSequence = (maxSeqData?.series_sequence || 0) + 1;

    // Sort events by date and attach them all
    const sortedEvents = [...activeEvents].sort(
      (a, b) => (a.start_datetime || '').localeCompare(b.start_datetime || '')
    );

    const succeeded: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const event of sortedEvents) {
      // Skip if already in this series
      if (event.series_id === seriesId) {
        succeeded.push(event.id);
        continue;
      }

      // Detach from old series if needed
      const { error: updateError } = await supabase
        .from('events')
        .update({
          series_id: seriesId,
          is_series_instance: true,
          series_sequence: nextSequence,
        })
        .eq('id', event.id);

      if (updateError) {
        failed.push({ id: event.id, error: updateError.message });
      } else {
        succeeded.push(event.id);
        nextSequence++;
      }
    }

    // Update series date range
    const allDates = sortedEvents
      .map(e => e.instance_date || e.start_datetime?.split('T')[0])
      .filter(Boolean) as string[];

    if (allDates.length > 0) {
      await supabase
        .from('series')
        .update({
          start_date: allDates[0],
          end_date: allDates[allDates.length - 1],
          total_sessions: succeeded.length + (maxSeqData?.series_sequence || 0),
        })
        .eq('id', seriesId);
    }

    // Audit log
    await supabase.from('admin_audit_log').insert({
      action: 'superadmin_bulk_attach_series',
      entity_type: 'series',
      entity_id: seriesId,
      admin_email: session.email,
      changes: {
        series_id: seriesId,
        attached_event_ids: succeeded,
        failed_event_ids: failed.map(f => f.id),
        created_new_series: !existingSeriesId,
      },
      notes: `Attached ${succeeded.length} events to series "${seriesTitle}" (${seriesId})${failed.length ? `. ${failed.length} failed.` : ''}`,
    });

    return NextResponse.json({
      success: true,
      mode: 'create_and_attach',
      seriesId,
      seriesTitle,
      succeeded,
      failed,
      message: `Attached ${succeeded.length} events to "${seriesTitle}"${failed.length ? ` (${failed.length} failed)` : ''}`,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('access required')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }
    console.error('Unexpected error in bulk-series:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
