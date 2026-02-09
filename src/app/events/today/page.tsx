/**
 * TODAY'S EVENTS PAGE
 * ===================
 * Events happening today.
 */

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { Container, Breadcrumbs } from '@/components/layout';
import { EventGrid } from '@/components/events';
import { getEvents } from '@/data/events';
import { getTodayRange } from '@/lib/utils';

export const metadata: Metadata = {
  title: "Today's Events",
  description: "Find things to do today. Browse events happening right now in your area.",
};

/**
 * Today's events page.
 */
export default async function TodayEventsPage() {
  console.log("📅 [TodayEventsPage] Rendering today's events");

  const todayRange = getTodayRange();

  const { events, total } = await getEvents({
    dateRange: todayRange,
    limit: 50, // Show more for single-day view
  });

  console.log(`✅ [TodayEventsPage] Found ${events.length} events today`);

  return (
    <Container className="py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/events' },
          { label: 'Today' },
        ]}
        className="mb-6"
      />

      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-h1 text-charcoal">
          Today&apos;s Events
        </h1>
        <p className="text-stone text-body mt-2">
          {total} {total === 1 ? 'event' : 'events'} happening today
        </p>
      </div>

      {/* Events grid */}
      <EventGrid
        events={events}
        columns={4}
        emptyTitle="Nothing happening today"
        emptyMessage="Check back soon or browse upcoming events!"
      />
    </Container>
  );
}
