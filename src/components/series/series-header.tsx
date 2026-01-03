/**
 * SERIES HEADER COMPONENT
 * =======================
 * Hero section for series detail pages.
 * Shows image, title, type, dates, location, and CTA.
 */

import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Users,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { SeriesTypeBadge } from './series-type-badge';
import { SeriesPrice } from './series-price';
import { formatDateRange } from '@/lib/utils/dates';
import { formatRecurrence } from '@/types';
import { cn, getBestImageUrl } from '@/lib/utils';
import type { SeriesWithDetails } from '@/types';

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface SeriesHeaderProps {
  /** Full series data */
  series: SeriesWithDetails;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Hero section for series detail page.
 * Shows all key information and CTA.
 *
 * @example
 * ```tsx
 * <SeriesHeader series={series} />
 * ```
 */
export function SeriesHeader({ series, className }: SeriesHeaderProps) {
  const imageUrl = getBestImageUrl(series.thumbnail_url, series.image_url);

  // Format date range
  const dateDisplay = series.start_date
    ? formatDateRange(series.start_date, series.end_date)
    : null;

  // Format recurrence for recurring series
  const recurrenceDisplay = series.recurrence_rule
    ? formatRecurrence(series.recurrence_rule)
    : null;

  // Session count display
  const sessionDisplay = series.total_sessions
    ? series.sessions_remaining
      ? `${series.sessions_remaining} of ${series.total_sessions} sessions remaining`
      : `${series.total_sessions} sessions total`
    : null;

  return (
    <section className={cn('grid lg:grid-cols-2 gap-8', className)}>
      {/* Image */}
      <div className="relative aspect-video lg:aspect-[4/3] rounded-lg overflow-hidden bg-sand">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={series.title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        ) : (
          // Placeholder with gradient
          <div className="w-full h-full bg-gradient-to-br from-sage/20 to-coral/20 flex items-center justify-center">
            <span className="text-stone/30 text-display font-display">
              {series.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Type badge overlay */}
        <div className="absolute top-4 left-4">
          <SeriesTypeBadge type={series.series_type} size="lg" />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col">
        {/* Category breadcrumb */}
        {series.category && (
          <Link
            href={`/events/${series.category.slug}`}
            className="text-body-sm text-coral hover:underline mb-2"
          >
            {series.category.name}
          </Link>
        )}

        {/* Title */}
        <h1 className="font-display text-h1 text-charcoal mb-4">
          {series.title}
        </h1>

        {/* Meta information */}
        <div className="space-y-3 mb-6">
          {/* Date range or recurrence */}
          {(dateDisplay || recurrenceDisplay) && (
            <div className="flex items-start gap-3 text-body text-stone">
              <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                {dateDisplay && <p>{dateDisplay}</p>}
                {recurrenceDisplay && (
                  <p className="text-sage">{recurrenceDisplay}</p>
                )}
              </div>
            </div>
          )}

          {/* Location */}
          {series.location && (
            <div className="flex items-start gap-3 text-body text-stone">
              <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <Link
                  href={`/venue/${series.location.slug}`}
                  className="text-charcoal hover:text-coral transition-colors"
                >
                  {series.location.name}
                </Link>
                {series.location.city && (
                  <p className="text-body-sm">{series.location.city}</p>
                )}
              </div>
            </div>
          )}

          {/* Sessions */}
          {sessionDisplay && (
            <div className="flex items-center gap-3 text-body text-stone">
              <Users className="w-5 h-5 flex-shrink-0" />
              <span>{sessionDisplay}</span>
            </div>
          )}

          {/* Duration (if set in recurrence) */}
          {series.recurrence_rule?.duration_minutes && (
            <div className="flex items-center gap-3 text-body text-stone">
              <Clock className="w-5 h-5 flex-shrink-0" />
              <span>{formatDuration(series.recurrence_rule.duration_minutes)}</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="mb-6">
          <SeriesPrice series={series} size="lg" />
          {series.price_details && (
            <p className="text-body-sm text-stone mt-1">{series.price_details}</p>
          )}
        </div>

        {/* CTA button */}
        {series.registration_url && (
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto"
          >
            <a
              href={series.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              {series.registration_required ? 'Register Now' : 'Get Tickets'}
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        )}

        {/* Organizer link */}
        {series.organizer && (
          <div className="mt-6 pt-6 border-t border-sand">
            <p className="text-body-sm text-stone mb-1">Presented by</p>
            <Link
              href={`/organizer/${series.organizer.slug}`}
              className="text-body font-medium text-charcoal hover:text-coral transition-colors"
            >
              {series.organizer.name}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format duration in minutes to human-readable string.
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  return `${hours}h ${mins}m`;
}
