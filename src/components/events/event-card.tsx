/**
 * EVENT CARD COMPONENT
 * ====================
 * Primary event display card with category-colored identity.
 *
 * Design: vibrant city magazine aesthetic — each category has a distinct
 * color accent (3px top border + opaque badge pill). Date format uses
 * day-of-week + time ("Sat · 7pm") for natural schedule planning.
 *
 * FEATURES:
 *   - Per-category color treatment (border + badge)
 *   - Smart date formatting (Today/Tomorrow/day+time)
 *   - Layered depth with lifted hover state
 *   - Responsive image with smart fallbacks
 *   - Memoized for performance in large grids
 *
 * USAGE:
 *   <EventCard event={eventData} />
 *   <EventCard event={eventData} variant="compact" />
 *   <EventCard event={eventData} variant="featured" showCategory />
 */

import { memo } from 'react';
import Link from 'next/link';
import { MapPin, Baby, Users } from 'lucide-react';
import {
  isToday,
  isTomorrow,
  differenceInCalendarDays,
  format,
  getHours,
  getMinutes,
} from 'date-fns';
import { buildEventUrl } from '@/lib/utils/url';
import { cn } from '@/lib/utils';
import { getChildEventLabel } from '@/lib/utils/parent-event-labels';
import { getCategoryColor } from '@/lib/constants/category-colors';
import { EventImage } from './event-image';
import { HeartButtonCompact } from '@/components/hearts';
import { VibeTagPill, AccessBadge, NoiseLevelIndicator } from './vibe-profile';
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
 * Format time portion: "7pm", "12pm", "7:30pm".
 * Drops minutes when they're :00.
 */
function formatTime(date: Date): string {
  const minutes = getMinutes(date);
  if (minutes === 0) {
    return format(date, 'haaa'); // "7pm"
  }
  return format(date, 'h:mmaaa'); // "7:30pm"
}

/**
 * Check whether the event time is midnight (all-day proxy).
 */
function isMidnightOrAllDay(date: Date): boolean {
  return getHours(date) === 0 && getMinutes(date) === 0;
}

/**
 * Format event date for card display.
 *
 * Rules:
 *   Today → "Today · 7pm"
 *   Tomorrow → "Tomorrow · 7pm"
 *   Within this week (next 6 days) → "Wed · 7pm"
 *   Further out → "Apr 12 · 7pm"
 *   All-day / midnight → day portion only (no time)
 */
function formatEventDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const allDay = isMidnightOrAllDay(date);
    const timePart = allDay ? '' : ` · ${formatTime(date)}`;

    if (isToday(date)) {
      return allDay ? 'Today' : `Today${timePart}`;
    }

    if (isTomorrow(date)) {
      return allDay ? 'Tomorrow' : `Tomorrow${timePart}`;
    }

    const daysOut = differenceInCalendarDays(date, now);

    if (daysOut >= 2 && daysOut <= 6) {
      // Within this week — abbreviated day name
      return `${format(date, 'EEE')}${timePart}`;
    }

    // Further out — "Apr 12" format
    return `${format(date, 'MMM d')}${timePart}`;
  } catch {
    console.warn(`⚠️ [EventCard] Invalid date: ${dateString}`);
    return '';
  }
}

/**
 * Format price for display.
 */
function formatPrice(event: EventCardType): string {
  if (event.is_free) return 'Free';

  switch (event.price_type) {
    case 'fixed':
      return event.price_low ? `$${event.price_low}` : 'See details';
    case 'range':
      if (event.price_low && event.price_high) return `$${event.price_low} – $${event.price_high}`;
      if (event.price_low) return `From $${event.price_low}`;
      return 'See details';
    case 'donation':
      return event.price_low ? `$${event.price_low}+ PWYC` : 'Pay What You Can';
    case 'per_session':
      return event.price_low ? `$${event.price_low}/session` : 'See details';
    case 'varies':
      return 'Varies';
    default:
      if (event.price_low && event.price_high && event.price_low !== event.price_high) {
        return `$${event.price_low} – $${event.price_high}`;
      }
      if (event.price_low) return `$${event.price_low}`;
      return 'See details';
  }
}

// =============================================================================
// 🎨 STYLE CONFIGURATIONS
// =============================================================================

const ASPECT_RATIOS: Record<string, string> = {
  default: 'aspect-video',
  compact: 'aspect-[4/3]',
  featured: 'aspect-[3/2]',
};

const TITLE_SIZES: Record<string, string> = {
  default: 'text-lg leading-snug',
  compact: 'text-base font-medium leading-snug',
  featured: 'text-xl leading-snug',
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
  const eventUrl = buildEventUrl(event);
  const categoryColor = getCategoryColor(event.category_slug);

  return (
    <article
      className={cn(
        // Base styles
        'bg-warm-white rounded-lg overflow-hidden',
        // Border for edge definition
        'border border-sand/50',
        // Shadows
        'shadow-card',
        // Hover: deeper shadow + lift
        'transition-all duration-200',
        'hover:shadow-card-lifted hover:-translate-y-1.5',
        className
      )}
      style={{ borderTopWidth: '3px', borderTopColor: categoryColor.accent }}
    >
      <Link href={eventUrl} className="block">
        {/* ---------------------------------------------------------------- */}
        {/* 🖼️ IMAGE SECTION */}
        {/* ---------------------------------------------------------------- */}
        <div className="relative">
          <EventImage
            src={event.image_url}
            fallbackSrc={event.thumbnail_url}
            alt={event.title}
            fallbackLetter={event.title.charAt(0)}
            aspectRatio={ASPECT_RATIOS[variant]}
            priority={priority}
          />

          {/* Category badge — opaque pill, top-left */}
          {showCategory && event.category_name && (
            <div className="absolute top-3 left-3 z-10">
              <span
                className="px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm"
                style={{
                  backgroundColor: categoryColor.bg,
                  color: categoryColor.text,
                }}
              >
                {event.category_name}
              </span>
            </div>
          )}

          {/* Series badge — top-right */}
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

          {/* Heart button — top-right (shifts down if series badge present) */}
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
          {/* Date — promoted to prominent */}
          <p className="text-sm font-semibold text-charcoal mb-1">
            {formatEventDate(event.start_datetime)}
          </p>

          {/* Parent event badge — shows child count for parent events */}
          {event.child_event_count && event.child_event_count > 0 && !event.parent_event_id && (
            <span
              className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mb-1.5"
              style={{
                backgroundColor: `${categoryColor.accent}15`,
                color: categoryColor.accent,
              }}
            >
              {getChildEventLabel(event.category_slug, event.child_event_count)}
            </span>
          )}

          {/* Title */}
          <h3
            className={cn(
              'font-display text-charcoal mb-1 line-clamp-2',
              TITLE_SIZES[variant]
            )}
          >
            {event.title}
          </h3>

          {/* Performers (from linked entities) or fallback talent_name */}
          {event.performers && event.performers.length > 0 ? (
            <p className="text-xs text-stone mb-1 truncate">
              ft. {event.performers.map((p) => p.name).join(', ')}
            </p>
          ) : event.talent_name ? (
            <p className="text-xs text-stone mb-1 truncate">
              feat. {event.talent_name}
            </p>
          ) : null}

          {/* Location + organizer */}
          {event.location_name && (
            <p className="text-sm text-stone mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{event.location_name}</span>
            </p>
          )}
          {event.organizer_name && !event.organizer_is_venue && (
            <p className="text-xs text-stone/80 mb-1.5 truncate">
              by {event.organizer_name}
            </p>
          )}

          {/* Short description teaser */}
          {event.short_description && variant !== 'compact' && (
            <p className="text-xs text-stone/90 mb-2 line-clamp-2 leading-relaxed">
              {event.short_description}
            </p>
          )}

          {/* Badges row: access, vibe tags, noise, age, family */}
          <div className="flex flex-wrap items-center gap-1 mb-2">
            {/* Access badge */}
            {event.access_type && (
              <AccessBadge accessType={event.access_type} isFree={event.is_free} />
            )}

            {/* Vibe tag pills (max 2) */}
            {event.vibe_tags && event.vibe_tags.slice(0, 2).map((tag) => (
              <VibeTagPill key={tag} tag={tag} size="xs" />
            ))}

            {/* Noise level */}
            {event.noise_level && (
              <NoiseLevelIndicator level={event.noise_level} variant="icon" />
            )}

            {/* Age restriction */}
            {event.age_restriction && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-800">
                <Baby className="w-3 h-3" aria-hidden="true" />
                {event.age_restriction}
              </span>
            )}

            {/* Family friendly */}
            {event.is_family_friendly && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">
                <Users className="w-3 h-3" aria-hidden="true" />
                Family Friendly
              </span>
            )}

            {/* Membership benefit badge */}
            {event.has_member_benefits && event.member_benefit_label && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                event.member_benefit_label === 'Free for members'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {event.member_benefit_label}
              </span>
            )}
          </div>

          {/* Price */}
          {event.is_free ? (
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-sage/10 text-sage">
              Free
            </span>
          ) : (
            <p className="text-sm font-semibold text-charcoal">
              {formatPrice(event)}
            </p>
          )}
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
