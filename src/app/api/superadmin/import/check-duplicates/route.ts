/**
 * SUPERADMIN IMPORT — FUZZY DUPLICATE CHECK
 * ==========================================
 * Takes a batch of preview events and returns a map of per-index candidate
 * duplicate rows already in the DB. Runs against the `find_duplicate_events`
 * Postgres RPC (pg_trgm on title + same-day window + optional venue bonus).
 *
 * Separate endpoint from /analyze + /save so the UI can:
 *   1. Analyze → show scraper output
 *   2. Check duplicates in background → decorate cards with warnings
 *   3. Save (manual user action, with full warning context visible)
 *
 * Request:
 *   POST { candidates: [{ index, title, start_datetime, venue_name? }] }
 *
 * Response:
 *   { duplicates: { [index: number]: DuplicateCandidate[] } }
 *
 * @module app/api/superadmin/import/check-duplicates
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/auth/is-superadmin';
import { createAdminClient } from '@/lib/supabase/admin';
import { findDuplicates, type DuplicateCandidate } from '@/lib/scraper/save-event';

export const runtime = 'nodejs';

interface Candidate {
  index: number;
  title: string;
  start_datetime: string;
  venue_name?: string | null;
}

export async function POST(request: NextRequest) {
  const { session } = await getSession();
  if (!session || !isSuperAdmin(session.email)) {
    return NextResponse.json({ error: 'Superadmin access required' }, { status: 401 });
  }

  let body: { candidates?: Candidate[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body.candidates) || body.candidates.length === 0) {
    return NextResponse.json({ error: 'candidates[] is required and non-empty' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Parallel dedupe lookups — each event is independent. RPC is fast and
  // bounded (top 5 per candidate), so firing 10–30 concurrently is fine.
  const results = await Promise.all(
    body.candidates.map(async (c) => {
      if (!c.title || !c.start_datetime) {
        return { index: c.index, candidates: [] as DuplicateCandidate[] };
      }
      const candidates = await findDuplicates(supabase, {
        title: c.title,
        start_datetime: c.start_datetime,
        venue_name: c.venue_name ?? null,
      });
      return { index: c.index, candidates };
    })
  );

  // Reshape into the map the UI expects.
  const duplicates: Record<number, DuplicateCandidate[]> = {};
  for (const r of results) {
    if (r.candidates.length > 0) duplicates[r.index] = r.candidates;
  }

  const hitCount = Object.keys(duplicates).length;
  console.log(
    `[dedupe:api] checked ${body.candidates.length} candidates, ${hitCount} have potential duplicates (by ${session.email})`
  );

  return NextResponse.json({ duplicates });
}
