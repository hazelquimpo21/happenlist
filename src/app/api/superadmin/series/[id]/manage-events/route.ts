/**
 * SERIES EVENT MANAGER API ROUTE
 * ================================
 * GET  /api/superadmin/series/[id]/manage-events — list current events + smart suggestions
 * POST /api/superadmin/series/[id]/manage-events — add or remove events from series
 *
 * The GET endpoint uses the series metadata (title, organizer, location, category)
 * to score and rank unattached events that likely belong to this series.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadminAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ===== GET: Fetch current events + smart suggestions =====
export async function GET(request: NextRequest, context: RouteContext) {
  const { id: seriesId } = await context.params;

  try {
    await requireSuperadminAuth();
    const supabase = await createClient();

    // Fetch the series with its metadata
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: series, error: seriesError } = await (supabase as any)
      .from('series')
      .select('id, title, organizer_id, location_id, category_id')
      .eq('id', seriesId)
      .single();

    if (seriesError || !series) {
      return NextResponse.json(
        { success: false, error: 'Series not found' },
        { status: 404 }
      );
    }

    // Fetch events currently in this series
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: currentEvents } = await (supabase as any)
      .from('events')
      .select(`
        id, title, start_datetime, instance_date, status,
        locations ( name ),
        organizers ( name )
      `)
      .eq('series_id', seriesId)
      .is('deleted_at', null)
      .order('start_datetime', { ascending: true });

    // ===== Smart suggestions: find unattached events matching series metadata =====
    const titleWords = (series.title || '')
      .toLowerCase()
      .split(/\s+/)
      .filter((w: string) => w.length >= 3)
      // Filter out extremely common words
      .filter((w: string) => !['the', 'and', 'for', 'with', 'from', 'this', 'that'].includes(w));

    // Build OR conditions for broad candidate search
    const conditions: string[] = [];
    if (series.location_id) {
      conditions.push(`location_id.eq.${series.location_id}`);
    }
    if (series.organizer_id) {
      conditions.push(`organizer_id.eq.${series.organizer_id}`);
    }
    if (series.category_id) {
      conditions.push(`category_id.eq.${series.category_id}`);
    }

    let suggestions: {
      id: string;
      title: string;
      start_datetime: string | null;
      instance_date: string | null;
      location_name: string | null;
      organizer_name: string | null;
      status: string;
      series_id: string | null;
      series_title: string | null;
      match_reasons: string[];
      score: number;
    }[] = [];

    if (conditions.length > 0 || titleWords.length > 0) {
      // Use or() to include: events matching org/location/category OR events with null series_id (orphans)
      // Also include title-based ilike conditions so title-only matches aren't missed
      const allOrConditions = [
        ...conditions,
        'series_id.is.null', // Always include orphan events
      ];

      // Add title keyword ilike conditions to broaden the candidate pool
      for (const word of titleWords.slice(0, 3)) {
        allOrConditions.push(`title.ilike.%${word}%`);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: candidates } = await (supabase as any)
        .from('events')
        .select(`
          id, title, start_datetime, instance_date, status,
          category_id, location_id, organizer_id,
          series_id,
          locations ( name ),
          organizers ( name ),
          series ( title )
        `)
        .is('deleted_at', null)
        .or(allOrConditions.join(','))
        .limit(300);

      // Filter out events already in this series (done in-memory since we broadened the query)
      const filteredCandidates = (candidates || []).filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (c: any) => c.series_id !== seriesId
      );

      if (filteredCandidates.length > 0) {
        // Also get day-of-week pattern from current events
        const seriesDays = (currentEvents || [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((e: any) => e.start_datetime)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((e: any) => new Date(e.start_datetime!).getDay());
        const seriesDaySet = new Set(seriesDays);

        // Score each candidate
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        suggestions = filteredCandidates.map((c: any) => {
          let score = 0;
          const reasons: string[] = [];

          // Title similarity
          const candidateTitle = (c.title || '').toLowerCase();
          const matchingWords = titleWords.filter((w: string) => candidateTitle.includes(w));
          if (matchingWords.length > 0) {
            score += matchingWords.length * 3;
            reasons.push(`title: "${matchingWords.join(', ')}"`);
          }

          // Same organizer (strong signal)
          if (c.organizer_id && c.organizer_id === series.organizer_id) {
            score += 4;
            reasons.push('same organizer');
          }

          // Same location
          if (c.location_id && c.location_id === series.location_id) {
            score += 2;
            reasons.push('same location');
          }

          // Same category
          if (c.category_id && c.category_id === series.category_id) {
            score += 1;
            reasons.push('same category');
          }

          // Same day-of-week pattern
          if (c.start_datetime && seriesDaySet.size > 0) {
            const candidateDay = new Date(c.start_datetime).getDay();
            if (seriesDaySet.has(candidateDay)) {
              score += 1;
              reasons.push('same day of week');
            }
          }

          // Not in any series = more likely orphan that belongs here
          if (!c.series_id) {
            score += 2;
            reasons.push('not in a series');
          }

          return {
            id: c.id,
            title: c.title,
            start_datetime: c.start_datetime,
            instance_date: c.instance_date,
            location_name: c.locations?.name || null,
            organizer_name: c.organizers?.name || null,
            status: c.status,
            series_id: c.series_id,
            series_title: c.series?.title || null,
            match_reasons: reasons,
            score,
          };
        })
        .filter((s: { score: number }) => s.score >= 4)
        .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
        .slice(0, 50);
      }
    }

    return NextResponse.json({
      success: true,
      currentEvents: (currentEvents || []).map((e: Record<string, unknown>) => ({
        id: e.id,
        title: e.title,
        start_datetime: e.start_datetime,
        instance_date: e.instance_date,
        status: e.status,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        location_name: (e.locations as any)?.name || null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        organizer_name: (e.organizers as any)?.name || null,
      })),
      suggestions,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('access required')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Unexpected error in manage-events GET:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ===== POST: Add or remove events from the series =====
export async function POST(request: NextRequest, context: RouteContext) {
  const { id: seriesId } = await context.params;

  try {
    const session = await requireSuperadminAuth();
    const supabase = await createClient();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const { action, eventIds } = body as {
      action: 'add' | 'remove';
      eventIds: string[];
    };

    if (!['add', 'remove'].includes(action)) {
      return NextResponse.json({ success: false, error: 'action must be "add" or "remove"' }, { status: 400 });
    }
    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json({ success: false, error: 'eventIds is required' }, { status: 400 });
    }

    // Verify series exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: series, error: seriesError } = await (supabase as any)
      .from('series')
      .select('id, title')
      .eq('id', seriesId)
      .single();

    if (seriesError || !series) {
      return NextResponse.json({ success: false, error: 'Series not found' }, { status: 404 });
    }

    const succeeded: string[] = [];
    const failed: { id: string; error: string }[] = [];

    if (action === 'add') {
      // Get current max sequence
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: maxSeqData } = await (supabase as any)
        .from('events')
        .select('series_sequence')
        .eq('series_id', seriesId)
        .order('series_sequence', { ascending: false })
        .limit(1)
        .single();

      let nextSequence = (maxSeqData?.series_sequence || 0) + 1;

      for (const eventId of eventIds) {
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
          failed.push({ id: eventId, error: updateError.message });
        } else {
          succeeded.push(eventId);
          nextSequence++;
        }
      }
    } else {
      // Remove events from series
      for (const eventId of eventIds) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase as any)
          .from('events')
          .update({
            series_id: null,
            is_series_instance: false,
            series_sequence: null,
          })
          .eq('id', eventId)
          .eq('series_id', seriesId); // Safety: only remove from THIS series

        if (updateError) {
          failed.push({ id: eventId, error: updateError.message });
        } else {
          succeeded.push(eventId);
        }
      }
    }

    // Update series date range and session count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allSeriesEvents } = await (supabase as any)
      .from('events')
      .select('instance_date, start_datetime')
      .eq('series_id', seriesId)
      .is('deleted_at', null)
      .order('start_datetime', { ascending: true });

    if (allSeriesEvents && allSeriesEvents.length > 0) {
      const allDates = allSeriesEvents
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((e: any) => e.instance_date || e.start_datetime?.split('T')[0])
        .filter(Boolean) as string[];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('series')
        .update({
          start_date: allDates[0] || null,
          end_date: allDates[allDates.length - 1] || null,
          total_sessions: allSeriesEvents.length,
        })
        .eq('id', seriesId);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('series')
        .update({ start_date: null, end_date: null, total_sessions: 0 })
        .eq('id', seriesId);
    }

    // Audit log
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_audit_log').insert({
      action: `superadmin_series_${action}_events`,
      entity_type: 'series',
      entity_id: seriesId,
      admin_email: session.email,
      changes: { action, event_ids: succeeded, failed: failed.map(f => f.id) },
      notes: `${action === 'add' ? 'Added' : 'Removed'} ${succeeded.length} events ${action === 'add' ? 'to' : 'from'} series "${series.title}"`,
    });

    return NextResponse.json({
      success: true,
      action,
      succeeded,
      failed,
      message: `${action === 'add' ? 'Added' : 'Removed'} ${succeeded.length} event${succeeded.length !== 1 ? 's' : ''}${failed.length ? ` (${failed.length} failed)` : ''}`,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('access required')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Unexpected error in manage-events POST:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
