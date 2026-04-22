/**
 * CRON: RECHECK SOLD OUT
 * =======================
 * Nightly sweep that looks at upcoming ticketed events and pokes their ticket
 * URLs via the scraper's cheap /check-sold-out endpoint.
 *
 * Target events:
 *   - status = 'published'
 *   - start_datetime > now() AND < now() + 30 days
 *   - ticket_url IS NOT NULL
 *   - sold_out IS NOT TRUE (no need to re-check already-sold-out events)
 *
 * Per run limits:
 *   - BATCH_LIMIT caps work so we stay well inside Vercel's 300s timeout.
 *   - Events are processed sequentially to stay polite against ticket-host servers.
 *   - Each event is independent — one failure doesn't abort the batch.
 *
 * Auth:
 *   - Vercel adds an "Authorization: Bearer <CRON_SECRET>" header on cron hits.
 *   - We match against CRON_SECRET. When CRON_SECRET isn't set (local dev),
 *     requests are allowed so you can `curl` the endpoint manually.
 *
 * Schedule: set in vercel.json → 08:00 UTC daily (~2am/3am CT depending on DST).
 *
 * @module api/cron/recheck-sold-out
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkSoldOut, ScraperClientError } from '@/lib/scraper/client';

export const runtime = 'nodejs';
// Vercel cron default timeout can be extended up to 300s.
export const maxDuration = 300;

// ----------------------------------------------------------------------------
// CONFIG
// ----------------------------------------------------------------------------

/** Max events checked per run. Tune up if cost/timeout allow. */
const BATCH_LIMIT = 30;

/** Only look at events starting within this window (days). */
const LOOKAHEAD_DAYS = 30;

// ----------------------------------------------------------------------------
// AUTH
// ----------------------------------------------------------------------------

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn('[cron:sold-out] CRON_SECRET not set — allowing (dev mode only).');
    return true;
  }
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;
  const [type, token] = authHeader.split(' ');
  return type === 'Bearer' && token === secret;
}

// ----------------------------------------------------------------------------
// HANDLER
// ----------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const started = Date.now();
  const supabase = createAdminClient();

  const windowStart = new Date();
  const windowEnd = new Date(Date.now() + LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000);

  console.log(
    `[cron:sold-out] sweep start window=${windowStart.toISOString()}..${windowEnd.toISOString()} limit=${BATCH_LIMIT}`
  );

  // Fetch candidates
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: events, error: fetchError } = await (supabase as any)
    .from('events')
    .select('id, title, source_url, ticket_url, sold_out, price_low, price_high, start_datetime')
    .eq('status', 'published')
    .gte('start_datetime', windowStart.toISOString())
    .lte('start_datetime', windowEnd.toISOString())
    .not('ticket_url', 'is', null)
    .not('sold_out', 'is', true)
    .order('start_datetime', { ascending: true })
    .limit(BATCH_LIMIT);

  if (fetchError) {
    console.error(`[cron:sold-out] candidate fetch failed: ${fetchError.message}`);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!events || events.length === 0) {
    console.log('[cron:sold-out] no candidates');
    return NextResponse.json({ checked: 0, patched: 0, duration_ms: Date.now() - started });
  }

  console.log(`[cron:sold-out] ${events.length} candidates`);

  let checked = 0;
  let patched = 0;
  let skipped = 0;
  let errored = 0;
  const results: Array<{
    id: string;
    title: string;
    status: 'patched' | 'noop' | 'error';
    patched?: string[];
    error?: string;
  }> = [];

  // Sequential pass — polite and keeps memory flat.
  for (const ev of events) {
    checked += 1;
    try {
      const check = await checkSoldOut({
        ticketUrl: ev.ticket_url,
        sourceUrl: ev.source_url ?? undefined,
      });

      const updates = check.updates || {};

      // Drop no-op fields so we don't write the same value back (clutters audit).
      for (const key of Object.keys(updates)) {
        if ((ev as Record<string, unknown>)[key] === updates[key]) {
          delete updates[key];
        }
      }

      if (Object.keys(updates).length === 0) {
        skipped += 1;
        results.push({ id: ev.id, title: ev.title, status: 'noop' });
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('events')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', ev.id);

      if (updateError) {
        errored += 1;
        console.error(`[cron:sold-out] update failed for ${ev.id}: ${updateError.message}`);
        results.push({ id: ev.id, title: ev.title, status: 'error', error: updateError.message });
        continue;
      }

      patched += 1;
      console.log(
        `[cron:sold-out] patched ${ev.id} "${ev.title}" fields=${Object.keys(updates).join(',')}`
      );
      results.push({ id: ev.id, title: ev.title, status: 'patched', patched: Object.keys(updates) });
    } catch (err) {
      errored += 1;
      if (err instanceof ScraperClientError) {
        console.error(`[cron:sold-out] scraper error for ${ev.id}: ${err.message}`);
        results.push({ id: ev.id, title: ev.title, status: 'error', error: err.message });
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[cron:sold-out] unexpected error for ${ev.id}: ${msg}`);
        results.push({ id: ev.id, title: ev.title, status: 'error', error: msg });
      }
    }
  }

  const duration_ms = Date.now() - started;
  console.log(
    `[cron:sold-out] done checked=${checked} patched=${patched} skipped=${skipped} errored=${errored} duration_ms=${duration_ms}`
  );

  return NextResponse.json({
    checked,
    patched,
    skipped,
    errored,
    duration_ms,
    results,
  });
}
