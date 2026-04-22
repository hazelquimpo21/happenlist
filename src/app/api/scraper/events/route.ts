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
 * All save/resolve logic lives in lib/scraper/save-event.ts so the admin
 * import flow (/api/superadmin/import/save) behaves identically. If you need
 * to change how events are deduped, how venues are resolved, how categories
 * are mapped — do it in save-event.ts, not here.
 *
 * @module api/scraper/events
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  saveScrapedEvent,
  type SaveEventInput,
  type SaveEventOptions,
} from '@/lib/scraper/save-event';

// ============================================================================
// AUTH
// ============================================================================

const API_SECRET = process.env.SCRAPER_API_SECRET;

function isAuthorized(request: NextRequest): boolean {
  if (!API_SECRET) {
    console.warn('⚠️ [scraper:events] SCRAPER_API_SECRET not set — allowing unauthenticated requests (dev mode)');
    return true;
  }
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;
  const [type, token] = authHeader.split(' ');
  return type === 'Bearer' && token === API_SECRET;
}

// ============================================================================
// POST /api/scraper/events
// ============================================================================

/**
 * The Chrome extension / Render scraper always creates events as auto-published.
 * Admin import UI uses the shared helper directly with status='pending_review'.
 */
const PUBLIC_SCRAPER_SAVE_OPTIONS: SaveEventOptions = {
  status: 'published',
  source: 'scraper',
};

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized — include Authorization: Bearer <SCRAPER_API_SECRET>' },
      { status: 401 }
    );
  }

  let body: SaveEventInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    const result = await saveScrapedEvent(supabase, body, PUBLIC_SCRAPER_SAVE_OPTIONS);

    if (result.ok) {
      console.log(`✅ [scraper:events] created "${body.title}" → ${result.eventId}`);
      return NextResponse.json(
        {
          success: true,
          eventId: result.eventId,
          slug: result.slug,
          status: result.status,
          locationId: result.locationId,
          organizerId: result.organizerId,
          message: 'Event created.',
        },
        { status: 201 }
      );
    }

    if (result.code === 'validation') {
      return NextResponse.json({ error: 'Validation failed', details: result.errors }, { status: 400 });
    }

    if (result.code === 'duplicate') {
      return NextResponse.json(
        {
          success: false,
          error: 'duplicate',
          message: `Event already exists: "${result.existingTitle}" (${result.existingStatus})`,
          existingEventId: result.existingEventId,
        },
        { status: 409 }
      );
    }

    // insert_failed
    console.error(`❌ [scraper:events] insert failed: ${result.error}`);
    return NextResponse.json(
      { error: 'Failed to create event', details: result.error },
      { status: 500 }
    );
  } catch (error) {
    console.error('❌ [scraper:events] unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      '3. Event is auto-published and visible immediately',
    ],
    required_fields: {
      title: 'string (min 3 chars)',
      start_datetime: 'string (ISO 8601, e.g. 2026-02-14T19:00:00-06:00)',
      source_url: 'string (URL of the page being scraped)',
    },
    deduplication: 'Events are deduplicated by source_url. If a matching event exists, returns 409 with existingEventId.',
    shared_logic: 'All save/resolve logic lives in src/lib/scraper/save-event.ts (also used by /api/superadmin/import/save).',
  });
}
