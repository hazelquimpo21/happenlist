/**
 * SERIES INDEX PAGE
 * =================
 * Lists all series (classes, camps, workshops, recurring events).
 *
 * URL: /series
 * Filters: ?type=class, ?category=music, ?free=true
 */

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Container, Breadcrumbs } from '@/components/layout';
import { SeriesGrid, SeriesGridSkeleton } from '@/components/series';
import { SeriesFilters } from './series-filters';
import { getSeries } from '@/data/series';
import { getCategories } from '@/data/categories';
import type { SeriesType, SeriesSortOption } from '@/lib/supabase/types';
import { SERIES_TYPE_INFO } from '@/types';

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: 'Classes & Series',
  description:
    'Discover classes, workshops, camps, and recurring events. Multi-session learning opportunities and regular community gatherings.',
};

// ============================================================================
// PAGE PROPS
// ============================================================================

interface SeriesPageProps {
  searchParams: Promise<{
    page?: string;
    type?: string;
    category?: string;
    free?: string;
    sort?: string;
    q?: string;
  }>;
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

/**
 * Series listing page with filters.
 *
 * @example URLs
 * /series                     - All series
 * /series?type=class          - Only classes
 * /series?category=music      - Music series
 * /series?free=true           - Free series
 */
export default async function SeriesPage({ searchParams }: SeriesPageProps) {
  const params = await searchParams;

  console.log('📚 [SeriesPage] Rendering series page with params:', params);

  // Parse search params
  const page = parseInt(params.page || '1', 10);
  const type = params.type as SeriesType | undefined;
  const categorySlug = params.category;
  const isFree = params.free === 'true';
  const orderBy = (params.sort as SeriesSortOption) || 'start-date-asc';
  const search = params.q;

  // Fetch data in parallel
  const [seriesResult, categories] = await Promise.all([
    getSeries({
      search,
      type,
      categorySlug,
      isFree,
      orderBy,
      page,
      limit: 12,
    }),
    getCategories(),
  ]);

  const { series, total, hasMore } = seriesResult;

  console.log(`✅ [SeriesPage] Found ${series.length} series (total: ${total})`);

  // Build page title based on filters
  const pageTitle = type
    ? SERIES_TYPE_INFO[type]?.labelPlural || 'Series'
    : 'Classes & Series';

  return (
    <Container className="py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Classes & Series' },
          ...(type ? [{ label: SERIES_TYPE_INFO[type]?.labelPlural || type }] : []),
        ]}
        className="mb-6"
      />

      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-h1 text-charcoal">{pageTitle}</h1>
        <p className="text-stone text-body mt-2">
          {total} {total === 1 ? 'series' : 'series'} available
        </p>
      </div>

      {/* Filters */}
      <Suspense fallback={null}>
        <SeriesFilters
          categories={categories}
          currentType={type}
          currentCategory={categorySlug}
          currentSort={orderBy}
          isFree={isFree}
          searchQuery={search}
          className="mb-8"
        />
      </Suspense>

      {/* Series grid */}
      <Suspense fallback={<SeriesGridSkeleton count={12} />}>
        <SeriesGrid
          series={series}
          emptyMessage={
            search
              ? `No series found for "${search}"`
              : 'No series found. Check back soon!'
          }
          showCategory
        />
      </Suspense>

      {/* Pagination */}
      {total > 12 && (
        <nav className="mt-12 flex justify-center gap-2" aria-label="Pagination">
          {page > 1 && (
            <PaginationLink
              href={buildPageUrl(params, page - 1)}
              label="Previous"
            />
          )}
          <span className="px-4 py-2 text-stone">
            Page {page} of {Math.ceil(total / 12)}
          </span>
          {hasMore && (
            <PaginationLink
              href={buildPageUrl(params, page + 1)}
              label="Next"
            />
          )}
        </nav>
      )}
    </Container>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function PaginationLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="px-4 py-2 rounded-md bg-sand text-charcoal hover:bg-coral-light transition-colors"
    >
      {label}
    </a>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Build URL with page parameter, preserving other filters.
 */
function buildPageUrl(
  params: Record<string, string | undefined>,
  page: number
): string {
  const searchParams = new URLSearchParams();

  // Copy existing params
  Object.entries(params).forEach(([key, value]) => {
    if (value && key !== 'page') {
      searchParams.set(key, value);
    }
  });

  // Set page
  if (page > 1) {
    searchParams.set('page', String(page));
  }

  const queryString = searchParams.toString();
  return `/series${queryString ? `?${queryString}` : ''}`;
}
