/**
 * CHILD EVENTS SCHEDULE
 * =====================
 * Displays child events of a parent event, grouped by date.
 * Used on parent event detail pages (festivals, theatrical runs, etc.)
 *
 * Features:
 *   - Date-grouped chronological layout (like a printed program)
 *   - Filter pills for parent_group values (venues, stages, etc.)
 *   - Today indicator with auto-scroll
 *   - Responsive: compact rows on desktop, stacked cards on mobile
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { MapPin, Clock } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { buildEventUrl } from '@/lib/utils/url';
import { getCategoryColor } from '@/lib/constants/category-colors';
import { cn } from '@/lib/utils';
import type { EventCard } from '@/types';

interface ChildEventsScheduleProps {
  events: EventCard[];
  /** Distinct parent_group values for filter pills */
  groups: string[];
  /** Category slug for color theming */
  categorySlug: string | null;
}

/**
 * Group events by their instance_date.
 */
function groupByDate(events: EventCard[]): Map<string, EventCard[]> {
  const grouped = new Map<string, EventCard[]>();
  for (const event of events) {
    const dateKey = event.instance_date;
    const existing = grouped.get(dateKey) || [];
    existing.push(event);
    grouped.set(dateKey, existing);
  }
  return grouped;
}

/**
 * Format time from a datetime string — "7pm", "7:30pm".
 */
function formatTime(datetime: string): string {
  try {
    const date = parseISO(datetime);
    const minutes = date.getMinutes();
    if (minutes === 0) return format(date, 'haaa');
    return format(date, 'h:mmaaa');
  } catch {
    return '';
  }
}

/**
 * Format price for compact display.
 */
function formatCompactPrice(event: EventCard): string | null {
  if (event.is_free) return null; // "Free" shown as badge instead
  if (event.price_low && event.price_high && event.price_low !== event.price_high) {
    return `$${event.price_low}–$${event.price_high}`;
  }
  if (event.price_low) return `$${event.price_low}`;
  return null;
}

export function ChildEventsSchedule({
  events,
  groups,
  categorySlug,
}: ChildEventsScheduleProps) {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const categoryColor = getCategoryColor(categorySlug);

  // Filter events by selected group
  const filteredEvents = activeGroup
    ? events.filter((e) => e.parent_group === activeGroup)
    : events;

  const dateGroups = groupByDate(filteredEvents);

  // Scroll to today's events on mount
  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  if (events.length === 0) return null;

  // Show message when filter yields no results
  if (filteredEvents.length === 0) {
    return (
      <div className="space-y-6">
        {groups.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveGroup(null)}
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-cloud/60 text-zinc hover:bg-cloud transition-colors"
            >
              All
            </button>
            {groups.map((group) => (
              <button
                key={group}
                onClick={() => setActiveGroup(group)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  activeGroup === group
                    ? 'text-white'
                    : 'bg-cloud/60 text-zinc hover:bg-cloud'
                )}
                style={
                  activeGroup === group
                    ? { backgroundColor: categoryColor.accent }
                    : undefined
                }
              >
                {group}
              </button>
            ))}
          </div>
        )}
        <p className="text-body text-zinc text-center py-8">No events match this filter.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter pills (only if there are groups) */}
      {groups.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveGroup(null)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              activeGroup === null
                ? 'text-white'
                : 'bg-cloud/60 text-zinc hover:bg-cloud'
            )}
            style={
              activeGroup === null
                ? { backgroundColor: categoryColor.accent }
                : undefined
            }
          >
            All
          </button>
          {groups.map((group) => (
            <button
              key={group}
              onClick={() => setActiveGroup(group)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeGroup === group
                  ? 'text-white'
                  : 'bg-cloud/60 text-zinc hover:bg-cloud'
              )}
              style={
                activeGroup === group
                  ? { backgroundColor: categoryColor.accent }
                  : undefined
              }
            >
              {group}
            </button>
          ))}
        </div>
      )}

      {/* Date-grouped schedule */}
      <div className="space-y-8">
        {Array.from(dateGroups.entries()).map(([dateKey, dayEvents]) => {
          const date = parseISO(dateKey);
          const isTodayDate = isToday(date);

          return (
            <div
              key={dateKey}
              ref={isTodayDate ? todayRef : undefined}
            >
              {/* Date header — editorial, like a printed program */}
              <div
                className={cn(
                  'flex items-center gap-3 mb-4 pb-2 border-b',
                  isTodayDate ? 'border-blue' : 'border-mist'
                )}
              >
                <div
                  className="w-1 h-8 rounded-full flex-shrink-0"
                  style={{ backgroundColor: isTodayDate ? '#008bd2' : categoryColor.accent }}
                  aria-hidden="true"
                />
                <h3 className="font-body text-lg md:text-xl text-ink">
                  {format(date, 'EEEE, MMMM d')}
                </h3>
                {isTodayDate && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue text-white">
                    Today
                  </span>
                )}
              </div>

              {/* Event rows for this date */}
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <ChildEventRow
                    key={event.id}
                    event={event}
                    categorySlug={categorySlug}
                    // Hide venue if all events in this schedule share the same location
                    showVenue={!activeGroup}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Child Event Row — compact schedule entry
// =============================================================================

interface ChildEventRowProps {
  event: EventCard;
  categorySlug: string | null;
  showVenue: boolean;
}

function ChildEventRow({ event, categorySlug, showVenue }: ChildEventRowProps) {
  const eventUrl = buildEventUrl(event);
  const categoryColor = getCategoryColor(categorySlug);
  const price = formatCompactPrice(event);
  const time = formatTime(event.start_datetime);

  return (
    <Link
      href={eventUrl}
      className={cn(
        'group flex items-center gap-4 p-3 rounded-lg',
        'bg-pure border border-mist/50',
        'transition-all duration-200',
        'hover:shadow-card-lifted hover:-translate-y-0.5'
      )}
    >
      {/* Time — bold, left-aligned */}
      <div className="flex-shrink-0 w-16 md:w-20">
        {time && (
          <span className="flex items-center gap-1 text-sm font-semibold text-ink tabular-nums">
            <Clock className="w-3.5 h-3.5 text-zinc hidden md:block" aria-hidden="true" />
            {time}
          </span>
        )}
      </div>

      {/* Category color dot */}
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: categoryColor.accent }}
        aria-hidden="true"
      />

      {/* Title + venue */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink group-hover:text-blue transition-colors truncate">
          {event.title}
        </p>
        {showVenue && event.location_name && (
          <p className="text-xs text-zinc flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{event.location_name}</span>
          </p>
        )}
        {/* Show parent_group only when it differs from venue name (avoid duplication) */}
        {event.parent_group && event.parent_group !== event.location_name && (
          <p className="text-xs text-zinc mt-0.5 truncate">
            {event.parent_group}
          </p>
        )}
      </div>

      {/* Price badge */}
      <div className="flex-shrink-0">
        {event.is_free ? (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald/10 text-emerald">
            Free
          </span>
        ) : price ? (
          <span className="text-xs font-medium text-zinc">
            {price}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
