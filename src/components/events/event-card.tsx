/**
 * EVENT CARD COMPONENT
 * ====================
 * Primary event display card for grids and lists.
 */

import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { buildEventUrl } from '@/lib/utils/url';
import { cn } from '@/lib/utils';
import type { EventCard as EventCardType } from '@/types';

interface EventCardProps {
  event: EventCardType;
  variant?: 'default' | 'compact' | 'featured';
  showCategory?: boolean;
  showSeriesBadge?: boolean;
  className?: string;
}

/**
 * Format event date for display
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Format price for display
 */
function formatPrice(event: EventCardType): string {
  if (event.is_free) return 'Free';
  if (event.price_low && event.price_high && event.price_low !== event.price_high) {
    return `$${event.price_low} - $${event.price_high}`;
  }
  if (event.price_low) return `$${event.price_low}`;
  return 'See details';
}

export function EventCard({
  event,
  variant = 'default',
  showCategory = true,
  className,
}: EventCardProps) {
  const eventUrl = buildEventUrl(event);

  // Aspect ratio by variant
  const aspectRatio = {
    default: 'aspect-video',
    compact: 'aspect-[4/3]',
    featured: 'aspect-[3/2]',
  };

  // Title size by variant
  const titleSize = {
    default: 'text-lg',
    compact: 'text-base font-medium',
    featured: 'text-xl',
  };

  return (
    <article
      className={cn(
        'bg-warm-white rounded-lg shadow-card overflow-hidden',
        'transition-all duration-200 hover:shadow-card-hover hover:-translate-y-1',
        className
      )}
    >
      <Link href={eventUrl} className="block">
        {/* Image placeholder */}
        <div className={cn('relative', aspectRatio[variant])}>
          <div className="w-full h-full bg-gradient-to-br from-sand to-stone/20 flex items-center justify-center">
            <span className="text-stone text-4xl font-display opacity-50">
              {event.title.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Category badge */}
          {showCategory && event.category_name && (
            <div className="absolute bottom-3 left-3">
              <span className="px-2 py-1 text-xs font-medium bg-warm-white/90 backdrop-blur-sm rounded-full text-charcoal">
                {event.category_name}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Date */}
          <p className="text-sm text-stone mb-1">
            {formatDate(event.start_datetime)}
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
            <p className="text-sm text-stone mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{event.location_name}</span>
            </p>
          )}

          {/* Price */}
          <p className={cn(
            'text-sm font-medium',
            event.is_free ? 'text-sage' : 'text-charcoal'
          )}>
            {formatPrice(event)}
          </p>
        </div>
      </Link>
    </article>
  );
}
