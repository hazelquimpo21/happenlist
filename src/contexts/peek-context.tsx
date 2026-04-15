/**
 * PEEK CONTEXT — client-side peek modal state
 * =====================================================================
 * Lets any component call `usePeek().openPeek(slug, date)` to pop up
 * the event peek sheet. Lives in a React context so the open state
 * survives Next router patches on the surrounding page.
 *
 * URL SYNC:
 *   When a peek opens, we push `/event/{slug}` onto history via
 *   `window.history.pushState`. This gives the user:
 *     - A real URL to copy/share (if they want to)
 *     - Browser back button closes the peek (popstate handler)
 *     - Forward button re-opens it
 *
 *   We *don't* use Next's router.push because that would trigger the
 *   /event/[slug] route to render — defeating the whole "peek stays
 *   over the feed" UX. Raw pushState bypasses Next's router.
 *
 *   A direct visit to /event/[slug] (refresh, bookmark, shared link)
 *   renders the full page via normal SSR — there's no peek layer at
 *   all on that path. That's by design.
 *
 * CROSS-FILE COUPLING:
 *   - src/components/events/peek/peek-host.tsx — consumes this context
 *   - src/components/events/event-card.tsx      — calls openPeek()
 *   - src/app/api/event/[slug]/route.ts         — data source
 *   - src/lib/utils/url.ts                      — buildEventUrl
 *
 * If you add a new entry point (e.g. a saved-events list), import
 * `usePeek` and call `openPeek({ slug, instanceDate })`. Don't touch
 * history or fetching yourself — this provider owns both.
 * =====================================================================
 */

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { EventCard, EventWithDetails } from '@/types';
import { PEEK_LOG_SCOPE } from '@/lib/constants/event-peek';
import { buildEventUrl } from '@/lib/utils';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

/** Lightweight identifier stored in context while the peek is open. */
export interface PeekTarget {
  slug: string;
  instanceDate: string; // YYYY-MM-DD
}

/**
 * Optional card-shaped data handed in at open time.
 *
 * WHY: When the user taps a card we already have title/image/date in
 * memory. Rendering those immediately (while the full event fetches in
 * the background) means the peek never shows a skeleton on fast
 * connections — it opens populated, and only CTAs + full description
 * fade in a beat later. Feels instant.
 */
export type PeekStub = EventCard;

/** Loaded event + loading/error state shown in the sheet. */
interface PeekData {
  target: PeekTarget;
  /** Card-shape data from the trigger; used for instant first paint. */
  stub: PeekStub | null;
  /** Null while fetching; present when loaded; undefined on error. */
  event: EventWithDetails | null | undefined;
  error: string | null;
  /** Element that had focus when peek opened — restore on close. */
  triggerEl: HTMLElement | null;
}

interface PeekContextValue {
  data: PeekData | null;
  isOpen: boolean;
  openPeek: (target: PeekTarget, stub?: PeekStub) => void;
  closePeek: () => void;
}

// ---------------------------------------------------------------------------
// CONTEXT
// ---------------------------------------------------------------------------

const PeekContext = createContext<PeekContextValue | null>(null);

// ---------------------------------------------------------------------------
// HISTORY STATE MARKER
// ---------------------------------------------------------------------------
// We stamp history entries we create so popstate can tell "the user
// pressed back while our peek was open" vs. "some other navigation
// happened." Without this marker we'd risk closing the peek on an
// unrelated history change.
const PEEK_HISTORY_MARKER = '__happenlist_peek__';
interface PeekHistoryState {
  [PEEK_HISTORY_MARKER]: true;
  slug: string;
  instanceDate: string;
}
function isPeekState(s: unknown): s is PeekHistoryState {
  return !!s && typeof s === 'object' && PEEK_HISTORY_MARKER in (s as object);
}

// ---------------------------------------------------------------------------
// PROVIDER
// ---------------------------------------------------------------------------

export function PeekProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PeekData | null>(null);

  // Mirror data in a ref so closePeek() (memoized without `data` dep to
  // keep its identity stable across renders) can still read the latest
  // triggerEl without going stale.
  const dataRef = useRef<PeekData | null>(null);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Track whether the CURRENT history entry was created by us. When true,
  // closePeek() calls history.back() to remove the entry; when false, we
  // just clear state (e.g. popstate already removed the entry).
  const weOwnTopOfHistory = useRef(false);

  // -------------------------------------------------------------------------
  // FETCH EVENT
  // -------------------------------------------------------------------------
  const fetchEvent = useCallback(async (target: PeekTarget) => {
    const url = buildEventUrl({
      slug: target.slug,
      instance_date: target.instanceDate,
    });
    try {
      // Strip leading `/event/` → `[slug]` for the API route.
      const apiPath = `/api/event/${url.replace(/^\/event\//, '')}`;
      console.log(`[${PEEK_LOG_SCOPE}:fetch] ${apiPath}`);
      const res = await fetch(apiPath, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const event = (await res.json()) as EventWithDetails;
      setData((prev) =>
        // Guard against a race where the user opened another peek mid-fetch.
        prev && prev.target.slug === target.slug
          ? { ...prev, event, error: null }
          : prev
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load event';
      console.error(`[${PEEK_LOG_SCOPE}:fetch-error]`, msg);
      setData((prev) =>
        prev && prev.target.slug === target.slug
          ? { ...prev, event: undefined, error: msg }
          : prev
      );
    }
  }, []);

  // -------------------------------------------------------------------------
  // OPEN
  // -------------------------------------------------------------------------
  const openPeek = useCallback(
    (target: PeekTarget, stub: PeekStub | null = null) => {
      console.log(
        `[${PEEK_LOG_SCOPE}:open] slug=${target.slug} date=${target.instanceDate} stub=${!!stub}`
      );
      // Remember who opened the peek so we can return focus on close.
      const triggerEl =
        (document.activeElement as HTMLElement | null) ?? null;

      setData({
        target,
        stub,
        event: null,
        error: null,
        triggerEl,
      });

      // Push a history entry so browser back closes the peek.
      const url = buildEventUrl({
        slug: target.slug,
        instance_date: target.instanceDate,
      });
      const state: PeekHistoryState = {
        [PEEK_HISTORY_MARKER]: true,
        slug: target.slug,
        instanceDate: target.instanceDate,
      };
      window.history.pushState(state, '', url);
      weOwnTopOfHistory.current = true;

      // Kick off the fetch (don't await — we render a loading state).
      void fetchEvent(target);
    },
    [fetchEvent]
  );

  // -------------------------------------------------------------------------
  // CLOSE
  // -------------------------------------------------------------------------
  const closePeek = useCallback(() => {
    console.log(`[${PEEK_LOG_SCOPE}:close]`);
    // Restore focus to the card that opened the peek — accessibility win
    // for keyboard users. Do this *before* unmounting the sheet so Radix
    // doesn't fight us over focus.
    const trigger = dataRef.current?.triggerEl;
    setData(null);
    if (trigger && document.contains(trigger)) {
      // Next tick so React unmounts the sheet before we focus.
      requestAnimationFrame(() => trigger.focus({ preventScroll: true }));
    }
    if (weOwnTopOfHistory.current) {
      // Pop our pushed entry so the URL reverts to where the user came from.
      weOwnTopOfHistory.current = false;
      window.history.back();
    }
  }, []);

  // -------------------------------------------------------------------------
  // POPSTATE LISTENER — browser back while peek open
  // -------------------------------------------------------------------------
  useEffect(() => {
    function onPopState(e: PopStateEvent) {
      // If the state we just LEFT was a peek state, the user pressed back
      // to close us. Clear the context; don't call history.back again.
      if (isPeekState(e.state)) {
        // Forward nav back into a peek (rare): re-open.
        console.log(`[${PEEK_LOG_SCOPE}:popstate] re-entering peek`);
        setData({
          target: { slug: e.state.slug, instanceDate: e.state.instanceDate },
          stub: null, // no card data on forward nav — fetch will fill in
          event: null,
          error: null,
          triggerEl: null,
        });
        weOwnTopOfHistory.current = true;
        void fetchEvent({
          slug: e.state.slug,
          instanceDate: e.state.instanceDate,
        });
        return;
      }
      // Non-peek state means we backed OUT of a peek (or an unrelated nav).
      if (weOwnTopOfHistory.current) {
        console.log(`[${PEEK_LOG_SCOPE}:popstate] back button closed peek`);
        weOwnTopOfHistory.current = false;
        setData(null);
      }
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [fetchEvent]);

  return (
    <PeekContext.Provider
      value={{ data, isOpen: !!data, openPeek, closePeek }}
    >
      {children}
    </PeekContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// HOOK
// ---------------------------------------------------------------------------
export function usePeek(): PeekContextValue {
  const ctx = useContext(PeekContext);
  if (!ctx) {
    throw new Error(
      'usePeek() must be used inside <PeekProvider>. Check that the root layout renders it.'
    );
  }
  return ctx;
}
