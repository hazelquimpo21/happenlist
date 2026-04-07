/**
 * MERGE EVENTS API ROUTE
 * ========================
 * POST /api/superadmin/events/merge
 *
 * Merges multiple duplicate events into a single event.
 * Two modes:
 *   - Preview (useAi: true, no mergedFields): returns AI-suggested merged fields
 *   - Commit (mergedFields provided): applies the merge
 *
 * The "primary" event is updated with merged data.
 * All other events are soft-deleted with a reference to the primary.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadminAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { mergeEventFields } from '@/lib/ai/openai';
import type { EventForMerge } from '@/lib/ai/openai';

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

    const {
      eventIds,
      primaryEventId,
      mergedFields,
      useAi = true,
    } = body as {
      eventIds: string[];
      primaryEventId?: string;
      mergedFields?: Record<string, unknown>;
      useAi?: boolean;
    };

    // Validate
    if (!Array.isArray(eventIds) || eventIds.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 event IDs are required to merge' },
        { status: 400 }
      );
    }

    if (eventIds.length > 20) {
      return NextResponse.json(
        { success: false, error: 'Cannot merge more than 20 events at once' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch all events with related data
    const { data: events, error: fetchError } = await supabase
      .from('events')
      .select(`
        *,
        categories ( name, slug ),
        locations ( name ),
        organizers ( name )
      `)
      .in('id', eventIds);

    if (fetchError || !events || events.length < 2) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch events: ${fetchError?.message || 'Not enough events found'}` },
        { status: 404 }
      );
    }

    // Filter out already-deleted events — can't merge something that's gone
    const activeEvents = events.filter(e => !e.deleted_at);
    if (activeEvents.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 non-deleted events are required to merge' },
        { status: 400 }
      );
    }

    // ===== PREVIEW MODE: return AI suggestion =====
    if (useAi && !mergedFields) {
      const eventsForAi: EventForMerge[] = activeEvents.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        short_description: e.short_description,
        start_datetime: e.start_datetime,
        end_datetime: e.end_datetime,
        instance_date: e.instance_date,
        category_id: e.category_id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        category_name: (e.categories as any)?.name || null,
        location_id: e.location_id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        location_name: (e.locations as any)?.name || null,
        organizer_id: e.organizer_id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        organizer_name: (e.organizers as any)?.name || null,
        price_type: e.price_type,
        price_low: e.price_low,
        price_high: e.price_high,
        price_details: e.price_details,
        ticket_url: e.ticket_url,
        website_url: e.website_url,
        registration_url: e.registration_url,
        image_url: e.image_url,
        source: e.source,
        source_url: e.source_url,
      }));

      try {
        const suggestion = await mergeEventFields(eventsForAi);
        return NextResponse.json({
          success: true,
          mode: 'preview',
          suggestion,
          events: activeEvents.map(e => ({
            id: e.id,
            title: e.title,
            start_datetime: e.start_datetime,
            status: e.status,
            source: e.source,
          })),
        });
      } catch (aiError) {
        console.error('AI merge failed:', aiError);
        return NextResponse.json(
          { success: false, error: `AI merge failed: ${aiError instanceof Error ? aiError.message : 'Unknown error'}` },
          { status: 500 }
        );
      }
    }

    // ===== COMMIT MODE: apply the merge =====

    // Determine primary event
    const sortedByDate = [...activeEvents].sort(
      (a, b) => (a.start_datetime || '').localeCompare(b.start_datetime || '')
    );
    const primary = primaryEventId
      ? activeEvents.find(e => e.id === primaryEventId) || sortedByDate[0]
      : sortedByDate[0];

    const otherIds = eventIds.filter(id => id !== primary.id);

    // Update primary event with merged fields
    if (mergedFields && Object.keys(mergedFields).length > 0) {
      // Only allow safe fields to be updated
      const allowedFields = [
        'title', 'description', 'short_description',
        'start_datetime', 'end_datetime', 'instance_date',
        'category_id', 'location_id', 'organizer_id',
        'price_type', 'price_low', 'price_high', 'price_details',
        'ticket_url', 'website_url', 'registration_url',
        'image_url', 'thumbnail_url',
      ];

      const safeFields: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(mergedFields)) {
        if (allowedFields.includes(key)) {
          safeFields[key] = value;
        }
      }

      // Auto-sync instance_date when start_datetime changes
      if (safeFields.start_datetime && !safeFields.instance_date) {
        const dt = String(safeFields.start_datetime);
        safeFields.instance_date = dt.split('T')[0];
      }

      if (Object.keys(safeFields).length > 0) {
        const { error: updateError } = await supabase
          .from('events')
          .update(safeFields)
          .eq('id', primary.id);

        if (updateError) {
          return NextResponse.json(
            { success: false, error: `Failed to update primary event: ${updateError.message}` },
            { status: 500 }
          );
        }
      }
    }

    // Soft-delete the other events (match existing delete pattern)
    const { error: deleteError } = await supabase
      .from('events')
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString(),
        deleted_by: session.email,
        delete_reason: `Merged into event ${primary.id}`,
        review_notes: `Merged into event ${primary.id} ("${primary.title}")`,
        // Detach from any series so the series doesn't have orphaned references
        series_id: null,
        is_series_instance: false,
        series_sequence: null,
      })
      .in('id', otherIds);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: `Failed to soft-delete merged events: ${deleteError.message}` },
        { status: 500 }
      );
    }

    // Audit log
    await supabase.from('admin_audit_log').insert({
      action: 'superadmin_merge_events',
      entity_type: 'event',
      entity_id: primary.id,
      admin_email: session.email,
      changes: {
        primary_event_id: primary.id,
        merged_event_ids: otherIds,
        merged_fields: mergedFields || {},
      },
      notes: `Merged ${activeEvents.length} events into "${primary.title}" (${primary.id}). Soft-deleted: ${otherIds.join(', ')}`,
    });

    return NextResponse.json({
      success: true,
      mode: 'committed',
      primaryEventId: primary.id,
      deletedIds: otherIds,
      message: `Merged ${activeEvents.length} events. Kept "${primary.title}", soft-deleted ${otherIds.length} duplicates.`,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('access required')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }
    console.error('Unexpected error in merge events:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
