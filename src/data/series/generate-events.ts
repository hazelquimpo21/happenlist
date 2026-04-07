/**
 * SERIES EVENT GENERATION
 * =======================
 * Reusable functions for creating events within a series.
 * Used by both the user submission flow and superadmin tools.
 *
 * Functions:
 *   - createSingleEvent: creates one event record
 *   - generateCampEvents: generates daily events from date range + days_of_week
 *   - generateRecurringEvents: generates events from a recurrence_rule pattern
 *   - createSeries: creates a new series record
 *   - updateSeriesDates: updates series with computed date range + session count
 *
 * @module data/series/generate-events
 */

import { generateSlug } from '@/lib/utils/slug';
import {
  calculateDatesInRange,
  calculateRecurringDates,
  addMinutesToTime,
} from '@/lib/utils/recurrence';
import type {
  EventDraftData,
  SeriesDraftData,
} from '@/types/submission';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateEventResult {
  success: boolean;
  eventId?: string;
  error?: string;
}

export interface GenerateEventsResult {
  success: boolean;
  firstEventId?: string;
  eventCount: number;
  startDate?: string;
  endDate?: string;
  error?: string;
}

// ============================================================================
// CREATE SINGLE EVENT
// ============================================================================

/**
 * Creates a single event record. Used for single events and existing series additions.
 */
export async function createSingleEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  draftData: EventDraftData,
  seriesId: string | null,
  locationId: string | null,
  userEmail: string,
  userName?: string
): Promise<CreateEventResult> {
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
// GENERATE CAMP EVENTS
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
export async function generateCampEvents(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  draftData: EventDraftData,
  seriesDraftData: SeriesDraftData,
  seriesId: string,
  locationId: string | null,
  userEmail: string,
  userName?: string
): Promise<GenerateEventsResult> {
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
// GENERATE RECURRING EVENTS
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
export async function generateRecurringEvents(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  draftData: EventDraftData,
  seriesId: string | null,
  locationId: string | null,
  userEmail: string,
  userName?: string
): Promise<GenerateEventsResult> {
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
// CREATE SERIES
// ============================================================================

/**
 * Creates a new series record with all fields including camps/classes enhancements.
 *
 * Persists attendance_mode, extended care times, per_session_price,
 * materials_fee, pricing_notes, age range, skill_level, days_of_week, and term_name.
 */
export async function createSeries(
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
// UPDATE SERIES DATES
// ============================================================================

/**
 * Updates a series record with computed start_date, end_date, and total_sessions
 * after generating camp/recurring events.
 */
export async function updateSeriesDates(
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
