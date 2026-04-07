/**
 * EVENTS INDEX PAGE
 * =================
 * Main events listing with filtering and pagination.
 */

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, Breadcrumbs } from '@/components/layout';
import { EventGrid, SectionHeader } from '@/components/events';
import { getEvents } from '@/data/events';
import { getCategories, getCategoryBySlug } from '@/data/categories';
import { GOOD_FOR_TAGS, getGoodForTag } from '@/types';
import { getCategoryColor } from '@/lib/constants/category-colors';

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
    goodFor?: string;
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
  const goodFor = params.goodFor;

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
      goodFor,
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

  // Get good_for tag if filtered
  const goodForTag = goodFor ? getGoodForTag(goodFor) : undefined;

  // Build title
  let title = 'All Events';
  if (categoryName) title = `${categoryName} Events`;
  if (goodForTag) title = `${goodForTag.label} Events`;
  if (isFree) title = 'Free Events';
  if (params.q) title = `Search: "${params.q}"`;

  // Count active filters
  const activeFilterCount =
    (categorySlug ? 1 : 0) + (goodFor ? 1 : 0) + (isFree ? 1 : 0);

  /**
   * Build a filter URL that preserves other active params.
   * Pass null for a key to remove it from the URL.
   */
  function filterUrl(overrides: Record<string, string | null>): string {
    const base: Record<string, string> = {};
    if (categorySlug) base.category = categorySlug;
    if (goodFor) base.goodFor = goodFor;
    if (isFree) base.free = 'true';
    // Apply overrides
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) {
        delete base[k];
      } else {
        base[k] = v;
      }
    }
    const qs = new URLSearchParams(base).toString();
    return qs ? `/events?${qs}` : '/events';
  }

  return (
    <Container className="py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/events' },
          ...(categoryName ? [{ label: categoryName }] : []),
          ...(goodForTag ? [{ label: goodForTag.label }] : []),
        ]}
        className="mb-6"
      />

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display text-h1 text-charcoal">{title}</h1>
          {activeFilterCount > 1 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-coral text-white">
              {activeFilterCount} filters
            </span>
          )}
        </div>
        <p className="text-stone text-body mt-2">
          {total} {total === 1 ? 'event' : 'events'} found
        </p>
      </div>

      {/* Category pills — colored per category identity */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Link
          href={filterUrl({ category: null })}
          className={`px-4 py-2 rounded-full text-body-sm font-medium transition-all ${
            !categorySlug
              ? 'bg-charcoal text-warm-white shadow-sm'
              : 'bg-sand/50 text-charcoal hover:bg-sand border border-sand'
          }`}
        >
          All
        </Link>
        {categories.slice(0, 6).map((cat) => {
          const color = getCategoryColor(cat.slug);
          const isActive = categorySlug === cat.slug;
          return (
            <a
              key={cat.id}
              href={isActive ? filterUrl({ category: null }) : filterUrl({ category: cat.slug })}
              className="px-4 py-2 rounded-full text-body-sm font-medium transition-all border"
              style={
                isActive
                  ? {
                      backgroundColor: color.bg,
                      color: color.text,
                      borderColor: color.bg,
                    }
                  : {
                      backgroundColor: 'transparent',
                      color: color.bg,
                      borderColor: color.accent,
                    }
              }
            >
              {cat.name}
            </a>
          );
        })}
      </div>

      {/* Free toggle pill */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <a
          href={isFree ? filterUrl({ free: null }) : filterUrl({ free: 'true' })}
          className={`px-4 py-2 rounded-full text-body-sm font-semibold transition-all ${
            isFree
              ? 'bg-sage text-white shadow-sm'
              : 'bg-sage/10 text-sage border border-sage/30 hover:bg-sage/20'
          }`}
        >
          {isFree ? 'Free Only' : 'Free'}
        </a>
      </div>

      {/* Good For pills — warm colored per tag */}
      <div className="flex flex-wrap gap-2 mb-8">
        <span className="px-2 py-2 text-body-sm text-stone self-center font-medium">Good for:</span>
        {GOOD_FOR_TAGS.slice(0, 8).map((tag) => {
          const isActive = goodFor === tag.slug;
          return (
            <a
              key={tag.slug}
              href={isActive ? filterUrl({ goodFor: null }) : filterUrl({ goodFor: tag.slug })}
              className={`px-3 py-1.5 rounded-full text-body-sm font-medium transition-all ${
                isActive
                  ? `${tag.color} ring-2 ring-offset-1 ring-current shadow-sm`
                  : `border border-sand text-stone hover:text-charcoal hover:border-charcoal/20`
              }`}
            >
              {tag.label}
            </a>
          );
        })}
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
              href={`/events?page=${page - 1}${categorySlug ? `&category=${categorySlug}` : ''}${goodFor ? `&goodFor=${goodFor}` : ''}`}
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
              href={`/events?page=${page + 1}${categorySlug ? `&category=${categorySlug}` : ''}${goodFor ? `&goodFor=${goodFor}` : ''}`}
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
