/**
 * SUPERADMIN RECHECK
 * ==================
 * Re-scrape an existing event's source page and return a field-level diff.
 *
 * Flow:
 *   1. Load the event (superadmin only).
 *   2. Build a slim snapshot — just the fields the scraper diffs on — and
 *      forward to the Render scraper's POST /recheck.
 *   3. Return the { event, diff, unchanged } payload to the client, which
 *      renders a "review changes" modal and lets the superadmin apply per-field.
 *
 * We do NOT apply the changes here. Applying goes through the existing
 * PATCH /api/superadmin/events/[id] route so audit logging stays consistent.
 *
 * @module app/api/superadmin/events/[id]/recheck
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/auth/is-superadmin';
import { createAdminClient } from '@/lib/supabase/admin';
import { recheckEvent, ScraperClientError } from '@/lib/scraper/client';

export const runtime = 'nodejs';
export const maxDuration = 90;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session } = await getSession();
  if (!session || !isSuperAdmin(session.email)) {
    return NextResponse.json({ error: 'Superadmin access required' }, { status: 401 });
  }

  const { id: eventId } = await params;

  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: event, error } = await (supabase as any)
    .from('events')
    .select(
      'id, source_url, title, short_description, description, tagline, ' +
      'start_datetime, end_datetime, price_type, price_low, price_high, ' +
      'price_details, ticket_url, sold_out, sold_out_details, ' +
      'age_low, age_high, age_restriction, is_family_friendly, ' +
      'website_url, registration_url, image_url'
    )
    .eq('id', eventId)
    .single();

  if (error || !event) {
    console.error(`[recheck:api] event not found ${eventId}`, error?.message);
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  if (!event.source_url) {
    return NextResponse.json(
      { error: 'Event has no source_url — cannot rescrape.' },
      { status: 400 }
    );
  }

  console.log(`[recheck:api] ${eventId} (${event.title}) → ${event.source_url}`);

  try {
    const result = await recheckEvent({
      sourceUrl: event.source_url,
      currentEvent: event,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ScraperClientError) {
      console.error(`[recheck:api] scraper error: ${err.message}`);
      const status = err.status >= 400 && err.status < 600 ? err.status : 502;
      return NextResponse.json({ error: err.message, endpoint: err.endpoint }, { status });
    }
    console.error('[recheck:api] unexpected error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
