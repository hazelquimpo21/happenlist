/**
 * =============================================================================
 * <TicketStub> — event detail sidebar, keepsake-first
 * =============================================================================
 *
 * Replaces the old sidebar (six stacked rounded-xl boxes) with a single
 * unified "ticket" composition. Heart is the HERO action — per Hazel's
 * stated hierarchy (Heart → Learn → Share → Tickets), not conversion-first.
 *
 * Visual language (2026-04-18 redesign):
 *   - 2px solid ink border
 *   - Hard-offset drop shadow (shadow-stub → 6px 6px 0 #020203)
 *   - Dashed separators between sections (ticket metaphor, no literal
 *     perforation — user explicitly chose metaphorical over literal)
 *   - Top section: category-color-filled "Save this" hero block
 *   - Middle section: monospace meta rows (Date / Doors / Show / Venue / etc.)
 *   - Secondary actions section: Share / Add to Calendar / View venue
 *   - Primary ticket CTA: ink-filled footer, only renders when ticket_url exists
 *   - Barcode-style ref footer: tiny mono "HPNL · EVT · date · MKE"
 *
 * Cross-file coupling:
 *   - src/components/hearts/heart-button.tsx — the save gesture (overridden)
 *   - src/components/events/share-button.tsx — share gesture
 *   - src/components/events/event-price.tsx — price formatting
 *   - src/components/events/event-links.tsx — external links
 *   - src/lib/utils/dates.ts — formatDate/formatTime
 * =============================================================================
 */

import Link from 'next/link';
import Image from 'next/image';
import {
  CalendarPlus,
  MapPin,
  ExternalLink,
  User,
  Ban,
  Ticket as TicketIcon,
} from 'lucide-react';
import { HeartButton } from '@/components/hearts';
import { ShareButton } from './share-button';
import { EventLinks } from './event-links';
import { FlyerLightbox } from './flyer-lightbox';
import { VenueMap } from '@/components/maps';
import { buildVenueUrl, buildOrganizerUrl } from '@/lib/utils';
import { formatDate, formatTime } from '@/lib/utils/dates';
import type { CategoryColor } from '@/lib/constants/category-colors';

// Loose props — consumes the full event from page.tsx. Not tight-typed to
// EventRow because the runtime payload carries overlay fields (performers,
// organizer, location cross-joins) that aren't in the generated DB types.
interface TicketStubProps {
  event: {
    id: string;
    title: string;
    slug: string;
    start_datetime: string;
    end_datetime?: string | null;
    is_all_day?: boolean | null;
    flyer_url?: string | null;
    heart_count?: number | null;
    view_count?: number | null;
    ticket_url?: string | null;
    registration_url?: string | null;
    website_url?: string | null;
    source_url?: string | null;
    instagram_url?: string | null;
    facebook_url?: string | null;
    price_type?: string | null;
    price_low?: number | null;
    price_high?: number | null;
    is_free?: boolean | null;
    age_low?: number | null;
    age_high?: number | null;
    age_restriction?: string | null;
    sold_out?: boolean | null;
    short_description?: string | null;
    location?: {
      name: string;
      slug: string;
      address_line?: string | null;
      address_line_2?: string | null;
      city?: string | null;
      state?: string | null;
      postal_code?: string | null;
      latitude?: number | string | null;
      longitude?: number | string | null;
      venue_type?: string | null;
    } | null;
    organizer?: {
      name: string;
      slug: string;
      logo_url?: string | null;
    } | null;
    organizer_is_venue?: boolean | null;
  };
  isHearted: boolean;
  isPastEvent: boolean;
  calendarUrl: string;
  categoryColor: CategoryColor;
}

// Formats the short price string for the meta rows. Uses the same logic
// EventPrice uses but as plain text (the stub composition needs flat strings,
// not styled components).
function formatPriceShort(event: TicketStubProps['event']): string {
  if (event.is_free) return 'FREE';
  if (event.price_low != null && event.price_high != null && event.price_low !== event.price_high) {
    return `$${event.price_low}–$${event.price_high}`;
  }
  if (event.price_low != null) return `$${event.price_low}`;
  if (event.price_high != null) return `$${event.price_high}`;
  return '—';
}

function formatAgeShort(event: TicketStubProps['event']): string | null {
  if (event.age_restriction) return event.age_restriction.toUpperCase();
  if (event.age_low != null && event.age_high != null) return `${event.age_low}–${event.age_high}`;
  if (event.age_low != null) return `${event.age_low}+`;
  return null;
}

export function TicketStub({
  event,
  isHearted,
  isPastEvent,
  calendarUrl,
  categoryColor,
}: TicketStubProps) {
  const ageLine = formatAgeShort(event);
  const dateShort = formatDate(event.start_datetime, 'EEE · MMM d').toUpperCase();
  const doors = event.is_all_day ? 'ALL DAY' : formatTime(event.start_datetime);
  const endTime = event.end_datetime && !event.is_all_day ? formatTime(event.end_datetime) : null;
  const priceShort = formatPriceShort(event);

  // Primary ticket-link selection — mirrors page.tsx old logic
  const primaryLink = event.ticket_url || event.registration_url || event.website_url || null;
  const primaryLabel = event.ticket_url
    ? event.sold_out
      ? 'Check Availability'
      : 'Get Tickets'
    : event.registration_url
      ? 'Register / RSVP'
      : 'Learn More';

  // Ref code for the barcode-style footer
  const refCode = `HPNL · EVT · ${formatDate(event.start_datetime, 'MM·dd·yyyy')} · MKE`;

  return (
    <div className="space-y-6">
      {/* Optional flyer above the stub — users love a big flyer to screenshot */}
      {event.flyer_url && (
        <FlyerLightbox
          flyerUrl={event.flyer_url}
          alt={`${event.title} event flyer`}
          eventTitle={event.title}
          className="w-full"
        />
      )}

      {/* Sold-out sash — before the stub so it reads as a banner, not buried */}
      {event.sold_out && !isPastEvent && (
        <div className="flex items-center justify-center gap-2 w-full px-4 py-3 font-mono text-xs font-bold tracking-[0.15em] uppercase text-pure bg-rose border-2 border-ink shadow-stub-sm">
          <Ban className="w-4 h-4" aria-hidden="true" />
          Sold Out
        </div>
      )}

      {/* The ticket itself */}
      <article className="bg-pure border-2 border-ink shadow-stub">
        {/* ── SECTION 1: Heart hero ── */}
        <div
          className="px-6 py-8 text-center"
          style={{ backgroundColor: categoryColor.bg, color: categoryColor.text }}
        >
          <HeartButton
            eventId={event.id}
            initialHearted={isHearted}
            initialCount={event.heart_count ?? 0}
            size="lg"
            showCount={true}
            className="!w-full !justify-center !bg-pure !text-ink !border-2 !border-ink !rounded-none !px-5 !py-4 !font-extrabold !text-base shadow-stub-sm hover:!-translate-x-[2px] hover:!-translate-y-[2px] hover:shadow-[5px_5px_0_#020203] transition-transform"
          />
          <p className="mt-3 font-mono text-[11px] font-bold tracking-[0.15em] uppercase opacity-90">
            {(event.heart_count ?? 0) > 0
              ? `${event.heart_count} saved`
              : 'Be the first to save'}
            {(event.view_count ?? 0) > 0 && ` · ${event.view_count?.toLocaleString()} views`}
          </p>
        </div>

        {/* ── SECTION 2: Monospace meta rows ── */}
        <div className="px-6 py-5 border-t-2 border-dashed border-ink">
          <dl className="font-mono text-[11px] font-bold tracking-[0.12em] uppercase space-y-0">
            <MetaRow label="Date" value={dateShort} />
            <MetaRow label={event.is_all_day ? 'When' : 'Starts'} value={doors} />
            {endTime && <MetaRow label="Ends" value={endTime} />}
            {event.location && (
              <MetaRow
                label="Venue"
                value={event.location.name}
                subValue={
                  [event.location.city, event.location.state]
                    .filter(Boolean)
                    .join(', ') || undefined
                }
              />
            )}
            <MetaRow
              label="Price"
              value={priceShort}
              valueClassName={event.is_free ? 'text-emerald' : undefined}
            />
            {ageLine && <MetaRow label="Ages" value={ageLine} />}
          </dl>
        </div>

        {/* ── SECTION 3: Secondary actions ── */}
        <div className="px-6 py-3 border-t-2 border-dashed border-ink">
          <ShareButton
            title={event.title}
            text={event.short_description || undefined}
            className="!w-full !justify-start !gap-3 !py-3 !px-0 !bg-transparent !border-0 !border-b !border-dotted !border-mist !rounded-none !text-sm !font-semibold !text-ink hover:!bg-transparent hover:!text-blue"
          />
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full py-3 text-sm font-semibold text-ink hover:text-blue border-b border-dotted border-mist transition-colors"
          >
            <CalendarPlus className="w-4 h-4" aria-hidden="true" />
            Add to calendar
          </a>
          {event.location && (
            <Link
              href={buildVenueUrl(event.location)}
              className="flex items-center gap-3 w-full py-3 text-sm font-semibold text-ink hover:text-blue transition-colors"
            >
              <MapPin className="w-4 h-4" aria-hidden="true" />
              View venue
            </Link>
          )}
        </div>

        {/* ── SECTION 4: Primary ticket CTA (only when link exists) ── */}
        {primaryLink && (
          <a
            href={primaryLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-6 py-5 bg-ink text-pure border-t-2 border-dashed border-ink font-mono text-sm font-bold tracking-[0.1em] uppercase hover:bg-slate transition-colors"
          >
            <TicketIcon className="w-4 h-4" aria-hidden="true" />
            {primaryLabel}
            <ExternalLink className="w-3.5 h-3.5 ml-1" aria-hidden="true" />
          </a>
        )}

        {/* ── Barcode footer ── */}
        <p className="font-mono text-[9px] tracking-[0.2em] text-zinc text-center py-3 border-t-2 border-dashed border-ink">
          {refCode}
        </p>
      </article>

      {/* ── Organizer card (outside the stub — separate "who's behind this" block) ── */}
      {event.organizer && !event.organizer_is_venue && (
        <div className="p-4 bg-pure border border-mist">
          <p className="font-mono text-[10px] font-bold tracking-[0.15em] uppercase text-zinc mb-3">
            Presented by
          </p>
          <Link
            href={buildOrganizerUrl(event.organizer)}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 bg-cloud flex items-center justify-center overflow-hidden flex-shrink-0">
              {event.organizer.logo_url ? (
                <Image
                  src={event.organizer.logo_url}
                  alt={event.organizer.name}
                  width={40}
                  height={40}
                  className="object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-zinc" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-ink group-hover:text-blue transition-colors truncate">
                {event.organizer.name}
              </p>
              <p className="text-xs text-zinc">View all events</p>
            </div>
          </Link>
        </div>
      )}

      {/* ── External links ── */}
      {(event.website_url ||
        event.instagram_url ||
        event.facebook_url ||
        event.registration_url ||
        event.source_url) && (
        <div className="p-4 bg-pure border border-mist">
          <p className="font-mono text-[10px] font-bold tracking-[0.15em] uppercase text-zinc mb-3">
            Links &amp; more
          </p>
          <EventLinks
            websiteUrl={event.website_url}
            instagramUrl={event.instagram_url}
            facebookUrl={event.facebook_url}
            registrationUrl={event.registration_url}
            variant="full"
          />
          {event.source_url && (
            <a
              href={event.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 mt-3 text-xs text-zinc hover:text-blue transition-colors"
            >
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
              View original listing
            </a>
          )}
        </div>
      )}

      {/* ── Venue map ── */}
      {event.location?.latitude && event.location?.longitude && (
        <div className="overflow-hidden border border-mist">
          <VenueMap
            latitude={Number(event.location.latitude)}
            longitude={Number(event.location.longitude)}
            venueName={event.location.name}
            address={
              [
                event.location.address_line,
                event.location.city,
                event.location.state,
                event.location.postal_code,
              ]
                .filter(Boolean)
                .join(', ') || undefined
            }
            venueType={event.location.venue_type ?? undefined}
            height="180px"
            zoom={15}
          />
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Helper — monospace label / value row with dotted separator
// -----------------------------------------------------------------------------

function MetaRow({
  label,
  value,
  subValue,
  valueClassName,
}: {
  label: string;
  value: string;
  /** Optional second line shown beneath the primary value, in a quieter weight.
      Used for e.g. "Venue: Turner Hall / Milwaukee, WI". */
  subValue?: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-dotted border-mist last:border-b-0">
      <dt className="text-zinc flex-shrink-0 pt-0.5">{label}</dt>
      <dd className="text-right min-w-0">
        <div className={`text-ink ${valueClassName ?? ''}`}>{value}</div>
        {subValue && (
          <div className="text-zinc font-normal normal-case tracking-normal text-[10px] mt-0.5">
            {subValue}
          </div>
        )}
      </dd>
    </div>
  );
}
