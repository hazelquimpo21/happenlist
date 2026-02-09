/**
 * SUBMIT EVENT
 * =============
 * Handles the final submission of an event for review.
 *
 * This converts a draft into an actual event with pending_review status.
 *
 * Phase D additions:
 *   - Camp event generation: auto-creates daily events from date range + days_of_week
 *   - Recurring event generation: creates events from recurrence_rule pattern
 *   - Series start_date / end_date are set from the generated events
 *   - total_sessions is computed from generated event count
 *
 * @module data/submit/submit-event
 */

import { createClient } from '@/lib/supabase/server';
import { createLogger, auditLogger } from '@/lib/utils/logger';
import { generateSlug } from '@/lib/utils/slug';
import { reHostImage, isHostedImage } from '@/lib/supabase/storage';
import { SERIES_LIMITS } from '@/lib/constants/series-limits';
import type {
  EventDraftData,
  SeriesDraftData,
  NewLocationData,
  EventDraft,
  RecurrenceRule,
} from '@/types/submission';

const logger = createLogger('Submit');

// ============================================================================
// TYPES
// ============================================================================

export interface SubmitEventParams {
  draftId?: string;
  draftData: EventDraftData;
  seriesDraftData?: SeriesDraftData | null;
  userEmail: string;
  userName?: string;
}

export interface SubmitEventResult {
  success: boolean;
  eventId?: string;
  seriesId?: string;
  locationId?: string;
  /** Number of events generated (for camps/recurring). 1 for single events. */
  eventCount?: number;
  error?: string;
}

// ============================================================================
// SUBMIT EVENT
// ============================================================================

/**
 * Submit an event for review
 *
 * This function:
 * 1. Creates new location if needed
 * 2. Creates new series if needed
 * 3. Creates the event(s) with pending_review status
 *    - For camps: generates daily events from date range + days_of_week
 *    - For recurring: generates events from recurrence_rule pattern
 *    - For single/existing_series: creates one event
 * 4. Links the draft to the submitted event
 *
 * @param params - Submission parameters
 * @returns Result with IDs of created entities
 */
export async function submitEvent(params: SubmitEventParams): Promise<SubmitEventResult> {
  const { draftId, draftData, seriesDraftData, userEmail, userName } = params;

  const timer = logger.time('submitEvent', {
    action: 'event_submitted',
    metadata: { userEmail, draftId },
  });

  try {
    const supabase = await createClient();

    let locationId = draftData.location_id || null;
    let seriesId = draftData.series_id || null;

    // ========================================
    // Step 1: Create location if needed
    // ========================================
    if (draftData.location_mode === 'new' && draftData.new_location) {
      const locationResult = await createLocation(supabase, draftData.new_location);
      if (!locationResult.success) {
        timer.error('Failed to create location', new Error(locationResult.error));
        return { success: false, error: `Failed to create venue: ${locationResult.error}` };
      }
      locationId = locationResult.locationId!;
      logger.info(`Created new location: ${locationId}`);
    }

    // ========================================
    // Step 2: Create series if needed
    // ========================================
    if (draftData.event_mode === 'new_series' && seriesDraftData) {
      const seriesResult = await createSeries(supabase, seriesDraftData, locationId);
      if (!seriesResult.success) {
        timer.error('Failed to create series', new Error(seriesResult.error));
        return { success: false, error: `Failed to create series: ${seriesResult.error}` };
      }
      seriesId = seriesResult.seriesId!;
      logger.info(`Created new series: ${seriesId}`);
    }

    // Auto-create a series for recurring events so they are grouped
    // and appear on the /series page.
    if (draftData.event_mode === 'recurring' && !seriesId) {
      const recurringSeriesData: SeriesDraftData = {
        title: draftData.title || 'Recurring Event',
        series_type: 'recurring',
        description: draftData.description,
        short_description: draftData.short_description,
        category_id: draftData.category_id,
        organizer_id: draftData.organizer_id,
        price_type: draftData.price_type,
        price_low: draftData.price_low,
        price_high: draftData.price_high,
        is_free: draftData.is_free,
        registration_url: draftData.registration_url,
        image_url: draftData.image_url,
        attendance_mode: 'drop_in',
      };
      const seriesResult = await createSeries(supabase, recurringSeriesData, locationId);
      if (!seriesResult.success) {
        timer.error('Failed to create recurring series', new Error(seriesResult.error));
        return { success: false, error: `Failed to create series: ${seriesResult.error}` };
      }
      seriesId = seriesResult.seriesId!;
      logger.info(`Created recurring series: ${seriesId}`);
    }

    // ========================================
    // Step 3: Create the event(s)
    // ========================================

    // Determine if we need multi-event generation
    const seriesConfig = seriesDraftData?.series_type
      ? SERIES_LIMITS[seriesDraftData.series_type]
      : null;
    const isCampMode = draftData.event_mode === 'new_series'
      && seriesConfig?.dateSelection === 'consecutive';
    const isRecurringMode = draftData.event_mode === 'recurring';

    let primaryEventId: string | undefined;
    let eventCount = 1;

    if (isCampMode && seriesDraftData) {
      // ---- Camp mode: generate daily events from date range ----
      const campResult = await generateCampEvents(
        supabase,
        draftData,
        seriesDraftData,
        seriesId!,
        locationId,
        userEmail,
        userName
      );

      if (!campResult.success) {
        timer.error('Failed to generate camp events', new Error(campResult.error));
        return { success: false, error: campResult.error };
      }

      primaryEventId = campResult.firstEventId;
      eventCount = campResult.eventCount;

      // Update series with computed start_date, end_date, total_sessions
      if (seriesId && campResult.startDate && campResult.endDate) {
        await updateSeriesDates(supabase, seriesId, {
          start_date: campResult.startDate,
          end_date: campResult.endDate,
          total_sessions: campResult.eventCount,
        });
      }
    } else if (isRecurringMode && draftData.recurrence_rule) {
      // ---- Recurring mode: generate events from recurrence pattern ----
      const recurResult = await generateRecurringEvents(
        supabase,
        draftData,
        seriesId,
        locationId,
        userEmail,
        userName
      );

      if (!recurResult.success) {
        timer.error('Failed to generate recurring events', new Error(recurResult.error));
        return { success: false, error: recurResult.error };
      }

      primaryEventId = recurResult.firstEventId;
      eventCount = recurResult.eventCount;

      // Update recurring series with computed dates
      if (seriesId && recurResult.eventCount > 0) {
        const rule = draftData.recurrence_rule!;
        const firstDate = draftData.start_datetime?.split('T')[0];
        const dates = calculateRecurringDates(rule, firstDate!);
        if (dates.length > 0) {
          await updateSeriesDates(supabase, seriesId, {
            start_date: dates[0],
            end_date: dates[dates.length - 1],
            total_sessions: recurResult.eventCount,
          });
        }
      }
    } else if (
      draftData.event_mode === 'new_series' &&
      draftData.additional_dates &&
      draftData.additional_dates.length > 0 &&
      seriesId
    ) {
      // ---- Manual multi-session (class/workshop): create events for each date ----
      const allDates = [
        draftData.start_datetime?.split('T')[0],
        ...draftData.additional_dates,
      ].filter((d): d is string => !!d);

      const startTime = seriesDraftData?.core_start_time || draftData.start_datetime?.split('T')[1]?.slice(0, 5) || '19:00';
      const endTime = seriesDraftData?.core_end_time || draftData.end_datetime?.split('T')[1]?.slice(0, 5) || '21:00';

      const events = allDates.map((date, index) => {
        const seqNum = index + 1;
        const eventTitle = allDates.length > 1
          ? `${draftData.title} - Session ${seqNum}`
          : draftData.title;
        const slug = generateSlug(eventTitle || 'event');

        return {
          title: eventTitle,
          slug,
          description: draftData.description || null,
          short_description: draftData.short_description || null,
          start_datetime: `${date}T${startTime}:00`,
          end_datetime: `${date}T${endTime}:00`,
          instance_date: date,
          is_all_day: false,
          timezone: draftData.timezone || 'America/Chicago',
          category_id: draftData.category_id || null,
          location_id: locationId,
          organizer_id: draftData.organizer_id || null,
          series_id: seriesId,
          is_series_instance: true,
          series_sequence: seqNum,
          price_type: draftData.price_type || 'free',
          price_low: draftData.price_low || null,
          price_high: draftData.price_high || null,
          price_details: draftData.price_details || null,
          is_free: draftData.is_free ?? draftData.price_type === 'free',
          ticket_url: draftData.ticket_url || null,
          image_url: draftData.image_url || null,
          thumbnail_url: draftData.thumbnail_url || null,
          website_url: draftData.website_url || null,
          instagram_url: draftData.instagram_url || null,
          facebook_url: draftData.facebook_url || null,
          registration_url: draftData.registration_url || null,
          status: 'pending_review',
          source: 'user_submission',
          submitted_by_email: userEmail,
          submitted_by_name: userName || null,
          submitted_at: new Date().toISOString(),
        };
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: insertedEvents, error: insertError } = await (supabase as any)
        .from('events')
        .insert(events)
        .select('id, title, instance_date, series_sequence');

      if (insertError) {
        timer.error('Failed to create multi-session events', new Error(insertError.message));
        return { success: false, error: insertError.message };
      }

      primaryEventId = insertedEvents?.[0]?.id;
      eventCount = insertedEvents?.length || 1;

      // Update series dates
      const sortedDates = allDates.sort();
      await updateSeriesDates(supabase, seriesId, {
        start_date: sortedDates[0],
        end_date: sortedDates[sortedDates.length - 1],
        total_sessions: eventCount,
      });

      logger.info(`Created ${eventCount} multi-session events for series ${seriesId}`);
    } else {
      // ---- Single event or existing series: create one event ----
      const singleResult = await createSingleEvent(
        supabase,
        draftData,
        seriesId,
        locationId,
        userEmail,
        userName
      );

      if (!singleResult.success) {
        timer.error('Failed to create event', new Error(singleResult.error));
        return { success: false, error: singleResult.error };
      }

      primaryEventId = singleResult.eventId;
    }

    // ========================================
    // Step 4: Update draft with submitted event ID
    // ========================================
    if (draftId && primaryEventId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('event_drafts')
        .update({ submitted_event_id: primaryEventId })
        .eq('id', draftId);
    }

    // ========================================
    // Step 5: Re-host external images to Supabase
    // ========================================
    if (primaryEventId) {
      await reHostEventImages(supabase, primaryEventId, {
        image_url: draftData.image_url,
        thumbnail_url: draftData.thumbnail_url,
      });
    }

    // ========================================
    // Step 6: Log to audit trail
    // ========================================
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('admin_audit_log').insert({
        action: 'event_submitted',
        entity_type: 'event',
        entity_id: primaryEventId,
        user_email: userEmail,
        changes: {
          draft_id: draftId,
          title: draftData.title,
          series_id: seriesId,
          location_id: locationId,
          event_count: eventCount,
          mode: isCampMode ? 'camp' : isRecurringMode ? 'recurring' : 'single',
        },
      });
    } catch (auditError) {
      auditLogger.warn('Failed to log submission audit', { metadata: { error: auditError } });
    }

    timer.success(`Event submitted: ${draftData.title} (${primaryEventId}), ${eventCount} event(s) created`);

    return {
      success: true,
      eventId: primaryEventId,
      seriesId: seriesId || undefined,
      locationId: locationId || undefined,
      eventCount,
    };
  } catch (error) {
    timer.error('Unexpected error', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// HELPER: CREATE SINGLE EVENT
// ============================================================================

/**
 * Creates a single event record. Used for single events and existing series additions.
 */
async function createSingleEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  draftData: EventDraftData,
  seriesId: string | null,
  locationId: string | null,
  userEmail: string,
  userName?: string
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  const eventSlug = generateSlug(draftData.title || 'event');
  const instanceDate = draftData.instance_date || draftData.start_datetime?.split('T')[0];

  const eventData = {
    title: draftData.title,
    slug: eventSlug,
    description: draftData.description || null,
    short_description: draftData.short_description || null,
    start_datetime: draftData.start_datetime,
    end_datetime: draftData.end_datetime || null,
    instance_date: instanceDate,
    is_all_day: draftData.is_all_day || false,
    timezone: draftData.timezone || 'America/Chicago',
    category_id: draftData.category_id || null,
    location_id: locationId,
    organizer_id: draftData.organizer_id || null,
    series_id: seriesId,
    is_series_instance: seriesId !== null,
    price_type: draftData.price_type || 'free',
    price_low: draftData.price_low || null,
    price_high: draftData.price_high || null,
    price_details: draftData.price_details || null,
    is_free: draftData.is_free ?? draftData.price_type === 'free',
    ticket_url: draftData.ticket_url || null,
    image_url: draftData.image_url || null,
    thumbnail_url: draftData.thumbnail_url || null,
    website_url: draftData.website_url || null,
    instagram_url: draftData.instagram_url || null,
    facebook_url: draftData.facebook_url || null,
    registration_url: draftData.registration_url || null,
    status: 'pending_review',
    source: 'user_submission',
    submitted_by_email: userEmail,
    submitted_by_name: userName || null,
    submitted_at: new Date().toISOString(),
  };

  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert(eventData)
    .select()
    .single();

  if (eventError) {
    console.error('❌ [createSingleEvent] Failed:', eventError.message);
    return { success: false, error: eventError.message };
  }

  console.log(`✅ [createSingleEvent] Created event: ${event.id} ("${event.title}")`);
  return { success: true, eventId: event.id };
}

// ============================================================================
// HELPER: GENERATE CAMP EVENTS
// ============================================================================

/**
 * Generates daily events for a camp from start_date to end_date
 * using the days_of_week filter.
 *
 * For a Mon-Fri camp running June 2-6, this creates 5 events:
 *   Day 1 (Mon Jun 2), Day 2 (Tue Jun 3), ..., Day 5 (Fri Jun 6)
 *
 * Each event gets:
 *   - title: "Camp Title - Day N"
 *   - series_sequence: N
 *   - start_datetime / end_datetime based on core hours
 *   - instance_date from the generated date
 */
async function generateCampEvents(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  draftData: EventDraftData,
  seriesDraftData: SeriesDraftData,
  seriesId: string,
  locationId: string | null,
  userEmail: string,
  userName?: string
): Promise<{
  success: boolean;
  firstEventId?: string;
  eventCount: number;
  startDate?: string;
  endDate?: string;
  error?: string;
}> {
  const startDate = draftData.start_datetime?.split('T')[0];
  const endDate = draftData.end_datetime?.split('T')[0];
  const startTime = seriesDraftData.core_start_time || '09:00';
  const endTime = seriesDraftData.core_end_time || '15:00';
  const daysOfWeek = seriesDraftData.days_of_week ?? [1, 2, 3, 4, 5]; // Default Mon-Fri

  if (!startDate || !endDate) {
    return { success: false, eventCount: 0, error: 'Camp start and end dates are required' };
  }

  console.log(`🏕️ [generateCampEvents] Generating camp events`, {
    seriesId,
    startDate,
    endDate,
    startTime,
    endTime,
    daysOfWeek,
    title: draftData.title,
  });

  // Calculate all dates in range matching days_of_week
  const dates = calculateDatesInRange(startDate, endDate, daysOfWeek);

  if (dates.length === 0) {
    return { success: false, eventCount: 0, error: 'No matching days found in the selected date range' };
  }

  console.log(`🏕️ [generateCampEvents] Will generate ${dates.length} camp day events`);

  // Build event records
  const events = dates.map((date, index) => {
    const dayNum = index + 1;
    const eventTitle = `${draftData.title} - Day ${dayNum}`;
    const slug = generateSlug(eventTitle);

    return {
      title: eventTitle,
      slug,
      description: draftData.description || null,
      short_description: draftData.short_description || null,
      start_datetime: `${date}T${startTime}:00`,
      end_datetime: `${date}T${endTime}:00`,
      instance_date: date,
      is_all_day: false,
      timezone: draftData.timezone || 'America/Chicago',
      category_id: draftData.category_id || null,
      location_id: locationId,
      organizer_id: draftData.organizer_id || null,
      series_id: seriesId,
      is_series_instance: true,
      series_sequence: dayNum,
      price_type: draftData.price_type || 'free',
      price_low: draftData.price_low || null,
      price_high: draftData.price_high || null,
      price_details: draftData.price_details || null,
      is_free: draftData.is_free ?? draftData.price_type === 'free',
      ticket_url: draftData.ticket_url || null,
      image_url: draftData.image_url || null,
      thumbnail_url: draftData.thumbnail_url || null,
      website_url: draftData.website_url || null,
      instagram_url: draftData.instagram_url || null,
      facebook_url: draftData.facebook_url || null,
      registration_url: draftData.registration_url || null,
      status: 'pending_review',
      source: 'user_submission',
      submitted_by_email: userEmail,
      submitted_by_name: userName || null,
      submitted_at: new Date().toISOString(),
    };
  });

  // Batch insert all events
  const { data: insertedEvents, error: insertError } = await supabase
    .from('events')
    .insert(events)
    .select('id, title, instance_date, series_sequence');

  if (insertError) {
    console.error(`❌ [generateCampEvents] Batch insert failed: ${insertError.message}`, insertError);
    return { success: false, eventCount: 0, error: insertError.message };
  }

  const firstEvent = insertedEvents?.[0];
  console.log(`✅ [generateCampEvents] Created ${insertedEvents.length} camp events`, {
    firstEventId: firstEvent?.id,
    dates: dates.slice(0, 3).join(', ') + (dates.length > 3 ? '...' : ''),
  });

  return {
    success: true,
    firstEventId: firstEvent?.id,
    eventCount: insertedEvents.length,
    startDate: dates[0],
    endDate: dates[dates.length - 1],
  };
}

// ============================================================================
// HELPER: GENERATE RECURRING EVENTS
// ============================================================================

/**
 * Generates events from a recurrence rule pattern.
 *
 * Supports:
 *   - Daily: every N days
 *   - Weekly/biweekly: specific days_of_week
 *   - Monthly: same day_of_month
 *
 * End conditions:
 *   - 'never': generates up to DEFAULT_GENERATION_WINDOW (12 weeks)
 *   - 'count': generates exactly N events
 *   - 'date': generates until end_date
 */
async function generateRecurringEvents(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  draftData: EventDraftData,
  seriesId: string | null,
  locationId: string | null,
  userEmail: string,
  userName?: string
): Promise<{
  success: boolean;
  firstEventId?: string;
  eventCount: number;
  error?: string;
}> {
  const rule = draftData.recurrence_rule!;
  const firstDate = draftData.start_datetime?.split('T')[0];

  if (!firstDate) {
    return { success: false, eventCount: 0, error: 'First occurrence date is required for recurring events' };
  }

  console.log(`🔁 [generateRecurringEvents] Generating recurring events`, {
    frequency: rule.frequency,
    interval: rule.interval,
    daysOfWeek: rule.days_of_week,
    endType: rule.end_type,
    endCount: rule.end_count,
    endDate: rule.end_date,
    startDate: firstDate,
    time: rule.time,
    durationMinutes: rule.duration_minutes,
  });

  // Calculate all occurrence dates
  const dates = calculateRecurringDates(rule, firstDate);

  if (dates.length === 0) {
    return { success: false, eventCount: 0, error: 'No recurring dates could be generated from the pattern' };
  }

  console.log(`🔁 [generateRecurringEvents] Will generate ${dates.length} recurring events`);

  // Calculate end time from start time + duration
  const time = rule.time || '19:00';
  const durationMinutes = rule.duration_minutes || 120;
  const endTime = addMinutesToTime(time, durationMinutes);

  // Build event records
  const events = dates.map((date, index) => {
    const seqNum = index + 1;
    const slug = generateSlug(`${draftData.title || 'event'}-${date}`);

    return {
      title: draftData.title,
      slug,
      description: draftData.description || null,
      short_description: draftData.short_description || null,
      start_datetime: `${date}T${time}:00`,
      end_datetime: `${date}T${endTime}:00`,
      instance_date: date,
      is_all_day: false,
      timezone: draftData.timezone || 'America/Chicago',
      category_id: draftData.category_id || null,
      location_id: locationId,
      organizer_id: draftData.organizer_id || null,
      series_id: seriesId,
      is_series_instance: seriesId !== null,
      series_sequence: seqNum,
      price_type: draftData.price_type || 'free',
      price_low: draftData.price_low || null,
      price_high: draftData.price_high || null,
      price_details: draftData.price_details || null,
      is_free: draftData.is_free ?? draftData.price_type === 'free',
      ticket_url: draftData.ticket_url || null,
      image_url: draftData.image_url || null,
      thumbnail_url: draftData.thumbnail_url || null,
      website_url: draftData.website_url || null,
      instagram_url: draftData.instagram_url || null,
      facebook_url: draftData.facebook_url || null,
      registration_url: draftData.registration_url || null,
      status: 'pending_review',
      source: 'user_submission',
      submitted_by_email: userEmail,
      submitted_by_name: userName || null,
      submitted_at: new Date().toISOString(),
    };
  });

  // Batch insert all events
  const { data: insertedEvents, error: insertError } = await supabase
    .from('events')
    .insert(events)
    .select('id, title, instance_date, series_sequence');

  if (insertError) {
    console.error(`❌ [generateRecurringEvents] Batch insert failed: ${insertError.message}`, insertError);
    return { success: false, eventCount: 0, error: insertError.message };
  }

  const firstEvent = insertedEvents?.[0];
  console.log(`✅ [generateRecurringEvents] Created ${insertedEvents.length} recurring events`, {
    firstEventId: firstEvent?.id,
    firstDate: dates[0],
    lastDate: dates[dates.length - 1],
  });

  return {
    success: true,
    firstEventId: firstEvent?.id,
    eventCount: insertedEvents.length,
  };
}

// ============================================================================
// HELPER: CALCULATE DATES IN RANGE (for camps)
// ============================================================================

/**
 * Calculate all dates between startDate and endDate that fall on specified days of week.
 * Safety-capped at 60 days to prevent runaway generation.
 */
function calculateDatesInRange(
  startDate: string,
  endDate: string,
  daysOfWeek: number[]
): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const maxDays = 60;
  let count = 0;

  const current = new Date(start);
  while (current <= end && count < maxDays) {
    if (daysOfWeek.includes(current.getDay())) {
      dates.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
    count++;
  }

  return dates;
}

// ============================================================================
// HELPER: CALCULATE RECURRING DATES
// ============================================================================

/**
 * Calculate occurrence dates from a recurrence rule.
 * Supports daily, weekly, biweekly, and monthly patterns.
 * Safety-capped at 52 occurrences.
 */
function calculateRecurringDates(
  rule: RecurrenceRule,
  firstDate: string
): string[] {
  const dates: string[] = [];
  const maxOccurrences = 52; // Safety cap: 1 year of weekly events
  const defaultWeeks = 12;   // Default generation window

  // Determine how many events to generate and/or end date
  let maxCount = maxOccurrences;
  let endDate: Date | null = null;

  switch (rule.end_type) {
    case 'count':
      maxCount = Math.min(rule.end_count || 10, maxOccurrences);
      break;
    case 'date':
      if (rule.end_date) {
        endDate = new Date(rule.end_date + 'T23:59:59');
      }
      break;
    case 'never':
    default:
      // Generate defaultWeeks worth of events
      endDate = new Date(firstDate + 'T00:00:00');
      endDate.setDate(endDate.getDate() + defaultWeeks * 7);
      break;
  }

  const current = new Date(firstDate + 'T00:00:00');
  const interval = rule.interval || 1;

  switch (rule.frequency) {
    case 'daily': {
      while (dates.length < maxCount) {
        if (endDate && current > endDate) break;
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + interval);
      }
      break;
    }

    case 'weekly':
    case 'biweekly': {
      const daysOfWeek = rule.days_of_week || [];
      const weekInterval = rule.frequency === 'biweekly' ? 2 * interval : interval;

      if (daysOfWeek.length === 0) {
        // If no specific days, use the day of the first occurrence
        daysOfWeek.push(current.getDay());
      }

      // Start from the beginning of the week containing firstDate
      const weekStart = new Date(current);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Go to Sunday

      let iterWeek = new Date(weekStart);
      const safetyLimit = maxCount * 4; // Prevent infinite loops
      let iterations = 0;

      while (dates.length < maxCount && iterations < safetyLimit) {
        for (const day of daysOfWeek) {
          const candidate = new Date(iterWeek);
          candidate.setDate(candidate.getDate() + day);

          // Skip dates before the first date
          if (candidate < current) continue;
          if (endDate && candidate > endDate) break;
          if (dates.length >= maxCount) break;

          dates.push(candidate.toISOString().split('T')[0]);
        }
        // Advance to the next applicable week
        iterWeek.setDate(iterWeek.getDate() + 7 * weekInterval);
        iterations++;
      }
      break;
    }

    case 'monthly': {
      const dayOfMonth = rule.day_of_month || current.getDate();

      while (dates.length < maxCount) {
        if (endDate && current > endDate) break;

        // Set to the target day of month (handle month-end overflow)
        const targetDate = new Date(current.getFullYear(), current.getMonth(), dayOfMonth);
        if (targetDate.getMonth() !== current.getMonth()) {
          // Day overflowed (e.g., Feb 30 -> Mar 2), use last day of month
          targetDate.setDate(0); // Last day of previous month
        }

        if (targetDate >= new Date(firstDate + 'T00:00:00')) {
          dates.push(targetDate.toISOString().split('T')[0]);
        }

        current.setMonth(current.getMonth() + interval);
      }
      break;
    }

    default:
      console.warn(`⚠️ [calculateRecurringDates] Unsupported frequency: ${rule.frequency}`);
  }

  console.log(`📅 [calculateRecurringDates] Generated ${dates.length} dates for ${rule.frequency} pattern`);
  return dates;
}

// ============================================================================
// HELPER: ADD MINUTES TO TIME
// ============================================================================

/**
 * Adds minutes to an HH:MM time string.
 * Example: addMinutesToTime("19:00", 120) => "21:00"
 */
function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

// ============================================================================
// HELPER: UPDATE SERIES DATES
// ============================================================================

/**
 * Updates a series record with computed start_date, end_date, and total_sessions
 * after generating camp/recurring events.
 */
async function updateSeriesDates(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  seriesId: string,
  updates: { start_date: string; end_date: string; total_sessions: number }
) {
  try {
    const { error } = await supabase
      .from('series')
      .update(updates)
      .eq('id', seriesId);

    if (error) {
      console.error(`⚠️ [updateSeriesDates] Failed to update series dates: ${error.message}`);
    } else {
      console.log(`✅ [updateSeriesDates] Series ${seriesId} dates updated:`, updates);
    }
  } catch (err) {
    console.error('⚠️ [updateSeriesDates] Unexpected error:', err);
  }
}

// ============================================================================
// HELPER: CREATE LOCATION
// ============================================================================

async function createLocation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  locationData: NewLocationData
): Promise<{ success: boolean; locationId?: string; error?: string }> {
  try {
    const slug = generateSlug(locationData.name);

    const { data, error } = await supabase
      .from('locations')
      .insert({
        name: locationData.name,
        slug,
        address_line: locationData.address_line || null,
        city: locationData.city,
        state: locationData.state || null,
        postal_code: locationData.postal_code || null,
        country: locationData.country || 'US',
        venue_type: locationData.venue_type || 'venue',
        latitude: locationData.latitude ?? null,
        longitude: locationData.longitude ?? null,
        source: 'user_submitted',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, locationId: data.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// HELPER: CREATE SERIES
// ============================================================================

/**
 * Creates a new series record with all fields including camps/classes enhancements.
 *
 * Phase B: Now persists attendance_mode, extended care times, per_session_price,
 * materials_fee, pricing_notes, age range, skill_level, days_of_week, and term_name.
 */
async function createSeries(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  seriesData: SeriesDraftData,
  locationId: string | null
): Promise<{ success: boolean; seriesId?: string; error?: string }> {
  try {
    const slug = generateSlug(seriesData.title);

    console.log(`📝 [createSeries] Creating series: "${seriesData.title}" (type: ${seriesData.series_type})`, {
      attendance_mode: seriesData.attendance_mode,
      has_extended_care: !!(seriesData.extended_start_time || seriesData.extended_end_time),
      age_range: seriesData.age_low != null || seriesData.age_high != null
        ? `${seriesData.age_low ?? '?'}-${seriesData.age_high ?? '?'}`
        : null,
      skill_level: seriesData.skill_level || null,
      days_of_week: seriesData.days_of_week || null,
      per_session_price: seriesData.per_session_price ?? null,
      materials_fee: seriesData.materials_fee ?? null,
    });

    const { data, error } = await supabase
      .from('series')
      .insert({
        // -- Core fields (existing) --
        title: seriesData.title,
        slug,
        description: seriesData.description || null,
        short_description: seriesData.short_description || null,
        series_type: seriesData.series_type || 'class',
        total_sessions: seriesData.total_sessions || null,
        category_id: seriesData.category_id || null,
        location_id: locationId || seriesData.location_id || null,
        organizer_id: seriesData.organizer_id || null,
        price_type: seriesData.price_type || null,
        price_low: seriesData.price_low || null,
        price_high: seriesData.price_high || null,
        is_free: seriesData.is_free || false,
        registration_url: seriesData.registration_url || null,
        image_url: seriesData.image_url || null,
        status: 'pending_review',

        // -- Camps/classes enhancements (Phase B) --

        // Attendance model
        attendance_mode: seriesData.attendance_mode || 'registered',

        // Extended care / before & after care times
        core_start_time: seriesData.core_start_time || null,
        core_end_time: seriesData.core_end_time || null,
        extended_start_time: seriesData.extended_start_time || null,
        extended_end_time: seriesData.extended_end_time || null,
        extended_care_details: seriesData.extended_care_details || null,

        // Pricing enhancements
        per_session_price: seriesData.per_session_price ?? null,
        materials_fee: seriesData.materials_fee ?? null,
        pricing_notes: seriesData.pricing_notes || null,

        // Age restrictions
        age_low: seriesData.age_low ?? null,
        age_high: seriesData.age_high ?? null,
        age_details: seriesData.age_details || null,

        // Skill level
        skill_level: seriesData.skill_level || null,

        // Day pattern & term
        days_of_week: seriesData.days_of_week || null,
        term_name: seriesData.term_name || null,
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ [createSeries] Failed to create series: ${error.message}`, error);
      return { success: false, error: error.message };
    }

    console.log(`✅ [createSeries] Series created: ${data.id} ("${data.title}")`);
    return { success: true, seriesId: data.id };
  } catch (error) {
    console.error('❌ [createSeries] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// HELPER: RE-HOST EVENT IMAGES
// ============================================================================

/**
 * Re-hosts external image URLs to Supabase Storage.
 * This runs asynchronously after event creation and doesn't block submission.
 */
async function reHostEventImages(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  eventId: string,
  images: {
    image_url?: string | null;
    thumbnail_url?: string | null;
  }
): Promise<void> {
  const updates: Record<string, unknown> = {};

  // Re-host main image
  if (images.image_url && !isHostedImage(images.image_url)) {
    try {
      logger.info(`Re-hosting main image for event ${eventId}`);
      const result = await reHostImage(images.image_url, eventId, 'hero');

      if (result.success && result.url) {
        updates.image_url = result.url;
        updates.image_storage_path = result.path;
        updates.image_hosted = true;
        updates.raw_image_url = images.image_url; // Keep original URL
        logger.info(`Successfully re-hosted main image: ${result.url}`);
      } else {
        logger.warn(`Failed to re-host main image: ${result.error}`);
      }
    } catch (error) {
      logger.warn('Error re-hosting main image', { metadata: { error } });
    }
  }

  // Re-host thumbnail
  if (images.thumbnail_url && !isHostedImage(images.thumbnail_url)) {
    try {
      logger.info(`Re-hosting thumbnail for event ${eventId}`);
      const result = await reHostImage(images.thumbnail_url, eventId, 'thumbnail');

      if (result.success && result.url) {
        updates.thumbnail_url = result.url;
        updates.thumbnail_storage_path = result.path;
        updates.thumbnail_hosted = true;
        updates.raw_thumbnail_url = images.thumbnail_url;
        logger.info(`Successfully re-hosted thumbnail: ${result.url}`);
      } else {
        logger.warn(`Failed to re-host thumbnail: ${result.error}`);
      }
    } catch (error) {
      logger.warn('Error re-hosting thumbnail', { metadata: { error } });
    }
  }

  // Update event with hosted image URLs
  if (Object.keys(updates).length > 0) {
    try {
      await supabase
        .from('events')
        .update(updates)
        .eq('id', eventId);

      logger.info(`Updated event ${eventId} with ${Object.keys(updates).length} hosted images`);
    } catch (error) {
      logger.warn('Failed to update event with hosted image URLs', { metadata: { error } });
    }
  }
}

// ============================================================================
// RESUBMIT EVENT (after changes requested)
// ============================================================================

/**
 * Resubmit an event after making requested changes
 *
 * @param eventId - Event ID
 * @param updates - Updated event data
 * @param userEmail - Submitter's email
 * @returns Success status
 */
export async function resubmitEvent(
  eventId: string,
  updates: Partial<EventDraftData>,
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  const timer = logger.time('resubmitEvent', {
    action: 'event_resubmitted',
    entityType: 'event',
    entityId: eventId,
    metadata: { userEmail },
  });

  try {
    const supabase = await createClient();

    // Update the event and change status back to pending_review
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('events')
      .update({
        ...updates,
        status: 'pending_review',
        submitted_at: new Date().toISOString(), // Reset submission time
        change_request_message: null, // Clear the change request
      })
      .eq('id', eventId)
      .eq('submitted_by_email', userEmail) // Ensure user owns this event
      .eq('status', 'changes_requested'); // Only resubmit if changes were requested

    if (error) {
      timer.error('Failed to resubmit event', error);
      return { success: false, error: error.message };
    }

    // Re-host images if updated
    if (updates.image_url || updates.thumbnail_url) {
      await reHostEventImages(supabase, eventId, {
        image_url: updates.image_url,
        thumbnail_url: updates.thumbnail_url,
      });
    }

    // Log to audit trail
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('admin_audit_log').insert({
        action: 'event_resubmitted',
        entity_type: 'event',
        entity_id: eventId,
        user_email: userEmail,
        changes: updates,
      });
    } catch (auditError) {
      auditLogger.warn('Failed to log resubmit audit', { metadata: { error: auditError } });
    }

    timer.success('Event resubmitted for review');

    return { success: true };
  } catch (error) {
    timer.error('Unexpected error', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
