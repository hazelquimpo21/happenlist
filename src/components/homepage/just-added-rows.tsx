/**
 * JUST ADDED ROWS
 * ===============
 * Numbered list rows of recently added events.
 * No images — speed and scannability.
 *
 * Inspo: AIHub bottom list (01 ChatGPT — Search Engine ...)
 */

import Link from 'next/link';
import { Repeat } from 'lucide-react';
import { getCategoryColor } from '@/lib/constants/category-colors';

interface JustAddedEvent {
  slug: string;
  title: string;
  category_slug: string | null;
  category_name: string | null;
  start_datetime: string;
  price_type?: string | null;
  price_min?: number | null;
  venue_name?: string | null;
  /** Recurrence label ("Every Tuesday") when this row represents a collapsed
   *  series — we show a tiny icon so users know it's a recurring thing, not
   *  a one-off. */
  recurrence_label?: string | null;
}

interface JustAddedRowsProps {
  events: JustAddedEvent[];
  className?: string;
}

function formatRowDate(dateStr: string): string {
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

function formatPrice(type: string | null | undefined, min: number | null | undefined): string {
  if (!type || type === 'free') return 'Free';
  if (min) return `$${min}`;
  return '';
}

export function JustAddedRows({ events, className = '' }: JustAddedRowsProps) {
  if (events.length === 0) return null;

  return (
    <div className={`divide-y divide-mist ${className}`}>
      {events.map((event, i) => {
        const colors = getCategoryColor(event.category_slug);
        const price = formatPrice(event.price_type, event.price_min);

        return (
          <Link
            key={event.slug}
            href={`/event/${event.slug}`}
            className="flex items-center gap-4 py-4 px-2 -mx-2 rounded-sm hover:bg-cloud transition-colors group"
          >
            {/* Number */}
            <span className="text-caption text-zinc tabular-nums font-medium w-6 text-right flex-shrink-0">
              {String(i + 1).padStart(2, '0')}
            </span>

            {/* Category dot */}
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: colors.accent }}
            />

            {/* Title + tiny recurrence hint */}
            <span className="flex-1 min-w-0 flex items-center gap-1.5">
              <span className="text-body text-ink font-semibold truncate group-hover:text-blue transition-colors">
                {event.title}
              </span>
              {event.recurrence_label && (
                <span
                  className="inline-flex items-center text-zinc/70 flex-shrink-0"
                  title={event.recurrence_label}
                  aria-label={`Recurring — ${event.recurrence_label}`}
                >
                  <Repeat className="w-3 h-3" aria-hidden="true" />
                </span>
              )}
            </span>

            {/* Venue — desktop only */}
            {event.venue_name && (
              <span className="hidden lg:inline text-body-sm text-zinc truncate max-w-[200px]">
                {event.venue_name}
              </span>
            )}

            {/* Date */}
            <span className="hidden sm:inline text-body-sm text-zinc whitespace-nowrap">
              {formatRowDate(event.start_datetime)}
            </span>

            {/* Price */}
            {price && (
              <span className={`text-body-sm font-semibold whitespace-nowrap ${
                price === 'Free' ? 'text-emerald' : 'text-zinc'
              }`}>
                {price}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
