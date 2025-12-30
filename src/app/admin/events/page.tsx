/**
 * ALL EVENTS PAGE
 * ================
 * List of all events with status filters.
 */

import Link from 'next/link';
import {
  Filter,
} from 'lucide-react';
import { AdminHeader, AdminBreadcrumbs, AdminEventCard, AdminEventFilters } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { getAllAdminEvents } from '@/data/admin';
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

  // Parse search params
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page) : 1;
  const status = typeof resolvedSearchParams.status === 'string' ? resolvedSearchParams.status : undefined;
  const source = typeof resolvedSearchParams.source === 'string' ? resolvedSearchParams.source : undefined;
  const search = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : undefined;
  const orderBy = (typeof resolvedSearchParams.orderBy === 'string' ? resolvedSearchParams.orderBy : 'created_at') as 'scraped_at' | 'created_at' | 'start_datetime' | 'title';
  const orderDir = (typeof resolvedSearchParams.orderDir === 'string' ? resolvedSearchParams.orderDir : 'desc') as 'asc' | 'desc';

  // Fetch all events
  const result = await getAllAdminEvents({
    status: status as EventStatus | undefined,
    source: source as EventSource | undefined,
    search,
    page,
    limit: 20,
    orderBy,
    orderDir,
  });

  timer.success('Loaded all events', {
    metadata: { total: result.total, page: result.page, status },
  });

  // Build filter URL helper
  const buildFilterUrl = (params: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams();
    Object.entries({ status, source, orderBy, orderDir, ...params }).forEach(([key, value]) => {
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
  ];

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="All Events"
        description={`${result.total} events total`}
      >
        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-sand/50 p-1 rounded-lg mr-auto">
          {statusTabs.map((tab) => (
            <Link
              key={tab.value || 'all'}
              href={buildFilterUrl({ status: tab.value, page: undefined })}
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

        {/* Filters and actions - using client component for interactivity */}
        <AdminEventFilters
          currentSource={source}
          currentOrderBy={orderBy}
          currentOrderDir={orderDir}
          currentStatus={status}
        />
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
            <input
              type="text"
              name="q"
              defaultValue={search}
              placeholder="Search events..."
              className="w-full px-4 py-2 pl-10 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone"
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
          <div className="bg-warm-white border border-sand rounded-lg p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sand flex items-center justify-center">
              <Filter className="w-8 h-8 text-stone" />
            </div>
            <h2 className="font-display text-xl text-charcoal mb-2">
              No Events Found
            </h2>
            <p className="text-stone max-w-md mx-auto">
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
            {/* Events list */}
            <div className="space-y-3 mb-8">
              {result.events.map((event) => (
                <AdminEventCard key={event.id} event={event} />
              ))}
            </div>

            {/* Pagination */}
            {result.totalPages > 1 && (
              <div className="flex items-center justify-between bg-warm-white border border-sand rounded-lg p-4">
                <p className="text-sm text-stone">
                  Showing {(result.page - 1) * result.limit + 1} to{' '}
                  {Math.min(result.page * result.limit, result.total)} of {result.total} events
                </p>
                <div className="flex items-center gap-2">
                  {result.page > 1 && (
                    <Link
                      href={buildFilterUrl({ page: String(result.page - 1) })}
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
                      href={buildFilterUrl({ page: String(result.page + 1) })}
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
