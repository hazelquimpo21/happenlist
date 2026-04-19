/**
 * =============================================================================
 * <PosterHero> — event detail concert-poster hero
 * =============================================================================
 *
 * Full-bleed category-color slab. Two rendering modes depending on whether
 * the event has a photo-style `image_url`:
 *
 *   MODE A — IMAGE        (event.image_url is set)
 *     ├─ Landscape 3/2 image card with slight rotation + offset shadow
 *     ├─ Category + timing stickers on the image
 *     └─ Date stamp + title + performers + venue in right column
 *
 *   MODE B — TYPOGRAPHIC  (no image_url, or only flyer_url)
 *     ├─ No image frame. The slab IS the poster.
 *     ├─ Giant ghosted category icon behind the type (fills visual space)
 *     ├─ Stickers float above the headline, rotated
 *     └─ Date stamp + title + performers + venue, larger than in MODE A
 *
 * Image taxonomy convention (enforced by this file):
 *   - event.image_url → photo / promo graphic (can be cropped to landscape)
 *   - event.flyer_url → typographic poster (NEVER cropped — lives in the
 *     sidebar via <FlyerLightbox>, not the hero)
 *
 * If an organizer uploads a flyer to image_url by mistake, the 3/2 crop
 * will clip their poster text. That's the known trade-off of the
 * convention. Document the distinction when building the admin form.
 *
 * Contrast is delegated to categoryColor.text — yellow/lime categories use
 * ink text, everything else uses white.
 *
 * Cross-file coupling:
 *   - src/components/ui/sticker.tsx — the sticker primitive
 *   - src/components/ui/marker-underline.tsx — the underline primitive
 *   - src/components/icons/category-icons.tsx — the ghosted bg icon in MODE B
 *   - src/lib/utils/dates.ts — formatDate / formatTime
 *   - src/lib/constants/category-colors.ts — CategoryColor shape
 *   - src/components/events/ticket-stub.tsx — renders <FlyerLightbox> when flyer exists
 * =============================================================================
 */

import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Sticker, MarkerUnderline } from '@/components/ui';
import { getCategoryIcon } from '@/components/icons/category-icons';
import { HeartButton } from '@/components/hearts';
import { ImageLightbox } from './image-lightbox';
import { buildVenueUrl } from '@/lib/utils';
import { formatDate, formatTime } from '@/lib/utils/dates';
import type { CategoryColor } from '@/lib/constants/category-colors';
import type { GoodForTag } from '@/types';

// Access-type labels — kept inline so the dark hero can render its own pill
// styling without pulling AccessBadge's light-mode color tokens.
const ACCESS_LABELS: Record<string, string> = {
  open: 'Just Show Up',
  ticketed: 'Tickets',
  rsvp: 'RSVP Required',
  pay_at_door: 'Pay at Door',
  registration: 'Register',
  membership: 'Members Only',
  invite_only: 'Invite Only',
};

// Stopwords we won't pick for the marker underline — common articles,
// prepositions, and "happenlist"-meta words. Picks the last long
// non-stopword token so venue names / band names tend to get underlined.
const UNDERLINE_STOPWORDS = new Set([
  'the',
  'and',
  'with',
  'from',
  'into',
  'your',
  'their',
  'that',
  'this',
  'these',
  'those',
  'event',
  'show',
  'night',
  'party',
  'presents',
]);

/**
 * Pick the word in a title to wrap in <MarkerUnderline>.
 * Rule: last token that is >5 chars and not a stopword.
 * Fallback: last token of any length.
 */
function pickUnderlineToken(title: string): string | null {
  if (!title.trim()) return null;
  const tokens = title.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;
  for (let i = tokens.length - 1; i >= 0; i--) {
    const raw = tokens[i];
    const normalized = raw.replace(/[^\w]/g, '').toLowerCase();
    if (normalized.length > 5 && !UNDERLINE_STOPWORDS.has(normalized)) {
      return raw;
    }
  }
  return tokens[tokens.length - 1];
}

/**
 * Render a title with one occurrence of `word` wrapped in <MarkerUnderline>.
 * We wrap the LAST occurrence to mirror pickUnderlineToken's walk.
 */
function TitleWithUnderline({
  title,
  word,
  color,
}: {
  title: string;
  word: string | null;
  color: string;
}) {
  if (!word) return <>{title}</>;
  const tokens = title.split(/(\s+)/); // keep whitespace
  let found = false;
  const rendered: React.ReactNode[] = [];
  const markedIndex = (() => {
    for (let i = tokens.length - 1; i >= 0; i--) {
      if (tokens[i] === word) return i;
    }
    return -1;
  })();

  tokens.forEach((tok, i) => {
    if (i === markedIndex && !found) {
      rendered.push(
        <MarkerUnderline key={i} color={color}>
          {tok}
        </MarkerUnderline>,
      );
      found = true;
    } else {
      rendered.push(<span key={i}>{tok}</span>);
    }
  });
  return <>{rendered}</>;
}

// -----------------------------------------------------------------------------
// Sub-component: Type column (date + title + performers + venue).
// Shared between MODE A and MODE B; size scale is passed in so MODE B can
// render bigger without duplicating JSX.
// -----------------------------------------------------------------------------

interface TypeColumnProps {
  event: PosterHeroProps['event'];
  categoryColor: CategoryColor;
  /** Typographic scale — 'regular' for MODE A (image present), 'poster' for MODE B (no image). */
  scale: 'regular' | 'poster';
  /** Stickers rendered inline above the date/title (only MODE B — MODE A puts them on the image). */
  showInlineStickers: boolean;
  timingBadge: { label: string } | null;
}

function TypeColumn({
  event,
  categoryColor,
  scale,
  showInlineStickers,
  timingBadge,
}: TypeColumnProps) {
  const dateText = formatDate(event.start_datetime, 'EEE · MMM d');
  const monthDay = formatDate(event.start_datetime, 'MM·dd');
  const timeText = event.is_all_day
    ? 'ALL DAY'
    : `${formatTime(event.start_datetime)}${event.end_datetime ? ` – ${formatTime(event.end_datetime)}` : ''}`;
  const dayLine = `${dateText.toUpperCase()}${event.is_all_day ? '' : ` · ${timeText.toUpperCase()}`}`;

  const underlineWord = pickUnderlineToken(event.title);
  const markerColor = categoryColor.accent;
  const performers = event.event_performers ?? [];

  // Type scale — MODE B is ~25% larger because it carries the whole composition.
  const dateStampSize =
    scale === 'poster' ? 'clamp(44px, 8vw, 96px)' : 'clamp(32px, 5vw, 64px)';
  const titleSize =
    scale === 'poster' ? 'clamp(34px, 5.5vw, 64px)' : 'clamp(26px, 3.6vw, 48px)';

  return (
    <div className="relative">
      {/* Inline stickers — only in MODE B (in MODE A the stickers are on the image). */}
      {showInlineStickers && (
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          {event.category && (
            <Sticker
              variant="category"
              bgColor={categoryColor.accent}
              textColor="#FAFAFA"
              rotate={-3}
            >
              {event.category.name}
            </Sticker>
          )}
          {timingBadge && (
            <Sticker variant="pure" rotate={2}>
              {timingBadge.label}
            </Sticker>
          )}
        </div>
      )}

      {/* Date stamp */}
      <div
        className="font-mono font-bold leading-[0.9] tracking-tight mb-3"
        style={{ fontSize: dateStampSize }}
      >
        <div
          className="font-mono font-bold uppercase mb-2"
          style={{ fontSize: '11px', letterSpacing: '0.25em', opacity: 0.78 }}
        >
          {dayLine}
        </div>
        <div>{monthDay}</div>
      </div>

      {/* Title */}
      <h1
        className="font-body font-extrabold leading-[0.95] tracking-tight mb-5"
        style={{ fontSize: titleSize }}
      >
        <TitleWithUnderline title={event.title} word={underlineWord} color={markerColor} />
      </h1>

      {/* Performers or legacy talent_name */}
      {performers.length > 0 ? (
        <p className="text-base md:text-lg mb-4 opacity-90">
          ft.{' '}
          {performers.slice(0, 3).map((ep, i) => (
            <span key={ep.id}>
              {i > 0 && ', '}
              <Link
                href={`/performer/${ep.performer.slug}`}
                className="font-bold underline decoration-2 underline-offset-4 hover:opacity-80 transition-opacity"
              >
                {ep.performer.name}
              </Link>
            </span>
          ))}
          {performers.length > 3 && (
            <span className="opacity-70"> +{performers.length - 3} more</span>
          )}
        </p>
      ) : event.talent_name ? (
        <p className="text-base md:text-lg mb-4 opacity-90">
          ft. <span className="font-bold">{event.talent_name}</span>
        </p>
      ) : null}

      {/* Venue line */}
      {event.location && (
        <div className="flex items-center gap-3 text-sm md:text-base font-semibold opacity-95">
          <span
            aria-hidden="true"
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: categoryColor.accent }}
          />
          <Link
            href={buildVenueUrl(event.location)}
            className="underline decoration-1 underline-offset-4 hover:opacity-80 transition-opacity"
          >
            {event.location.name}
          </Link>
          {event.location.address_line && (
            <span className="opacity-70 font-normal">· {event.location.address_line}</span>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface PosterHeroProps {
  event: {
    id: string;
    title: string;
    start_datetime: string;
    end_datetime?: string | null;
    is_all_day?: boolean | null;
    image_url?: string | null;
    flyer_url?: string | null;
    heart_count?: number | null;
    ticket_url?: string | null;
    registration_url?: string | null;
    website_url?: string | null;
    category?: { name: string; slug: string; icon?: string | null } | null;
    location?: {
      name: string;
      slug: string;
      address_line?: string | null;
      city?: string | null;
      state?: string | null;
      venue_type?: string | null;
    } | null;
    event_performers?:
      | Array<{
          id: string;
          performer: { name: string; slug: string };
        }>
      | null;
    talent_name?: string | null;
  };
  categoryColor: CategoryColor;
  /** Optional timing badge — renders as a sticker when present */
  timingBadge?: { label: string } | null;
  /** Whether the current viewer has already hearted this event */
  isHearted?: boolean;
  /** Pill-row content (was the old StampedRow under the hero) */
  priceSummary?: string | null;
  ageSummary?: string | null;
  accessType?: string | null;
  isFree?: boolean;
  goodForTags?: GoodForTag[];
}

export function PosterHero({
  event,
  categoryColor,
  timingBadge,
  isHearted = false,
  priceSummary = null,
  ageSummary = null,
  accessType = null,
  isFree = false,
  goodForTags = [],
}: PosterHeroProps) {
  // MODE SELECTION — image_url wins. Flyer stays in sidebar via
  // FlyerLightbox in TicketStub; we never crop a poster here.
  const hasImage = !!event.image_url;

  const CategoryIcon = event.category ? getCategoryIcon(event.category.icon ?? null) : null;

  // Hero is now ALWAYS dark (#141416 night). Category color is preserved via
  // categoryColor.accent for marker underline + accent dot + CTA fill.
  const heroText = '#FAFAFA';
  const accent = categoryColor.accent;

  // Primary external link — same precedence as TicketStub's primary CTA.
  const primaryLink = event.ticket_url || event.registration_url || event.website_url || null;
  const primaryLabel = event.ticket_url ? 'Get Tickets' : event.registration_url ? 'RSVP' : 'Visit Site';

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: '#141416', color: heroText }}
    >
      {/* Radial lighting for depth — tinted with the category accent so the
          dark slab still feels category-coded. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 80% 20%, ${accent}26 0%, transparent 45%), radial-gradient(circle at 20% 90%, rgba(255,255,255,0.04) 0%, transparent 50%)`,
        }}
      />

      {/* Ghosted category icon — MODE B only. */}
      {!hasImage && CategoryIcon && (
        <div
          aria-hidden="true"
          className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-[20%] pointer-events-none"
          style={{
            width: 'min(720px, 70%)',
            color: accent,
            opacity: 0.12,
          }}
        >
          <CategoryIcon className="w-full h-auto" />
        </div>
      )}

      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 relative">
        {hasImage ? (
          // ── MODE A: image + type column grid ──
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-8 md:gap-12 items-center">
            <ImageLightbox
              src={event.image_url as string}
              alt={event.title}
              label={`Zoom image for ${event.title}`}
            >
              <div
                className="relative aspect-[3/2] max-w-2xl mx-auto md:mx-0 w-full rounded-xl overflow-hidden"
                style={{
                  boxShadow: '0 24px 60px -12px rgba(0,0,0,0.4)',
                  transform: 'rotate(-1deg)',
                }}
              >
                <Image
                  src={event.image_url as string}
                  alt={event.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {event.category && (
                  <div className="absolute top-4 left-4">
                    <Sticker
                      variant="category"
                      bgColor={categoryColor.accent}
                      textColor={categoryColor.text}
                      rotate={-3}
                    >
                      {event.category.name}
                    </Sticker>
                  </div>
                )}
                {timingBadge && (
                  <div className="absolute bottom-4 right-4">
                    <Sticker variant="pure" rotate={2}>
                      {timingBadge.label}
                    </Sticker>
                  </div>
                )}
              </div>
            </ImageLightbox>

            <TypeColumn
              event={event}
              categoryColor={categoryColor}
              scale="regular"
              showInlineStickers={false}
              timingBadge={timingBadge ?? null}
            />
          </div>
        ) : (
          // ── MODE B: typographic-only, single column, left-aligned ──
          // Max-width constrained so the type stays readable on wide viewports;
          // the ghosted category icon fills the right side visually.
          <div className="max-w-3xl">
            <TypeColumn
              event={event}
              categoryColor={categoryColor}
              scale="poster"
              showInlineStickers={true}
              timingBadge={timingBadge ?? null}
            />
          </div>
        )}

        {/* Pill row + actions — replaces the old StampedRow that lived under
            the hero. Lives inside the hero now so the dark slab carries
            everything the visitor needs at a glance. */}
        <HeroActions
          eventId={event.id}
          isHearted={isHearted}
          heartCount={event.heart_count ?? 0}
          primaryLink={primaryLink}
          primaryLabel={primaryLabel}
          accent={accent}
          priceSummary={priceSummary}
          ageSummary={ageSummary}
          accessType={accessType}
          isFree={isFree}
          goodForTags={goodForTags}
        />
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// HeroActions — pill row (price/age/access/good-for) + heart + primary link.
// Designed against the dark hero slab; pills use white/10 surface + white
// border for affordance, primary CTA uses the category accent.
// -----------------------------------------------------------------------------

interface HeroActionsProps {
  eventId: string;
  isHearted: boolean;
  heartCount: number;
  primaryLink: string | null;
  primaryLabel: string;
  accent: string;
  priceSummary: string | null;
  ageSummary: string | null;
  accessType: string | null;
  isFree: boolean;
  goodForTags: GoodForTag[];
}

function HeroActions({
  eventId,
  isHearted,
  heartCount,
  primaryLink,
  primaryLabel,
  accent,
  priceSummary,
  ageSummary,
  accessType,
  isFree,
  goodForTags,
}: HeroActionsProps) {
  const pills: React.ReactNode[] = [];

  if (priceSummary) {
    const isFreePill = priceSummary === 'FREE';
    pills.push(
      <Pill
        key="price"
        className={isFreePill ? 'bg-emerald/20 border-emerald/40 text-emerald-light' : ''}
      >
        {priceSummary}
      </Pill>,
    );
  }
  if (ageSummary) pills.push(<Pill key="age">{ageSummary}</Pill>);
  if (accessType && ACCESS_LABELS[accessType]) {
    const label = isFree && accessType === 'open' ? 'Free · Just Show Up' : ACCESS_LABELS[accessType];
    pills.push(<Pill key="access">{label}</Pill>);
  }
  goodForTags.slice(0, 4).forEach((tag) => {
    pills.push(
      <Link
        key={`gf-${tag.slug}`}
        href={`/events?goodFor=${tag.slug}`}
        className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold tracking-[0.08em] uppercase border border-white/20 bg-white/5 text-white/85 hover:bg-white/15 hover:text-white transition-colors"
      >
        {tag.label}
      </Link>,
    );
  });

  const hasPills = pills.length > 0;
  const hasActions = !!primaryLink || true; // heart is always present

  if (!hasPills && !hasActions) return null;

  return (
    <div className="mt-8 md:mt-10 flex flex-col gap-5">
      {hasPills && <div className="flex flex-wrap gap-2">{pills}</div>}
      <div className="flex flex-wrap items-center gap-3">
        <HeartButton
          eventId={eventId}
          initialHearted={isHearted}
          initialCount={heartCount}
          showCount={true}
          size="md"
          className="!bg-white/10 !text-white !border !border-white/25 !rounded-full !px-4 !py-2 hover:!bg-white/20"
        />
        {primaryLink && (
          <a
            href={primaryLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold tracking-wide text-white shadow-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: accent }}
          >
            {primaryLabel}
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  );
}

function Pill({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold tracking-[0.08em] uppercase border border-white/20 bg-white/5 text-white/90 ${className}`}
    >
      {children}
    </span>
  );
}
