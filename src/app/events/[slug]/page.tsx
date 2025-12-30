/**
 * CATEGORY EVENTS PAGE
 * ====================
 * Events filtered by category with clean URLs like /events/music
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container, Breadcrumbs } from '@/components/layout';
import { EventGrid } from '@/components/events';
import { Button } from '@/components/ui';
import { getEvents } from '@/data/events';
import { getCategories, getCategoryBySlug } from '@/data/categories';
import { ROUTES } from '@/lib/constants';

interface CategoryEventsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

/**
 * Generate metadata for the category page.
 */
export async function generateMetadata({
  params,
}: CategoryEventsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return { title: 'Category Not Found' };
  }

  return {
    title: `${category.name} Events`,
    description: `Browse ${category.name.toLowerCase()} events in your area. ${category.description || ''}`.trim(),
  };
}

/**
 * Category events page - shows events for a specific category.
 */
export default async function CategoryEventsPage({
  params,
  searchParams,
}: CategoryEventsPageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;

  console.log(`🏷️ [CategoryEventsPage] Rendering category: ${slug}`);

  // Fetch the category
  const category = await getCategoryBySlug(slug);

  // If category doesn't exist, show 404
  if (!category) {
    console.log(`⚠️ [CategoryEventsPage] Category not found: ${slug}`);
    notFound();
  }

  // Parse pagination
  const page = parseInt(pageParam || '1', 10);
  const limit = 24;

  // Fetch events for this category
  const [{ events, total }, allCategories] = await Promise.all([
    getEvents({
      categorySlug: slug,
      page,
      limit,
    }),
    getCategories(),
  ]);

  const totalPages = Math.ceil(total / limit);

  console.log(
    `✅ [CategoryEventsPage] Found ${total} events for category: ${category.name}`
  );

  return (
    <Container className="py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Events', href: ROUTES.events },
          { label: category.name },
        ]}
        className="mb-6"
      />

      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-h1 text-charcoal">
          {category.name} Events
        </h1>
        {category.description && (
          <p className="text-stone text-body mt-2">{category.description}</p>
        )}
        <p className="text-stone text-body-sm mt-2">
          {total} {total === 1 ? 'event' : 'events'} found
        </p>
      </div>

      {/* Category pills for switching */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Button
          href={ROUTES.events}
          variant="secondary"
          size="sm"
          className="rounded-full"
        >
          All
        </Button>
        {allCategories.slice(0, 8).map((cat) => (
          <Button
            key={cat.id}
            href={ROUTES.eventsCategory(cat.slug)}
            variant={cat.slug === slug ? 'primary' : 'secondary'}
            size="sm"
            className="rounded-full"
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Events grid */}
      <EventGrid
        events={events}
        columns={4}
        emptyTitle={`No ${category.name} Events`}
        emptyMessage={`There are no upcoming ${category.name.toLowerCase()} events right now. Check back soon!`}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex justify-center items-center gap-4">
          {page > 1 && (
            <Button
              href={`${ROUTES.eventsCategory(slug)}?page=${page - 1}`}
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
              href={`${ROUTES.eventsCategory(slug)}?page=${page + 1}`}
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
