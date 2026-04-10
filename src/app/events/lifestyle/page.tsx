/**
 * LIFESTYLE EVENTS PAGE
 * =====================
 * Recurring lifestyle events: yoga, trivia, happy hour, brunch, exhibits, etc.
 *
 * These events are excluded from the main feed by default to prevent clutter,
 * but users can discover them here.
 */

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { Container, Breadcrumbs } from '@/components/layout';
import { EventGrid } from '@/components/events';
import { Button } from '@/components/ui';
import { getEvents } from '@/data/events';
import { ROUTES } from '@/lib/constants';

interface LifestyleEventsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export const metadata: Metadata = {
  title: 'Things to Do Anytime',
  description:
    'Discover ongoing and recurring events in Milwaukee — yoga classes, trivia nights, happy hours, brunch specials, museum exhibits, and more.',
};

/**
 * Lifestyle events page — shows only lifestyle/ongoing/exhibit series events.
 */
export default async function LifestyleEventsPage({
  searchParams,
}: LifestyleEventsPageProps) {
  const { page: pageParam } = await searchParams;

  console.log('✨ [LifestyleEventsPage] Rendering lifestyle events');

  const page = parseInt(pageParam || '1', 10);
  const limit = 24;

  const { events, total } = await getEvents({
    includeLifestyle: 'only',
    collapseSeries: true,
    page,
    limit,
  });

  const totalPages = Math.ceil(total / limit);

  console.log(
    `✅ [LifestyleEventsPage] Found ${total} lifestyle events`
  );

  return (
    <Container className="py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Events', href: ROUTES.events },
          { label: 'Things to Do Anytime' },
        ]}
        className="mb-6"
      />

      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-body text-h1 text-ink">
          Things to Do Anytime
        </h1>
        <p className="text-zinc text-body mt-2 max-w-2xl">
          Recurring events, ongoing exhibits, and everyday happenings — yoga classes,
          trivia nights, happy hours, brunch specials, and more. These are always
          around, so come whenever you&apos;re ready.
        </p>
        <p className="text-zinc text-body-sm mt-2">
          {total} {total === 1 ? 'event' : 'events'} found
        </p>
      </div>

      {/* Events grid */}
      <EventGrid
        events={events}
        columns={4}
        emptyTitle="No Lifestyle Events Yet"
        emptyMessage="We're working on adding recurring events like yoga classes, trivia nights, and happy hours. Check back soon!"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex justify-center items-center gap-4">
          {page > 1 && (
            <Button
              href={`${ROUTES.eventsLifestyle}?page=${page - 1}`}
              variant="secondary"
              size="sm"
            >
              Previous
            </Button>
          )}
          <span className="text-zinc text-body-sm">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Button
              href={`${ROUTES.eventsLifestyle}?page=${page + 1}`}
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
