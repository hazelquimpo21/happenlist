/**
 * EVENT CARD COMPONENT
 * ====================
 * Primary event display card for grids and lists.
 * Shows series badge when event is part of a series.
 */

import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { SeriesLinkBadge } from '@/components/series';
import { EventPrice } from './event-price';
import { formatEventDate } from '@/lib/utils/dates';
import { buildEventUrl } from '@/lib/utils/url';
import { cn, getBestImageUrl } from '@/lib/utils';
import type { EventCard as EventCardType } from '@/types';

interface EventCardProps {
  /** Event data */
  event: EventCardType;
  /** Card variant */
  variant?: 'default' | 'compact' | 'featured';
  /** Show category badge */
  showCategory?: boolean;
  /** Show series badge (when event is part of a series) */
  showSeriesBadge?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Event card for displaying in grids and lists.
 *
 * @example Basic usage
 * ```tsx
 * <EventCard event={event} />
 * ```
 *
 * @example With all badges
 * ```tsx
 * <EventCard event={event} variant="featured" showCategory showSeriesBadge />
 * ```
 */
export function EventCard({
  event,
  variant = 'default',
  showCategory = true,
  showSeriesBadge = true,
  className,
}: EventCardProps) {
  const eventUrl = buildEventUrl(event);

  // Get validated image URL (handles invalid page URLs gracefully)
  const imageUrl = getBestImageUrl(event.thumbnail_url, event.image_url);

  // Check if event is part of a series
  const isSeriesEvent = event.is_series_instance && event.series_slug;

  // Image aspect ratio by variant
  const aspectRatio = {
    default: 'aspect-video',      // 16:9
    compact: 'aspect-[4/3]',      // 4:3
    featured: 'aspect-[3/2]',     // 3:2
  };

  // Title size by variant
  const titleSize = {
    default: 'text-h3',
    compact: 'text-body font-medium',
    featured: 'text-h2',
  };

  return (
    <Card hover className={cn('overflow-hidden group', className)}>
      <Link href={eventUrl} className="block">
        {/* Image container */}
        <div className={cn('relative', aspectRatio[variant])}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={event.title}
              fill
              className="object-cover transition-transform duration-slow group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            // Placeholder for events without valid images
            <div className="w-full h-full bg-gradient-to-br from-sand to-stone/20 flex items-center justify-center">
              <span className="text-stone text-h1 font-display opacity-50">
                {event.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Badge stack */}
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
            {/* Category badge */}
            {showCategory && event.category_name && (
              <Badge
                variant="category"
                className="bg-warm-white/90 backdrop-blur-sm"
              >
                {event.category_name}
              </Badge>
            )}
          </div>

          {/* Series badge (top-right) */}
          {showSeriesBadge && isSeriesEvent && event.series_slug && event.series_title && (
            <div className="absolute top-3 right-3">
              <SeriesLinkBadge
                seriesSlug={event.series_slug}
                seriesTitle={event.series_title}
                seriesType={event.series_type || undefined}
                sequenceNumber={event.series_sequence}
                size="sm"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Date */}
          <p className="text-body-sm text-stone mb-1">
            {formatEventDate(event.start_datetime, { format: 'relative' })}
          </p>

          {/* Title */}
          <h3
            className={cn(
              'font-display text-charcoal mb-1 line-clamp-2',
              titleSize[variant]
            )}
          >
            {event.title}
          </h3>

          {/* Location */}
          {event.location_name && (
            <p className="text-body-sm text-stone mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{event.location_name}</span>
            </p>
          )}

          {/* Price */}
          <EventPrice event={event} size="sm" />
        </div>
      </Link>
    </Card>
  );
}
