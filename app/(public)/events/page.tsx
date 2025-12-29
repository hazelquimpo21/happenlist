// ============================================================================
// 📅 HAPPENLIST - Events Listing Page
// ============================================================================
// Displays all upcoming events with filtering and pagination.
// Uses Server Components with Suspense for loading states.
// ============================================================================

import { Suspense } from 'react'
import Link from 'next/link'
import { Calendar, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui'
import { EventCard } from '@/components/events/event-card'
import { EventCardSkeleton } from '@/components/events/event-card-skeleton'
import { CategoryBadge } from '@/components/categories/category-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { getEvents } from '@/lib/queries/events'
import { getCategories } from '@/lib/queries/categories'
import { ROUTES, DEFAULT_PAGE_SIZE, DATE_FILTER_OPTIONS } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'
import type { Metadata } from 'next'

// ============================================================================
// 📋 Metadata
// ============================================================================

export const metadata: Metadata = {
  title: 'Events',
  description:
    'Browse upcoming events in Milwaukee. Find concerts, festivals, family activities, and more.',
}

// ============================================================================
// 📋 Page Props
// ============================================================================

interface EventsPageProps {
  searchParams: Promise<{
    category?: string
    date?: string
    page?: string
    q?: string
  }>
}

// ============================================================================
// 📅 Events Page Component
// ============================================================================

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams
  const currentPage = Number(params.page) || 1
  const categoryFilter = params.category
  const dateFilter = params.date
  const searchQuery = params.q

  logger.info('📅 Rendering events page', {
    page: currentPage,
    category: categoryFilter,
    date: dateFilter,
    search: searchQuery,
  })

  return (
    <div className="py-8 md:py-12">
      <div className="page-container">
        {/* ========================================
            📋 Page Header
            ======================================== */}
        <div className="mb-8">
          <h1 className="text-heading-lg font-bold text-text-primary">
            Upcoming Events
          </h1>
          <p className="text-body-md text-text-secondary mt-2">
            Discover what's happening in Milwaukee
          </p>
        </div>

        {/* ========================================
            🔍 Filters
            ======================================== */}
        <Suspense fallback={<FiltersSkeleton />}>
          <FiltersSection
            categoryFilter={categoryFilter}
            dateFilter={dateFilter}
          />
        </Suspense>

        {/* ========================================
            📅 Events Grid
            ======================================== */}
        <Suspense fallback={<EventsGridSkeleton />}>
          <EventsGrid
            page={currentPage}
            category={categoryFilter}
            date={dateFilter}
            search={searchQuery}
          />
        </Suspense>
      </div>
    </div>
  )
}

// ============================================================================
// 🔍 Filters Section
// ============================================================================

async function FiltersSection({
  categoryFilter,
  dateFilter,
}: {
  categoryFilter?: string
  dateFilter?: string
}) {
  const categories = await getCategories()

  return (
    <div className="mb-8 space-y-4">
      {/* Date Filter Pills */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={ROUTES.events}
          className={`px-4 py-2 rounded-full text-body-sm font-medium transition-colors ${
            !dateFilter
              ? 'bg-primary text-white'
              : 'bg-surface text-text-secondary hover:bg-background'
          }`}
        >
          All Dates
        </Link>
        {DATE_FILTER_OPTIONS.map((option) => (
          <Link
            key={option.value}
            href={`${ROUTES.events}?date=${option.value}${categoryFilter ? `&category=${categoryFilter}` : ''}`}
            className={`px-4 py-2 rounded-full text-body-sm font-medium transition-colors ${
              dateFilter === option.value
                ? 'bg-primary text-white'
                : 'bg-surface text-text-secondary hover:bg-background'
            }`}
          >
            {option.label}
          </Link>
        ))}
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`${ROUTES.events}${dateFilter ? `?date=${dateFilter}` : ''}`}
          className={`px-3 py-1.5 rounded-full text-caption font-medium transition-colors ${
            !categoryFilter
              ? 'bg-secondary text-white'
              : 'bg-surface text-text-secondary hover:bg-background'
          }`}
        >
          All Categories
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`${ROUTES.events}?category=${category.slug}${dateFilter ? `&date=${dateFilter}` : ''}`}
            className={categoryFilter === category.slug ? 'ring-2 ring-primary ring-offset-2 rounded-full' : ''}
          >
            <CategoryBadge category={category} />
          </Link>
        ))}
      </div>

      {/* Active Filters Display */}
      {(categoryFilter || dateFilter) && (
        <div className="flex items-center gap-2 text-body-sm text-text-secondary">
          <Filter className="w-4 h-4" />
          <span>Showing filtered results</span>
          <Link
            href={ROUTES.events}
            className="text-primary hover:underline ml-2"
          >
            Clear all filters
          </Link>
        </div>
      )}
    </div>
  )
}

function FiltersSkeleton() {
  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-10 w-24 bg-surface rounded-full animate-pulse"
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 bg-surface rounded-full animate-pulse"
          />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// 📅 Events Grid
// ============================================================================

async function EventsGrid({
  page,
  category,
  date,
  search,
}: {
  page: number
  category?: string
  date?: string
  search?: string
}) {
  const { events, total, totalPages } = await getEvents({
    page,
    limit: DEFAULT_PAGE_SIZE,
    category,
    dateFilter: date,
    search,
  })

  // No events found
  if (events.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="w-12 h-12" />}
        title="No events found"
        description={
          category || date || search
            ? 'Try adjusting your filters or search terms.'
            : "There are no upcoming events at the moment. Check back soon!"
        }
        action={
          (category || date || search) && (
            <Button asChild variant="secondary">
              <Link href={ROUTES.events}>Clear Filters</Link>
            </Button>
          )
        }
      />
    )
  }

  return (
    <div>
      {/* Results Count */}
      <p className="text-body-sm text-text-secondary mb-6">
        Showing {events.length} of {total} events
        {page > 1 && ` (page ${page} of ${totalPages})`}
      </p>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          category={category}
          date={date}
          search={search}
        />
      )}
    </div>
  )
}

function EventsGridSkeleton() {
  return (
    <div>
      <div className="h-5 w-32 bg-surface rounded animate-pulse mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// 📄 Pagination Component
// ============================================================================

function Pagination({
  currentPage,
  totalPages,
  category,
  date,
  search,
}: {
  currentPage: number
  totalPages: number
  category?: string
  date?: string
  search?: string
}) {
  // Build query string helper
  const buildUrl = (page: number) => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', String(page))
    if (category) params.set('category', category)
    if (date) params.set('date', date)
    if (search) params.set('q', search)
    const queryString = params.toString()
    return `${ROUTES.events}${queryString ? `?${queryString}` : ''}`
  }

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push('ellipsis')
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis')
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <nav
      className="mt-12 flex items-center justify-center gap-2"
      aria-label="Pagination"
    >
      {/* Previous Button */}
      <Button
        asChild={currentPage > 1}
        variant="secondary"
        size="icon"
        disabled={currentPage <= 1}
      >
        {currentPage > 1 ? (
          <Link href={buildUrl(currentPage - 1)}>
            <ChevronLeft className="w-4 h-4" />
            <span className="sr-only">Previous page</span>
          </Link>
        ) : (
          <span>
            <ChevronLeft className="w-4 h-4" />
            <span className="sr-only">Previous page</span>
          </span>
        )}
      </Button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((pageNum, index) =>
          pageNum === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-3 py-2 text-text-secondary"
            >
              ...
            </span>
          ) : (
            <Button
              key={pageNum}
              asChild={pageNum !== currentPage}
              variant={pageNum === currentPage ? 'primary' : 'ghost'}
              size="sm"
            >
              {pageNum === currentPage ? (
                <span>{pageNum}</span>
              ) : (
                <Link href={buildUrl(pageNum)}>{pageNum}</Link>
              )}
            </Button>
          )
        )}
      </div>

      {/* Next Button */}
      <Button
        asChild={currentPage < totalPages}
        variant="secondary"
        size="icon"
        disabled={currentPage >= totalPages}
      >
        {currentPage < totalPages ? (
          <Link href={buildUrl(currentPage + 1)}>
            <ChevronRight className="w-4 h-4" />
            <span className="sr-only">Next page</span>
          </Link>
        ) : (
          <span>
            <ChevronRight className="w-4 h-4" />
            <span className="sr-only">Next page</span>
          </span>
        )}
      </Button>
    </nav>
  )
}
