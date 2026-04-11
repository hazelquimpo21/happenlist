/**
 * =============================================================================
 * PastInstances — historical sibling events from the same series
 * =============================================================================
 *
 * Server component. Mounted on the event detail page when `event.series_id`
 * is set. Shows up to 6 past dates of the same series so visitors can verify
 * "is this a real recurring thing? has it happened before?"
 *
 * Why not reuse the existing series detail page schedule view?
 *   - That view shows ALL instances (past + upcoming), needs filter pills,
 *     auto-scroll, and other heavy machinery. Past instances on the event
 *     detail page is a small ambient signal — collapsed by default would
 *     hide it; a 5-row list with date links is plenty.
 *
 * Returns null when there are no past instances — the parent page should
 * not render any "Past dates" heading at all in that case.
 *
 * Cross-file coupling:
 *   - src/data/series/get-series-detail.ts — getPastSeriesInstances
 *   - src/lib/utils/url.ts — buildEventUrl (matches the rest of the app)
 *   - src/app/event/[slug]/page.tsx — sole consumer
 * =============================================================================
 */

import Link from 'next/link';
import { History } from 'lucide-react';
import { format } from 'date-fns';
import { getPastSeriesInstances } from '@/data/series';
import { buildEventUrl } from '@/lib/utils/url';

interface PastInstancesProps {
  seriesId: string;
  /** ID of the event currently being viewed — excluded from the list. */
  excludeEventId: string;
  /** Optional UI label override. */
  title?: string;
  limit?: number;
}

/**
 * Format a past instance date for display: "Sat, Apr 5" or fallback to ISO.
 *
 * Uses instance_date when available (date-only, no timezone games), otherwise
 * falls back to start_datetime. Try/catch defensively — bad data should not
 * crash the detail page.
 */
function formatPastDate(instance_date: string | null, start_datetime: string): string {
  try {
    const dateStr = instance_date ?? start_datetime;
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return format(date, 'EEE, MMM d, yyyy');
  } catch {
    return instance_date ?? start_datetime;
  }
}

export async function PastInstances({
  seriesId,
  excludeEventId,
  title = 'Past dates',
  limit = 6,
}: PastInstancesProps) {
  const instances = await getPastSeriesInstances(seriesId, excludeEventId, limit);

  // Defensive — render nothing when there's no history
  if (instances.length === 0) return null;

  return (
    <section
      className="mt-8 p-5 rounded-xl border border-mist bg-cloud/40"
      aria-labelledby="past-instances-heading"
    >
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-zinc" aria-hidden="true" />
        <h3 id="past-instances-heading" className="font-body text-body font-semibold text-ink">
          {title}
        </h3>
        <span className="text-xs text-zinc">
          {instances.length} previous {instances.length === 1 ? 'date' : 'dates'}
        </span>
      </div>

      <ul className="divide-y divide-mist">
        {instances.map((inst) => (
          <li key={inst.id}>
            <Link
              href={buildEventUrl({ slug: inst.slug, instance_date: inst.instance_date ?? '' })}
              className="flex items-center justify-between py-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue rounded-md"
            >
              <span className="text-body-sm text-ink group-hover:text-blue truncate">
                {inst.title}
              </span>
              <span className="text-xs text-zinc font-medium ml-3 flex-shrink-0">
                {formatPastDate(inst.instance_date, inst.start_datetime)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
