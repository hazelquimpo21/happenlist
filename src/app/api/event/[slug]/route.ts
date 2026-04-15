/**
 * /api/event/[slug] — JSON endpoint for client-side event fetch
 * =====================================================================
 * The peek modal is a client-side overlay that opens when the user
 * taps an EventCard. To render the peek we need the same data as the
 * full page (`EventWithDetails`), but we can't reach `getEvent()`
 * directly from the client. This thin API wraps it.
 *
 * WHY A PUBLIC API ROUTE AND NOT A SERVER ACTION:
 *   - Server actions POST, which feels wrong semantically for a GET.
 *   - API routes cache well (could add CDN caching later).
 *   - A simple JSON endpoint is easier to curl/debug.
 *
 * CROSS-FILE COUPLING:
 *   - src/components/events/peek/peek-host.tsx — primary consumer
 *   - src/data/events/get-event.ts              — shared data layer
 *   - src/lib/utils/url.ts                      — parseEventSlug
 *
 * If `getEvent()`'s return shape changes, client-side peek needs a
 * rebuild — the JSON here is a passthrough, on purpose. Drift is
 * caught because both the full page and peek read from the same
 * function.
 * =====================================================================
 */

import { NextResponse, type NextRequest } from 'next/server';
import { getEvent } from '@/data/events';
import { parseEventSlug } from '@/lib/utils';
import { PEEK_LOG_SCOPE } from '@/lib/constants/event-peek';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { slug: rawSlug } = await params;

  const parsed = parseEventSlug(rawSlug);
  if (!parsed) {
    console.warn(
      `[${PEEK_LOG_SCOPE}:api] rejected slug=${rawSlug} reason=unparseable`
    );
    return NextResponse.json(
      { error: 'Invalid event slug' },
      { status: 400 }
    );
  }

  console.log(
    `[${PEEK_LOG_SCOPE}:api] fetching slug=${parsed.slug} date=${parsed.date}`
  );

  const event = await getEvent({
    slug: parsed.slug,
    instanceDate: parsed.date,
  });

  if (!event) {
    console.warn(
      `[${PEEK_LOG_SCOPE}:api] not-found slug=${rawSlug}`
    );
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  // No caching for now — event data (hearts, views) is live.
  return NextResponse.json(event, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
