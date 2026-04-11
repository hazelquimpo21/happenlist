/**
 * =============================================================================
 * recordEventView — server action for B3 view tracking
 * =============================================================================
 *
 * Phase 1, Session B3 of the Smart Filters Roadmap. Wraps the
 * `record_event_view` Postgres function (created by
 * `supabase/migrations/20260411_1900_event_views.sql`) with:
 *
 *   1. Anonymous session id management via the `hl_sid` cookie
 *      (server-set, sameSite=lax, 1 year, NOT httpOnly so that future
 *      client-side analytics could read it if needed; only set if missing).
 *   2. A try/catch that NEVER throws — view tracking failure must never
 *      break the event detail page render. Errors get logged with the
 *      `[event-views]` prefix per the CLAUDE.md logging convention.
 *   3. Idempotency at two layers: the DB unique index on
 *      (event_id, session_id, view_date) suppresses duplicate inserts,
 *      and this action always reuses the existing cookie if present so
 *      a single browser stays on a single session id.
 *
 * The action is invoked from <ViewTracker /> (a small client component
 * mounted on the event detail page). It is the ONLY mounting point for
 * view tracking in Phase 1; if you add new event detail surfaces (modals,
 * embedded cards on a profile, etc.) you should mount ViewTracker there
 * too — see src/components/events/view-tracker.tsx.
 *
 * Cross-file coupling:
 *   - supabase/migrations/20260411_1900_event_views.sql — table + function
 *   - src/components/events/view-tracker.tsx              — sole caller
 *   - src/lib/supabase/server.ts                          — server client
 *   - src/lib/supabase/types.ts                           — typed RPC sig
 * =============================================================================
 */

'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

/**
 * Cookie name for the anonymous session id. The format is
 * `sess_<32 hex chars>` (16 random bytes = 128 bits of entropy) and is
 * generated server-side on first call.
 *
 * Not httpOnly: client analytics scripts may read it in the future. Today
 * the cookie is only consumed server-side, but flipping httpOnly off costs
 * nothing and keeps the door open.
 */
const SESSION_COOKIE_NAME = 'hl_sid';

/** 1 year in seconds — long enough that returning visitors stay coherent. */
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * 16 bytes of randomness → 32 hex chars. 128 bits is comfortably beyond
 * collision risk for the visitor population we'll ever see, and gives a
 * cleaner safety margin than the original 64-bit version. The session id
 * is not a security secret (it only de-duplicates view inserts), but the
 * extra bytes cost nothing.
 *
 * Cookie format: `sess_` (5 chars) + 32 hex chars = 37 chars total.
 */
const SESSION_ID_BYTES = 16;
const SESSION_ID_LENGTH = 'sess_'.length + SESSION_ID_BYTES * 2; // 37

/**
 * Generate a fresh session id. Format `sess_` + 32 hex chars (16 bytes).
 *
 * Uses Web Crypto (`crypto.getRandomValues`) which exists in the Next.js
 * Node 18+ runtime — no need for the Node `crypto` module shim.
 */
function generateSessionId(): string {
  const bytes = new Uint8Array(SESSION_ID_BYTES);
  crypto.getRandomValues(bytes);
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return `sess_${hex}`;
}

/**
 * Get the current session id from the `hl_sid` cookie, generating and
 * setting a new one if absent. Idempotent across calls within the same
 * request — the cookie write happens only when a new id is generated.
 *
 * Server actions CAN set cookies. This is invoked from a server action
 * context (`recordEventView` below), so cookies().set() is allowed.
 */
async function getOrCreateSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(SESSION_COOKIE_NAME)?.value;
  // Accept legacy 8-byte ids (length 21) so visitors who already have a
  // cookie from the original B3 build don't get reset to a new session and
  // double-counted. New ids are minted at SESSION_ID_LENGTH (37).
  if (
    existing &&
    existing.startsWith('sess_') &&
    (existing.length === SESSION_ID_LENGTH || existing.length === 21)
  ) {
    return existing;
  }

  const fresh = generateSessionId();
  try {
    store.set(SESSION_COOKIE_NAME, fresh, {
      path: '/',
      maxAge: SESSION_COOKIE_MAX_AGE,
      sameSite: 'lax',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
    });
  } catch (err) {
    // cookies().set() throws if called from a Server Component (not a
    // Server Action). View tracking is always invoked from a client
    // component via a server action, so this should never trigger — but
    // log it loudly if the assumption breaks so R1 catches it.
    console.warn('[event-views] could not set hl_sid cookie:', err);
  }
  return fresh;
}

/**
 * Record a view of an event for the current anonymous session.
 *
 * Idempotent at the DB layer (unique index on event_id + session_id +
 * Chicago-local view_date). Returning value is best-effort — callers
 * should NOT rely on it being accurate; it's mostly there so smoke tests
 * can verify the action wired up.
 *
 * Never throws. Logs errors with [event-views] prefix and returns false.
 */
export async function recordEventView(eventId: string): Promise<boolean> {
  if (!eventId || typeof eventId !== 'string') {
    console.warn('[event-views] recordEventView called with invalid eventId');
    return false;
  }

  try {
    const sessionId = await getOrCreateSessionId();
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('record_event_view', {
      p_event_id: eventId,
      p_session_id: sessionId,
    });

    if (error) {
      console.error(
        `[event-views] rpc error event=${eventId} session=${sessionId.slice(0, 12)}…`,
        error,
      );
      return false;
    }

    const inserted = data === true;
    console.log(
      `[event-views] ${inserted ? 'inserted view' : 'duplicate (skipped)'} event=${eventId} session=${sessionId.slice(0, 12)}…`,
    );
    return inserted;
  } catch (err) {
    console.error(`[event-views] unexpected failure event=${eventId}`, err);
    return false;
  }
}
