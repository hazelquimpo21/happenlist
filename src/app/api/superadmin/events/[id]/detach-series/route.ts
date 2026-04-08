/**
 * DETACH EVENT FROM SERIES API ROUTE
 * ====================================
 * POST /api/superadmin/events/[id]/detach-series
 *
 * Removes an event from its series, making it standalone.
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

    const supabase = await createClient();

    // Fetch the event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: event, error: fetchError } = await (supabase as any)
      .from('events')
      .select('id, title, series_id, series_sequence')
      .eq('id', eventId)
      .single();

    if (fetchError || !event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    if (!event.series_id) {
      return NextResponse.json(
        { success: false, error: 'Event is not part of a series' },
        { status: 400 }
      );
    }

    const previousSeriesId = event.series_id;

    // Detach from series
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('events')
      .update({
        series_id: null,
        is_series_instance: false,
        series_sequence: null,
      })
      .eq('id', eventId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: `Failed to detach event: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Audit log
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_audit_log').insert({
      action: 'superadmin_detach_series',
      entity_type: 'event',
      entity_id: eventId,
      admin_email: session.email,
      changes: {
        before: {
          series_id: previousSeriesId,
          series_sequence: event.series_sequence,
        },
        after: {
          series_id: null,
          is_series_instance: false,
          series_sequence: null,
        },
      },
      notes: `Detached event "${event.title}" from series ${previousSeriesId}`,
    });

    return NextResponse.json({
      success: true,
      message: `Event detached from series`,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('access required')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }
    console.error('Unexpected error in detach-series:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
