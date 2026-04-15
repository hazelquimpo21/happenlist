/**
 * EVENT PEEK — constants
 * =====================================================================
 * Centralized labels, copy, and config for the event peek modal/sheet.
 *
 * WHY CENTRALIZED:
 *   The peek surface has CTAs, telemetry scopes, and layout constants
 *   that must stay consistent across four files (peek content, sheet
 *   wrapper, route wrapper, intercepted route). Duplicating strings is
 *   how drift starts. Put them here.
 *
 * CROSS-FILE COUPLING:
 *   - src/components/events/peek/event-peek.tsx        (consumes CTAs)
 *   - src/components/events/peek/event-peek-sheet.tsx  (uses layout const)
 *   - src/components/events/peek/event-peek-route.tsx  (logs with SCOPE)
 *   - src/app/@modal/(.)event/[slug]/page.tsx          (logs with SCOPE)
 *
 * If you add a new CTA or copy line, add it HERE and import — do not
 * inline literals in the components.
 * =====================================================================
 */

// ---------------------------------------------------------------------------
// Telemetry scope — structured log prefix per engineering standards.
// Matches existing convention: [scope:action]. See CLAUDE.md → logging.
// ---------------------------------------------------------------------------
export const PEEK_LOG_SCOPE = 'peek';

// ---------------------------------------------------------------------------
// Copy — user-facing strings. Keep short, warm, action-oriented.
// ---------------------------------------------------------------------------
export const PEEK_COPY = {
  /** Primary CTA when the event has an external ticket/RSVP URL. */
  ctaTicketsLabel: 'Get tickets',
  /** Primary CTA when the event is free but has a signup/details URL. */
  ctaRsvpLabel: 'RSVP',
  /** Primary CTA for parent events (festivals/multi-act) — routes to full page. */
  ctaScheduleLabel: 'See full schedule',
  /** Secondary CTA on every peek — links to the full detail page. */
  ctaViewFullLabel: 'View full details',
  /** Close button aria-label. */
  closeLabel: 'Close event preview',
  /** Sheet aria-label when no title loaded yet (shouldn't happen, but safe). */
  fallbackTitle: 'Event preview',
} as const;

// ---------------------------------------------------------------------------
// Layout — sheet sizing and responsive behavior.
// Breakpoints mirror Tailwind's `md` (768px) used throughout the app.
// ---------------------------------------------------------------------------
export const PEEK_LAYOUT = {
  /** Max height on mobile (bottom sheet). Leaves room for URL bar / status. */
  mobileMaxHeightVh: 92,
  /** Desktop modal max width in pixels — matches `max-w-2xl`. */
  desktopMaxWidthPx: 640,
  /** Hero image aspect ratio on the peek (wider than the card to feel bigger). */
  heroAspect: 'aspect-[16/9]',
} as const;
