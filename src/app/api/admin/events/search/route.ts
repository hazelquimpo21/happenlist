/**
 * ADMIN EVENT SEARCH API
 * ======================
 * GET /api/admin/events/search?q=query&limit=20&exclude=<id>
 *
 * Lightweight event search for admin pickers (e.g. ParentEventPicker).
 * Returns {id, title, slug, instance_date, child_event_count, series_id}
 * for each match. Orders by upcoming date first, then by title similarity.
 *
 * Admin auth required. Not paginated — caller specifies `limit`.
 *
 * Used by: ParentEventPicker (parent event lookup).
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('API.AdminEventSearch');

export async function GET(request: NextRequest) {
  const timer = logger.time('GET /api/admin/events/search');

  try {
    await requireAdminAuth();

    const searchParams = request.nextUrl.searchParams;
    const query = (searchParams.get('q') || '').trim();
    const lookupId = (searchParams.get('id') || '').trim();
    const parentId = (searchParams.get('parentId') || '').trim();
    const excludeId = searchParams.get('exclude') || null;
    const limit = Math.min(parseInt(searchParams.get('limit') || '12', 10), 100);

    const supabase = await createClient();

    // By-id lookup (single event resolve, used by picker when a draft loads
    // with a parent id but no pre-joined details). Short-circuit path — no
    // search, no ordering, just the one row.
    if (lookupId) {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, slug, instance_date, series_id, parent_event_id')
        .eq('id', lookupId)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) {
        timer.error('Failed to lookup event by id', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      timer.success(`Resolved event by id: ${lookupId}`);
      return NextResponse.json({ success: true, events: data ? [data] : [] });
    }

    let builder = supabase
      .from('events')
      .select('id, title, slug, instance_date, series_id, parent_event_id')
      .is('deleted_at', null)
      .limit(limit);

    // Collection-children listing: return every event whose parent_event_id
    // matches. Oldest-first so a festival programme reads chronologically.
    if (parentId) {
      builder = builder.eq('parent_event_id', parentId);
      builder = builder.order('instance_date', { ascending: true, nullsFirst: true });
    } else {
      if (query.length > 0) {
        builder = builder.ilike('title', `%${query}%`);
      }
      // Upcoming first, then older
      builder = builder.order('instance_date', { ascending: false, nullsFirst: false });
    }
    if (excludeId) {
      builder = builder.neq('id', excludeId);
    }

    const { data, error } = await builder;
    if (error) {
      timer.error('Failed to search events', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    timer.success(`Returned ${(data || []).length} matches for "${query}"`);
    return NextResponse.json({ success: true, events: data || [] });
  } catch (err) {
    // requireAdminAuth throws → 403
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ success: false, error: message }, { status: 403 });
  }
}
