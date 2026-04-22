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
import { ArrowRight, ListChecks } from 'lucide-react';
import { AdminHeader, AdminBreadcrumbs } from '@/components/admin';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { WORKLISTS, getWorklistCounts } from '@/data/admin';

export const metadata = { title: 'Cleanup Worklists' };

export default async function WorklistsPage() {
  const counts = await getWorklistCounts();
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
      </div>
    </div>
  );
}
