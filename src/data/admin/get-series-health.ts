/**
 * RECURRING SERIES HEALTH
 * =======================
 * Surfaces recurring series that need superadmin attention because they're
 * running out of upcoming instances. The extend-recurring-series cron handles
 * routine top-ups, so a series only lands here if the cron *couldn't* extend
 * it — typically because:
 *
 *   - It hit MAX_RECURRING_GENERATION (52 instances cumulative).
 *   - end_type='count' end_count was reached.
 *   - end_type='date' end_date is in the past.
 *
 * Used by:
 *   - src/app/admin/worklists/page.tsx — "Recurring series" section
 *
 * Coupling:
 *   - MIN_RECURRING_BUFFER from series-limits.ts is the threshold.
 *   - The cron in src/app/api/cron/extend-recurring-series writes
 *     audit log rows that explain *why* a given series wasn't extended.
 */

import { createClient } from '@/lib/supabase/server';
import { MIN_RECURRING_BUFFER } from '@/lib/constants/series-limits';
import { isSeriesOpenEnded } from '@/lib/series/date-display';

const EXTENDABLE_SERIES_TYPES = ['recurring', 'class', 'workshop'] as const;

export interface RunningLowSeries {
  id: string;
  title: string;
  slug: string;
  series_type: string;
  futureCount: number;
  lastInstanceDate: string | null;
  endType: 'never' | 'count' | 'date' | null;
  endDate: string | null;
  endCount: number | null;
  /**
   * True when the recurrence rule has no fixed end (end_type='never' OR
   * a missing/partial rule). Lets the UI render "scheduled thru X" instead
   * of "latest: X" without re-deriving the rule shape on the client.
   */
  isOpenEnded: boolean;
}

interface SeriesRow {
  id: string;
  title: string;
  slug: string;
  series_type: string;
  recurrence_rule: {
    end_type?: 'never' | 'count' | 'date';
    end_date?: string;
    end_count?: number;
  } | null;
}

/**
 * Recurring series that have fewer than MIN_RECURRING_BUFFER future
 * (non-cancelled) instances. Sorted by futureCount asc, so the most urgent
 * surface first.
 */
export async function getRunningLowSeries(): Promise<RunningLowSeries[]> {
  const supabase = await createClient();
  const todayIso = new Date().toISOString();

  // Fetch all extendable series (small set — usually < 100)
  const { data: seriesRows, error } = await supabase
    .from('series')
    .select('id, title, slug, series_type, recurrence_rule')
    .in('series_type', EXTENDABLE_SERIES_TYPES)
    .neq('status', 'cancelled')
    .is('deleted_at', null)
    .not('recurrence_rule', 'is', null);

  if (error) {
    console.error(`[series-health] series fetch failed: ${error.message}`);
    return [];
  }

  if (!seriesRows || seriesRows.length === 0) return [];

  // Count future + find latest instance per series in parallel
  const checks = await Promise.all(
    (seriesRows as unknown as SeriesRow[]).map(async (s) => {
      const [futureRes, latestRes] = await Promise.all([
        supabase
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('series_id', s.id)
          .neq('status', 'cancelled')
          .gte('start_datetime', todayIso),
        supabase
          .from('events')
          .select('instance_date')
          .eq('series_id', s.id)
          .neq('status', 'cancelled')
          .not('instance_date', 'is', null)
          .order('instance_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      return {
        series: s,
        futureCount: futureRes.count ?? 0,
        lastInstanceDate:
          (latestRes.data as { instance_date: string } | null)?.instance_date ?? null,
      };
    })
  );

  return checks
    .filter(c => c.futureCount < MIN_RECURRING_BUFFER)
    .sort((a, b) => a.futureCount - b.futureCount)
    .map(c => ({
      id: c.series.id,
      title: c.series.title,
      slug: c.series.slug,
      series_type: c.series.series_type,
      futureCount: c.futureCount,
      lastInstanceDate: c.lastInstanceDate,
      endType: c.series.recurrence_rule?.end_type ?? null,
      endDate: c.series.recurrence_rule?.end_date ?? null,
      endCount: c.series.recurrence_rule?.end_count ?? null,
      isOpenEnded: isSeriesOpenEnded(c.series.recurrence_rule),
    }));
}
