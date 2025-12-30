/**
 * PENDING EVENTS PAGE
 * ====================
 * List of events awaiting admin review.
 */

import Link from 'next/link';
import { Suspense } from 'react';
import {
  CheckCircle,
  XCircle,
  Filter,
  RefreshCw,
  ArrowUpDown,
} from 'lucide-react';
import { AdminHeader, AdminBreadcrumbs, AdminEventCard, AdminEventCardSkeleton } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { getPendingEvents } from '@/data/admin';
import { adminDataLogger } from '@/lib/utils/logger';

export const metadata = {
  title: 'Pending Review',
};

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function PendingEventsPage({ searchParams }: PageProps) {
  const timer = adminDataLogger.time('PendingEventsPage render');

  // Parse search params
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const source = typeof searchParams.source === 'string' ? searchParams.source : undefined;
  const search = typeof searchParams.q === 'string' ? searchParams.q : undefined;
  const orderBy = (typeof searchParams.orderBy === 'string' ? searchParams.orderBy : 'scraped_at') as 'scraped_at' | 'created_at' | 'start_datetime' | 'title';
  const orderDir = (typeof searchParams.orderDir === 'string' ? searchParams.orderDir : 'desc') as 'asc' | 'desc';

  // Fetch pending events
  const result = await getPendingEvents({
    status: 'pending_review',
    source: source as 'scraper' | 'manual' | 'api' | 'import' | undefined,
    search,
    page,
    limit: 20,
    orderBy,
    orderDir,
  });

  timer.success('Loaded pending events', {
    metadata: { total: result.total, page: result.page },
  });

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="Pending Review"
        description={`${result.total} events awaiting approval`}
      >
        <div className="flex items-center gap-3">
          {/* Filter dropdown - simplified for now */}
          <div className="relative">
            <select
              className="appearance-none bg-warm-white border border-sand rounded-lg px-4 py-2 pr-10 text-sm focus:border-coral focus:ring-1 focus:ring-coral outline-none"
              defaultValue={source || 'all'}
            >
              <option value="all">All Sources</option>
              <option value="scraper">Scraped</option>
              <option value="manual">Manual</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone pointer-events-none" />
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <select
              className="appearance-none bg-warm-white border border-sand rounded-lg px-4 py-2 pr-10 text-sm focus:border-coral focus:ring-1 focus:ring-coral outline-none"
              defaultValue={orderBy}
            >
              <option value="scraped_at">Scraped Date</option>
              <option value="start_datetime">Event Date</option>
              <option value="title">Title</option>
              <option value="created_at">Created Date</option>
            </select>
            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone pointer-events-none" />
          </div>

          {/* Bulk actions */}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="secondary" size="sm" leftIcon={<CheckCircle className="w-4 h-4" />}>
              Approve Selected
            </Button>
            <Button variant="ghost" size="sm" leftIcon={<XCircle className="w-4 h-4" />}>
              Reject Selected
            </Button>
          </div>
        </div>
      </AdminHeader>

      <div className="p-8">
        <AdminBreadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Events', href: '/admin/events' },
            { label: 'Pending Review' },
          ]}
        />

        {result.events.length === 0 ? (
          <div className="bg-warm-white border border-sand rounded-lg p-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-sage" />
            <h2 className="font-display text-xl text-charcoal mb-2">
              All Caught Up!
            </h2>
            <p className="text-stone max-w-md mx-auto">
              There are no events pending review. New scraped events will appear here
              when they need to be approved.
            </p>
            <Button href="/admin" variant="secondary" className="mt-6">
              Back to Dashboard
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
                      href={`/admin/events/pending?page=${result.page - 1}`}
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
                      href={`/admin/events/pending?page=${result.page + 1}`}
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
