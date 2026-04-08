/**
 * ATTACH EVENT TO SERIES API ROUTE
 * ==================================
 * POST /api/superadmin/events/[id]/attach-series
 *
 * Links a standalone event to an existing series.
 * Auto-assigns the next series_sequence number.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadminAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

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

    // Verify the event exists and is standalone
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: event, error: eventError } = await (supabase as any)
      .from('events')
      .select('id, title, series_id')
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

    // Verify the series exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: series, error: seriesError } = await (supabase as any)
      .from('series')
      .select('id, title')
      .eq('id', seriesId)
      .single();

    if (seriesError || !series) {
      return NextResponse.json(
        { success: false, error: 'Series not found' },
        { status: 404 }
      );
    }

    // Get max series_sequence from existing events in this series
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: maxSeqData } = await (supabase as any)
      .from('events')
      .select('series_sequence')
      .eq('series_id', seriesId)
      .order('series_sequence', { ascending: false })
      .limit(1)
      .single();

    const nextSequence = (maxSeqData?.series_sequence || 0) + 1;

    // Link the event to the series
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('events')
      .update({
        series_id: seriesId,
        is_series_instance: true,
        series_sequence: nextSequence,
      })
      .eq('id', eventId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: `Failed to attach event: ${updateError.message}` },
        { status: 500 }
      );
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
      },
      notes: `Attached event "${event.title}" to series "${series.title}" as #${nextSequence}`,
    });

    return NextResponse.json({
      success: true,
      seriesId,
      seriesSequence: nextSequence,
      message: `Attached to "${series.title}" as instance #${nextSequence}`,
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
