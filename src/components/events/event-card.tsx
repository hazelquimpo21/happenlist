/**
 * EVENT CARD COMPONENT
 * ====================
 * 🎴 Primary event display card for grids and lists.
 *
 * FEATURES:
 *   - Responsive image with smart fallbacks
 *   - Optimized with Next.js Image (lazy loading, WebP)
 *   - Memoized for performance in large grids
 *   - Beautiful hover effects and animations
 *   - Accessible with proper semantic markup
 *
 * USAGE:
 *   <EventCard event={eventData} />
 *   <EventCard event={eventData} variant="compact" />
 *   <EventCard event={eventData} variant="featured" showCategory />
 */

import { memo } from 'react';
import Link from 'next/link';
import { MapPin, Baby, Users } from 'lucide-react';
import { buildEventUrl } from '@/lib/utils/url';
import { cn } from '@/lib/utils';
import { EventImage } from './event-image';
import { HeartButtonCompact } from '@/components/hearts';
import type { EventCard as EventCardType } from '@/types';

// =============================================================================
// 📋 TYPES
// =============================================================================

interface EventCardProps {
  /** Event data to display */
  event: EventCardType;
  /** Card variant: default, compact (smaller), or featured (larger) */
  variant?: 'default' | 'compact' | 'featured';
  /** Show category badge on the image */
  showCategory?: boolean;
  /** Show "Part of a series" badge */
  showSeriesBadge?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Use priority loading for above-the-fold images */
  priority?: boolean;
}

// =============================================================================
// 🛠️ HELPER FUNCTIONS
// =============================================================================

/**
 * Format event date for display.
 *
 * @example
 *   formatDate('2026-02-14T19:00:00Z') → 'Feb 14'
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    console.warn(`⚠️ [EventCard] Invalid date: ${dateString}`);
    return '';
  }
}

/**
 * Format price for display.
 *
 * @example
 *   formatPrice({ is_free: true }) → 'Free'
 *   formatPrice({ price_low: 15, price_high: 25 }) → '$15 - $25'
 *   formatPrice({ price_low: 20 }) → '$20'
 */
function formatPrice(event: EventCardType): string {
  if (event.is_free) return 'Free';

  // Range price
  if (event.price_low && event.price_high && event.price_low !== event.price_high) {
    return `$${event.price_low} - $${event.price_high}`;
  }

  // Fixed price
  if (event.price_low) return `$${event.price_low}`;

  // Unknown price
  return 'See details';
}

// =============================================================================
// 🎨 STYLE CONFIGURATIONS
// =============================================================================

/**
 * Aspect ratio classes for different variants.
 * - default: 16:9 (standard video ratio, works well for landscape images)
 * - compact: 4:3 (slightly taller, good for smaller cards)
 * - featured: 3:2 (classic photo ratio, great for hero images)
 */
const ASPECT_RATIOS: Record<string, string> = {
  default: 'aspect-video',       // 16:9
  compact: 'aspect-[4/3]',       // 4:3
  featured: 'aspect-[3/2]',      // 3:2
};

/**
 * Title size classes for different variants.
 */
const TITLE_SIZES: Record<string, string> = {
  default: 'text-lg',
  compact: 'text-base font-medium',
  featured: 'text-xl',
};

// =============================================================================
// 🎴 EVENT CARD COMPONENT
// =============================================================================

function EventCardComponent({
  event,
  variant = 'default',
  showCategory = true,
  showSeriesBadge = false,
  className,
  priority = false,
}: EventCardProps) {
  // Build the URL for this event
  const eventUrl = buildEventUrl(event);

  return (
    <article
      className={cn(
        // Base styles
        'bg-warm-white rounded-lg shadow-card overflow-hidden',
        // Hover effects: lift up and enhance shadow
        'transition-all duration-200',
        'hover:shadow-card-hover hover:-translate-y-1',
        // Additional classes
        className
      )}
    >
      <Link href={eventUrl} className="block">
        {/* ---------------------------------------------------------------- */}
        {/* 🖼️ IMAGE SECTION */}
        {/* ---------------------------------------------------------------- */}
        <div className="relative">
          {/* Event Image with smart fallback */}
          <EventImage
            src={event.image_url}
            fallbackSrc={event.thumbnail_url}
            alt={event.title}
            fallbackLetter={event.title.charAt(0)}
            aspectRatio={ASPECT_RATIOS[variant]}
            priority={priority}
          />

          {/* Category badge - overlaid on image */}
          {showCategory && event.category_name && (
            <div className="absolute bottom-3 left-3 z-10">
              <span
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded-full',
                  'bg-warm-white/90 backdrop-blur-sm text-charcoal',
                  'shadow-sm'
                )}
              >
                {event.category_name}
              </span>
            </div>
          )}

          {/* Series badge - overlaid on image top-right */}
          {showSeriesBadge && event.is_series_instance && event.series_title && (
            <div className="absolute top-3 right-3 z-10">
              <span
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded-full',
                  'bg-coral/90 backdrop-blur-sm text-white',
                  'shadow-sm'
                )}
              >
                Series
              </span>
            </div>
          )}

          {/* Heart button - overlaid on image */}
          <div className={cn(
            'absolute z-10',
            showSeriesBadge && event.is_series_instance ? 'top-10 right-3' : 'top-3 right-3'
          )}>
            <HeartButtonCompact
              eventId={event.id}
              className="bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white/95"
            />
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* 📝 CONTENT SECTION */}
        {/* ---------------------------------------------------------------- */}
        <div className="p-4">
          {/* Date */}
          <p className="text-sm text-stone mb-1">
            {formatDate(event.start_datetime)}
          </p>

          {/* Title */}
          <h3
            className={cn(
              'font-display text-charcoal mb-1 line-clamp-2',
              TITLE_SIZES[variant]
            )}
          >
            {event.title}
          </h3>

          {/* Location */}
          {event.location_name && (
            <p className="text-sm text-stone mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{event.location_name}</span>
            </p>
          )}

          {/* Age / audience badges */}
          {(event.age_restriction || event.is_family_friendly) && (
            <div className="flex flex-wrap gap-1 mb-2">
              {event.age_restriction && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  <Baby className="w-3 h-3" aria-hidden="true" />
                  {event.age_restriction}
                </span>
              )}
              {event.is_family_friendly && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  <Users className="w-3 h-3" aria-hidden="true" />
                  Family Friendly
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <p
            className={cn(
              'text-sm font-medium',
              event.is_free ? 'text-sage' : 'text-charcoal'
            )}
          >
            {formatPrice(event)}
          </p>
        </div>
      </Link>
    </article>
  );
}

// =============================================================================
// 📤 EXPORTS
// =============================================================================

/**
 * Memoized EventCard component.
 *
 * 💡 PERFORMANCE:
 *    - Prevents re-renders when parent component updates
 *    - In a grid of 24 cards, only cards with changed data re-render
 *    - Critical for smooth scrolling in event listings
 */
export const EventCard = memo(EventCardComponent);
EventCard.displayName = 'EventCard';
