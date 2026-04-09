/**
 * LIST CARD
 * =========
 * Numbered compact event list (no images).
 * "Trending" or "New this week" with 3-4 events.
 *
 * Inspo: AIHub bottom numbered list (01-05)
 */

import Link from 'next/link';
import { getCategoryColor } from '@/lib/constants/category-colors';

interface ListEvent {
  slug: string;
  title: string;
  category_slug: string | null;
  start_datetime: string;
  price_type?: string | null;
}

interface ListCardProps {
  title: string;
  events: ListEvent[];
  viewAllHref?: string;
  className?: string;
}

function formatCompactDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return `Today · ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()}`;
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow · ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()}`;
  }

  return `${date.toLocaleDateString('en-US', { weekday: 'short' })} · ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()}`;
}

export function ListCard({ title, events, viewAllHref, className = '' }: ListCardProps) {
  return (
    <div className={`bg-pure rounded-lg p-5 h-full flex flex-col shadow-card ${className}`}>
      <h3 className="text-caption uppercase tracking-wider text-zinc font-semibold mb-4">
        {title}
      </h3>
      <div className="flex-1 space-y-0">
        {events.slice(0, 4).map((event, i) => {
          const colors = getCategoryColor(event.category_slug);
          return (
            <Link
              key={event.slug}
              href={`/event/${event.slug}`}
              className="flex items-center gap-3 py-2.5 border-b border-mist last:border-0 group hover:bg-cloud -mx-2 px-2 rounded-sm transition-colors"
            >
              <span className="text-caption text-zinc tabular-nums font-medium w-5">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: colors.accent }}
              />
              <span className="flex-1 text-body-sm text-ink font-semibold truncate group-hover:text-blue transition-colors">
                {event.title}
              </span>
              <span className="text-caption text-zinc whitespace-nowrap hidden sm:inline">
                {formatCompactDate(event.start_datetime)}
              </span>
            </Link>
          );
        })}
      </div>
      {viewAllHref && (
        <Link href={viewAllHref} className="mt-3 text-caption text-blue font-semibold hover:underline">
          View all →
        </Link>
      )}
    </div>
  );
}
