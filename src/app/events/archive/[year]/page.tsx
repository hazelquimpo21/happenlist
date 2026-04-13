/**
 * YEAR ARCHIVE PAGE
 * =================
 * Shows all past events for a given year, grouped by month.
 * Provides month-level links for drilling down.
 *
 * URL: /events/archive/[year]
 * Breadcrumbs: Events → Archive → 2026
 *
 * Does NOT use collapseSeries — past events are shown individually
 * per architectural decision #11 in docs/filter-roadmap.md.
 *
 * Cross-file coupling:
 *   - ROUTES.eventsYear, ROUTES.eventsMonth in src/lib/constants/routes.ts
 *   - getEvents in src/data/events/get-events.ts
 *
 * @module app/events/archive/[year]/page
 */

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Container, Breadcrumbs } from '@/components/layout';
import { EventGrid } from '@/components/events';
import { Button } from '@/components/ui';
import { getEvents } from '@/data/events';
import { ROUTES } from '@/lib/constants';

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
] as const;

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

interface YearArchivePageProps {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: YearArchivePageProps): Promise<Metadata> {
  const { year } = await params;
  return {
    title: `Past Events — ${year}`,
    description: `Browse past events from ${year} in Milwaukee. Concerts, festivals, classes, and more.`,
  };
}

export default async function YearArchivePage({ params }: YearArchivePageProps) {
  const { year: yearParam } = await params;

  const year = parseInt(yearParam, 10);
  if (isNaN(year) || year < 2020 || year > 2100) {
    console.log(`[archive:year] invalid year: ${yearParam}`);
    notFound();
  }

  console.log(`[archive:year] rendering year=${year}`);

  // Fetch all events for this year (up to 500 — archive pages are low-traffic)
  const dateRange = {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  };

  const { events, total } = await getEvents({
    dateRange,
    includePast: true,
    orderBy: 'date-asc',
    limit: 500,
    page: 1,
  });

  console.log(`[archive:year] found ${total} events for ${year}`);

  // Group events by month for the summary grid
  const eventsByMonth = new Map<number, number>();
  for (const event of events) {
    const month = new Date(event.instance_date).getMonth(); // 0-indexed
    eventsByMonth.set(month, (eventsByMonth.get(month) || 0) + 1);
  }

  return (
    <Container className="py-8">
      <Breadcrumbs
        items={[
          { label: 'Events', href: ROUTES.events },
          { label: 'Archive', href: ROUTES.events },
          { label: String(year) },
        ]}
        className="mb-6"
      />

      {/* Header with year navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="font-body text-h1 text-ink">
            Past Events — {year}
          </h1>
          <p className="text-zinc text-body mt-2">
            {total} {total === 1 ? 'event' : 'events'} from {year}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            href={ROUTES.eventsYear(year - 1)}
            variant="secondary"
            size="sm"
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            {year - 1}
          </Button>
          <Button
            href={ROUTES.eventsYear(year + 1)}
            variant="secondary"
            size="sm"
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            {year + 1}
          </Button>
        </div>
      </div>

      {/* Month grid — links to individual month pages */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-10">
        {MONTH_NAMES.map((slug, idx) => {
          const count = eventsByMonth.get(idx) || 0;
          const hasEvents = count > 0;

          return hasEvents ? (
            <Link
              key={slug}
              href={ROUTES.eventsMonth(year, slug)}
              className="bg-cloud hover:bg-mist border border-mist rounded-lg px-4 py-3 text-center transition-colors"
            >
              <div className="font-semibold text-ink text-body-sm">{MONTH_LABELS[idx]}</div>
              <div className="text-zinc text-caption mt-1">
                {count} {count === 1 ? 'event' : 'events'}
              </div>
            </Link>
          ) : (
            <div
              key={slug}
              className="bg-white border border-mist/50 rounded-lg px-4 py-3 text-center opacity-50"
            >
              <div className="font-semibold text-silver text-body-sm">{MONTH_LABELS[idx]}</div>
              <div className="text-silver text-caption mt-1">—</div>
            </div>
          );
        })}
      </div>

      {/* All events for the year */}
      <EventGrid
        events={events}
        columns={4}
        emptyTitle={`No Events in ${year}`}
        emptyMessage={`There are no events recorded for ${year}. Try a different year.`}
      />
    </Container>
  );
}
