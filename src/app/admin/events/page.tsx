/**
 * ALL EVENTS PAGE
 * ================
 * List of all events with status filters.
 */

import Link from 'next/link';
import Script from 'next/script';
import {
  Filter,
} from 'lucide-react';
import { AdminHeader, AdminBreadcrumbs, AdminEventList } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { getAllAdminEvents } from '@/data/admin';
import { getCategories } from '@/data/categories';
import { adminDataLogger } from '@/lib/utils/logger';
import type { EventStatus, EventSource } from '@/lib/supabase/types';

export const metadata = {
  title: 'All Events',
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AllEventsPage({ searchParams }: PageProps) {
  const timer = adminDataLogger.time('AllEventsPage render');

  // Await searchParams (Next.js 15+ requirement)
  const resolvedSearchParams = await searchParams;

  // Parse search params (empty strings from form submissions treated as "no filter")
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page) : 1;
  const status = (typeof resolvedSearchParams.status === 'string' && resolvedSearchParams.status) || undefined;
  const source = (typeof resolvedSearchParams.source === 'string' && resolvedSearchParams.source) || undefined;
  const search = (typeof resolvedSearchParams.q === 'string' && resolvedSearchParams.q) || undefined;
  const orderBy = ((typeof resolvedSearchParams.orderBy === 'string' && resolvedSearchParams.orderBy) || 'created_at') as 'scraped_at' | 'created_at' | 'start_datetime' | 'title';
  const orderDir = ((typeof resolvedSearchParams.orderDir === 'string' && resolvedSearchParams.orderDir) || 'desc') as 'asc' | 'desc';
  const seriesFilter = (typeof resolvedSearchParams.series === 'string' && resolvedSearchParams.series) ? resolvedSearchParams.series as 'in_series' | 'no_series' : undefined;
  const showDeleted = status === 'deleted';

  // Fetch all events + categories (for the bulk "assign category" picker) in parallel
  const [result, categories] = await Promise.all([
    getAllAdminEvents({
      status: showDeleted ? undefined : status as EventStatus | undefined,
      source: source as EventSource | undefined,
      search,
      page,
      limit: 20,
      orderBy,
      orderDir,
      showDeleted,
      seriesFilter,
    }),
    getCategories(),
  ]);

  timer.success('Loaded all events', {
    metadata: { total: result.total, page: result.page, status },
  });

  // Build filter URL helper
  const buildFilterUrl = (params: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams();
    Object.entries({ status, source, q: search, series: seriesFilter, orderBy, orderDir, ...params }).forEach(([key, value]) => {
      if (value) newParams.set(key, value);
    });
    return `/admin/events?${newParams.toString()}`;
  };

  // Status tabs
  const statusTabs = [
    { label: 'All', value: undefined, count: result.total },
    { label: 'Pending', value: 'pending_review' },
    { label: 'Published', value: 'published' },
    { label: 'Draft', value: 'draft' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Deleted', value: 'deleted' },
  ];

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="All Events"
        description={`${result.total} events total`}
      >
        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-cloud/50 p-1 rounded-lg mr-auto">
          {statusTabs.map((tab) => (
            <Link
              key={tab.value || 'all'}
              href={buildFilterUrl({ status: tab.value, page: undefined })}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                status === tab.value || (!status && !tab.value)
                  ? 'bg-pure text-ink font-medium shadow-sm'
                  : 'text-zinc hover:text-ink'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Filter dropdowns — plain HTML form, no React hydration needed */}
        <form method="GET" action="/admin/events" id="admin-filters" className="flex items-center gap-3">
          {/* Carry forward params that aren't in a visible dropdown */}
          {status && <input type="hidden" name="status" value={status} />}
          {search && <input type="hidden" name="q" value={search} />}

          <select
            name="series"
            defaultValue={seriesFilter || ''}
            className="appearance-none bg-pure border border-mist rounded-lg px-4 py-2 pr-8 text-sm focus:border-coral outline-none cursor-pointer"
          >
            <option value="">All Events</option>
            <option value="in_series">In a Series</option>
            <option value="no_series">Not in Series</option>
          </select>

          <select
            name="source"
            defaultValue={source || ''}
            className="appearance-none bg-pure border border-mist rounded-lg px-4 py-2 pr-8 text-sm focus:border-coral outline-none cursor-pointer"
          >
            <option value="">All Sources</option>
            <option value="scraper">Scraped</option>
            <option value="manual">Manual</option>
            <option value="api">API</option>
            <option value="import">Import</option>
          </select>

          <select
            name="orderBy"
            defaultValue={orderBy}
            className="appearance-none bg-pure border border-mist rounded-lg px-4 py-2 pr-8 text-sm focus:border-coral outline-none cursor-pointer"
          >
            <option value="created_at">Created Date</option>
            <option value="start_datetime">Event Date</option>
            <option value="title">Title</option>
            <option value="scraped_at">Scraped Date</option>
          </select>

          <noscript><button type="submit" className="px-3 py-2 text-sm bg-blue text-white rounded-lg">Apply</button></noscript>
        </form>
        <Script id="admin-filter-autosubmit" strategy="afterInteractive">{`
          document.querySelectorAll('#admin-filters select').forEach(function(s){
            s.addEventListener('change', function(){ s.form.submit(); });
          });
        `}</Script>
      </AdminHeader>

      <div className="p-8">
        <AdminBreadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Events' },
          ]}
        />

        {/* Search bar */}
        <div className="mb-6">
          <form className="relative max-w-md">
            {status && <input type="hidden" name="status" value={status} />}
            {source && <input type="hidden" name="source" value={source} />}
            {seriesFilter && <input type="hidden" name="series" value={seriesFilter} />}
            {orderBy !== 'created_at' && <input type="hidden" name="orderBy" value={orderBy} />}
            {orderDir !== 'desc' && <input type="hidden" name="orderDir" value={orderDir} />}
            <input
              type="text"
              name="q"
              defaultValue={search}
              placeholder="Search events..."
              className="w-full px-4 py-2 pl-10 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </form>
        </div>

        {result.events.length === 0 ? (
          <div className="bg-pure border border-mist rounded-lg p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cloud flex items-center justify-center">
              <Filter className="w-8 h-8 text-zinc" />
            </div>
            <h2 className="font-body text-xl text-ink mb-2">
              No Events Found
            </h2>
            <p className="text-zinc max-w-md mx-auto">
              {search
                ? `No events match your search "${search}".`
                : status
                ? `No events with status "${status}" found.`
                : 'No events found in the database.'}
            </p>
            <Button href="/admin/events" variant="secondary" className="mt-6">
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            {/* Events list with bulk selection */}
            <div className="mb-8">
              <AdminEventList
                events={result.events}
                showApproveReject
                showSuperadminActions
                categories={categories}
              />
            </div>

            {/* Pagination */}
            {result.totalPages > 1 && (
              <div className="flex items-center justify-between bg-pure border border-mist rounded-lg p-4">
                <p className="text-sm text-zinc">
                  Showing {(result.page - 1) * result.limit + 1} to{' '}
                  {Math.min(result.page * result.limit, result.total)} of {result.total} events
                </p>
                <div className="flex items-center gap-2">
                  {result.page > 1 && (
                    <Link
                      href={buildFilterUrl({ page: String(result.page - 1) })}
                      className="px-4 py-2 text-sm border border-mist rounded-lg hover:border-coral transition-colors"
                    >
                      Previous
                    </Link>
                  )}
                  <span className="px-4 py-2 text-sm text-zinc">
                    Page {result.page} of {result.totalPages}
                  </span>
                  {result.page < result.totalPages && (
                    <Link
                      href={buildFilterUrl({ page: String(result.page + 1) })}
                      className="px-4 py-2 text-sm border border-mist rounded-lg hover:border-coral transition-colors"
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
