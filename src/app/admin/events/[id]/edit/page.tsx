/**
 * 🦸 SUPERADMIN EVENT EDIT PAGE
 * ==============================
 * Full edit page for superadmins to modify any event.
 *
 * This page allows superadmins to:
 * - Edit all event fields
 * - Change event status directly
 * - Delete or restore events
 *
 * @module app/admin/events/[id]/edit
 */

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Shield,
  Calendar,
  MapPin,
  User as UserIcon,
  Clock,
} from 'lucide-react';
import { AdminHeader, AdminBreadcrumbs } from '@/components/admin';
import { SuperadminEventEditForm } from '@/components/superadmin';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAdminEvent, getEventAuditHistory } from '@/data/admin';
import { getSession, isSuperAdmin } from '@/lib/auth';
import { superadminLogger } from '@/lib/utils/logger';

export const metadata = {
  title: 'Edit Event',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SuperadminEventEditPage({ params }: PageProps) {
  // Await params (Next.js 15+ requirement)
  const resolvedParams = await params;
  const eventId = resolvedParams.id;

  // 🔐 Check authentication and superadmin status
  const { session } = await getSession();

  if (!session) {
    superadminLogger.warn('Unauthenticated user tried to access edit page', {
      entityType: 'event',
      entityId: eventId,
    });
    redirect('/auth/login?redirect=/admin/events/' + eventId + '/edit');
  }

  if (!isSuperAdmin(session.email)) {
    superadminLogger.warn('Non-superadmin tried to access edit page', {
      entityType: 'event',
      entityId: eventId,
      adminEmail: session.email,
    });
    // Redirect to regular review page instead
    redirect('/admin/events/' + eventId);
  }

  const timer = superadminLogger.time('SuperadminEventEditPage render', {
    entityType: 'event',
    entityId: eventId,
    adminEmail: session.email,
  });

  // Fetch event and audit history
  const [event, auditHistory] = await Promise.all([
    getAdminEvent(eventId),
    getEventAuditHistory(eventId),
  ]);

  if (!event) {
    superadminLogger.warn('Event not found', { entityType: 'event', entityId: eventId });
    notFound();
  }

  timer.success(`Loaded event for editing: ${event.title}`);

  // Format dates for display
  const eventDate = format(new Date(event.start_datetime), 'EEEE, MMMM d, yyyy');
  const eventTime = format(new Date(event.start_datetime), 'h:mm a');

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="Edit Event"
        description="Superadmin editing mode"
      >
        <div className="flex items-center gap-3">
          {/* Superadmin badge */}
          <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Superadmin Mode
          </Badge>

          {/* Status badge */}
          <Badge className={getStatusClassName(event.status)}>
            {getStatusLabel(event.status)}
          </Badge>

          <div className="flex-1" />

          {/* Back link */}
          <Link
            href={`/admin/events/${eventId}`}
            className="flex items-center gap-2 text-sm text-stone hover:text-charcoal transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Review
          </Link>
        </div>
      </AdminHeader>

      <div className="p-8">
        <AdminBreadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Events', href: '/admin/events' },
            { label: event.title, href: `/admin/events/${eventId}` },
            { label: 'Edit' },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content - Edit form */}
          <div className="lg:col-span-2">
            <SuperadminEventEditForm event={event} />
          </div>

          {/* Sidebar - Event info and history */}
          <div className="space-y-6">
            {/* Quick info */}
            <Card padding="lg" className="border border-sand">
              <h3 className="font-medium text-charcoal mb-4 flex items-center gap-2">
                📋 Event Summary
              </h3>

              <div className="space-y-3 text-sm">
                {/* Date & Time */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-coral mt-0.5" />
                  <div>
                    <p className="text-charcoal font-medium">{eventDate}</p>
                    <p className="text-stone">{eventTime}</p>
                  </div>
                </div>

                {/* Location */}
                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-sage mt-0.5" />
                    <div>
                      <p className="text-charcoal font-medium">{event.location.name}</p>
                      <p className="text-stone">
                        {event.location.city}
                        {event.location.state && `, ${event.location.state}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Organizer */}
                {event.organizer && (
                  <div className="flex items-start gap-3">
                    <UserIcon className="w-4 h-4 text-stone mt-0.5" />
                    <p className="text-charcoal">{event.organizer.name}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Event metadata */}
            <Card padding="lg" className="border border-sand">
              <h3 className="font-medium text-charcoal mb-4 flex items-center gap-2">
                🔧 Metadata
              </h3>

              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone">Event ID</dt>
                  <dd className="text-charcoal font-mono text-xs">
                    {event.id.slice(0, 8)}...
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone">Source</dt>
                  <dd className="text-charcoal capitalize">{event.source}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone">Created</dt>
                  <dd className="text-charcoal">
                    {format(new Date(event.created_at), 'MMM d, yyyy')}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone">Updated</dt>
                  <dd className="text-charcoal">
                    {format(new Date(event.updated_at), 'MMM d, yyyy')}
                  </dd>
                </div>
                {event.reviewed_by && (
                  <div className="flex justify-between">
                    <dt className="text-stone">Reviewed by</dt>
                    <dd className="text-charcoal text-right truncate max-w-[150px]">
                      {event.reviewed_by}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>

            {/* Audit history */}
            {auditHistory.length > 0 && (
              <Card padding="lg" className="border border-sand">
                <h3 className="font-medium text-charcoal mb-4 flex items-center gap-2">
                  📜 Recent Activity
                </h3>

                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {auditHistory.slice(0, 10).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 text-sm pb-3 border-b border-sand/50 last:border-0"
                    >
                      <Clock className="w-4 h-4 text-stone mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-charcoal">
                          <span className="font-medium">
                            {formatActionName(entry.action)}
                          </span>
                        </p>
                        {entry.notes && (
                          <p className="text-stone text-xs mt-0.5 truncate">
                            {entry.notes}
                          </p>
                        )}
                        <p className="text-stone/70 text-xs mt-1">
                          {format(new Date(entry.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {auditHistory.length > 10 && (
                  <p className="text-xs text-stone mt-3 text-center">
                    + {auditHistory.length - 10} more entries
                  </p>
                )}
              </Card>
            )}

            {/* Superadmin info */}
            <Card padding="lg" className="border border-purple-200 bg-purple-50/50">
              <h3 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Superadmin Editing
              </h3>
              <p className="text-sm text-purple-700">
                You are editing this event as a superadmin. All changes are logged
                to the audit trail. Use this power responsibly!
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 🔧 HELPERS
// ============================================================================

function getStatusClassName(status: string): string {
  const classes: Record<string, string> = {
    draft: 'bg-stone/20 text-stone',
    pending_review: 'bg-amber-100 text-amber-800',
    changes_requested: 'bg-orange-100 text-orange-800',
    published: 'bg-sage/20 text-sage',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-stone/30 text-stone',
  };
  return classes[status] || classes.draft;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Draft',
    pending_review: 'Pending Review',
    changes_requested: 'Changes Requested',
    published: 'Published',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
}

function formatActionName(action: string): string {
  // Convert snake_case to Title Case with emoji
  const actionMap: Record<string, string> = {
    superadmin_edit: '✏️ Edited',
    superadmin_soft_delete: '🗑️ Deleted',
    superadmin_hard_delete: '💥 Permanently Deleted',
    superadmin_restore: '♻️ Restored',
    superadmin_status_change: '🔄 Status Changed',
    event_approved: '✅ Approved',
    event_rejected: '❌ Rejected',
    event_edited: '✏️ Edited',
    event_changes_req: '📝 Changes Requested',
  };

  return actionMap[action] || action.replace(/_/g, ' ');
}
