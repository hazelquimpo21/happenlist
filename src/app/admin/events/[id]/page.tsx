/**
 * EVENT REVIEW PAGE
 * ==================
 * Detailed view for reviewing and editing a single event.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  DollarSign,
  Tag,
  ExternalLink,
  FileText,
  CheckCircle,
  XCircle,
  Edit,
  History,
  AlertCircle,
} from 'lucide-react';
import { AdminHeader, AdminBreadcrumbs } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getAdminEvent, getEventAuditHistory } from '@/data/admin';
import { adminDataLogger } from '@/lib/utils/logger';
import { getBestImageUrl, getImageUrlIssue } from '@/lib/utils';
import { EventApprovalForm } from './approval-form';

export const metadata = {
  title: 'Review Event',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventReviewPage({ params }: PageProps) {
  // Await params (Next.js 15+ requirement)
  const resolvedParams = await params;

  const timer = adminDataLogger.time('EventReviewPage render', {
    entityType: 'event',
    entityId: resolvedParams.id,
  });

  // Fetch event and audit history in parallel
  const [event, auditHistory] = await Promise.all([
    getAdminEvent(resolvedParams.id),
    getEventAuditHistory(resolvedParams.id),
  ]);

  if (!event) {
    adminDataLogger.warn('Event not found', { entityType: 'event', entityId: resolvedParams.id });
    notFound();
  }

  timer.success(`Loaded event: ${event.title}`);

  // Status styles
  const statusStyles: Record<string, { className: string; label: string; icon: React.ReactNode }> = {
    pending_review: {
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      label: 'Pending Review',
      icon: <Clock className="w-4 h-4" />,
    },
    published: {
      className: 'bg-green-100 text-green-800 border-green-200',
      label: 'Published',
      icon: <CheckCircle className="w-4 h-4" />,
    },
    rejected: {
      className: 'bg-red-100 text-red-800 border-red-200',
      label: 'Rejected',
      icon: <XCircle className="w-4 h-4" />,
    },
    draft: {
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      label: 'Draft',
      icon: <FileText className="w-4 h-4" />,
    },
  };

  const statusStyle = statusStyles[event.status] || statusStyles.draft;

  // Format dates
  const eventDate = format(new Date(event.start_datetime), 'EEEE, MMMM d, yyyy');
  const eventTime = format(new Date(event.start_datetime), 'h:mm a');
  const scrapedDate = event.scraped_at
    ? format(new Date(event.scraped_at), 'MMM d, yyyy h:mm a')
    : null;

  // Price display
  const getPriceDisplay = () => {
    if (event.is_free) return 'Free';
    if (event.price_type === 'range' && event.price_low && event.price_high) {
      return `$${event.price_low} - $${event.price_high}`;
    }
    if (event.price_low) return `$${event.price_low}`;
    if (event.price_type === 'varies') return 'Prices vary';
    if (event.price_type === 'donation') return 'Pay what you can';
    return 'Price TBD';
  };

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="Review Event"
        description={event.title}
      >
        <div className="flex items-center gap-3">
          {/* Status badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusStyle.className}`}>
            {statusStyle.icon}
            <span className="text-sm font-medium">{statusStyle.label}</span>
          </div>

          {/* Source badge */}
          {event.source !== 'manual' && (
            <Badge className="bg-purple-100 text-purple-800">
              Scraped from {event.source}
            </Badge>
          )}

          <div className="flex-1" />

          {/* Actions */}
          {event.source_url && (
            <Button
              href={event.source_url}
              external
              variant="ghost"
              size="sm"
              leftIcon={<ExternalLink className="w-4 h-4" />}
            >
              View Source
            </Button>
          )}
        </div>
      </AdminHeader>

      <div className="p-8">
        <AdminBreadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Events', href: '/admin/events' },
            { label: event.title },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event image */}
            {(() => {
              const validImageUrl = getBestImageUrl(event.image_url, event.flyer_url);
              const imageIssue = !validImageUrl && (event.image_url || event.flyer_url) 
                ? getImageUrlIssue(event.image_url || event.flyer_url)
                : null;
              
              return validImageUrl ? (
                <Card className="overflow-hidden">
                  <div className="relative aspect-video">
                    <Image
                      src={validImageUrl}
                      alt={event.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 66vw"
                    />
                  </div>
                </Card>
              ) : imageIssue ? (
                <Card className="overflow-hidden border-yellow-200 bg-yellow-50">
                  <div className="p-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">Invalid Image URL</p>
                        <p className="text-sm text-yellow-700 mt-1">{imageIssue}</p>
                        <p className="text-xs text-yellow-600 mt-2 font-mono break-all">
                          {event.image_url || event.flyer_url}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : null;
            })()}

            {/* Event details */}
            <Card padding="lg" className="border border-sand">
              <h2 className="font-display text-2xl text-charcoal mb-4">
                {event.title}
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Date */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-coral/10 rounded-lg">
                    <Calendar className="w-5 h-5 text-coral" />
                  </div>
                  <div>
                    <p className="text-sm text-stone">Date & Time</p>
                    <p className="text-charcoal font-medium">{eventDate}</p>
                    <p className="text-charcoal">{eventTime}</p>
                  </div>
                </div>

                {/* Location */}
                {event.location && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-sage/10 rounded-lg">
                      <MapPin className="w-5 h-5 text-sage" />
                    </div>
                    <div>
                      <p className="text-sm text-stone">Location</p>
                      <p className="text-charcoal font-medium">{event.location.name}</p>
                      <p className="text-charcoal text-sm">
                        {event.location.city}
                        {event.location.state && `, ${event.location.state}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-sand rounded-lg">
                    <DollarSign className="w-5 h-5 text-charcoal" />
                  </div>
                  <div>
                    <p className="text-sm text-stone">Price</p>
                    <p className="text-charcoal font-medium">{getPriceDisplay()}</p>
                    {event.price_details && (
                      <p className="text-charcoal text-sm">{event.price_details}</p>
                    )}
                  </div>
                </div>

                {/* Category */}
                {event.category && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-sand rounded-lg">
                      <Tag className="w-5 h-5 text-charcoal" />
                    </div>
                    <div>
                      <p className="text-sm text-stone">Category</p>
                      <p className="text-charcoal font-medium">{event.category.name}</p>
                    </div>
                  </div>
                )}

                {/* Organizer */}
                {event.organizer && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-sand rounded-lg">
                      <User className="w-5 h-5 text-charcoal" />
                    </div>
                    <div>
                      <p className="text-sm text-stone">Organizer</p>
                      <p className="text-charcoal font-medium">{event.organizer.name}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {event.description && (
                <div className="pt-4 border-t border-sand">
                  <h3 className="font-medium text-charcoal mb-2">Description</h3>
                  <div className="prose prose-sm max-w-none text-stone">
                    <p className="whitespace-pre-wrap">{event.description}</p>
                  </div>
                </div>
              )}

              {/* Short description */}
              {event.short_description && (
                <div className="pt-4 border-t border-sand">
                  <h3 className="font-medium text-charcoal mb-2">Short Description</h3>
                  <p className="text-stone">{event.short_description}</p>
                </div>
              )}
            </Card>

            {/* Scraped data (if available) */}
            {event.scraped_data && (
              <Card padding="lg" className="border border-sand">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-purple-600" />
                  <h3 className="font-medium text-charcoal">Raw Scraped Data</h3>
                </div>
                <pre className="bg-charcoal text-cream p-4 rounded-lg overflow-auto text-xs max-h-64">
                  {JSON.stringify(event.scraped_data, null, 2)}
                </pre>
              </Card>
            )}

            {/* Audit history */}
            {auditHistory.length > 0 && (
              <Card padding="lg" className="border border-sand">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-stone" />
                  <h3 className="font-medium text-charcoal">Activity History</h3>
                </div>
                <div className="space-y-3">
                  {auditHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 text-sm"
                    >
                      <div className="w-8 h-8 rounded-full bg-sand flex items-center justify-center flex-shrink-0">
                        {entry.action.includes('approved') && (
                          <CheckCircle className="w-4 h-4 text-sage" />
                        )}
                        {entry.action.includes('rejected') && (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        {entry.action.includes('edited') && (
                          <Edit className="w-4 h-4 text-stone" />
                        )}
                      </div>
                      <div>
                        <p className="text-charcoal">
                          <span className="font-medium">{entry.admin_email || 'Admin'}</span>
                          {' '}
                          {entry.action.replace(/_/g, ' ')}
                        </p>
                        {entry.notes && (
                          <p className="text-stone mt-0.5">{entry.notes}</p>
                        )}
                        <p className="text-stone/70 text-xs mt-1">
                          {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Approval form */}
            <EventApprovalForm event={event} />

            {/* Meta info */}
            <Card padding="lg" className="border border-sand">
              <h3 className="font-medium text-charcoal mb-4">Event Info</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone">ID</dt>
                  <dd className="text-charcoal font-mono text-xs">{event.id.slice(0, 8)}...</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone">Source</dt>
                  <dd className="text-charcoal capitalize">{event.source}</dd>
                </div>
                {scrapedDate && (
                  <div className="flex justify-between">
                    <dt className="text-stone">Scraped</dt>
                    <dd className="text-charcoal">{scrapedDate}</dd>
                  </div>
                )}
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
                    <dd className="text-charcoal">{event.reviewed_by}</dd>
                  </div>
                )}
              </dl>
            </Card>

            {/* Links */}
            <Card padding="lg" className="border border-sand">
              <h3 className="font-medium text-charcoal mb-4">Links</h3>
              <div className="space-y-2">
                {event.ticket_url && (
                  <a
                    href={event.ticket_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-coral hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ticket Link
                  </a>
                )}
                {event.source_url && (
                  <a
                    href={event.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-coral hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Original Source
                  </a>
                )}
                {event.organizer?.website_url && (
                  <a
                    href={event.organizer.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-coral hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Organizer Website
                  </a>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
