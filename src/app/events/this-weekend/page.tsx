/**
 * THIS WEEKEND EVENTS PAGE
 * ========================
 * Events happening this weekend (Friday - Sunday).
 */

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { Container, Breadcrumbs } from '@/components/layout';
import { EventGrid } from '@/components/events';
import { getEvents } from '@/data/events';
import { getThisWeekendRange } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'This Weekend',
  description: 'Find things to do this weekend. Browse events happening Friday through Sunday.',
};

/**
 * This weekend's events page.
 */
export default async function WeekendEventsPage() {
  console.log('🗓️ [WeekendEventsPage] Rendering weekend events');

  const weekendRange = getThisWeekendRange();

  const { events, total } = await getEvents({
    dateRange: weekendRange,
    limit: 50, // Show more for weekend view
  });

  console.log(`✅ [WeekendEventsPage] Found ${events.length} events this weekend`);

  return (
    <Container className="py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/events' },
          { label: 'This Weekend' },
        ]}
        className="mb-6"
      />

      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-h1 text-charcoal">This Weekend</h1>
        <p className="text-stone text-body mt-2">
          {total} {total === 1 ? 'event' : 'events'} happening this weekend
        </p>
      </div>

      {/* Events grid */}
      <EventGrid
        events={events}
        columns={4}
        emptyTitle="Nothing this weekend"
        emptyMessage="Check back soon for upcoming weekend events!"
      />
    </Container>
  );
}
