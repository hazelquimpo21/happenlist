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
import { calculateRecurringDates } from '@/lib/utils/recurrence';
import { reHostImage, isHostedImage } from '@/lib/supabase/storage';
import { SERIES_LIMITS } from '@/lib/constants/series-limits';
import {
  createSingleEvent,
  generateCampEvents,
  generateRecurringEvents,
  createSeries,
  updateSeriesDates,
} from '@/data/series/generate-events';
import type {
  EventDraftData,
  SeriesDraftData,
  NewLocationData,
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
// HELPER: CREATE LOCATION
// ============================================================================

async function createLocation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  locationData: NewLocationData
): Promise<{ success: boolean; locationId?: string; error?: string }> {
  try {
    // Check for near-duplicate venues before inserting
    const { data: matches } = await supabase.rpc('search_venues', {
      search_query: locationData.name,
      result_limit: 3,
    });

    if (matches && matches.length > 0) {
      const best = matches[0];
      // Use existing venue if similarity is high enough
      if (best.similarity_score > 0.7) {
        logger.info(`Matched existing venue "${best.name}" (score: ${best.similarity_score}) instead of creating duplicate "${locationData.name}"`);
        return { success: true, locationId: best.id };
      }
    }

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
