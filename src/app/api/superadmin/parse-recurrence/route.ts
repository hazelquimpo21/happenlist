/**
 * SUPERADMIN PARSE RECURRENCE
 * ============================
 * Thin proxy — takes a plain-English recurrence description from the series
 * editor and forwards to the Render scraper's POST /parse/recurrence.
 *
 * The scraper validates against the same vocab used for scraped events, so
 * the returned rule is guaranteed UI-renderable.
 *
 * @module app/api/superadmin/parse-recurrence
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/auth/is-superadmin';
import { parseRecurrence, ScraperClientError } from '@/lib/scraper/client';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const { session } = await getSession();
  if (!session || !isSuperAdmin(session.email)) {
    return NextResponse.json({ error: 'Superadmin access required' }, { status: 401 });
  }

  let body: { description?: string; startDate?: string; defaultTime?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body.description !== 'string' || body.description.trim().length < 4) {
    return NextResponse.json({ error: 'description must be at least 4 characters' }, { status: 400 });
  }

  console.log(`[parse-recurrence:api] "${body.description.trim()}" by ${session.email}`);

  try {
    const result = await parseRecurrence({
      description: body.description,
      startDate: body.startDate,
      defaultTime: body.defaultTime,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ScraperClientError) {
      console.error(`[parse-recurrence:api] scraper error: ${err.message}`);
      const status = err.status >= 400 && err.status < 600 ? err.status : 502;
      return NextResponse.json({ error: err.message }, { status });
    }
    console.error('[parse-recurrence:api] unexpected error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
