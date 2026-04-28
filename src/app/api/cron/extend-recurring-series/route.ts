/**
 * CRON: EXTEND RECURRING SERIES
 * ==============================
 * Nightly top-up for recurring series so the calendar never runs dry.
 *
 * Target series:
 *   - series_type IN ('recurring', 'class', 'workshop')  (collapsible types)
 *   - recurrence_rule IS NOT NULL
 *   - status != 'cancelled'
 *
 * Per-series logic lives in src/data/series/extend-series.ts so the
 * superadmin PATCH /api/superadmin/series/[id] route can reuse it
 * (with `gateOnBuffer=false`) for immediate-feedback materialization
 * after an operator changes the recurrence rule.
 *
 * Auth: same Bearer CRON_SECRET pattern as recheck-sold-out.
 *
 * Coupling:
 *   - All inserts go through src/data/series/materialize-instances.ts.
 *   - Threshold constants: src/lib/constants/series-limits.ts
 *     (MIN_RECURRING_BUFFER, MAX_RECURRING_GENERATION).
 *   - Schedule: vercel.json crons[].
 *
 * @module api/cron/extend-recurring-series
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { extendSeriesInstances } from '@/data/series/extend-series';
import {
  MIN_RECURRING_BUFFER,
  MAX_RECURRING_GENERATION,
} from '@/lib/constants/series-limits';
import type { RecurrenceRule } from '@/lib/supabase/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

// Series types that own a recurrence_rule and should be topped up.
// Other types (festival, season, annual, camp, lifestyle, ongoing, exhibit)
// don't follow a repeating instance schedule.
const EXTENDABLE_SERIES_TYPES = ['recurring', 'class', 'workshop'] as const;

// ----------------------------------------------------------------------------
// AUTH
// ----------------------------------------------------------------------------

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn('[cron:extend-series] CRON_SECRET not set — allowing (dev mode only).');
    return true;
  }
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;
  const [type, token] = authHeader.split(' ');
  return type === 'Bearer' && token === secret;
}

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

interface SeriesRow {
  id: string;
  title: string;
  series_type: string;
  recurrence_rule: RecurrenceRule | null;
  end_date: string | null;
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

  console.log(`[cron:extend-series] start buffer=${MIN_RECURRING_BUFFER} cap=${MAX_RECURRING_GENERATION}`);

  // Fetch every recurring series. There aren't that many — this is fine.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: seriesRows, error: seriesErr } = await (supabase as any)
    .from('series')
    .select('id, title, series_type, recurrence_rule, end_date')
    .in('series_type', EXTENDABLE_SERIES_TYPES)
    .neq('status', 'cancelled')
    .not('recurrence_rule', 'is', null);

  if (seriesErr) {
    console.error(`[cron:extend-series] series fetch failed: ${seriesErr.message}`);
    return NextResponse.json({ error: seriesErr.message }, { status: 500 });
  }

  if (!seriesRows || seriesRows.length === 0) {
    console.log('[cron:extend-series] no candidate series');
    return NextResponse.json({ checked: 0, extended: 0, duration_ms: Date.now() - started });
  }

  const outcomes = [];
  for (const series of seriesRows as SeriesRow[]) {
    const outcome = await extendSeriesInstances(
      supabase,
      {
        id: series.id,
        title: series.title,
        recurrence_rule: series.recurrence_rule,
        end_date: series.end_date,
      },
      // 'api' = automated background generation. events_source_check allows
      // manual / scraper / user_submission / api / import only.
      { gateOnBuffer: true, source: 'api' }
    );
    outcomes.push(outcome);
  }

  const counts = outcomes.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});
  const totalGenerated = outcomes.reduce((sum, o) => sum + o.generated, 0);

  // One audit row per run, summarizing outcomes.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('admin_audit_log').insert({
    action: 'cron_extend_recurring_series',
    entity_type: 'series',
    entity_id: null,
    admin_email: 'system:cron',
    changes: {
      checked: outcomes.length,
      total_generated: totalGenerated,
      counts,
    },
    notes: `Cron sweep: ${outcomes.length} series, ${totalGenerated} new instances`,
  });

  const duration_ms = Date.now() - started;
  console.log(
    `[cron:extend-series] done checked=${outcomes.length} generated=${totalGenerated} counts=${JSON.stringify(counts)} duration_ms=${duration_ms}`
  );

  return NextResponse.json({
    checked: outcomes.length,
    extended: counts.extended ?? 0,
    total_generated: totalGenerated,
    counts,
    duration_ms,
    outcomes,
  });
}
