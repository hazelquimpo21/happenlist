/**
 * MATERIALIZE FUTURE SERIES INSTANCES
 * ===================================
 * Single writer for "given a series + recurrence_rule + a template event,
 * generate child event rows for each future date that doesn't already exist."
 *
 * Used by:
 *   - POST /api/superadmin/events/[id]/make-recurring
 *   - POST /api/superadmin/events/[id]/attach-series (when target series is recurring)
 *   - GET  /api/cron/extend-recurring-series (nightly top-up)
 *
 * Why one helper:
 *   Three call sites used to duplicate slug generation, end-time math,
 *   field cloning from a template, and the date-already-exists check.
 *   Drift between them caused the "attach-series doesn't generate"
 *   bug. This file is now the only path that inserts series instances
 *   from a recurrence rule.
 *
 * Idempotency:
 *   - Pre-fetches existing (non-cancelled) instance_dates for the series
 *     and skips any candidate date that's already there.
 *   - The DB partial unique index events_series_instance_date_uniq
 *     (migration 20260427_1200_series_instance_unique.sql) is the backstop
 *     in case a race slips past the pre-filter.
 *
 * @module data/series/materialize-instances
 */

import { generateSlug } from '@/lib/utils/slug';
import {
  calculateRecurringDates,
  addMinutesToTime,
} from '@/lib/utils/recurrence';
import { MAX_RECURRING_GENERATION } from '@/lib/constants/series-limits';
import type { RecurrenceRule } from '@/lib/supabase/types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Minimal shape we need from an existing event to clone into new instances.
 * Routes pass `select('*')` rows; this interface documents which columns
 * actually get used.
 */
export interface InstanceTemplate {
  title: string;
  description: string | null;
  short_description: string | null;
  category_id: string | null;
  location_id: string | null;
  organizer_id: string | null;
  price_type: string | null;
  price_low: number | null;
  price_high: number | null;
  price_details: string | null;
  ticket_url: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  registration_url: string | null;
  timezone: string | null;
  status: string | null;
  // Optional fall-through for time/duration when rule omits them.
  start_datetime?: string | null;
}

export interface MaterializeOptions {
  /** Series the new instances belong to. */
  seriesId: string;
  /** Recurrence pattern. Used to generate candidate dates. */
  recurrenceRule: RecurrenceRule;
  /** YYYY-MM-DD — the anchor date. The rule expands relative to this. */
  fromDate: string;
  /** Event whose fields are cloned into new rows. */
  template: InstanceTemplate;
  /** Sequence number to start counting from. */
  startingSequence: number;
  /**
   * If true, the date matching `fromDate` is excluded from inserts.
   * Use when `fromDate` is the existing template event itself
   * (e.g. make-recurring promotes the original to instance #1).
   * If false, all generated dates are candidates (used by cron top-up).
   */
  excludeFromDate: boolean;
  /**
   * Source label written to events.source on the new rows.
   * MUST satisfy events_source_check: one of
   * 'manual' | 'scraper' | 'user_submission' | 'api' | 'import'.
   * Admin-driven paths use 'manual'; cron/automated use 'api'.
   */
  source?: 'manual' | 'scraper' | 'user_submission' | 'api' | 'import';
}

export interface MaterializeResult {
  generatedCount: number;
  generatedDates: string[];
  skippedExisting: string[];
  hitMaxCap: boolean;
  error?: string;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Materialize future instances of a recurring series.
 *
 * Steps:
 *   1. Run calculateRecurringDates() against the rule.
 *   2. Optionally drop the anchor date.
 *   3. Pull existing (non-cancelled) instance_dates for this series; skip them.
 *   4. Cap total instances at MAX_RECURRING_GENERATION (52).
 *   5. Batch-insert remaining dates.
 *
 * Returns counts + the actual dates inserted/skipped for audit logging.
 */
export async function materializeFutureInstances(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  options: MaterializeOptions
): Promise<MaterializeResult> {
  const {
    seriesId,
    recurrenceRule,
    fromDate,
    template,
    startingSequence,
    excludeFromDate,
    source = 'admin',
  } = options;

  console.log(`🔁 [materialize-instances] series=${seriesId} from=${fromDate} excludeAnchor=${excludeFromDate}`);

  // 1. Generate candidate dates from the rule
  const allDates = calculateRecurringDates(recurrenceRule, fromDate);

  if (allDates.length === 0) {
    return {
      generatedCount: 0,
      generatedDates: [],
      skippedExisting: [],
      hitMaxCap: false,
    };
  }

  // 2. Drop the anchor if asked (the caller already has an event for that date)
  const candidateDates = excludeFromDate
    ? allDates.filter(d => d !== fromDate)
    : allDates;

  // 3. Find dates already present in the DB so we never double-insert
  const { data: existingRows, error: existingError } = await supabase
    .from('events')
    .select('instance_date')
    .eq('series_id', seriesId)
    .neq('status', 'cancelled')
    .not('instance_date', 'is', null);

  if (existingError) {
    console.error(`❌ [materialize-instances] existing-dates query failed: ${existingError.message}`);
    return {
      generatedCount: 0,
      generatedDates: [],
      skippedExisting: [],
      hitMaxCap: false,
      error: existingError.message,
    };
  }

  const existingDates = new Set<string>(
    (existingRows ?? []).map((r: { instance_date: string }) => r.instance_date)
  );

  const skipped = candidateDates.filter(d => existingDates.has(d));
  let datesToInsert = candidateDates.filter(d => !existingDates.has(d));

  // 4. Cap total at MAX_RECURRING_GENERATION across all instances in the series
  const existingCount = existingDates.size;
  const remainingBudget = Math.max(0, MAX_RECURRING_GENERATION - existingCount);
  const hitMaxCap = datesToInsert.length > remainingBudget;
  if (hitMaxCap) {
    datesToInsert = datesToInsert.slice(0, remainingBudget);
  }

  if (datesToInsert.length === 0) {
    console.log(`🔁 [materialize-instances] nothing to insert (skipped=${skipped.length} cap=${hitMaxCap})`);
    return {
      generatedCount: 0,
      generatedDates: [],
      skippedExisting: skipped,
      hitMaxCap,
    };
  }

  // 5. Build + insert rows
  const time =
    recurrenceRule.time ||
    template.start_datetime?.split('T')[1]?.substring(0, 5) ||
    '19:00';
  const durationMinutes = recurrenceRule.duration_minutes || 120;
  const endTime = addMinutesToTime(time, durationMinutes);

  const rows = datesToInsert.map((date, index) => ({
    title: template.title,
    // Slug includes date — uniqueness across the series is implicit since
    // each instance has a unique date. Cross-series collisions are still
    // possible (two series with same title on same date) but the events
    // table doesn't enforce slug uniqueness so this is fine.
    slug: generateSlug(`${template.title || 'event'}-${date}`),
    description: template.description ?? null,
    short_description: template.short_description ?? null,
    start_datetime: `${date}T${time}:00`,
    end_datetime: `${date}T${endTime}:00`,
    instance_date: date,
    is_all_day: false,
    timezone: template.timezone ?? 'America/Chicago',
    category_id: template.category_id ?? null,
    location_id: template.location_id ?? null,
    organizer_id: template.organizer_id ?? null,
    series_id: seriesId,
    is_series_instance: true,
    series_sequence: startingSequence + index,
    price_type: template.price_type ?? 'free',
    price_low: template.price_low ?? null,
    price_high: template.price_high ?? null,
    price_details: template.price_details ?? null,
    ticket_url: template.ticket_url ?? null,
    image_url: template.image_url ?? null,
    thumbnail_url: template.thumbnail_url ?? null,
    website_url: template.website_url ?? null,
    instagram_url: template.instagram_url ?? null,
    facebook_url: template.facebook_url ?? null,
    registration_url: template.registration_url ?? null,
    status: template.status ?? 'published',
    source,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from('events')
    .insert(rows)
    .select('id, instance_date');

  if (insertError) {
    console.error(`❌ [materialize-instances] insert failed: ${insertError.message}`, insertError);
    return {
      generatedCount: 0,
      generatedDates: [],
      skippedExisting: skipped,
      hitMaxCap,
      error: insertError.message,
    };
  }

  const generatedDates = (inserted ?? []).map(
    (r: { instance_date: string }) => r.instance_date
  );

  console.log(
    `✅ [materialize-instances] generated=${generatedDates.length} skipped=${skipped.length} cap=${hitMaxCap} series=${seriesId}`
  );

  return {
    generatedCount: generatedDates.length,
    generatedDates,
    skippedExisting: skipped,
    hitMaxCap,
  };
}
