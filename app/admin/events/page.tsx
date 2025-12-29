// ============================================================================
// 📅 HAPPENLIST - Admin Events List
// ============================================================================
// Lists all events with status filters and management actions.
// Supports search, filtering, and pagination.
// ============================================================================

import { Suspense } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Eye,
  MapPin,
  Clock,
} from 'lucide-react'
import { Button, Card, Input } from '@/components/ui'
import { getEvents } from '@/lib/queries/events'
import { formatEventDate, formatEventTime } from '@/lib/utils/dates'
import { ROUTES, EVENT_STATUS_CONFIG, EVENT_STATUSES } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'
import type { Metadata } from 'next'

// ============================================================================
// 📋 Metadata
// ============================================================================

export const metadata: Metadata = {
  title: 'Events',
  description: 'Manage events on Happenlist.',
}

// ============================================================================
// 📋 Page Props
// ============================================================================

interface AdminEventsPageProps {
  searchParams: Promise<{
    status?: string
    page?: string
    q?: string
  }>
}

// ============================================================================
// 📅 Admin Events Page Component
// ============================================================================

export default async function AdminEventsPage({
  searchParams,
}: AdminEventsPageProps) {
  const params = await searchParams
  const currentPage = Number(params.page) || 1
  const statusFilter = params.status
  const searchQuery = params.q

  logger.info('📅 Rendering admin events page', {
    page: currentPage,
    status: statusFilter,
    search: searchQuery,
  })

  return (
    <div className="space-y-6">
      {/* ========================================
          📋 Page Header
          ======================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-heading-lg font-bold text-text-primary">Events</h1>
          <p className="text-body-md text-text-secondary mt-1">
            Manage and organize your events
          </p>
        </div>

        <Button asChild>
          <Link href={ROUTES.adminEventNew}>
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Link>
        </Button>
      </div>

      {/* ========================================
          🔍 Filters
          ======================================== */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <form className="flex-1" action={ROUTES.adminEvents} method="GET">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <Input
                name="q"
                placeholder="Search events..."
                defaultValue={searchQuery}
                className="pl-10"
              />
              {statusFilter && (
                <input type="hidden" name="status" value={statusFilter} />
              )}
            </div>
          </form>

          {/* Status Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            <Link
              href={ROUTES.adminEvents}
              className={`px-3 py-1.5 rounded-lg text-body-sm font-medium whitespace-nowrap transition-colors ${
                !statusFilter
                  ? 'bg-primary text-white'
                  : 'bg-background text-text-secondary hover:bg-border'
              }`}
            >
              All
            </Link>
            {EVENT_STATUSES.map((status) => {
              const config = EVENT_STATUS_CONFIG[status]
              return (
                <Link
                  key={status}
                  href={`${ROUTES.adminEvents}?status=${status}`}
                  className={`px-3 py-1.5 rounded-lg text-body-sm font-medium whitespace-nowrap transition-colors ${
                    statusFilter === status
                      ? 'bg-primary text-white'
                      : 'bg-background text-text-secondary hover:bg-border'
                  }`}
                >
                  {config.label}
                </Link>
              )
            })}
          </div>
        </div>
      </Card>

      {/* ========================================
          📅 Events List
          ======================================== */}
      <Suspense fallback={<EventsListSkeleton />}>
        <EventsList
          page={currentPage}
          status={statusFilter}
          search={searchQuery}
        />
      </Suspense>
    </div>
  )
}

// ============================================================================
// 📅 Events List Component
// ============================================================================

async function EventsList({
  page,
  status,
  search,
}: {
  page: number
  status?: string
  search?: string
}) {
  const { events, total, totalPages } = await getEvents({
    page,
    limit: 20,
    status: status as any,
    search,
    includeAll: true, // Include drafts and archived
  })

  if (events.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Calendar className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
        <h3 className="text-heading-sm font-semibold text-text-primary">
          No events found
        </h3>
        <p className="text-body-sm text-text-secondary mt-2">
          {search || status
            ? 'Try adjusting your filters or search.'
            : "Get started by creating your first event."}
        </p>
        {!search && !status && (
          <Button asChild className="mt-6">
            <Link href={ROUTES.adminEventNew}>
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Link>
          </Button>
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Results Count */}
      <p className="text-body-sm text-text-secondary">
        Showing {events.length} of {total} events
      </p>

      {/* Events Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="text-left text-caption font-semibold text-text-secondary px-4 py-3">
                  Event
                </th>
                <th className="text-left text-caption font-semibold text-text-secondary px-4 py-3">
                  Date
                </th>
                <th className="text-left text-caption font-semibold text-text-secondary px-4 py-3 hidden md:table-cell">
                  Venue
                </th>
                <th className="text-left text-caption font-semibold text-text-secondary px-4 py-3">
                  Status
                </th>
                <th className="text-right text-caption font-semibold text-text-secondary px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.map((event) => {
                const statusConfig = EVENT_STATUS_CONFIG[event.status as keyof typeof EVENT_STATUS_CONFIG]

                return (
                  <tr key={event.id} className="hover:bg-background/50">
                    {/* Event Title */}
                    <td className="px-4 py-4">
                      <Link
                        href={ROUTES.adminEventEdit(event.id)}
                        className="font-medium text-text-primary hover:text-primary"
                      >
                        {event.title}
                      </Link>
                      {event.category && (
                        <p className="text-caption text-text-tertiary mt-0.5">
                          {event.category.name}
                        </p>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-body-sm text-text-secondary">
                        <Calendar className="w-4 h-4" />
                        {formatEventDate(event.start_at, 'short')}
                      </div>
                      <div className="flex items-center gap-1 text-caption text-text-tertiary mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formatEventTime(event.start_at)}
                      </div>
                    </td>

                    {/* Venue */}
                    <td className="px-4 py-4 hidden md:table-cell">
                      {event.venue ? (
                        <div className="flex items-center gap-1 text-body-sm text-text-secondary">
                          <MapPin className="w-4 h-4" />
                          {event.venue.name}
                        </div>
                      ) : (
                        <span className="text-body-sm text-text-tertiary">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig?.bgColor} ${statusConfig?.color}`}
                      >
                        {statusConfig?.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* View */}
                        {event.status === 'published' && (
                          <Button asChild variant="ghost" size="icon">
                            <Link
                              href={ROUTES.eventDetail(event.slug)}
                              target="_blank"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="sr-only">View</span>
                            </Link>
                          </Button>
                        )}

                        {/* Edit */}
                        <Button asChild variant="ghost" size="icon">
                          <Link href={ROUTES.adminEventEdit(event.id)}>
                            <Edit className="w-4 h-4" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>

                        {/* More Actions (would be a dropdown in full implementation) */}
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                          <span className="sr-only">More actions</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <Link
              key={pageNum}
              href={`${ROUTES.adminEvents}?page=${pageNum}${status ? `&status=${status}` : ''}${search ? `&q=${search}` : ''}`}
              className={`px-3 py-1.5 rounded-lg text-body-sm font-medium ${
                pageNum === page
                  ? 'bg-primary text-white'
                  : 'bg-background text-text-secondary hover:bg-border'
              }`}
            >
              {pageNum}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// ⏳ Loading Skeleton
// ============================================================================

function EventsListSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 border-b border-border last:border-0"
          >
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-background rounded w-1/3" />
              <div className="h-4 bg-background rounded w-1/4" />
            </div>
            <div className="h-6 w-20 bg-background rounded-full" />
          </div>
        ))}
      </div>
    </Card>
  )
}
