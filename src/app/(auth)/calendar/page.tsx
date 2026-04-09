/**
 * CALENDAR PAGE — "What's Happening"
 * ===================================
 * Unified timeline view that merges Google Calendar events,
 * AI-recommended email events, and extracted dates into a single
 * chronological stream grouped by time period.
 *
 * NO TABS. Items are classified into four display categories
 * (schedule, recommendation, date, low-signal) and rendered
 * with distinct visual treatments in a single timeline.
 *
 * Data flow:
 *   useCalendarEvents() → RawCalendarEvent[]  ─┐
 *                                               ├→ buildTimeline() → TimeGroup[]
 *   useEmailEvents()    → RawEmailEvent[]     ─┘
 */

'use client';

import { useMemo, useState } from 'react';
import { Container } from '@/components/layout';
import {
  buildTimeline,
  type RawCalendarEvent,
  type RawEmailEvent,
} from '@/components/calendar/smart-timeline.utils';
import type {
  DisplayItem,
  DisplayCategory,
  TimeGroup,
} from '@/components/calendar/display-item.types';

// ============================================================================
// PLACEHOLDER HOOKS
// ============================================================================
// These will be replaced with real data hooks in a future prompt.
// For now they return empty arrays so the page compiles and renders.

function useCalendarEvents(): {
  events: RawCalendarEvent[];
  isLoading: boolean;
} {
  return { events: [], isLoading: false };
}

function useEmailEvents(): {
  events: RawEmailEvent[];
  isLoading: boolean;
} {
  return { events: [], isLoading: false };
}

// ============================================================================
// CATEGORY VISUAL CONFIG
// ============================================================================

const CATEGORY_CONFIG: Record<
  DisplayCategory,
  { label: string; dotColor: string; bgColor: string; textColor: string }
> = {
  schedule: {
    label: 'Calendar',
    dotColor: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
  },
  recommendation: {
    label: 'Recommended',
    dotColor: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
  },
  date: {
    label: 'Date',
    dotColor: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
  },
  'low-signal': {
    label: 'Maybe',
    dotColor: 'bg-stone',
    bgColor: 'bg-cloud/50',
    textColor: 'text-zinc',
  },
};

// ============================================================================
// DISPLAY ITEM CARD
// ============================================================================

function DisplayItemCard({ item }: { item: DisplayItem }) {
  const config = CATEGORY_CONFIG[item.displayCategory];

  return (
    <div
      className={`
        group relative rounded-xl border border-mist bg-pure p-4
        shadow-card transition-all duration-200
        hover:shadow-card-lifted hover:-translate-y-0.5
      `}
    >
      {/* Category indicator + time */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-block w-2 h-2 rounded-full ${config.dotColor}`} />
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.bgColor} ${config.textColor}`}
        >
          {config.label}
        </span>
        {item.time && (
          <span className="text-xs text-zinc ml-auto">
            {item.time}
            {item.endTime ? ` \u2013 ${item.endTime}` : ''}
          </span>
        )}
        {item.isOverdue && (
          <span className="text-xs font-medium text-red-600 ml-auto">
            Overdue
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-medium text-ink text-sm leading-snug mb-1">
        {item.isBirthday && item.birthdayPersonName
          ? `${item.birthdayPersonName}'s Birthday${item.birthdayAge ? ` (${item.birthdayAge})` : ''}`
          : item.title}
      </h3>

      {/* Context line */}
      {item.contextLine && (
        <p className="text-xs text-zinc leading-relaxed mb-2">
          {item.contextLine}
        </p>
      )}

      {/* Location */}
      {item.location && (
        <p className="text-xs text-zinc flex items-center gap-1 mb-2">
          <span aria-hidden="true">&#x1F4CD;</span>
          {item.location}
        </p>
      )}

      {/* whyAttend — full recommendation context */}
      {item.displayCategory === 'recommendation' &&
        item.whyAttend &&
        item.whyAttend !== item.contextLine && (
          <p className="text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-2 mb-2 leading-relaxed">
            {item.whyAttend}
          </p>
        )}

      {/* Calendar color stripe (schedule items) — inset to avoid rounded corner clip */}
      {item.calendarColor && (
        <div
          className="absolute left-1 top-3 bottom-3 w-1 rounded-full"
          style={{ backgroundColor: item.calendarColor }}
        />
      )}

      {/* Action buttons */}
      {item.actions.length > 0 && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-mist/60">
          {item.actions.map((action, idx) => (
            <button
              key={`${action.action}-${idx}`}
              className={`
                text-xs font-medium px-3 py-1.5 rounded-lg transition-colors
                ${
                  action.type === 'primary'
                    ? 'bg-blue text-white hover:bg-blue/90'
                    : action.type === 'secondary'
                      ? 'bg-cloud text-ink hover:bg-cloud/80'
                      : 'text-zinc hover:text-ink'
                }
              `}
              onClick={() => {
                if (action.url && (action.action === 'open-external' || action.action === 'join-meeting')) {
                  window.open(action.url, '_blank', 'noopener');
                }
                // Other action handlers will be wired in future prompts
                console.log(`🎯 [CalendarPage] Action: ${action.action}`, {
                  itemId: item.id,
                  url: action.url,
                });
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TIME GROUP SECTION
// ============================================================================

function TimeGroupSection({ group }: { group: TimeGroup }) {
  return (
    <section className="mb-8">
      <h2 className="font-body text-lg font-bold text-ink mb-4 sticky top-0 bg-white/95 backdrop-blur-sm py-2 z-10">
        {group.label}
        <span className="text-zinc font-body text-sm font-normal ml-2">
          {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
        </span>
      </h2>
      <div className="space-y-3">
        {group.items.map((item) => (
          <DisplayItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyTimeline() {
  return (
    <div className="text-center py-16">
      <p className="font-body text-2xl text-ink mb-2">
        Nothing on the horizon
      </p>
      <p className="text-zinc text-body">
        Connect your calendar and email to see what&apos;s happening.
      </p>
    </div>
  );
}

// ============================================================================
// LOADING STATE
// ============================================================================

function TimelineLoading() {
  return (
    <div className="space-y-8">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <div className="h-6 w-24 bg-cloud rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2].map((j) => (
              <div
                key={j}
                className="rounded-xl border border-mist bg-pure p-4"
              >
                <div className="h-4 w-32 bg-cloud rounded animate-pulse mb-2" />
                <div className="h-4 w-48 bg-cloud/60 rounded animate-pulse mb-2" />
                <div className="h-3 w-64 bg-cloud/40 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// STATS BAR
// ============================================================================

function StatsBar({ items }: { items: DisplayItem[] }) {
  const counts = useMemo(() => {
    const result = { schedule: 0, recommendation: 0, date: 0, 'low-signal': 0 };
    for (const item of items) {
      result[item.displayCategory]++;
    }
    return result;
  }, [items]);

  const total = items.length;
  if (total === 0) return null;

  return (
    <div className="flex flex-wrap gap-4 mb-8">
      {counts.schedule > 0 && (
        <Stat label="On your calendar" count={counts.schedule} config={CATEGORY_CONFIG.schedule} />
      )}
      {counts.recommendation > 0 && (
        <Stat label="Recommended" count={counts.recommendation} config={CATEGORY_CONFIG.recommendation} />
      )}
      {counts.date > 0 && (
        <Stat label="Dates & deadlines" count={counts.date} config={CATEGORY_CONFIG.date} />
      )}
      {counts['low-signal'] > 0 && (
        <Stat label="Maybe" count={counts['low-signal']} config={CATEGORY_CONFIG['low-signal']} />
      )}
    </div>
  );
}

function Stat({
  label,
  count,
  config,
}: {
  label: string;
  count: number;
  config: (typeof CATEGORY_CONFIG)[DisplayCategory];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
      <span className="text-sm text-ink font-medium">{count}</span>
      <span className="text-sm text-zinc">{label}</span>
    </div>
  );
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

/**
 * "What's Happening" — unified calendar timeline.
 * No tabs. Four-category display model with time-period grouping.
 */
export default function CalendarPage() {
  const { events: calendarEvents, isLoading: calLoading } = useCalendarEvents();
  const { events: emailEvents, isLoading: emailLoading } = useEmailEvents();
  const [showMonthView, setShowMonthView] = useState(false);

  const isLoading = calLoading || emailLoading;

  // Build the timeline: raw data → DisplayItem[] → TimeGroup[]
  const { groups, allItems } = useMemo(() => {
    if (isLoading) return { groups: [], allItems: [] };

    const timeGroups = buildTimeline(calendarEvents, emailEvents);
    const all = timeGroups.flatMap((g) => g.items);

    console.log(`📅 [CalendarPage] Built timeline: ${all.length} items in ${timeGroups.length} groups`);

    return { groups: timeGroups, allItems: all };
  }, [calendarEvents, emailEvents, isLoading]);

  return (
    <Container className="py-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="font-body text-h1 text-ink">
            What&apos;s Happening
          </h1>
          <button
            onClick={() => setShowMonthView(!showMonthView)}
            className="text-sm font-medium text-zinc hover:text-ink transition-colors px-4 py-2 rounded-lg border border-mist hover:border-charcoal/20"
          >
            {showMonthView ? 'Timeline View' : 'Month View'}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {!isLoading && <StatsBar items={allItems} />}

      {/* Month view placeholder — CalendarGrid goes here in a future prompt */}
      {showMonthView ? (
        <div className="text-center py-16 text-zinc">
          <p className="font-body text-xl text-ink mb-2">
            Month View
          </p>
          <p className="text-sm">
            CalendarGrid component will be rendered here.
          </p>
        </div>
      ) : (
        /* Timeline view */
        <>
          {isLoading ? (
            <TimelineLoading />
          ) : groups.length === 0 ? (
            <EmptyTimeline />
          ) : (
            <div>
              {groups.map((group) => (
                <TimeGroupSection key={group.label} group={group} />
              ))}
            </div>
          )}
        </>
      )}
    </Container>
  );
}
