/**
 * SCRAPER / CHROME EXTENSION — EVENT CREATION API
 * ================================================
 * Creates events from the Chrome extension or any external scraper.
 *
 * Authentication: Bearer token using SCRAPER_API_SECRET (same secret as image upload).
 * Uses the admin Supabase client (service role) to bypass RLS.
 *
 * The Chrome extension should NEVER have the Supabase service role key.
 * This endpoint is the only way external tools create events.
 *
 * Flow:
 *   1. Extension scrapes event data from a website
 *   2. POST to /api/scraper/events with the scraped data
 *   3. API validates, deduplicates, and inserts
 *   4. Extension uses returned eventId to upload images via /api/images/upload
 *   5. Event lands in admin queue as pending_review
 *
 * @module api/scraper/events
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateSlug } from '@/lib/utils/slug';
import type { EventSource } from '@/lib/supabase/types';

// ============================================================================
// AUTH
// ============================================================================

const API_SECRET = process.env.SCRAPER_API_SECRET;

function isAuthorized(request: NextRequest): boolean {
  if (!API_SECRET) {
    console.warn('⚠️ SCRAPER_API_SECRET not set — allowing unauthenticated requests (dev mode)');
    return true;
  }
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;
  const [type, token] = authHeader.split(' ');
  return type === 'Bearer' && token === API_SECRET;
}

// ============================================================================
// TYPES
// ============================================================================

/** Fields the Chrome extension can send. */
interface ScraperEventInput {
  // -- Required --
  title: string;
  start_datetime: string; // ISO 8601
  source_url: string;     // The page being scraped

  // -- Strongly recommended --
  end_datetime?: string | null;
  instance_date?: string | null; // YYYY-MM-DD, derived from start_datetime if omitted
  description?: string | null;
  short_description?: string | null;
  organizer_description?: string | null;
  happenlist_summary?: string | null;

  // -- Pricing --
  price_type?: string | null;
  price_low?: number | null;
  price_high?: number | null;
  price_details?: string | null;
  ticket_url?: string | null;

  // -- Category --
  category_id?: string | null;
  category_slug?: string | null; // Alternative: look up by slug

  // -- Links --
  website_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  registration_url?: string | null;

  // -- Images (already uploaded via /api/images/upload, or raw URLs to re-host) --
  image_url?: string | null;
  flyer_url?: string | null;
  thumbnail_url?: string | null;

  // -- Location: either reference an existing one or provide data for a new one --
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

  // -- Organizer: either reference an existing one or provide data for a new one --
  organizer_id?: string | null;
  organizer?: {
    name: string;
    website_url?: string | null;
    email?: string | null;
  } | null;

  // -- Age/audience (optional) --
  age_low?: number | null;
  age_high?: number | null;
  age_restriction?: string | null;
  is_family_friendly?: boolean | null;

  // -- Good For audience tags --
  good_for?: string[] | null; // e.g., ['date_night', 'foodies']

  // -- Misc --
  is_all_day?: boolean;
  timezone?: string | null;
  scraped_data?: Record<string, unknown> | null; // Raw scraped JSON for debugging
}

// ============================================================================
// POST /api/scraper/events
// ============================================================================

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized — include Authorization: Bearer <SCRAPER_API_SECRET>' },
      { status: 401 }
    );
  }

  try {
    const body: ScraperEventInput = await request.json();

    // -- Validate required fields --
    const errors: string[] = [];
    if (!body.title?.trim()) errors.push('title is required');
    if (!body.start_datetime) errors.push('start_datetime is required (ISO 8601)');
    if (!body.source_url?.trim()) errors.push('source_url is required');

    if (body.title && body.title.length < 3) errors.push('title must be at least 3 characters');
    if (body.title && body.title.length > 200) errors.push('title must be 200 characters or less');

    if (errors.length > 0) {
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }

    const supabase = createAdminClient();

    // -- Deduplicate by source_url --
    const { data: existing } = await supabase
      .from('events')
      .select('id, title, status')
      .eq('source_url', body.source_url)
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'duplicate',
        message: `Event already exists: "${existing.title}" (${existing.status})`,
        existingEventId: existing.id,
      }, { status: 409 });
    }

    // -- Resolve category (by ID or slug) --
    let categoryId = body.category_id || null;
    if (!categoryId && body.category_slug) {
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', body.category_slug)
        .eq('is_active', true)
        .single();
      if (cat) categoryId = cat.id;
    }

    // -- Resolve location --
    let locationId = body.location_id || null;
    if (!locationId && body.location) {
      locationId = await resolveLocation(supabase, body.location);
    }

    // -- Resolve organizer --
    let organizerId = body.organizer_id || null;
    if (!organizerId && body.organizer) {
      organizerId = await resolveOrganizer(supabase, body.organizer);
    }

    // -- Derive instance_date --
    const instanceDate = body.instance_date || body.start_datetime.split('T')[0];

    // -- Validate price_type --
    const validPriceTypes = ['free', 'fixed', 'range', 'varies', 'donation', 'per_session'];
    const priceType = body.price_type && validPriceTypes.includes(body.price_type)
      ? body.price_type
      : 'free';

    // -- Build event row --
    const eventSlug = generateSlug(body.title);
    const source: EventSource = 'scraper';

    const eventData = {
      title: body.title.trim(),
      slug: eventSlug,
      description: body.description || null,
      short_description: body.short_description?.slice(0, 160) || null,
      happenlist_summary: body.happenlist_summary || null,
      organizer_description: body.organizer_description || null,
      start_datetime: body.start_datetime,
      end_datetime: body.end_datetime || null,
      instance_date: instanceDate,
      is_all_day: body.is_all_day || false,
      timezone: body.timezone || 'America/Chicago',
      category_id: categoryId,
      location_id: locationId,
      organizer_id: organizerId,
      price_type: priceType,
      price_low: body.price_low ?? null,
      price_high: body.price_high ?? null,
      price_details: body.price_details || null,
      ticket_url: body.ticket_url || null,
      image_url: body.image_url || null,
      flyer_url: body.flyer_url || null,
      thumbnail_url: body.thumbnail_url || null,
      website_url: body.website_url || null,
      instagram_url: body.instagram_url || null,
      facebook_url: body.facebook_url || null,
      registration_url: body.registration_url || null,
      age_low: body.age_low ?? null,
      age_high: body.age_high ?? null,
      age_restriction: body.age_restriction || null,
      is_family_friendly: body.is_family_friendly ?? null,
      good_for: body.good_for || [],
      status: 'pending_review',
      source,
      source_url: body.source_url,
      scraped_at: new Date().toISOString(),
      scraped_data: body.scraped_data || null,
    };

    const { data: event, error: insertError } = await supabase
      .from('events')
      .insert(eventData)
      .select('id, title, slug, status')
      .single();

    if (insertError) {
      console.error('❌ [scraper/events] Insert failed:', insertError.message);
      return NextResponse.json(
        { error: 'Failed to create event', details: insertError.message },
        { status: 500 }
      );
    }

    console.log(`✅ [scraper/events] Created: "${event.title}" (${event.id})`);

    return NextResponse.json({
      success: true,
      eventId: event.id,
      slug: event.slug,
      status: event.status,
      locationId,
      organizerId,
      message: 'Event created and queued for admin review.',
    }, { status: 201 });

  } catch (error) {
    console.error('❌ [scraper/events] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/scraper/events — docs
// ============================================================================

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/scraper/events',
    methods: ['POST'],
    authentication: 'Bearer token (SCRAPER_API_SECRET)',
    description: 'Create events from the Chrome extension or external scrapers.',
    workflow: [
      '1. POST event data here → get eventId back',
      '2. Upload images to /api/images/upload using that eventId',
      '3. Event appears in admin review queue as pending_review',
    ],
    required_fields: {
      title: 'string (min 3 chars)',
      start_datetime: 'string (ISO 8601, e.g. 2026-02-14T19:00:00-06:00)',
      source_url: 'string (URL of the page being scraped)',
    },
    recommended_fields: {
      description: 'string — cleaned event description',
      short_description: 'string — max 160 chars, for cards',
      organizer_description: 'string — verbatim text from the source page',
      price_type: 'free | fixed | range | varies | donation',
      price_low: 'number',
      price_high: 'number',
      price_details: 'string — complex pricing text',
      category_id: 'UUID — or use category_slug instead',
      category_slug: 'string — e.g. "music", "art"',
      end_datetime: 'string (ISO 8601)',
      image_url: 'string — Supabase CDN URL after uploading via /api/images/upload',
      age_low: 'number — minimum age (e.g. 21)',
      age_high: 'number — maximum age (e.g. 65)',
      age_restriction: 'string — human-readable age note (e.g. "21+", "All ages")',
      is_family_friendly: 'boolean — whether suitable for families/children',
      good_for: 'string[] — audience tags, e.g. ["date_night", "foodies"]. Valid: date_night, families_young_kids, families_older_kids, pet_friendly, foodies, girls_night, guys_night, solo_friendly, outdoorsy, creatives, music_lovers, active_seniors, college_crowd, first_timers',
    },
    location_options: [
      'location_id: UUID of existing venue',
      'location: { name, city, address_line?, state?, postal_code?, latitude?, longitude?, google_place_id?, venue_type? }',
    ],
    organizer_options: [
      'organizer_id: UUID of existing organizer',
      'organizer: { name, website_url?, email? }',
    ],
    deduplication: 'Events are deduplicated by source_url. If a matching event exists, returns 409 with existingEventId.',
  });
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Match an existing location or create a new one.
 * Priority: google_place_id → name+city fuzzy match → create new.
 */
async function resolveLocation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  loc: NonNullable<ScraperEventInput['location']>
): Promise<string | null> {
  // 1. Match by google_place_id (most reliable)
  if (loc.google_place_id) {
    const { data } = await supabase
      .from('locations')
      .select('id')
      .eq('google_place_id', loc.google_place_id)
      .limit(1)
      .single();
    if (data) {
      console.log(`📍 [resolveLocation] Matched by google_place_id: ${data.id}`);
      return data.id;
    }
  }

  // 2. Fuzzy match by name using search_venues RPC
  try {
    const { data: matches } = await supabase.rpc('search_venues', {
      search_query: loc.name,
      result_limit: 3,
    });
    if (matches && matches.length > 0 && matches[0].similarity_score > 0.7) {
      console.log(`📍 [resolveLocation] Fuzzy matched "${loc.name}" → "${matches[0].name}" (score: ${matches[0].similarity_score})`);
      return matches[0].id;
    }
  } catch {
    // search_venues RPC may not exist in all environments
  }

  // 3. Create new location
  const slug = generateSlug(loc.name);
  const { data, error } = await supabase
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
    console.error(`❌ [resolveLocation] Failed to create: ${error.message}`);
    return null;
  }

  console.log(`📍 [resolveLocation] Created new: "${loc.name}" (${data.id})`);
  return data.id;
}

/**
 * Match an existing organizer or create a new one.
 * Matches by name (case-insensitive exact match).
 */
async function resolveOrganizer(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  org: NonNullable<ScraperEventInput['organizer']>
): Promise<string | null> {
  // 1. Case-insensitive name match
  const { data: match } = await supabase
    .from('organizers')
    .select('id')
    .ilike('name', org.name)
    .limit(1)
    .single();

  if (match) {
    console.log(`🏢 [resolveOrganizer] Matched: "${org.name}" → ${match.id}`);
    return match.id;
  }

  // 2. Create new
  const slug = generateSlug(org.name);
  const { data, error } = await supabase
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
    console.error(`❌ [resolveOrganizer] Failed to create: ${error.message}`);
    return null;
  }

  console.log(`🏢 [resolveOrganizer] Created new: "${org.name}" (${data.id})`);
  return data.id;
}
