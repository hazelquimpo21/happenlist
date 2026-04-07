/**
 * ADMIN SERIES LISTING PAGE
 * ==========================
 * Browsable list of all series with type/status filters and search.
 * Supports bulk select, delete, and merge via client component.
 */

import Link from 'next/link';
import {
  Repeat,
  Filter,
} from 'lucide-react';
import { AdminHeader, AdminBreadcrumbs } from '@/components/admin';
import { AdminSeriesGrid } from '@/components/admin/admin-series-grid';
import { Button } from '@/components/ui/button';
import { getAdminSeries } from '@/data/admin/get-admin-series';

export const metadata = {
  title: 'All Series',
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const SERIES_TYPES = [
  { value: undefined, label: 'All Types' },
  { value: 'recurring', label: 'Recurring' },
  { value: 'class', label: 'Class' },
  { value: 'camp', label: 'Camp' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'festival', label: 'Festival' },
  { value: 'season', label: 'Season' },
];

const STATUS_TABS = [
  { value: undefined, label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'pending_review', label: 'Pending' },
  { value: 'draft', label: 'Draft' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default async function AdminSeriesPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const page = typeof sp.page === 'string' ? parseInt(sp.page) : 1;
  const status = typeof sp.status === 'string' ? sp.status : undefined;
  const seriesType = typeof sp.type === 'string' ? sp.type : undefined;
  const search = typeof sp.q === 'string' ? sp.q : undefined;
  const orderBy = (typeof sp.orderBy === 'string' ? sp.orderBy : 'created_at') as 'created_at' | 'title' | 'start_date' | 'total_sessions';
  const orderDir = (typeof sp.orderDir === 'string' ? sp.orderDir : 'desc') as 'asc' | 'desc';

  const result = await getAdminSeries({ search, seriesType, status, page, limit: 20, orderBy, orderDir });

  const buildUrl = (params: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams();
    Object.entries({ status, type: seriesType, orderBy, orderDir, q: search, ...params }).forEach(([key, value]) => {
      if (value) newParams.set(key, value);
    });
    const qs = newParams.toString();
    return `/admin/series${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="All Series"
        description={`${result.total} series total`}
      >
        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-sand/50 p-1 rounded-lg mr-auto">
          {STATUS_TABS.map(tab => (
            <Link
              key={tab.value || 'all'}
              href={buildUrl({ status: tab.value, page: undefined })}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                status === tab.value || (!status && !tab.value)
                  ? 'bg-warm-white text-charcoal font-medium shadow-sm'
                  : 'text-stone hover:text-charcoal'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Sort */}
        <Link
          href={buildUrl({ orderBy: orderBy === 'created_at' ? 'title' : orderBy === 'title' ? 'start_date' : 'created_at', page: undefined })}
          className="flex items-center gap-1.5 px-3 py-2 text-sm border border-sand rounded-lg hover:border-coral transition-colors text-stone hover:text-charcoal"
        >
          <Filter className="w-4 h-4" />
          Sort: {orderBy === 'title' ? 'Title' : orderBy === 'start_date' ? 'Start Date' : 'Created'}
        </Link>
      </AdminHeader>

      <div className="p-8">
        <AdminBreadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Series' },
          ]}
        />

        {/* Search */}
        <div className="mb-6">
          <form className="relative max-w-md">
            <input
              type="text"
              name="q"
              defaultValue={search}
              placeholder="Search series..."
              className="w-full px-4 py-2 pl-10 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {status && <input type="hidden" name="status" value={status} />}
            {seriesType && <input type="hidden" name="type" value={seriesType} />}
          </form>
        </div>

        {/* Type filter pills */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs text-stone uppercase tracking-wider font-medium mr-1">Type:</span>
          {SERIES_TYPES.map(t => (
            <Link
              key={t.value || 'all'}
              href={buildUrl({ type: t.value, page: undefined })}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                seriesType === t.value || (!seriesType && !t.value)
                  ? 'bg-coral text-white font-medium'
                  : 'bg-sand/50 text-stone hover:text-charcoal hover:bg-sand'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {result.series.length === 0 ? (
          <div className="bg-warm-white border border-sand rounded-lg p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sand flex items-center justify-center">
              <Repeat className="w-8 h-8 text-stone" />
            </div>
            <h2 className="font-display text-xl text-charcoal mb-2">No Series Found</h2>
            <p className="text-stone max-w-md mx-auto">
              {search
                ? `No series match "${search}".`
                : 'No series found with the current filters.'}
            </p>
            <Button href="/admin/series" variant="secondary" className="mt-6">
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <AdminSeriesGrid series={result.series} />
            </div>

            {/* Pagination */}
            {result.totalPages > 1 && (
              <div className="flex items-center justify-between bg-warm-white border border-sand rounded-lg p-4">
                <p className="text-sm text-stone">
                  Showing {(result.page - 1) * result.limit + 1} to{' '}
                  {Math.min(result.page * result.limit, result.total)} of {result.total} series
                </p>
                <div className="flex items-center gap-2">
                  {result.page > 1 && (
                    <Link
                      href={buildUrl({ page: String(result.page - 1) })}
                      className="px-4 py-2 text-sm border border-sand rounded-lg hover:border-coral transition-colors"
                    >
                      Previous
                    </Link>
                  )}
                  <span className="px-4 py-2 text-sm text-stone">
                    Page {result.page} of {result.totalPages}
                  </span>
                  {result.page < result.totalPages && (
                    <Link
                      href={buildUrl({ page: String(result.page + 1) })}
                      className="px-4 py-2 text-sm border border-sand rounded-lg hover:border-coral transition-colors"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
