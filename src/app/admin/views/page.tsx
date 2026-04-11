/**
 * =============================================================================
 * /admin/views — sanity dashboard for the B3 event_views table
 * =============================================================================
 *
 * Phase 1, Session B3 of the Smart Filters Roadmap.
 *
 * THIS IS A SANITY CHECK, NOT A FEATURE. event_views is collecting data
 * unused for ~4 weeks before Phase 3's trending sort starts consuming it
 * (see CLAUDE.md, the migration header, and docs/filter-roadmap.md). This
 * page exists so we can confirm rows are accumulating during the bake.
 *
 * Why service-role: event_views has RLS that denies SELECT to anon and
 * authenticated. The /admin pages already use the service role for
 * superadmin operations, so this page does the same via createAdminClient().
 *
 * Auth is gated at the page level via the same `getSession + isSuperAdmin
 * + redirect` pattern every other /admin page uses (see /admin/series/[id]
 * /edit/page.tsx). Throwing on denial is a worse UX than redirecting to the
 * login page or to /admin, and pattern consistency keeps the admin shell
 * from acting differently across pages.
 *
 * Cross-file coupling:
 *   - supabase/migrations/20260411_1900_event_views.sql — schema
 *   - src/lib/supabase/admin.ts                          — service-role client
 *   - src/lib/auth/session.ts                            — getSession()
 *   - src/lib/auth/is-superadmin.ts                      — isSuperAdmin()
 * =============================================================================
 */

import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSession, isSuperAdmin } from '@/lib/auth';
import { AdminHeader } from '@/components/admin';

export const metadata = { title: 'Event Views' };
export const dynamic = 'force-dynamic';

interface ViewStats {
  total: number;
  last24h: number;
  last7d: number;
  topEvents: Array<{ event_id: string; title: string | null; view_count: number }>;
}

async function loadViewStats(): Promise<ViewStats> {
  const supabase = createAdminClient();

  // Total rows
  const { count: total } = await supabase
    .from('event_views')
    .select('*', { count: 'exact', head: true });

  // Rows in last 24h
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: last24h } = await supabase
    .from('event_views')
    .select('*', { count: 'exact', head: true })
    .gte('viewed_at', since24h);

  // Rows in last 7d
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: last7d } = await supabase
    .from('event_views')
    .select('*', { count: 'exact', head: true })
    .gte('viewed_at', since7d);

  // Top 10 events by view count in last 7d.
  // Supabase JS doesn't expose GROUP BY directly — use a small RPC or just
  // fetch the rows and aggregate in JS. Volume during the bake will be
  // small (< few thousand rows in a week), so JS aggregation is fine.
  const { data: rawRows } = await supabase
    .from('event_views')
    .select('event_id')
    .gte('viewed_at', since7d)
    .limit(10000);

  const counts = new Map<string, number>();
  for (const row of rawRows ?? []) {
    counts.set(row.event_id, (counts.get(row.event_id) ?? 0) + 1);
  }
  const topPairs = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Resolve titles for the top events.
  const topIds = topPairs.map(([id]) => id);
  let titles = new Map<string, string>();
  if (topIds.length > 0) {
    const { data: events } = await supabase
      .from('events')
      .select('id, title')
      .in('id', topIds);
    titles = new Map((events ?? []).map((e) => [e.id, e.title]));
  }

  return {
    total: total ?? 0,
    last24h: last24h ?? 0,
    last7d: last7d ?? 0,
    topEvents: topPairs.map(([event_id, view_count]) => ({
      event_id,
      title: titles.get(event_id) ?? null,
      view_count,
    })),
  };
}

export default async function AdminViewsPage() {
  // Gate: same getSession + isSuperAdmin + redirect pattern as the rest of
  // /admin (see /admin/series/[id]/edit/page.tsx). Anonymous → login,
  // non-superadmin → /admin landing.
  const { session } = await getSession();
  if (!session) redirect('/auth/login?redirect=/admin/views');
  if (!isSuperAdmin(session.email)) redirect('/admin');

  let stats: ViewStats;
  try {
    stats = await loadViewStats();
  } catch (err) {
    console.error('[admin-views] failed to load view stats', err);
    stats = { total: 0, last24h: 0, last7d: 0, topEvents: [] };
  }

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="Event Views"
        description="B3 view tracking sanity dashboard. Phase 3 trending consumes this; the data bakes for ~4 weeks first."
      />

      <div className="p-8 space-y-8">
        {/* Top-line counts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatBlock label="Total views (all time)" value={stats.total} />
          <StatBlock label="Last 24 hours" value={stats.last24h} />
          <StatBlock label="Last 7 days" value={stats.last7d} />
        </div>

        {/* Top events */}
        <div className="border border-mist rounded-lg p-6 bg-pure">
          <h2 className="font-body text-h4 text-ink mb-4">Top events (last 7 days)</h2>
          {stats.topEvents.length === 0 ? (
            <p className="text-zinc text-body-sm">
              No views recorded yet. Visit an event detail page to see the
              tracker fire — log line is <code>[event-views] inserted view event=…</code>.
            </p>
          ) : (
            <ol className="space-y-2">
              {stats.topEvents.map((row, i) => (
                <li
                  key={row.event_id}
                  className="flex items-center justify-between gap-4 text-body-sm"
                >
                  <span className="text-zinc font-mono w-6 text-right">{i + 1}.</span>
                  <span className="flex-1 text-ink truncate">
                    {row.title ?? <span className="text-zinc italic">{row.event_id}</span>}
                  </span>
                  <span className="text-blue font-semibold">{row.view_count}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Bake-timeline reminder */}
        <div className="text-xs text-zinc">
          Pre-flight target before enabling the trending sort in Phase 3:
          &gt;1000 rows distributed across &gt;50 events. Re-check this page
          at the start of Phase 3.
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-mist rounded-lg p-6 bg-pure">
      <p className="text-zinc text-body-sm">{label}</p>
      <p className="text-h2 font-body font-semibold text-ink mt-1">
        {value.toLocaleString()}
      </p>
    </div>
  );
}
