/**
 * WORKLISTS TILE
 * ==============
 * Dashboard tile that surfaces data-quality cleanup queues. One chip per
 * worklist slug — click to open the per-slug detail page. Chips are muted
 * (grey) when the count is zero and accentuated (amber) when work is waiting.
 *
 * Data comes from getWorklistCounts() — see src/data/admin/get-worklists.ts.
 *
 * @module components/admin/worklists-tile
 */

import Link from 'next/link';
import { ArrowRight, ListChecks } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { WorklistCount } from '@/data/admin/get-worklists';

interface WorklistsTileProps {
  counts: WorklistCount[];
}

export function WorklistsTile({ counts }: WorklistsTileProps) {
  const totalFlagged = counts.reduce((sum, w) => sum + w.count, 0);

  return (
    <Card padding="lg" className="border border-mist">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-zinc" />
          <h2 className="font-body text-xl text-ink">Cleanup worklists</h2>
          {totalFlagged > 0 && (
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
              {totalFlagged} flagged
            </span>
          )}
        </div>
        <Link
          href="/admin/worklists"
          className="text-blue text-sm hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {totalFlagged === 0 ? (
        <p className="text-sm text-zinc py-4">
          All clean. No data-quality issues detected across the monitored dimensions.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {counts.map((list) => (
            <Link
              key={list.slug}
              href={`/admin/worklists/${list.slug}`}
              className={cn(
                'block p-4 rounded-lg border transition-colors',
                list.count > 0
                  ? 'bg-amber-50 border-amber-200 hover:border-amber-400'
                  : 'bg-cloud border-mist hover:border-silver text-zinc'
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <div
                  className={cn(
                    'text-2xl font-semibold',
                    list.count > 0 ? 'text-amber-900' : 'text-silver'
                  )}
                >
                  {list.count}
                </div>
                {list.count > 0 && (
                  <ArrowRight className="w-4 h-4 text-amber-700 flex-shrink-0" />
                )}
              </div>
              <div
                className={cn(
                  'text-sm font-medium mt-1',
                  list.count > 0 ? 'text-ink' : 'text-zinc'
                )}
              >
                {list.title}
              </div>
              <div className="text-xs text-zinc mt-0.5 line-clamp-2">
                {list.description}
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
