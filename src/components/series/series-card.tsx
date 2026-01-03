/**
 * SERIES CARD COMPONENT
 * =====================
 * Primary series display card for grids and lists.
 * Shows series info with type badge, session count, and dates.
 */

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Calendar, Users } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { SeriesTypeBadge } from './series-type-badge';
import { SeriesPrice } from './series-price';
import { formatDateRange } from '@/lib/utils/dates';
import { cn, getBestImageUrl } from '@/lib/utils';
import type { SeriesCard as SeriesCardType } from '@/types';

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface SeriesCardProps {
  /** Series data */
  series: SeriesCardType;
  /** Card variant */
  variant?: 'default' | 'compact' | 'featured';
  /** Show category badge (in addition to type badge) */
  showCategory?: boolean;
  /** Show session count */
  showSessions?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Series card for displaying in grids and lists.
 *
 * @example Basic usage
 * ```tsx
 * <SeriesCard series={series} />
 * ```
 *
 * @example Featured variant
 * ```tsx
 * <SeriesCard series={series} variant="featured" showCategory />
 * ```
 */
export function SeriesCard({
  series,
  variant = 'default',
  showCategory = false,
  showSessions = true,
  className,
}: SeriesCardProps) {
  // Build series detail URL
  const seriesUrl = `/series/${series.slug}`;

  // Get validated image URL
  const imageUrl = getBestImageUrl(series.thumbnail_url, series.image_url);

  // Image aspect ratio by variant
  const aspectRatio = {
    default: 'aspect-video',
    compact: 'aspect-[4/3]',
    featured: 'aspect-[3/2]',
  };

  // Title size by variant
  const titleSize = {
    default: 'text-h3',
    compact: 'text-body font-medium',
    featured: 'text-h2',
  };

  // Format date range for display
  const dateDisplay = series.start_date
    ? formatDateRange(series.start_date, series.end_date)
    : series.next_event_date
    ? `Next: ${formatDateRange(series.next_event_date, null)}`
    : null;

  // Session info text
  const sessionInfo = series.total_sessions
    ? series.sessions_remaining
      ? `${series.sessions_remaining} of ${series.total_sessions} sessions left`
      : `${series.total_sessions} sessions`
    : series.upcoming_event_count
    ? `${series.upcoming_event_count} upcoming`
    : null;

  return (
    <Card hover className={cn('overflow-hidden group', className)}>
      <Link href={seriesUrl} className="block">
        {/* Image container */}
        <div className={cn('relative', aspectRatio[variant])}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={series.title}
              fill
              className="object-cover transition-transform duration-slow group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            // Placeholder gradient with series type icon
            <div className="w-full h-full bg-gradient-to-br from-sage/20 to-coral/20 flex items-center justify-center">
              <span className="text-stone text-h1 font-display opacity-50">
                {series.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Badge stack (top-right) */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5">
            <SeriesTypeBadge type={series.series_type} size="sm" />
            {showCategory && series.category_name && (
              <Badge
                variant="category"
                className="bg-warm-white/90 backdrop-blur-sm"
              >
                {series.category_name}
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Date range */}
          {dateDisplay && (
            <p className="text-body-sm text-stone mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span>{dateDisplay}</span>
            </p>
          )}

          {/* Title */}
          <h3
            className={cn(
              'font-display text-charcoal mb-1 line-clamp-2',
              titleSize[variant]
            )}
          >
            {series.title}
          </h3>

          {/* Location */}
          {series.location_name && (
            <p className="text-body-sm text-stone mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{series.location_name}</span>
            </p>
          )}

          {/* Session count */}
          {showSessions && sessionInfo && (
            <p className="text-body-sm text-sage mb-2 flex items-center gap-1">
              <Users className="w-3 h-3 flex-shrink-0" />
              <span>{sessionInfo}</span>
            </p>
          )}

          {/* Price */}
          <SeriesPrice series={series} size="sm" />
        </div>
      </Link>
    </Card>
  );
}
