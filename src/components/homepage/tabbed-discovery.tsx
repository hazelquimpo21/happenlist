/**
 * =============================================================================
 * TABBED DISCOVERY — homepage Popular / New / This weekend panel (B1)
 * =============================================================================
 *
 * 360px-wide (desktop) panel that sits next to the HeroFeaturedCard on the
 * homepage. 3 tabs, each showing 4 compact event rows with:
 *   - 56×56 rounded thumbnail (event image, or 45° striped gradient in
 *     category color as fallback)
 *   - Category label (uppercase, colored in category color)
 *   - Event title (bold, single-line truncate)
 *   - Meta line: "Sat · 5pm · Free" or "Added today"
 *
 * Server component receives data via props — parent fetches all three tab
 * datasets in parallel. Client-side, we only manage the active tab. The
 * content DOESN'T re-fetch on tab switch (everything is already loaded).
 *
 * Tab content semantics (see get-trending-events.ts):
 *   - Popular: hearts-ranked, 14-day window with newest fallback
 *   - New: newest-first, 30-day window
 *   - This weekend: Saturday + Sunday
 *
 * Cross-file coupling:
 *   - src/data/events/get-trending-events.ts — data source
 *   - src/lib/constants/category-colors.ts — colors + fallback gradient
 *   - src/app/page.tsx — homepage composition parent
 * =============================================================================
 */

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { EventCard } from '@/types';
import { cn } from '@/lib/utils/cn';
import { getCategoryColor } from '@/lib/constants/category-colors';
import { shorthandToRange } from '@/components/events/filters/b1/when-shorthands';

type TabKey = 'popular' | 'new' | 'weekend';

interface TabbedDiscoveryProps {
  popular: EventCard[];
  newest: EventCard[];
  weekend: EventCard[];
}

const TABS: readonly { k: TabKey; label: string }[] = [
  { k: 'popular', label: 'Popular' },
  { k: 'new', label: 'New' },
  { k: 'weekend', label: 'This weekend' },
];

/**
 * Build "See all →" deep-link destinations. Popular / New map to sort
 * options on /events; Weekend carries the same date range the weekend
 * tab used, so the archive shows a matching set rather than everything.
 * Computed once per render — refreshes any time the server fetches
 * fresh data.
 */
function buildSeeAllHref(tab: TabKey): string {
  if (tab === 'popular') return '/events?sort=popular';
  if (tab === 'new') return '/events?sort=newest';
  const r = shorthandToRange('this-weekend');
  return `/events?from=${r.dateFrom}&to=${r.dateTo}`;
}

/**
 * Format a short meta line per tab:
 *   popular  → "Sat · 7pm · 340 going"
 *   new      → "Sat · 7pm · Added today"
 *   weekend  → "Sat · 7pm · Free"
 */
function metaFor(tab: TabKey, event: EventCard): string {
  const dayTime = formatDayTime(event.instance_date, event.start_datetime);
  if (tab === 'popular') {
    return event.heart_count > 0 ? `${dayTime} \u00b7 ${event.heart_count} hearted` : dayTime;
  }
  if (tab === 'new') {
    const added = formatRelativeAge(event.created_at);
    return added ? `${dayTime} \u00b7 ${added}` : dayTime;
  }
  // weekend
  const price = event.is_free ? 'Free' : event.price_low ? `$${event.price_low}` : '';
  return price ? `${dayTime} \u00b7 ${price}` : dayTime;
}

const WEEKDAY_FMT = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
function formatDayTime(instanceDate: string, startDatetime: string): string {
  const d = new Date(`${instanceDate}T00:00:00`);
  const day = WEEKDAY_FMT.format(d);
  const t = new Date(startDatetime);
  const hour = t.getHours();
  const min = t.getMinutes();
  const ampm = hour >= 12 ? 'pm' : 'am';
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const time = min === 0 ? `${h12}${ampm}` : `${h12}:${String(min).padStart(2, '0')}${ampm}`;
  return `${day} \u00b7 ${time}`;
}

function formatRelativeAge(createdAt: string | null | undefined): string | null {
  if (!createdAt) return null;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return null;
  const diffMs = Date.now() - created.getTime();
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  if (hours < 1) return 'Added just now';
  if (hours < 24) return `Added ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Added yesterday';
  if (days < 7) return `Added ${days}d ago`;
  return `Added ${Math.floor(days / 7)}w ago`;
}

export function TabbedDiscovery({ popular, newest, weekend }: TabbedDiscoveryProps) {
  const [tab, setTab] = useState<TabKey>('popular');
  const data: Record<TabKey, EventCard[]> = { popular, new: newest, weekend };
  const events = data[tab].slice(0, 4);
  // Memoize — weekend URL builds a Date() which we don't want recomputed
  // on every render (produces a stable href per tab).
  const seeAllHref = useMemo(() => buildSeeAllHref(tab), [tab]);

  return (
    <div className="flex flex-col rounded-[20px] border border-mist bg-pure p-5 md:w-[360px] md:flex-shrink-0">
      {/* Tab bar */}
      <div className="mb-4 flex gap-1 rounded-full bg-cloud p-1">
        {TABS.map((t) => {
          const on = tab === t.k;
          return (
            <button
              key={t.k}
              type="button"
              onClick={() => setTab(t.k)}
              aria-pressed={on}
              className={cn(
                'flex-1 rounded-full px-2 py-1.5 text-[12.5px] font-bold transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue',
                on
                  ? 'bg-pure text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                  : 'bg-transparent text-zinc hover:text-ink'
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Rows */}
      <div className="grid gap-2.5">
        {events.length === 0 && (
          <p className="py-4 text-center text-[13px] text-zinc">
            Nothing here yet.
          </p>
        )}
        {events.map((event, i) => {
          const color = getCategoryColor(event.category_slug);
          const img = event.thumbnail_url ?? event.image_url;
          return (
            <Link
              key={event.id}
              href={`/event/${event.slug}`}
              className={cn(
                'flex min-w-0 gap-2.5 py-2 pr-1',
                i < events.length - 1 && 'border-b border-mist'
              )}
            >
              <div
                className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-[10px]"
                style={{
                  background: img
                    ? undefined
                    : `repeating-linear-gradient(45deg, ${color.bg}66 0 8px, ${color.bg}22 8px 16px)`,
                }}
              >
                {img && (
                  <Image
                    src={img}
                    alt=""
                    width={56}
                    height={56}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="text-[10px] font-bold uppercase tracking-[0.06em]"
                  style={{ color: color.accent }}
                >
                  {event.category_name ?? 'Event'}
                </div>
                <div className="mt-0.5 truncate text-[14px] font-bold text-ink">
                  {event.title}
                </div>
                <div className="mt-0.5 text-[11.5px] text-zinc">
                  {metaFor(tab, event)}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <Link
        href={seeAllHref}
        className="mt-4 text-[13px] font-semibold text-blue hover:text-blue-dark"
      >
        {'See all →'}
      </Link>
    </div>
  );
}
