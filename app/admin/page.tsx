// ============================================================================
// 📊 HAPPENLIST - Admin Dashboard
// ============================================================================
// The main admin dashboard with quick stats and recent activity.
// Provides an overview of events, venues, and organizers.
// ============================================================================

import Link from 'next/link'
import { Calendar, MapPin, Users, Plus, ArrowRight, Clock } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { getEvents } from '@/lib/queries/events'
import { getVenues } from '@/lib/queries/venues'
import { getOrganizers } from '@/lib/queries/organizers'
import { formatEventDate } from '@/lib/utils/dates'
import { ROUTES, EVENT_STATUS_CONFIG } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'
import type { Metadata } from 'next'

// ============================================================================
// 📋 Metadata
// ============================================================================

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Admin dashboard for managing Happenlist.',
}

// ============================================================================
// 📊 Admin Dashboard Component
// ============================================================================

export default async function AdminDashboardPage() {
  logger.info('📊 Rendering admin dashboard')

  // Fetch stats in parallel
  const [eventsResult, venues, organizers] = await Promise.all([
    getEvents({ limit: 5 }),
    getVenues(),
    getOrganizers(),
  ])

  const { events: recentEvents, total: totalEvents } = eventsResult
  const totalVenues = venues.length
  const totalOrganizers = organizers.length

  return (
    <div className="space-y-8">
      {/* ========================================
          📋 Page Header
          ======================================== */}
      <div>
        <h1 className="text-heading-lg font-bold text-text-primary">
          Dashboard
        </h1>
        <p className="text-body-md text-text-secondary mt-1">
          Welcome back! Here's what's happening with Happenlist.
        </p>
      </div>

      {/* ========================================
          📊 Quick Stats
          ======================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Events Stat */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-heading-lg font-bold text-text-primary">
                {totalEvents}
              </p>
              <p className="text-body-sm text-text-secondary">Total Events</p>
            </div>
          </div>
          <Button asChild variant="ghost" size="sm" className="mt-4 w-full">
            <Link href={ROUTES.adminEvents}>
              Manage Events
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </Card>

        {/* Venues Stat */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-secondary/10 rounded-lg">
              <MapPin className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-heading-lg font-bold text-text-primary">
                {totalVenues}
              </p>
              <p className="text-body-sm text-text-secondary">Total Venues</p>
            </div>
          </div>
          <Button asChild variant="ghost" size="sm" className="mt-4 w-full">
            <Link href={ROUTES.adminVenues}>
              Manage Venues
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </Card>

        {/* Organizers Stat */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-lg">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-heading-lg font-bold text-text-primary">
                {totalOrganizers}
              </p>
              <p className="text-body-sm text-text-secondary">Organizers</p>
            </div>
          </div>
          <Button asChild variant="ghost" size="sm" className="mt-4 w-full">
            <Link href={ROUTES.adminOrganizers}>
              Manage Organizers
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </Card>
      </div>

      {/* ========================================
          ⚡ Quick Actions
          ======================================== */}
      <Card className="p-6">
        <h2 className="text-heading-sm font-semibold text-text-primary mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={ROUTES.adminEventNew}>
              <Plus className="w-4 h-4 mr-2" />
              New Event
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={ROUTES.adminVenueNew}>
              <Plus className="w-4 h-4 mr-2" />
              New Venue
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={ROUTES.adminOrganizerNew}>
              <Plus className="w-4 h-4 mr-2" />
              New Organizer
            </Link>
          </Button>
        </div>
      </Card>

      {/* ========================================
          📅 Recent Events
          ======================================== */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-heading-sm font-semibold text-text-primary">
            Recent Events
          </h2>
          <Link
            href={ROUTES.adminEvents}
            className="text-body-sm text-primary hover:underline flex items-center gap-1"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentEvents.length > 0 ? (
          <div className="space-y-4">
            {recentEvents.map((event) => {
              const statusConfig = EVENT_STATUS_CONFIG[event.status as keyof typeof EVENT_STATUS_CONFIG]

              return (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 bg-background rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={ROUTES.adminEventEdit(event.id)}
                      className="font-medium text-text-primary hover:text-primary truncate block"
                    >
                      {event.title}
                    </Link>
                    <div className="flex items-center gap-4 mt-1 text-body-sm text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatEventDate(event.start_at)}
                      </span>
                      {event.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.venue.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig?.bgColor} ${statusConfig?.color}`}
                  >
                    {statusConfig?.label}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-body-sm text-text-secondary text-center py-8">
            No events yet.{' '}
            <Link href={ROUTES.adminEventNew} className="text-primary hover:underline">
              Create your first event
            </Link>
          </p>
        )}
      </Card>
    </div>
  )
}
