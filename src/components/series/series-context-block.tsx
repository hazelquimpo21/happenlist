/**
 * SERIES CONTEXT BLOCK
 * ====================
 * Friendly, prominent block shown on the event detail page when the event
 * belongs to a series. Replaces the terse "Class" / "#3" pill with warm,
 * plain-English framing + real CTAs.
 *
 * Design intent:
 *   - Visually tied to the category (tinted background using category accent)
 *   - Plain language that tells the truth about the rhythm:
 *       • Regular:   "Happens every Tuesday"
 *       • Daily run: "Runs daily"
 *       • Irregular: "Runs on various dates" (theater seasons, festivals,
 *                    camps where each performance/session has its own
 *                    date/time and there's no clean weekly rule)
 *   - Count-aware unit: "5 more performances" for seasons, "12 more sessions"
 *     for classes, "27 more dates" default. Be honest about what's ahead.
 *   - Clear primary CTA → series detail page ("See all dates")
 *
 * Cross-file coupling:
 *   - src/app/event/[slug]/page.tsx — sole consumer; passes seriesInfo + stats
 *   - src/data/series/get-series-detail.ts — SeriesSummary, getSeriesStats
 *   - src/lib/constants/category-colors.ts — tint source
 *   - src/types/series.ts — SERIES_TYPE_INFO for labeling
 */

import Link from 'next/link';
import { Repeat, ArrowRight } from 'lucide-react';
import { getCategoryColor } from '@/lib/constants/category-colors';
import { getSeriesTypeInfo } from '@/types';
import type { SeriesSummary } from '@/data/series/get-series-detail';

// ============================================================================
// COPY HELPERS
// ============================================================================

const DAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/** Short day labels for multi-day weekly patterns. */
const DAY_LABELS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/**
 * Friendly noun per series type — used inline ("Part of a weekly CLASS").
 * Kept lowercase on purpose.
 */
const SERIES_TYPE_NOUN: Record<string, string> = {
  class: 'class series',
  workshop: 'workshop series',
  camp: 'camp',
  recurring: 'series',
  lifestyle: 'series',
  ongoing: 'series',
  exhibit: 'exhibit',
  festival: 'festival',
  season: 'season',
  annual: 'annual event',
};

/**
 * Unit label for "N more ___" line.
 * Matches what people would naturally say for that series type.
 */
function countUnit(seriesType: string, count: number): string {
  const plural = count !== 1;
  switch (seriesType) {
    case 'class':
    case 'workshop':
      return plural ? 'sessions' : 'session';
    case 'camp':
      return plural ? 'camp days' : 'camp day';
    case 'season':
    case 'festival':
      return plural ? 'performances' : 'performance';
    case 'exhibit':
      return plural ? 'viewing dates' : 'viewing date';
    default:
      return plural ? 'dates' : 'date';
  }
}

/** Frequency adjective used in the headline ("weekly class series"). */
const FREQUENCY_ADJECTIVE: Record<string, string> = {
  daily: 'daily',
  weekly: 'weekly',
  biweekly: 'bi-weekly',
  monthly: 'monthly',
  yearly: 'annual',
};

/**
 * Series types where prepending a frequency adjective would feel wrong
 * (a festival isn't "weekly" — each day is distinct content).
 */
const NO_FREQUENCY_ADJECTIVE = new Set(['season', 'festival', 'camp', 'annual']);

/**
 * Build the headline pill: "Part of a weekly class series"
 *
 * Handles:
 *   - Article agreement ("a weekly class" vs "an annual event")
 *   - Suppressing frequency for types where it doesn't apply
 *   - Fallback when recurrence is unknown or irregular
 */
function buildHeadline(seriesType: string, frequency: string | null): string {
  const noun = SERIES_TYPE_NOUN[seriesType] ?? 'series';

  const useFreq = frequency && !NO_FREQUENCY_ADJECTIVE.has(seriesType);
  const descriptor = useFreq && frequency
    ? `${FREQUENCY_ADJECTIVE[frequency] ?? frequency} ${noun}`
    : noun;

  const article = /^[aeiou]/i.test(descriptor) ? 'an' : 'a';
  return `Part of ${article} ${descriptor}`;
}

/**
 * Build the rhythm line: the plain-English answer to "when does this run?"
 *
 * Returns null when we can't say something concrete — the caller should
 * fall back to showing the count line only ("5 more performances") so we
 * don't lie about irregular schedules.
 *
 * Examples:
 *   weekly + Tue              → "Happens every Tuesday"
 *   weekly + Tue/Thu/Sat      → "Happens every Tue, Thu & Sat"
 *   biweekly + Fri            → "Happens every other Friday"
 *   monthly + 15              → "Happens monthly on the 15th"
 *   monthly (no day)          → "Happens monthly"
 *   daily                     → "Runs daily"
 *   yearly                    → "Happens once a year"
 *   anything irregular/empty  → null (caller decides)
 */
function buildRhythmLine(
  rule: Record<string, unknown> | null,
  seriesType: string
): string | null {
  // Festivals/seasons/camps are inherently multi-day runs of distinct content.
  // Don't try to describe them as a rhythm — the count line carries the weight.
  if (seriesType === 'festival' || seriesType === 'season' || seriesType === 'camp') {
    return null;
  }

  if (!rule) return null;

  const frequency = rule.frequency as string | undefined;
  const daysOfWeek = rule.days_of_week as number[] | undefined;
  const dayOfMonth = rule.day_of_month as number | undefined;

  if (frequency === 'daily') {
    return 'Runs daily';
  }

  if (frequency === 'weekly' && daysOfWeek?.length === 1) {
    return `Happens every ${DAY_LABELS[daysOfWeek[0]]}`;
  }
  if (frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 1) {
    const names = daysOfWeek.map((d) => DAY_LABELS_SHORT[d]);
    const joined = names.length === 2
      ? names.join(' & ')
      : `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
    return `Happens every ${joined}`;
  }
  if (frequency === 'weekly') {
    return 'Happens weekly';
  }

  if (frequency === 'biweekly' && daysOfWeek?.length === 1) {
    return `Happens every other ${DAY_LABELS[daysOfWeek[0]]}`;
  }
  if (frequency === 'biweekly') {
    return 'Happens every other week';
  }

  if (frequency === 'monthly' && dayOfMonth) {
    const v = dayOfMonth % 100;
    const suffix = ['th', 'st', 'nd', 'rd'];
    const ord = dayOfMonth + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
    return `Happens monthly on the ${ord}`;
  }
  if (frequency === 'monthly') {
    return 'Happens monthly';
  }

  if (frequency === 'yearly') {
    return 'Happens once a year';
  }

  // Frequency key present but unrecognized — honest fallback.
  return null;
}

// ============================================================================
// COMPONENT
// ============================================================================

interface SeriesContextBlockProps {
  /** Series metadata from getSeriesById. */
  seriesInfo: SeriesSummary;
  /** Category slug drives the tint — defaults to a neutral treatment if absent. */
  categorySlug: string | null;
  /** Session number within the series (e.g. "Session 3 of 8"). */
  sequenceNumber: number | null;
  /** Upcoming-dates count from getSeriesStats (excluding current event). */
  upcomingCount: number;
  /** Whether the page has a past-instances section to link to. */
  hasPastInstances: boolean;
}

export function SeriesContextBlock({
  seriesInfo,
  categorySlug,
  sequenceNumber,
  upcomingCount,
  hasPastInstances,
}: SeriesContextBlockProps) {
  const categoryColor = getCategoryColor(categorySlug ?? 'music');
  const typeInfo = getSeriesTypeInfo(seriesInfo.series_type);
  const frequency = (seriesInfo.recurrence_rule?.frequency as string | undefined) ?? null;

  const headline = buildHeadline(seriesInfo.series_type, frequency);
  const rhythmLine = buildRhythmLine(seriesInfo.recurrence_rule, seriesInfo.series_type);

  // "Session N of M" — only meaningful for structured educational types
  // (class/workshop/camp). For a recurring karaoke night, saying "session 1"
  // is nonsensical; the user just wants to know it repeats.
  const SEQUENCE_TYPES = new Set(['class', 'workshop', 'camp']);
  const showSequence =
    sequenceNumber != null && SEQUENCE_TYPES.has(seriesInfo.series_type);
  const sequenceLine = showSequence
    ? seriesInfo.total_sessions
      ? `Session ${sequenceNumber} of ${seriesInfo.total_sessions}`
      : `Session ${sequenceNumber}`
    : null;

  // "5 more performances" — series-type-aware unit.
  const moreDatesLine =
    upcomingCount > 0
      ? `${upcomingCount} more upcoming ${countUnit(seriesInfo.series_type, upcomingCount)}`
      : null;

  // Honest fallback: no rhythm + multiple upcoming dates = tell the truth.
  // This matters for theater runs / festivals where times shift daily and a
  // weekly label would be a lie.
  const showVariesLine = !rhythmLine && upcomingCount > 1;

  // "Last chance" line — only upcoming date. Friendly reassurance vs a
  // silent fallback. Skip for annual (one-per-year is the point).
  const showLastChanceLine =
    upcomingCount === 0 && seriesInfo.series_type !== 'annual';

  return (
    <section
      className="rounded-xl border p-5 sm:p-6"
      style={{
        backgroundColor: `${categoryColor.accent}0D`, // ~5% tint
        borderColor: `${categoryColor.accent}33`,     // ~20% tint
      }}
      aria-labelledby="series-context-heading"
    >
      {/* Little banner row — immediately orients the user */}
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3"
        style={{
          backgroundColor: `${categoryColor.accent}1F`,
          color: categoryColor.accent,
        }}
      >
        <Repeat className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{headline}</span>
      </div>

      {/* Series title — tells the user the name of the thing they're part of */}
      <h2
        id="series-context-heading"
        className="font-body text-lg sm:text-xl font-bold text-ink leading-snug mb-1"
      >
        {seriesInfo.title}
      </h2>

      {/* Rhythm + count — plain English, short lines */}
      <div className="text-body-sm text-zinc space-y-0.5 mb-4">
        {rhythmLine && <p>{rhythmLine}</p>}
        {showVariesLine && <p>Runs on various dates &amp; times</p>}
        {moreDatesLine && <p>{moreDatesLine}</p>}
        {showLastChanceLine && (
          <p className="text-ink font-medium">
            {hasPastInstances
              ? 'Last upcoming date in this series'
              : 'Only date currently scheduled'}
          </p>
        )}
        {sequenceLine && (
          <p className="text-zinc/80">You&apos;re looking at {sequenceLine.toLowerCase()}</p>
        )}
        {/* Last-resort fallback: no rhythm, no count, no sequence. Use the
            series-type description so the block still feels intentional. */}
        {!rhythmLine && !showVariesLine && !moreDatesLine && !showLastChanceLine && !sequenceLine && (
          <p>{typeInfo.description}</p>
        )}
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/series/${seriesInfo.slug}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-pure transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            backgroundColor: categoryColor.accent,
          }}
        >
          See all dates
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>

        {hasPastInstances && (
          <a
            href="#past-instances-heading"
            className="inline-flex items-center text-sm font-medium text-zinc hover:text-ink underline decoration-1 underline-offset-4"
          >
            See past dates
          </a>
        )}
      </div>
    </section>
  );
}
