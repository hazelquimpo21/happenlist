/**
 * SCRAPER → SUPABASE SAVE
 * ========================
 * Shared logic for turning a scraper-analyzed event payload into an `events`
 * row. Used by:
 *   - src/app/api/scraper/events/route.ts (Chrome extension / Render → Vercel)
 *   - src/app/api/superadmin/import/save/route.ts (admin import UI)
 *
 * Any time you touch this file, think about whether BOTH callers still behave
 * correctly. Validation, dedup, resolve-then-insert logic all live here so
 * they can't drift.
 *
 * @module lib/scraper/save-event
 */

import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { generateSlug } from '@/lib/utils/slug';
import type { EventSource, EventStatus } from '@/lib/supabase/types';
import type { ScraperEvent, ScraperVenue } from './types';

// ============================================================================
// INPUT
// ============================================================================

export interface SaveEventInput {
  // Required
  title: string;
  start_datetime: string;
  source_url: string;

  // Strongly recommended
  end_datetime?: string | null;
  instance_date?: string | null;
  description?: string | null;
  short_description?: string | null;
  tagline?: string | null;
  happenlist_summary?: string | null;
  organizer_description?: string | null;

  // Pricing
  price_type?: string | null;
  price_low?: number | null;
  price_high?: number | null;
  price_details?: string | null;
  ticket_url?: string | null;

  // Category
  category_id?: string | null;
  category_slug?: string | null;

  // Links
  website_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  registration_url?: string | null;

  // Images
  image_url?: string | null;
  flyer_url?: string | null;
  thumbnail_url?: string | null;

  // Location
  location_id?: string | null;
  location?: {
    name: string;
    address_line?: string | null;
    city: string;
    state?: string | null;
    postal_code?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    google_place_id?: string | null;
    venue_type?: string | null;
  } | null;

  // Organizer
  organizer_id?: string | null;
  organizer?: {
    name: string;
    website_url?: string | null;
    email?: string | null;
  } | null;

  // Age / audience
  age_low?: number | null;
  age_high?: number | null;
  age_restriction?: string | null;
  is_family_friendly?: boolean | null;
  good_for?: string[] | null;

  // Talent
  talent_name?: string | null;
  talent_bio?: string | null;

  // Misc
  is_all_day?: boolean;
  timezone?: string | null;
  scraped_data?: Record<string, unknown> | null;
}

export interface SaveEventOptions {
  /** Default: 'published'. Import UI uses 'pending_review' so humans review before going live. */
  status?: EventStatus;
  /** Default: 'scraper'. Import UI uses 'admin'. */
  source?: EventSource;
}

export type SaveEventResult =
  | { ok: true; eventId: string; slug: string; status: string; locationId: string | null; organizerId: string | null }
  | { ok: false; code: 'validation'; errors: string[] }
  | { ok: false; code: 'duplicate'; existingEventId: string; existingTitle: string; existingStatus: string }
  | { ok: false; code: 'insert_failed'; error: string };

// ============================================================================
// VALIDATION
// ============================================================================

export function validateSaveInput(input: Partial<SaveEventInput>): string[] {
  const errors: string[] = [];
  if (!input.title?.trim()) errors.push('title is required');
  if (!input.start_datetime) errors.push('start_datetime is required (ISO 8601)');
  if (!input.source_url?.trim()) errors.push('source_url is required');
  if (input.title && input.title.length < 3) errors.push('title must be at least 3 characters');
  if (input.title && input.title.length > 200) errors.push('title must be 200 characters or less');
  return errors;
}

const VALID_PRICE_TYPES = new Set(['free', 'fixed', 'range', 'varies', 'donation', 'per_session']);

// ============================================================================
// SAVE
// ============================================================================

/**
 * Main entry: dedupe, resolve venue/organizer/category, insert event row.
 * Does NOT throw on validation/duplicate/insert errors — returns a tagged result.
 * Throws only on unexpected programming errors (so callers get a 500).
 */
export async function saveScrapedEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  input: SaveEventInput,
  options: SaveEventOptions = {}
): Promise<SaveEventResult> {
  const errors = validateSaveInput(input);
  if (errors.length > 0) {
    return { ok: false, code: 'validation', errors };
  }

  const status: EventStatus = options.status ?? 'published';
  const source: EventSource = options.source ?? 'scraper';

  // Dedup by source_url
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('events')
    .select('id, title, status')
    .eq('source_url', input.source_url)
    .limit(1)
    .maybeSingle();

  if (existing) {
    console.log(`[import:save] duplicate source_url — existing event ${existing.id} (${existing.status})`);
    return {
      ok: false,
      code: 'duplicate',
      existingEventId: existing.id,
      existingTitle: existing.title,
      existingStatus: existing.status,
    };
  }

  // Resolve category
  let categoryId = input.category_id || null;
  if (!categoryId && input.category_slug) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cat } = await (supabase as any)
      .from('categories')
      .select('id')
      .eq('slug', input.category_slug)
      .eq('is_active', true)
      .maybeSingle();
    if (cat) categoryId = cat.id;
  }

  const locationId = input.location_id
    ?? (input.location ? await resolveLocation(supabase, input.location) : null);

  const organizerId = input.organizer_id
    ?? (input.organizer ? await resolveOrganizer(supabase, input.organizer) : null);

  const instanceDate = input.instance_date || input.start_datetime.split('T')[0];

  const priceType = input.price_type && VALID_PRICE_TYPES.has(input.price_type)
    ? input.price_type
    : 'free';

  const eventSlug = generateSlug(input.title);
  const nowIso = new Date().toISOString();

  const eventData: Record<string, unknown> = {
    title: input.title.trim(),
    slug: eventSlug,
    description: input.description || null,
    short_description: input.short_description?.slice(0, 160) || null,
    tagline: input.tagline || null,
    happenlist_summary: input.happenlist_summary || null,
    organizer_description: input.organizer_description || null,
    start_datetime: input.start_datetime,
    end_datetime: input.end_datetime || null,
    instance_date: instanceDate,
    is_all_day: input.is_all_day || false,
    timezone: input.timezone || 'America/Chicago',
    category_id: categoryId,
    location_id: locationId,
    organizer_id: organizerId,
    price_type: priceType,
    price_low: input.price_low ?? null,
    price_high: input.price_high ?? null,
    price_details: input.price_details || null,
    ticket_url: input.ticket_url || null,
    image_url: input.image_url || null,
    flyer_url: input.flyer_url || null,
    thumbnail_url: input.thumbnail_url || null,
    website_url: input.website_url || null,
    instagram_url: input.instagram_url || null,
    facebook_url: input.facebook_url || null,
    registration_url: input.registration_url || null,
    age_low: input.age_low ?? null,
    age_high: input.age_high ?? null,
    age_restriction: input.age_restriction || null,
    is_family_friendly: input.is_family_friendly ?? null,
    good_for: input.good_for || [],
    talent_name: input.talent_name || null,
    talent_bio: input.talent_bio || null,
    status,
    published_at: status === 'published' ? nowIso : null,
    source,
    source_url: input.source_url,
    scraped_at: nowIso,
    scraped_data: input.scraped_data || null,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: event, error: insertError } = await (supabase as any)
    .from('events')
    .insert(eventData)
    .select('id, title, slug, status')
    .single();

  if (insertError) {
    console.error(`[import:save] insert failed: ${insertError.message}`);
    return { ok: false, code: 'insert_failed', error: insertError.message };
  }

  console.log(`[import:save] created "${event.title}" (${event.id}) status=${status} source=${source}`);
  return {
    ok: true,
    eventId: event.id,
    slug: event.slug,
    status: event.status,
    locationId,
    organizerId,
  };
}

// ============================================================================
// VENUE / ORGANIZER RESOLVERS
// ============================================================================

/**
 * Match an existing location or create a new one.
 * Priority: google_place_id → name+city fuzzy match → create new.
 */
async function resolveLocation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  loc: NonNullable<SaveEventInput['location']>
): Promise<string | null> {
  if (loc.google_place_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('locations')
      .select('id')
      .eq('google_place_id', loc.google_place_id)
      .limit(1)
      .maybeSingle();
    if (data) {
      console.log(`[import:resolveLocation] matched by google_place_id ${data.id}`);
      return data.id;
    }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: matches } = await (supabase as any).rpc('search_venues', {
      search_query: loc.name,
      result_limit: 3,
    });
    if (matches && matches.length > 0 && matches[0].similarity_score > 0.7) {
      console.log(`[import:resolveLocation] fuzzy matched "${loc.name}" → "${matches[0].name}" (score ${matches[0].similarity_score})`);
      return matches[0].id;
    }
  } catch {
    // search_venues RPC may not exist in all environments — fall through.
  }

  const slug = generateSlug(loc.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('locations')
    .insert({
      name: loc.name,
      slug,
      address_line: loc.address_line || null,
      city: loc.city,
      state: loc.state || null,
      postal_code: loc.postal_code || null,
      country: 'US',
      latitude: loc.latitude ?? null,
      longitude: loc.longitude ?? null,
      google_place_id: loc.google_place_id || null,
      venue_type: loc.venue_type || 'venue',
      source: 'scraper',
      is_active: true,
    })
    .select('id')
    .single();

  if (error) {
    console.error(`[import:resolveLocation] create failed: ${error.message}`);
    return null;
  }
  console.log(`[import:resolveLocation] created "${loc.name}" (${data.id})`);
  return data.id;
}

/**
 * Match an existing organizer (case-insensitive name) or create a new one.
 */
async function resolveOrganizer(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  org: NonNullable<SaveEventInput['organizer']>
): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: match } = await (supabase as any)
    .from('organizers')
    .select('id')
    .ilike('name', org.name)
    .limit(1)
    .maybeSingle();

  if (match) {
    console.log(`[import:resolveOrganizer] matched "${org.name}" → ${match.id}`);
    return match.id;
  }

  const slug = generateSlug(org.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('organizers')
    .insert({
      name: org.name,
      slug,
      website_url: org.website_url || null,
      email: org.email || null,
    })
    .select('id')
    .single();

  if (error) {
    console.error(`[import:resolveOrganizer] create failed: ${error.message}`);
    return null;
  }
  console.log(`[import:resolveOrganizer] created "${org.name}" (${data.id})`);
  return data.id;
}

// ============================================================================
// MAPPING
// ============================================================================

/**
 * Turn a ScraperEvent (raw extractor output) into a SaveEventInput. Splits the
 * flat `venue` object into the expected `location` sub-object and peels
 * organizer fields into `organizer`.
 *
 * The admin import route uses this after /analyze returns. The /api/scraper/events
 * route accepts SaveEventInput directly so this mapping only matters for the
 * import flow.
 */
export function scraperEventToSaveInput(
  event: ScraperEvent,
  fallbackSourceUrl: string
): SaveEventInput {
  const venue: ScraperVenue | null | undefined = event.venue;
  const location = venue && venue.name
    ? {
        name: venue.name,
        address_line: venue.address_line ?? null,
        city: venue.city ?? 'Milwaukee',
        state: venue.state ?? null,
        postal_code: venue.postal_code ?? null,
        latitude: venue.latitude ?? null,
        longitude: venue.longitude ?? null,
        google_place_id: venue.google_place_id ?? null,
        venue_type: venue.venue_type ?? null,
      }
    : null;

  const organizer = event.organizer_name
    ? {
        name: event.organizer_name,
        website_url: event.organizer_website_url ?? null,
        email: event.organizer_email ?? null,
      }
    : null;

  return {
    title: event.title,
    start_datetime: event.start_datetime,
    source_url: event.source_url || fallbackSourceUrl,
    end_datetime: event.end_datetime ?? null,
    instance_date: event.instance_date ?? null,
    description: event.description ?? null,
    short_description: event.short_description ?? null,
    tagline: event.tagline ?? null,
    happenlist_summary: event.happenlist_summary ?? null,
    organizer_description: event.organizer_description ?? null,
    price_type: event.price_type ?? null,
    price_low: event.price_low ?? null,
    price_high: event.price_high ?? null,
    price_details: event.price_details ?? null,
    ticket_url: event.ticket_url ?? null,
    category_slug: event.category_slug ?? null,
    website_url: event.website_url ?? null,
    instagram_url: event.instagram_url ?? null,
    facebook_url: event.facebook_url ?? null,
    registration_url: event.registration_url ?? null,
    image_url: event.image_url ?? null,
    flyer_url: event.flyer_url ?? null,
    thumbnail_url: event.thumbnail_url ?? null,
    location,
    organizer,
    age_low: event.age_low ?? null,
    age_high: event.age_high ?? null,
    age_restriction: event.age_restriction ?? null,
    is_family_friendly: event.is_family_friendly ?? null,
    good_for: event.good_for ?? null,
    talent_name: event.talent_name ?? null,
    talent_bio: event.talent_bio ?? null,
    is_all_day: event.is_all_day ?? false,
    timezone: event.timezone ?? null,
    scraped_data: event.scraped_data ?? null,
  };
}
