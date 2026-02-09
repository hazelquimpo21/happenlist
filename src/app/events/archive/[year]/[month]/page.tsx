/**
 * MONTH EVENTS PAGE
 * =================
 * Events filtered by month with URLs like /events/2025/january
 */

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Container, Breadcrumbs } from '@/components/layout';
import { EventGrid } from '@/components/events';
import { Button } from '@/components/ui';
import { getEvents } from '@/data/events';
import { getMonthRange, parseMonthName } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

/**
 * Valid months for URL routing.
 */
const MONTH_NAMES = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const;

/**
 * Get display name for a month.
 */
function getMonthDisplayName(monthSlug: string): string {
  return monthSlug.charAt(0).toUpperCase() + monthSlug.slice(1);
}

interface MonthEventsPageProps {
  params: Promise<{ year: string; month: string }>;
  searchParams: Promise<{ page?: string }>;
}

/**
 * Generate metadata for the month page.
 */
export async function generateMetadata({
  params,
}: MonthEventsPageProps): Promise<Metadata> {
  const { year, month } = await params;
  const monthName = getMonthDisplayName(month);

  return {
    title: `${monthName} ${year} Events`,
    description: `Browse events happening in ${monthName} ${year}. Find concerts, festivals, classes, and more.`,
  };
}

/**
 * Month events page - shows events for a specific month.
 */
export default async function MonthEventsPage({
  params,
  searchParams,
}: MonthEventsPageProps) {
  const { year: yearParam, month: monthParam } = await params;
  const { page: pageParam } = await searchParams;

  console.log(`📅 [MonthEventsPage] Rendering month: ${monthParam} ${yearParam}`);

  // Validate year
  const year = parseInt(yearParam, 10);
  if (isNaN(year) || year < 2020 || year > 2100) {
    console.log(`⚠️ [MonthEventsPage] Invalid year: ${yearParam}`);
    notFound();
  }

  // Validate month
  const monthLower = monthParam.toLowerCase();
  if (!MONTH_NAMES.includes(monthLower as typeof MONTH_NAMES[number])) {
    console.log(`⚠️ [MonthEventsPage] Invalid month: ${monthParam}`);
    notFound();
  }

  // Parse month number and get date range
  const monthNumber = parseMonthName(monthLower);
  const dateRange = getMonthRange(year, monthNumber);
  const monthName = getMonthDisplayName(monthLower);

  // Parse pagination
  const page = parseInt(pageParam || '1', 10);
  const limit = 24;

  // Fetch events for this month
  const { events, total } = await getEvents({
    dateRange,
    page,
    limit,
  });

  const totalPages = Math.ceil(total / limit);

  console.log(
    `✅ [MonthEventsPage] Found ${total} events for ${monthName} ${year}`
  );

  // Calculate previous and next months
  const prevMonth = monthNumber === 1 ? 12 : monthNumber - 1;
  const prevYear = monthNumber === 1 ? year - 1 : year;
  const prevMonthName = MONTH_NAMES[prevMonth - 1];

  const nextMonth = monthNumber === 12 ? 1 : monthNumber + 1;
  const nextYear = monthNumber === 12 ? year + 1 : year;
  const nextMonthName = MONTH_NAMES[nextMonth - 1];

  return (
    <Container className="py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Events', href: ROUTES.events },
          { label: `${monthName} ${year}` },
        ]}
        className="mb-6"
      />

      {/* Page header with month navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display text-h1 text-charcoal">
            {monthName} {year}
          </h1>
          <p className="text-stone text-body mt-2">
            {total} {total === 1 ? 'event' : 'events'} happening this month
          </p>
        </div>

        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <Button
            href={ROUTES.eventsMonth(prevYear, prevMonthName)}
            variant="secondary"
            size="sm"
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            {getMonthDisplayName(prevMonthName)}
          </Button>
          <Button
            href={ROUTES.eventsMonth(nextYear, nextMonthName)}
            variant="secondary"
            size="sm"
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            {getMonthDisplayName(nextMonthName)}
          </Button>
        </div>
      </div>

      {/* Quick links to nearby months */}
      <div className="flex flex-wrap gap-2 mb-8">
        {MONTH_NAMES.map((m, idx) => {
          const isCurrentMonth = m === monthLower;
          return (
            <Button
              key={m}
              href={ROUTES.eventsMonth(year, m)}
              variant={isCurrentMonth ? 'primary' : 'secondary'}
              size="sm"
              className="rounded-full"
            >
              {m.slice(0, 3).toUpperCase()}
            </Button>
          );
        })}
      </div>

      {/* Events grid */}
      <EventGrid
        events={events}
        columns={4}
        emptyTitle={`No Events in ${monthName}`}
        emptyMessage={`There are no events scheduled for ${monthName} ${year}. Check out other months or browse all events.`}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex justify-center items-center gap-4">
          {page > 1 && (
            <Button
              href={`${ROUTES.eventsMonth(year, monthLower)}?page=${page - 1}`}
              variant="secondary"
              size="sm"
            >
              Previous
            </Button>
          )}
          <span className="text-stone text-body-sm">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Button
              href={`${ROUTES.eventsMonth(year, monthLower)}?page=${page + 1}`}
              variant="secondary"
              size="sm"
            >
              Next
            </Button>
          )}
        </div>
      )}
    </Container>
  );
}
