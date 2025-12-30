/**
 * ADMIN DASHBOARD PAGE
 * =====================
 * Main admin dashboard with overview stats and recent activity.
 */

import Link from 'next/link';
import { format } from 'date-fns';
import {
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  TrendingUp,
  FileText,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { AdminHeader, StatCard, StatCardGrid } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getAdminStats, getRecentActivity, getPendingEvents } from '@/data/admin';
import { adminDataLogger } from '@/lib/utils/logger';

export const metadata = {
  title: 'Dashboard',
};

export default async function AdminDashboardPage() {
  const timer = adminDataLogger.time('AdminDashboardPage render');

  // Fetch all data in parallel
  const [stats, recentActivity, pendingEvents] = await Promise.all([
    getAdminStats(),
    getRecentActivity(5),
    getPendingEvents({ limit: 5 }),
  ]);

  timer.success('Dashboard data loaded', {
    metadata: {
      pendingCount: stats.pendingReviewCount,
      recentActivityCount: recentActivity.length,
    },
  });

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="Dashboard"
        description="Overview of events and activity"
      />

      <div className="p-8 space-y-8">
        {/* Stats Grid */}
        <StatCardGrid columns={4}>
          <StatCard
            label="Pending Review"
            value={stats.pendingReviewCount}
            icon={Clock}
            iconColor="coral"
            href="/admin/events/pending"
            trend={
              stats.scrapedLast24h > 0
                ? {
                    value: stats.scrapedLast24h,
                    label: 'new in 24h',
                    direction: 'up',
                  }
                : undefined
            }
          />

          <StatCard
            label="Published"
            value={stats.publishedCount}
            icon={CheckCircle}
            iconColor="sage"
            href="/admin/events?status=published"
          />

          <StatCard
            label="Rejected"
            value={stats.rejectedCount}
            icon={XCircle}
            iconColor="stone"
            href="/admin/events?status=rejected"
          />

          <StatCard
            label="Total Events"
            value={stats.totalCount}
            icon={Calendar}
            iconColor="charcoal"
            href="/admin/events"
            trend={
              stats.reviewedLast24h > 0
                ? {
                    value: stats.reviewedLast24h,
                    label: 'reviewed in 24h',
                    direction: 'neutral',
                  }
                : undefined
            }
          />
        </StatCardGrid>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Events Preview */}
          <Card padding="lg" className="border border-sand">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-charcoal">
                Pending Review
              </h2>
              <Link
                href="/admin/events/pending"
                className="text-coral text-sm hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {pendingEvents.events.length === 0 ? (
              <div className="py-8 text-center text-stone">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-sage" />
                <p>All caught up! No events pending review.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingEvents.events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/admin/events/${event.id}`}
                    className="block p-3 rounded-lg hover:bg-sand/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-charcoal group-hover:text-coral transition-colors line-clamp-1">
                          {event.title}
                        </p>
                        <p className="text-sm text-stone mt-0.5">
                          {format(new Date(event.start_datetime), 'MMM d, yyyy')}
                          {event.location_name && ` • ${event.location_name}`}
                        </p>
                      </div>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full flex-shrink-0">
                        {event.source !== 'manual' ? 'Scraped' : 'Manual'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {pendingEvents.total > 5 && (
              <div className="mt-4 pt-4 border-t border-sand">
                <Button href="/admin/events/pending" variant="secondary" fullWidth>
                  View all {pendingEvents.total} pending events
                </Button>
              </div>
            )}
          </Card>

          {/* Recent Activity */}
          <Card padding="lg" className="border border-sand">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-charcoal">
                Recent Activity
              </h2>
              <Link
                href="/admin/activity"
                className="text-coral text-sm hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {recentActivity.length === 0 ? (
              <div className="py-8 text-center text-stone">
                <FileText className="w-12 h-12 mx-auto mb-2 text-stone/50" />
                <p>No recent activity yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-sand/50 transition-colors"
                  >
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${
                        activity.action.includes('approved')
                          ? 'bg-sage/10 text-sage'
                          : activity.action.includes('rejected')
                          ? 'bg-red-100 text-red-500'
                          : 'bg-sand text-stone'
                      }`}
                    >
                      {activity.action.includes('approved') && (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      {activity.action.includes('rejected') && (
                        <XCircle className="w-4 h-4" />
                      )}
                      {activity.action.includes('edited') && (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-charcoal">
                        <span className="font-medium">
                          {activity.admin_email || 'Admin'}
                        </span>{' '}
                        {activity.action.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-stone mt-0.5">
                        {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Stats Summary */}
        <Card padding="lg" className="border border-sand">
          <h2 className="font-display text-xl text-charcoal mb-4">
            Scraped Events Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-2xl font-display font-semibold text-charcoal">
                {stats.scrapedCount}
              </p>
              <p className="text-sm text-stone">Total scraped</p>
            </div>
            <div>
              <p className="text-2xl font-display font-semibold text-coral">
                {stats.scrapedPendingCount}
              </p>
              <p className="text-sm text-stone">Awaiting review</p>
            </div>
            <div>
              <p className="text-2xl font-display font-semibold text-sage">
                {stats.scrapedLast24h}
              </p>
              <p className="text-sm text-stone">Scraped (24h)</p>
            </div>
            <div>
              <p className="text-2xl font-display font-semibold text-charcoal">
                {stats.reviewedLast24h}
              </p>
              <p className="text-sm text-stone">Reviewed (24h)</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
