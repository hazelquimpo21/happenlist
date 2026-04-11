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
 *   - Layer 1: useRef sentinel prevents the action from firing twice
 *     during React 18+ strict-mode double-mount in development.
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
  // useRef sentinel: in dev, React 18+ strict mode mounts components
  // twice on purpose to surface effect-cleanup bugs. We don't want both
  // mounts to fire the server action — the unique index would suppress
  // the duplicate, but the wasted round-trip is avoidable.
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    // Fire and forget. recordEventView never throws — it returns false
    // on error. We don't await/log the result here because the action
    // already does its own logging.
    void recordEventView(eventId);
  }, [eventId]);

  return null;
}
