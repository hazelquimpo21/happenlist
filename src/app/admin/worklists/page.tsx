/**
 * WORKLISTS OVERVIEW
 * ==================
 * Full-page view of all cleanup worklists. Mirrors the dashboard tile but
 * with more context per list (predicate descriptor, deep link).
 *
 * Data: getWorklistCounts() from src/data/admin/get-worklists.ts.
 *
 * @module app/admin/worklists
 */

import Link from 'next/link';
import { ArrowRight, ListChecks, RefreshCw } from 'lucide-react';
import { AdminHeader, AdminBreadcrumbs } from '@/components/admin';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { WORKLISTS, getWorklistCounts, getRunningLowSeries } from '@/data/admin';
import { MIN_RECURRING_BUFFER } from '@/lib/constants/series-limits';

export const metadata = { title: 'Cleanup Worklists' };

export default async function WorklistsPage() {
  const [counts, runningLow] = await Promise.all([
    getWorklistCounts(),
    getRunningLowSeries(),
  ]);
  const total = counts.reduce((sum, w) => sum + w.count, 0);

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="Cleanup Worklists"
        description="Events with data-quality issues worth reviewing"
      />

      <div className="px-8 py-6 space-y-6">
        <AdminBreadcrumbs
          items={[{ label: 'Admin', href: '/admin' }, { label: 'Worklists' }]}
        />

        <Card padding="lg" className="border border-mist">
          <div className="flex items-center gap-3 mb-6">
            <ListChecks className="w-6 h-6 text-blue" />
            <div>
              <h2 className="font-body text-xl text-ink">
                {total} event{total === 1 ? '' : 's'} flagged across {WORKLISTS.length} checks
              </h2>
              <p className="text-sm text-zinc mt-0.5">
                Each list hits a narrow SQL predicate — counts and items are always fresh.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {counts.map((list) => (
              <Link
                key={list.slug}
                href={`/admin/worklists/${list.slug}`}
                className={cn(
                  'flex items-center justify-between gap-4 p-4 rounded-lg border transition-colors',
                  list.count > 0
                    ? 'bg-amber-50 border-amber-200 hover:border-amber-400'
                    : 'bg-cloud border-mist hover:border-silver'
                )}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div
                    className={cn(
                      'text-3xl font-semibold w-16 text-right flex-shrink-0',
                      list.count > 0 ? 'text-amber-900' : 'text-silver'
                    )}
                  >
                    {list.count}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-ink">{list.title}</div>
                    <div className="text-sm text-zinc mt-0.5">{list.description}</div>
                    {/* Predicate — machine-readable descriptor from WORKLISTS */}
                    <code className="text-xs text-zinc/70 mt-1 block truncate">
                      {WORKLISTS.find(w => w.slug === list.slug)?.predicate}
                    </code>
                  </div>
                </div>
                <ArrowRight
                  className={cn(
                    'w-5 h-5 flex-shrink-0',
                    list.count > 0 ? 'text-amber-700' : 'text-silver'
                  )}
                />
              </Link>
            ))}
          </div>
        </Card>

        {/* Recurring series health: cron auto-extends, but some series can't
            be extended (hit MAX cap, end_count reached, or end_date passed).
            Those land here for manual attention. */}
        <Card padding="lg" className="border border-mist">
          <div className="flex items-center gap-3 mb-4">
            <RefreshCw className="w-6 h-6 text-blue" />
            <div>
              <h2 className="font-body text-xl text-ink">
                Recurring series running low
              </h2>
              <p className="text-sm text-zinc mt-0.5">
                Fewer than {MIN_RECURRING_BUFFER} upcoming instances. The nightly cron tops up
                what it can — anything stuck here needs a human (extend the rule, raise the cap, or end the series).
              </p>
            </div>
          </div>

          {runningLow.length === 0 ? (
            <div className="text-sm text-zinc px-1 py-2">
              All recurring series have a healthy runway. ✨
            </div>
          ) : (
            <div className="space-y-2">
              {runningLow.map((s) => (
                <Link
                  key={s.id}
                  href={`/admin/series/${s.id}/edit`}
                  className={cn(
                    'flex items-center justify-between gap-4 p-4 rounded-lg border transition-colors',
                    s.futureCount === 0
                      ? 'bg-rose-50 border-rose-200 hover:border-rose-400'
                      : 'bg-amber-50 border-amber-200 hover:border-amber-400'
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div
                      className={cn(
                        'text-3xl font-semibold w-16 text-right flex-shrink-0',
                        s.futureCount === 0 ? 'text-rose-900' : 'text-amber-900'
                      )}
                    >
                      {s.futureCount}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-ink truncate">{s.title}</div>
                      <div className="text-xs text-zinc mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>{s.series_type}</span>
                        {/* Wording differs by open-ended vs bounded so admins
                            don't read "latest: X" as "ends X" on a series
                            the cron will keep extending. Bounded series get
                            their actual end (count/date) shown alongside. */}
                        {s.lastInstanceDate && s.isOpenEnded && (
                          <span>scheduled thru {s.lastInstanceDate}</span>
                        )}
                        {s.lastInstanceDate && !s.isOpenEnded && (
                          <span>latest: {s.lastInstanceDate}</span>
                        )}
                        {s.endType === 'count' && s.endCount && (
                          <span>ends after {s.endCount}</span>
                        )}
                        {s.endType === 'date' && s.endDate && (
                          <span>ends on {s.endDate}</span>
                        )}
                        {s.isOpenEnded && (
                          <span>open-ended (cron extends)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ArrowRight
                    className={cn(
                      'w-5 h-5 flex-shrink-0',
                      s.futureCount === 0 ? 'text-rose-700' : 'text-amber-700'
                    )}
                  />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
