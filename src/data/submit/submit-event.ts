/**
 * SUBMIT EVENT
 * =============
 * Handles the final submission of an event for review.
 *
 * This converts a draft into an actual event with pending_review status.
 *
 * @module data/submit/submit-event
 */

import { createClient } from '@/lib/supabase/server';
import { createLogger, auditLogger } from '@/lib/utils/logger';
import { generateSlug } from '@/lib/utils/slug';
import { reHostImage, isHostedImage } from '@/lib/supabase/storage';
import type {
  EventDraftData,
  SeriesDraftData,
  NewLocationData,
  EventDraft,
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
 * 3. Creates the event with pending_review status
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

    // ========================================
    // Step 3: Create the event
    // ========================================
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
      // External links
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: event, error: eventError } = await (supabase as any)
      .from('events')
      .insert(eventData)
      .select()
      .single();

    if (eventError) {
      timer.error('Failed to create event', eventError);
      return { success: false, error: eventError.message };
    }

    // ========================================
    // Step 4: Update draft with submitted event ID
    // ========================================
    if (draftId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('event_drafts')
        .update({ submitted_event_id: event.id })
        .eq('id', draftId);
    }

    // ========================================
    // Step 5: Re-host external images to Supabase
    // ========================================
    await reHostEventImages(supabase, event.id, {
      image_url: draftData.image_url,
      thumbnail_url: draftData.thumbnail_url,
    });

    // ========================================
    // Step 6: Log to audit trail
    // ========================================
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('admin_audit_log').insert({
        action: 'event_submitted',
        entity_type: 'event',
        entity_id: event.id,
        user_email: userEmail,
        changes: {
          draft_id: draftId,
          title: draftData.title,
          series_id: seriesId,
          location_id: locationId,
        },
      });
    } catch (auditError) {
      auditLogger.warn('Failed to log submission audit', { metadata: { error: auditError } });
    }

    timer.success(`Event submitted: ${event.title} (${event.id})`);

    return {
      success: true,
      eventId: event.id,
      seriesId: seriesId || undefined,
      locationId: locationId || undefined,
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
