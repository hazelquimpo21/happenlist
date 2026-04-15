/**
 * EVENT PEEK — shared content
 * =====================================================================
 * Pure presentational component. Renders the *contents* of a peek
 * surface (no dialog chrome — that's EventPeekSheet's job).
 *
 * WHY SEPARATE FROM THE SHEET:
 *   The sheet owns focus trap / scroll lock / animation / close button.
 *   This component owns layout + information hierarchy. Separating them
 *   means we can render the same content inside a dialog, inside a
 *   drawer, inline on a detail page preview, or in Storybook without
 *   touching dialog code.
 *
 * DESIGN PRINCIPLES (from CLAUDE.md):
 *   - Browse-first UX: enough info to say "yes / not for me"
 *   - Category color = identity (badge pill on hero image)
 *   - Day + time (not calendar date)
 *   - Sans-serif only (Plus Jakarta Sans via `font-body`)
 *
 * CROSS-FILE COUPLING:
 *   - event-peek-sheet.tsx           — wraps this in a Radix Dialog
 *   - src/lib/constants/event-peek.ts — CTA labels, layout constants
 *   - src/components/events/event-card.tsx — shares date formatting rules
 *   - src/types/event.ts              — EventWithDetails shape
 *
 * If the card's date-format rules change, update the shared helper in
 * `src/lib/utils/dates.ts` — both card and peek read from there.
 * =====================================================================
 */

'use client';

import Link from 'next/link';
import { MapPin, Ticket, ExternalLink, Calendar, Repeat, ArrowRight } from 'lucide-react';
import type { EventWithDetails } from '@/types';
import { buildEventUrl, buildVenueUrl } from '@/lib/utils';
import { cn } from '@/lib/utils/cn';
import { formatEventDate } from '@/lib/utils/dates';
import { getCategoryColor } from '@/lib/constants/category-colors';
import { PEEK_COPY, PEEK_LAYOUT, PEEK_LOG_SCOPE } from '@/lib/constants/event-peek';
import { EventImage } from '../event-image';
import { HeartButtonCompact } from '@/components/hearts';
import { VibeTagPill, AccessBadge } from '../vibe-profile';

// ---------------------------------------------------------------------------
// PROP TYPES
// ---------------------------------------------------------------------------

interface EventPeekProps {
  event: EventWithDetails;
  /** Whether an upcoming-series recurrence label should be shown. */
  recurrenceLabel?: string | null;
  /** Number of additional upcoming dates in the series. */
  upcomingCount?: number;
  /**
   * Called by the primary/secondary CTAs right before navigation.
   * Parent (the sheet) uses this to close itself, so the transition
   * from peek → full page feels like a single action.
   */
  onNavigate?: () => void;
  /**
   * When true, `event` is a partial stub (card data reshaped). Used for
   * instant first paint while the full event fetches. Visually we:
   *   - Dim the description placeholder (will fill in shortly)
   *   - Hide the primary "Get tickets" CTA (needs ticket_url)
   * These are intentional quiet transitions, not loading spinners.
   */
  isStub?: boolean;
}

// ---------------------------------------------------------------------------
// PRIMARY CTA — varies by event shape
// ---------------------------------------------------------------------------
//
// Parent events (festivals, multi-act): the peek can't meaningfully
// convey a program — route to the full page where <ChildEventsSchedule>
// lives.
//
// Events with a ticket_url: external CTA (the real action the user is
// here to take).
//
// Otherwise: fall back to "View full details" as the only CTA — no
// made-up RSVP button when there's nothing to RSVP to.
// ---------------------------------------------------------------------------
function resolvePrimaryCta(event: EventWithDetails): {
  kind: 'schedule' | 'tickets' | 'rsvp' | null;
  href: string;
  label: string;
  external: boolean;
} | null {
  const isParent = (event.child_event_count ?? 0) > 0 && !event.parent_event_id;

  if (isParent) {
    return {
      kind: 'schedule',
      href: buildEventUrl({ slug: event.slug, instance_date: event.instance_date }),
      label: PEEK_COPY.ctaScheduleLabel,
      external: false,
    };
  }

  if (event.ticket_url) {
    return {
      kind: event.is_free ? 'rsvp' : 'tickets',
      href: event.ticket_url,
      label: event.is_free ? PEEK_COPY.ctaRsvpLabel : PEEK_COPY.ctaTicketsLabel,
      external: true,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// PRICE FORMATTING — kept local because peek's phrasing is slightly
// friendlier than the card. Cards say "See details"; the peek always
// has a full-page CTA right there, so it can say less.
// ---------------------------------------------------------------------------
function formatPeekPrice(event: EventWithDetails): string | null {
  if (event.is_free) return 'Free';
  if (event.price_low && event.price_high && event.price_low !== event.price_high) {
    return `$${event.price_low} – $${event.price_high}`;
  }
  if (event.price_low) return `$${event.price_low}`;
  return null; // Intentionally null → the peek just won't show a price chip.
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export function EventPeek({
  event,
  recurrenceLabel,
  upcomingCount,
  onNavigate,
  isStub = false,
}: EventPeekProps) {
  const categoryColor = getCategoryColor(event.category?.slug ?? null);
  // Stub has no ticket_url — skip primary CTA resolution to avoid
  // rendering a dead button that would pop in a beat later.
  const primaryCta = isStub ? null : resolvePrimaryCta(event);
  const fullPageHref = buildEventUrl({
    slug: event.slug,
    instance_date: event.instance_date,
  });
  const priceLabel = formatPeekPrice(event);
  const hasRecurrence = recurrenceLabel && (upcomingCount ?? 0) > 0;

  // Log CTA intents so we can confirm peek → action conversion in dev.
  // Structured prefix `[peek:...]` per engineering standards.
  const logAndClose = (action: 'cta-tickets' | 'cta-full' | 'cta-schedule') => {
    return () => {
      console.log(`[${PEEK_LOG_SCOPE}:${action}] event=${event.slug}`);
      onNavigate?.();
    };
  };

  return (
    <div className="flex flex-col h-full">
      {/* ─────────────────────────────────────────────────────────────── */}
      {/* HERO IMAGE — wider than card, category badge for identity */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <div className="relative flex-shrink-0">
        <EventImage
          src={event.image_url}
          fallbackSrc={event.thumbnail_url}
          alt={event.title}
          fallbackLetter={event.title.charAt(0)}
          aspectRatio={PEEK_LAYOUT.heroAspect}
          priority
        />

        {event.category?.name && (
          <div className="absolute top-3 left-3 z-10">
            <span
              className="px-2.5 py-1 text-caption uppercase font-semibold tracking-wider rounded-sm shadow-sm"
              style={{
                backgroundColor: categoryColor.bg,
                color: categoryColor.text,
              }}
            >
              {event.category.name}
            </span>
          </div>
        )}

        {/* Heart lives on hero so it's reachable without scrolling on mobile. */}
        <div className="absolute top-3 right-3 z-10">
          <HeartButtonCompact
            eventId={event.id}
            className="bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white"
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* SCROLLABLE CONTENT — flex-1 lets hero stay pinned on small screens */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Date — prominent, prefixed with "Next:" for collapsed series */}
        <div>
          <p className="text-body-sm font-semibold text-blue flex items-center gap-1.5">
            <Calendar className="w-4 h-4" aria-hidden="true" />
            {hasRecurrence
              ? `Next: ${formatEventDate(event.start_datetime, { format: 'relative' })}`
              : formatEventDate(event.start_datetime, { format: 'relative' })}
          </p>

          {hasRecurrence && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium mt-1.5"
              style={{
                backgroundColor: `${categoryColor.accent}15`,
                color: categoryColor.accent,
              }}
            >
              <Repeat className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              {recurrenceLabel} &middot; {upcomingCount} more{' '}
              {upcomingCount === 1 ? 'date' : 'dates'}
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="font-body text-h3 font-semibold text-ink leading-tight">
          {event.title}
        </h2>

        {/* Location — tappable, goes to venue page on full page link */}
        {event.location?.name && (
          <div className="flex items-start gap-2 text-body-sm text-zinc">
            <MapPin
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            {event.location.slug ? (
              <Link
                href={buildVenueUrl({ slug: event.location.slug })}
                onClick={logAndClose('cta-full')}
                className="hover:text-blue transition-colors"
              >
                {event.location.name}
                {event.location.city && (
                  <span className="text-zinc/70"> · {event.location.city}</span>
                )}
              </Link>
            ) : (
              <span>
                {event.location.name}
                {event.location.city && (
                  <span className="text-zinc/70"> · {event.location.city}</span>
                )}
              </span>
            )}
          </div>
        )}

        {/* Description — short_description is the editorial teaser; fall
            back to a trimmed description if absent. Full prose lives on
            the full page, so we cap at ~3 lines here.
            In stub mode we fade the text slightly to signal the full
            version is about to slide in. */}
        {(event.short_description || event.description) && (
          <p
            className={cn(
              'text-body-sm text-ink/80 leading-relaxed line-clamp-4',
              'transition-opacity duration-200',
              isStub && 'opacity-70'
            )}
          >
            {event.short_description ?? event.description}
          </p>
        )}

        {/* Badges row — access, vibe tags, price chip.
            Display-only in v1 (no filter-on-tap). */}
        <div className="flex flex-wrap items-center gap-2">
          {event.is_free ? (
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-light text-emerald">
              Free
            </span>
          ) : priceLabel ? (
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-cloud text-ink">
              {priceLabel}
            </span>
          ) : null}

          {event.access_type && (
            <AccessBadge
              accessType={event.access_type}
              isFree={event.is_free ?? false}
            />
          )}

          {event.vibe_tags?.slice(0, 3).map((tag) => (
            <VibeTagPill key={tag} tag={tag} size="sm" />
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* CTA FOOTER — sticky at bottom of sheet */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-mist px-5 py-3 bg-pure flex flex-col sm:flex-row gap-2">
        {primaryCta && (
          <a
            href={primaryCta.href}
            target={primaryCta.external ? '_blank' : undefined}
            rel={primaryCta.external ? 'noopener noreferrer' : undefined}
            onClick={logAndClose(
              primaryCta.kind === 'schedule' ? 'cta-schedule' : 'cta-tickets'
            )}
            className={
              'flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg ' +
              'bg-blue text-pure font-semibold text-body-sm ' +
              'hover:bg-blue-dark transition-colors ' +
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2'
            }
          >
            {primaryCta.kind === 'schedule' ? (
              <Calendar className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Ticket className="w-4 h-4" aria-hidden="true" />
            )}
            {primaryCta.label}
            {primaryCta.external && (
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </a>
        )}

        {/* Secondary CTA is always present — it's the committed "go deep". */}
        <Link
          href={fullPageHref}
          onClick={logAndClose('cta-full')}
          className={
            'flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-lg ' +
            'border border-mist text-ink font-semibold text-body-sm ' +
            'hover:border-blue hover:text-blue transition-colors ' +
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2'
          }
        >
          {PEEK_COPY.ctaViewFullLabel}
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
