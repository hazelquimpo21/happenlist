/**
 * SERIES HEADER COMPONENT
 * =======================
 * Hero section for series detail pages.
 * Shows image, title, type, dates, location, CTA, and
 * Phase C camps/classes info (care options, attendance, age, skill, pricing).
 */

import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Users,
  ExternalLink,
  Clock,
  Shield,
  DollarSign,
  Baby,
  GraduationCap,
  CalendarDays,
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { SeriesTypeBadge } from './series-type-badge';
import { SeriesPrice } from './series-price';
import { formatDateRange } from '@/lib/utils/dates';
import {
  formatRecurrence,
  formatAgeRange,
  formatTimeDisplay,
  ATTENDANCE_MODE_INFO,
  SKILL_LEVEL_INFO,
  DAY_OF_WEEK_SHORT,
} from '@/types';
import { cn, getBestImageUrl } from '@/lib/utils';
import type { SeriesWithDetails } from '@/types';
import type { AttendanceMode, SkillLevel } from '@/lib/supabase/types';

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
        <h1 className="font-display text-h1 text-charcoal mb-2">
          {series.title}
        </h1>

        {/* Phase C: Quick-glance badges row (attendance, age, skill) */}
        <SeriesQuickBadges series={series} />

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

          {/* Phase C: Core hours (for camps/classes with structured times) */}
          {(series.core_start_time || series.core_end_time) && (
            <div className="flex items-center gap-3 text-body text-stone">
              <Clock className="w-5 h-5 flex-shrink-0" />
              <span>
                {formatTimeDisplay(series.core_start_time)}
                {series.core_start_time && series.core_end_time && ' – '}
                {formatTimeDisplay(series.core_end_time)}
              </span>
            </div>
          )}

          {/* Phase C: Days of week (for camps: Mon-Fri display) */}
          {series.days_of_week && series.days_of_week.length > 0 && (
            <div className="flex items-center gap-3 text-body text-stone">
              <CalendarDays className="w-5 h-5 flex-shrink-0" />
              <span>{formatDaysOfWeek(series.days_of_week)}</span>
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

          {/* Duration (if set in recurrence and no core times) */}
          {series.recurrence_rule?.duration_minutes && !series.core_start_time && (
            <div className="flex items-center gap-3 text-body text-stone">
              <Clock className="w-5 h-5 flex-shrink-0" />
              <span>{formatDuration(series.recurrence_rule.duration_minutes)}</span>
            </div>
          )}

          {/* Phase C: Age range (if set) */}
          {(series.age_low != null || series.age_high != null) && (
            <div className="flex items-start gap-3 text-body text-stone">
              <Baby className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p>{formatAgeRange(series.age_low, series.age_high)}</p>
                {series.age_details && (
                  <p className="text-body-sm text-stone/70">{series.age_details}</p>
                )}
              </div>
            </div>
          )}

          {/* Phase C: Skill level (if set) */}
          {series.skill_level && (
            <div className="flex items-center gap-3 text-body text-stone">
              <GraduationCap className="w-5 h-5 flex-shrink-0" />
              <span>{SKILL_LEVEL_INFO[series.skill_level as SkillLevel]?.label ?? series.skill_level}</span>
            </div>
          )}
        </div>

        {/* Phase C: Extended care callout (for camps with before/after care) */}
        <ExtendedCareSection series={series} />

        {/* Price section (enhanced for Phase C) */}
        <div className="mb-6">
          <SeriesPrice series={series} size="lg" />

          {/* Phase C: Per-session / drop-in price */}
          {series.per_session_price != null && series.per_session_price > 0 && (
            <p className="text-body text-stone mt-1">
              Drop-in: ${series.per_session_price % 1 === 0 ? series.per_session_price : series.per_session_price.toFixed(2)}/session
            </p>
          )}

          {/* Phase C: Materials fee */}
          {series.materials_fee != null && series.materials_fee > 0 && (
            <p className="text-body-sm text-stone mt-1">
              Materials fee: ${series.materials_fee % 1 === 0 ? series.materials_fee : series.materials_fee.toFixed(2)}
            </p>
          )}

          {/* Existing price_details */}
          {series.price_details && (
            <p className="text-body-sm text-stone mt-1">{series.price_details}</p>
          )}

          {/* Phase C: Pricing notes (early bird, discounts, etc.) */}
          {series.pricing_notes && (
            <p className="text-body-sm text-stone/80 mt-1 italic">{series.pricing_notes}</p>
          )}
        </div>

        {/* CTA button -- label adapts to attendance mode */}
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
              {getCtaLabel(series)}
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        )}

        {/* Phase C: Term/semester label */}
        {series.term_name && (
          <p className="text-body-sm text-stone mt-3">
            Term: <span className="font-medium text-charcoal">{series.term_name}</span>
          </p>
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

// ============================================================================
// PHASE C: QUICK BADGES ROW
// ============================================================================

/**
 * Renders a row of quick-glance badges below the title.
 * Shows attendance mode, age range, and skill level in compact badge form.
 */
function SeriesQuickBadges({ series }: { series: SeriesWithDetails }) {
  const badges: React.ReactNode[] = [];

  // Attendance mode badge
  if (series.attendance_mode) {
    const info = ATTENDANCE_MODE_INFO[series.attendance_mode as AttendanceMode];
    if (info) {
      badges.push(
        <span key="attendance" className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', info.badgeColor)}>
          {info.label}
        </span>
      );
    }
  }

  // Age range badge
  const ageText = formatAgeRange(series.age_low, series.age_high);
  if (ageText) {
    badges.push(
      <span key="age" className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
        {ageText}
      </span>
    );
  }

  // Skill level badge
  if (series.skill_level) {
    const info = SKILL_LEVEL_INFO[series.skill_level as SkillLevel];
    if (info) {
      badges.push(
        <span key="skill" className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', info.badgeColor)}>
          {info.label}
        </span>
      );
    }
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mb-4">
      {badges}
    </div>
  );
}

// ============================================================================
// PHASE C: EXTENDED CARE SECTION
// ============================================================================

/**
 * Renders the extended care callout box for camps with before/after care.
 * Follows the wireframe design from PLAN-CAMPS-CLASSES-SERIES.md.
 */
function ExtendedCareSection({ series }: { series: SeriesWithDetails }) {
  // Only show if either extended time is set
  const hasExtendedCare = series.extended_start_time || series.extended_end_time;
  if (!hasExtendedCare) return null;

  return (
    <div className="mb-6 p-4 bg-sky-50 border border-sky-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-4 h-4 text-sky-700" />
        <h3 className="text-body font-medium text-sky-900">Extended Care Available</h3>
      </div>

      <div className="space-y-1 text-body-sm text-sky-800">
        {/* Before care line */}
        {series.extended_start_time && series.core_start_time && (
          <p>
            Before care: {formatTimeDisplay(series.extended_start_time)} – {formatTimeDisplay(series.core_start_time)}
          </p>
        )}

        {/* After care line */}
        {series.extended_end_time && series.core_end_time && (
          <p>
            After care: {formatTimeDisplay(series.core_end_time)} – {formatTimeDisplay(series.extended_end_time)}
          </p>
        )}
      </div>

      {/* Human-readable details (pricing, notes, etc.) */}
      {series.extended_care_details && (
        <p className="text-body-sm text-sky-700 mt-2 italic">
          {series.extended_care_details}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// PHASE C: CTA LABEL HELPER
// ============================================================================

/**
 * Determines the CTA button label based on attendance mode.
 * - registered: "Register Now"
 * - drop_in: "More Info"
 * - hybrid: "Register or Drop In"
 * - fallback: uses registration_required field
 */
function getCtaLabel(series: SeriesWithDetails): string {
  switch (series.attendance_mode) {
    case 'drop_in':
      return 'More Info';
    case 'hybrid':
      return 'Register or Drop In';
    case 'registered':
      return 'Register Now';
    default:
      return series.registration_required ? 'Register Now' : 'Get Tickets';
  }
}

// ============================================================================
// PHASE C: DAYS OF WEEK FORMATTER
// ============================================================================

/**
 * Format days_of_week array to human-readable string.
 * Examples:
 *   [1,2,3,4,5] -> "Mon – Fri"
 *   [1,3,5] -> "Mon, Wed, Fri"
 *   [0,6] -> "Sat, Sun"
 */
function formatDaysOfWeek(days: number[]): string {
  if (!days || days.length === 0) return '';

  const sorted = [...days].sort((a, b) => a - b);

  // Check for consecutive weekday range (Mon-Fri)
  if (sorted.length >= 3) {
    const isConsecutive = sorted.every((d, i) =>
      i === 0 || d === sorted[i - 1] + 1
    );
    if (isConsecutive) {
      return `${DAY_OF_WEEK_SHORT[sorted[0]]} – ${DAY_OF_WEEK_SHORT[sorted[sorted.length - 1]]}`;
    }
  }

  // Individual days
  return sorted.map(d => DAY_OF_WEEK_SHORT[d]).join(', ');
}
