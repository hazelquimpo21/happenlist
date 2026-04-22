/**
 * SUPERADMIN IMPORT — SAVE
 * =========================
 * Takes one or more scraper-analyzed events and persists them to the `events`
 * table as `status='pending_review'`. The superadmin reviews each event in
 * /admin/events/pending before it goes live.
 *
 * Request:
 *   POST {
 *     events: ScraperEvent[],          // one or more
 *     fallbackSourceUrl: string,       // required — used for any event missing source_url
 *   }
 *
 * Response:
 *   {
 *     results: Array<
 *       | { ok: true, index, eventId, slug, status }
 *       | { ok: false, index, code: 'validation'|'duplicate'|'insert_failed', ... }
 *     >,
 *     savedCount: number,
 *   }
 *
 * @module app/api/superadmin/import/save
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/auth/is-superadmin';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  saveScrapedEvent,
  scraperEventToSaveInput,
  type SaveEventResult,
} from '@/lib/scraper/save-event';
import type { ScraperEvent } from '@/lib/scraper/types';

export const runtime = 'nodejs';

interface SaveImportBody {
  events: ScraperEvent[];
  fallbackSourceUrl: string;
}

export async function POST(request: NextRequest) {
  const { session } = await getSession();
  if (!session || !isSuperAdmin(session.email)) {
    return NextResponse.json({ error: 'Superadmin access required' }, { status: 401 });
  }

  let body: Partial<SaveImportBody>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body.events) || body.events.length === 0) {
    return NextResponse.json({ error: 'events[] is required and non-empty' }, { status: 400 });
  }
  if (typeof body.fallbackSourceUrl !== 'string' || !body.fallbackSourceUrl.trim()) {
    return NextResponse.json({ error: 'fallbackSourceUrl is required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const results: Array<SaveEventResult & { index: number }> = [];

  // Save sequentially — venue/organizer resolvers may create shared rows across
  // events in the same batch, and parallel inserts risk duplicate venues.
  for (let i = 0; i < body.events.length; i++) {
    const ev = body.events[i];
    const input = scraperEventToSaveInput(ev, body.fallbackSourceUrl);
    console.log(`[import:save] saving ${i + 1}/${body.events.length}: "${ev.title}"`);
    const result = await saveScrapedEvent(supabase, input, {
      status: 'pending_review',
      source: 'scraper',
    });
    results.push({ ...result, index: i });
  }

  const savedCount = results.filter(r => r.ok).length;
  console.log(`[import:save] batch complete by ${session.email} — saved ${savedCount}/${body.events.length}`);

  return NextResponse.json({ results, savedCount }, { status: 200 });
}
