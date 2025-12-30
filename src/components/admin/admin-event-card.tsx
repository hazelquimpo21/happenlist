/**
 * ADMIN EVENT CARD
 * =================
 * Event card for admin review with actions.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import {
  Calendar,
  MapPin,
  ExternalLink,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Tag,
  DollarSign,
  MoreVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AdminEventCard as AdminEventCardType } from '@/data/admin';

interface AdminEventCardProps {
  event: AdminEventCardType;
  selected?: boolean;
  onSelect?: (eventId: string, selected: boolean) => void;
  onApprove?: (eventId: string) => void;
  onReject?: (eventId: string) => void;
}

export function AdminEventCard({
  event,
  selected = false,
  onSelect,
  onApprove,
  onReject,
}: AdminEventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Status badge styles
  const statusStyles: Record<string, { className: string; label: string }> = {
    pending_review: { className: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    published: { className: 'bg-green-100 text-green-800', label: 'Published' },
    rejected: { className: 'bg-red-100 text-red-800', label: 'Rejected' },
    draft: { className: 'bg-gray-100 text-gray-800', label: 'Draft' },
  };

  const statusStyle = statusStyles[event.status] || statusStyles.draft;

  // Format date
  const eventDate = format(new Date(event.start_datetime), 'EEE, MMM d, yyyy');
  const eventTime = format(new Date(event.start_datetime), 'h:mm a');
  const scrapedDate = event.scraped_at
    ? format(new Date(event.scraped_at), 'MMM d, h:mm a')
    : null;

  // Price display
  const getPriceDisplay = () => {
    if (event.is_free) return 'Free';
    if (event.price_type === 'range' && event.price_low && event.price_high) {
      return `$${event.price_low} - $${event.price_high}`;
    }
    if (event.price_low) return `$${event.price_low}`;
    return 'Price TBD';
  };

  return (
    <div
      className={cn(
        'bg-warm-white border rounded-lg overflow-hidden',
        'transition-all duration-200',
        selected ? 'border-coral ring-2 ring-coral/20' : 'border-sand hover:border-stone'
      )}
    >
      <div className="flex gap-4 p-4">
        {/* Selection checkbox */}
        {onSelect && (
          <div className="flex-shrink-0 pt-1">
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelect(event.id, e.target.checked)}
              className="w-5 h-5 rounded border-sand text-coral focus:ring-coral"
            />
          </div>
        )}

        {/* Event image */}
        <div className="flex-shrink-0 w-32 h-24 rounded-lg overflow-hidden bg-sand relative">
          {event.image_url || event.thumbnail_url ? (
            <Image
              src={event.thumbnail_url || event.image_url || ''}
              alt={event.title}
              fill
              className="object-cover"
              sizes="128px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone">
              <Calendar className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Event info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {/* Title */}
              <Link
                href={`/admin/events/${event.id}`}
                className="font-display text-lg text-charcoal hover:text-coral transition-colors line-clamp-1"
              >
                {event.title}
              </Link>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-stone">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {eventDate} at {eventTime}
                </span>

                {event.location_name && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {event.location_name}
                    {event.location_city && `, ${event.location_city}`}
                  </span>
                )}

                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {getPriceDisplay()}
                </span>
              </div>

              {/* Tags row */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusStyle.className)}>
                  {statusStyle.label}
                </span>

                {event.category_name && (
                  <Badge variant="category" size="sm">
                    <Tag className="w-3 h-3 mr-1" />
                    {event.category_name}
                  </Badge>
                )}

                {event.source !== 'manual' && (
                  <Badge size="sm" className="bg-purple-100 text-purple-800">
                    <Clock className="w-3 h-3 mr-1" />
                    Scraped
                  </Badge>
                )}

                {scrapedDate && (
                  <span className="text-xs text-stone">
                    Scraped: {scrapedDate}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href={`/admin/events/${event.id}`}
                className="p-2 text-stone hover:text-charcoal hover:bg-sand rounded-lg transition-colors"
                title="View details"
              >
                <Eye className="w-5 h-5" />
              </Link>

              {event.source_url && (
                <a
                  href={event.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-stone hover:text-charcoal hover:bg-sand rounded-lg transition-colors"
                  title="View original source"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}

              {event.status === 'pending_review' && (
                <>
                  {onApprove && (
                    <button
                      onClick={() => onApprove(event.id)}
                      className="p-2 text-sage hover:text-white hover:bg-sage rounded-lg transition-colors"
                      title="Approve"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                  {onReject && (
                    <button
                      onClick={() => onReject(event.id)}
                      className="p-2 text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition-colors"
                      title="Reject"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for admin event card
 */
export function AdminEventCardSkeleton() {
  return (
    <div className="bg-warm-white border border-sand rounded-lg p-4 animate-pulse">
      <div className="flex gap-4">
        <div className="w-32 h-24 bg-sand rounded-lg" />
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-sand rounded w-2/3" />
          <div className="h-4 bg-sand rounded w-1/2" />
          <div className="flex gap-2">
            <div className="h-5 bg-sand rounded-full w-16" />
            <div className="h-5 bg-sand rounded-full w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}
