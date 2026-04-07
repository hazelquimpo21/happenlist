/**
 * MAKE EVENT RECURRING API ROUTE
 * ===============================
 * POST /api/superadmin/events/[id]/make-recurring
 *
 * Creates a new recurring series from a standalone event, links the original
 * event as instance #1, and generates future instances from a recurrence rule.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadminAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { generateSlug } from '@/lib/utils/slug';
import { calculateRecurringDates, addMinutesToTime } from '@/lib/utils/recurrence';
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
    const { data: event, error: fetchError } = await supabase
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

    // Create a recurring series from the event's metadata
    const seriesSlug = generateSlug(event.title || 'recurring-series');
    const { data: series, error: seriesError } = await supabase
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
        attendance_mode: 'drop_in',
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

    // Link the original event as instance #1
    const { error: linkError } = await supabase
      .from('events')
      .update({
        series_id: series.id,
        is_series_instance: true,
        series_sequence: 1,
      })
      .eq('id', eventId);

    if (linkError) {
      return NextResponse.json(
        { success: false, error: `Failed to link original event: ${linkError.message}` },
        { status: 500 }
      );
    }

    // Generate future instances from the recurrence rule
    const firstDate = event.start_datetime?.split('T')[0];
    if (!firstDate) {
      return NextResponse.json(
        { success: false, error: 'Original event has no start date' },
        { status: 400 }
      );
    }

    const allDates = calculateRecurringDates(recurrenceRule, firstDate);
    // Skip the first date (that's the original event)
    const futureDates = allDates.filter(d => d !== firstDate);

    let generatedCount = 0;

    if (futureDates.length > 0) {
      const time = recurrenceRule.time || event.start_datetime?.split('T')[1]?.substring(0, 5) || '19:00';
      const durationMinutes = recurrenceRule.duration_minutes || 120;
      const endTime = addMinutesToTime(time, durationMinutes);

      const newEvents = futureDates.map((date, index) => ({
        title: event.title,
        slug: generateSlug(`${event.title || 'event'}-${date}`),
        description: event.description || null,
        short_description: event.short_description || null,
        start_datetime: `${date}T${time}:00`,
        end_datetime: `${date}T${endTime}:00`,
        instance_date: date,
        is_all_day: false,
        timezone: event.timezone || 'America/Chicago',
        category_id: event.category_id || null,
        location_id: event.location_id || null,
        organizer_id: event.organizer_id || null,
        series_id: series.id,
        is_series_instance: true,
        series_sequence: index + 2, // +2 because original is #1
        price_type: event.price_type || 'free',
        price_low: event.price_low || null,
        price_high: event.price_high || null,
        price_details: event.price_details || null,
        ticket_url: event.ticket_url || null,
        image_url: event.image_url || null,
        thumbnail_url: event.thumbnail_url || null,
        website_url: event.website_url || null,
        instagram_url: event.instagram_url || null,
        facebook_url: event.facebook_url || null,
        registration_url: event.registration_url || null,
        status: event.status || 'published',
        source: 'admin',
      }));

      const { data: inserted, error: insertError } = await supabase
        .from('events')
        .insert(newEvents)
        .select('id');

      if (insertError) {
        console.error('Failed to generate recurring events:', insertError);
      } else {
        generatedCount = inserted?.length || 0;
      }
    }

    // Update series with date range
    const allEventDates = [firstDate, ...futureDates].sort();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('series').update({
      start_date: allEventDates[0],
      end_date: allEventDates[allEventDates.length - 1],
      total_sessions: allEventDates.length,
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
        events_generated: generatedCount,
      },
      notes: `Made event recurring: created series with ${generatedCount + 1} total events`,
    });

    return NextResponse.json({
      success: true,
      seriesId: series.id,
      eventCount: generatedCount + 1, // original + generated
      message: `Created recurring series with ${generatedCount + 1} events`,
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
