/**
 * EVENTS INDEX PAGE
 * =================
 * Main events listing with filtering and pagination.
 */

import type { Metadata } from 'next';
import { Container, Breadcrumbs } from '@/components/layout';
import { EventGrid, SectionHeader } from '@/components/events';
import { getEvents } from '@/data/events';
import { getCategories, getCategoryBySlug } from '@/data/categories';

export const metadata: Metadata = {
  title: 'Events',
  description: 'Browse upcoming events in your area. Find concerts, festivals, classes, and more.',
};

interface EventsPageProps {
  searchParams: Promise<{
    category?: string;
    from?: string;
    to?: string;
    free?: string;
    q?: string;
    page?: string;
  }>;
}

/**
 * Events listing page with filters.
 */
export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;

  console.log('📋 [EventsPage] Rendering events page with params:', params);

  // Parse params
  const page = parseInt(params.page || '1', 10);
  const isFree = params.free === 'true';
  const categorySlug = params.category;

  // Build date range if provided
  const dateRange =
    params.from || params.to
      ? { start: params.from || '', end: params.to }
      : undefined;

  // Fetch events and categories
  const [{ events, total }, categories] = await Promise.all([
    getEvents({
      search: params.q,
      categorySlug,
      dateRange,
      isFree,
      page,
      limit: 24,
    }),
    getCategories(),
  ]);

  // Get category name if filtered
  let categoryName: string | undefined;
  if (categorySlug) {
    const category = await getCategoryBySlug(categorySlug);
    categoryName = category?.name;
  }

  // Build title
  let title = 'All Events';
  if (categoryName) title = `${categoryName} Events`;
  if (isFree) title = 'Free Events';
  if (params.q) title = `Search: "${params.q}"`;

  return (
    <Container className="py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/events' },
          ...(categoryName ? [{ label: categoryName }] : []),
        ]}
        className="mb-6"
      />

      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-h1 text-charcoal">{title}</h1>
        <p className="text-stone text-body mt-2">
          {total} {total === 1 ? 'event' : 'events'} found
        </p>
      </div>

      {/* Category pills for quick filtering */}
      <div className="flex flex-wrap gap-2 mb-8">
        <a
          href="/events"
          className={`px-4 py-2 rounded-full text-body-sm font-medium transition-colors ${
            !categorySlug
              ? 'bg-coral text-warm-white'
              : 'bg-sand text-charcoal hover:bg-coral-light'
          }`}
        >
          All
        </a>
        {categories.slice(0, 6).map((cat) => (
          <a
            key={cat.id}
            href={`/events?category=${cat.slug}`}
            className={`px-4 py-2 rounded-full text-body-sm font-medium transition-colors ${
              categorySlug === cat.slug
                ? 'bg-coral text-warm-white'
                : 'bg-sand text-charcoal hover:bg-coral-light'
            }`}
          >
            {cat.name}
          </a>
        ))}
      </div>

      {/* Events grid */}
      <EventGrid
        events={events}
        columns={4}
        emptyTitle="No events found"
        emptyMessage={
          params.q
            ? `No events match "${params.q}". Try a different search term.`
            : 'Check back soon for upcoming events!'
        }
      />

      {/* Pagination (simple for MVP) */}
      {total > 24 && (
        <div className="mt-12 flex justify-center gap-2">
          {page > 1 && (
            <a
              href={`/events?page=${page - 1}${categorySlug ? `&category=${categorySlug}` : ''}`}
              className="px-4 py-2 rounded-md bg-sand text-charcoal hover:bg-coral-light transition-colors"
            >
              Previous
            </a>
          )}
          <span className="px-4 py-2 text-stone">
            Page {page} of {Math.ceil(total / 24)}
          </span>
          {page * 24 < total && (
            <a
              href={`/events?page=${page + 1}${categorySlug ? `&category=${categorySlug}` : ''}`}
              className="px-4 py-2 rounded-md bg-sand text-charcoal hover:bg-coral-light transition-colors"
            >
              Next
            </a>
          )}
        </div>
      )}
    </Container>
  );
}
