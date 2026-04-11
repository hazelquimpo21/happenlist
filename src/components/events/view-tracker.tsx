/**
 * =============================================================================
 * ViewTracker — invisible client component that records a view on mount
 * =============================================================================
 *
 * Phase 1, Session B3 of the Smart Filters Roadmap.
 *
 * THIS IS THE ONLY MOUNTING POINT FOR VIEW TRACKING. If you add a new
 * surface that should count as "the user viewed this event" (an event
 * detail modal, an embedded card on a profile page, an iframe, etc.),
 * mount <ViewTracker eventId={...} /> there.
 *
 * Why a client component:
 *   - We need an effect that runs in the browser (not on every server
 *     render — server renders happen on bots, prefetches, etc., and would
 *     wildly inflate the count).
 *   - useEffect ensures the view is recorded only after the page has
 *     committed to the user.
 *
 * Why no visible output:
 *   - This component returns null. It exists purely for its side effect.
 *
 * Idempotency:
 *   - Layer 1: useRef sentinel keyed by eventId prevents the action from
 *     firing twice during React 18+ strict-mode double-mount in dev.
 *     Keying by eventId (rather than a plain boolean) means that if some
 *     future caller reuses the same component instance for a different
 *     event (e.g. an SPA modal that swaps eventId without remount), the
 *     new event still records — only the *same* eventId is suppressed.
 *   - Layer 2: the recordEventView server action reuses the existing
 *     hl_sid cookie, so navigations within the same browser session
 *     don't pick up new session ids.
 *   - Layer 3: the DB unique index on (event_id, session_id, view_date)
 *     suppresses duplicate inserts at the storage layer.
 *
 * Failure mode:
 *   - recordEventView never throws. If anything goes wrong, the action
 *     logs `[event-views] …` and returns false. The page render is
 *     unaffected.
 *
 * Cross-file coupling:
 *   - src/data/events/record-view.ts                       — server action
 *   - src/app/event/[slug]/page.tsx                         — sole mount point today
 *   - supabase/migrations/20260411_1900_event_views.sql     — schema
 * =============================================================================
 */

'use client';

import { useEffect, useRef } from 'react';
import { recordEventView } from '@/data/events/record-view';

interface ViewTrackerProps {
  eventId: string;
}

export function ViewTracker({ eventId }: ViewTrackerProps) {
  // Sentinel keyed by the eventId we already fired for. In dev, React 18+
  // strict mode runs the effect twice for the same instance — the second
  // run sees firedForRef.current === eventId and skips. If a parent ever
  // swaps the eventId on a live instance, the ref no longer matches and
  // the new event records correctly.
  const firedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (firedForRef.current === eventId) return;
    firedForRef.current = eventId;

    // Fire and forget. recordEventView never throws — it returns false
    // on error. We don't await/log the result here because the action
    // already does its own logging.
    void recordEventView(eventId);
  }, [eventId]);

  return null;
}
