/**
 * =============================================================================
 * <PosterHero> — event detail concert-poster hero
 * =============================================================================
 *
 * Full-bleed category-color slab with an offset, rotated image card and
 * oversized monospace date stamp. Replaces the old 21:9 gradient banner on
 * event/[slug] pages (2026-04-18 redesign).
 *
 * Contrast is delegated to categoryColor.text — yellow/lime categories use
 * ink text, everything else uses white. Don't hardcode colors here.
 *
 * Two stickers render on the image: category (top-left, rotated) + timing
 * (bottom-right, rotated opposite) — timing is optional.
 *
 * Image fallback: when no image, the slab composition itself carries the
 * page — giant date + title + no image frame.
 *
 * Cross-file coupling:
 *   - src/components/ui/sticker.tsx — the sticker primitive
 *   - src/components/ui/marker-underline.tsx — the underline primitive
 *   - src/lib/utils/dates.ts — formatDate / formatTime
 *   - src/lib/constants/category-colors.ts — CategoryColor shape
 * =============================================================================
 */

import Image from 'next/image';
import Link from 'next/link';
import { Sticker, MarkerUnderline } from '@/components/ui';
import { getBestImageUrl, buildVenueUrl } from '@/lib/utils';
import { formatDate, formatTime } from '@/lib/utils/dates';
import type { CategoryColor } from '@/lib/constants/category-colors';

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
  // Walk from end → start looking for a good candidate
  for (let i = tokens.length - 1; i >= 0; i--) {
    const raw = tokens[i];
    const normalized = raw.replace(/[^\w]/g, '').toLowerCase();
    if (normalized.length > 5 && !UNDERLINE_STOPWORDS.has(normalized)) {
      return raw;
    }
  }
  // Nothing matched — fall back to last token so the underline still shows up
  return tokens[tokens.length - 1];
}

/**
 * Render a title with one occurrence of `word` wrapped in <MarkerUnderline>.
 * We wrap the last occurrence to mirror pickUnderlineToken's walk.
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
  // Case-sensitive match of the exact token in the source title to avoid
  // accidentally underlining mid-word matches ("Park" in "Sparks").
  const tokens = title.split(/(\s+)/); // keep whitespace
  let found = false;
  const rendered: React.ReactNode[] = [];
  // Walk right-to-left marking the last match only
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

interface PosterHeroProps {
  event: {
    title: string;
    start_datetime: string;
    end_datetime?: string | null;
    is_all_day?: boolean | null;
    image_url?: string | null;
    flyer_url?: string | null;
    category?: { name: string; slug: string } | null;
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
}

export function PosterHero({ event, categoryColor, timingBadge }: PosterHeroProps) {
  // getBestImageUrl prefers image_url, falls back to flyer_url. On the
  // detail page the flyer already gets its own FlyerLightbox in the sidebar,
  // so we prefer image_url here and only use flyer as a last resort.
  const heroImage = getBestImageUrl(event.image_url, event.flyer_url);

  const dateText = formatDate(event.start_datetime, 'EEE · MMM d');
  // Short form for the giant stamp: "04·12"
  const monthDay = formatDate(event.start_datetime, 'MM·dd');
  const timeText = event.is_all_day
    ? 'ALL DAY'
    : `${formatTime(event.start_datetime)}${event.end_datetime ? ` – ${formatTime(event.end_datetime)}` : ''}`;

  const dayLine = `${dateText.toUpperCase()}${event.is_all_day ? '' : ` · ${timeText.toUpperCase()}`}`;

  const underlineWord = pickUnderlineToken(event.title);
  // Marker underline color — use a contrasting brand color (not the slab
  // color, which would be invisible). On dark-text categories (yellow/lime)
  // use blue; everywhere else use the orange brand accent.
  const markerColor = categoryColor.text === '#020203' ? '#008bd2' : '#d95927';

  const performers = event.event_performers ?? [];

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: categoryColor.bg, color: categoryColor.text }}
    >
      {/* Subtle radial lighting for visual depth on the slab */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(0,0,0,0.08) 0%, transparent 40%)',
        }}
      />

      <div className="container mx-auto px-4 md:px-6 py-10 md:py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-8 md:gap-12 items-center">
          {/* Image card with stickers */}
          {heroImage ? (
            <div
              className="relative aspect-[4/5] max-w-md mx-auto md:mx-0 rounded-xl overflow-hidden"
              style={{
                boxShadow: '0 24px 60px -12px rgba(0,0,0,0.4)',
                transform: 'rotate(-1.2deg)',
              }}
            >
              <Image
                src={heroImage}
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
          ) : (
            // No-image fallback: an empty frame that echoes the sticker placement,
            // so the composition reads as intentional rather than broken.
            <div
              aria-hidden="true"
              className="hidden md:block relative aspect-[4/5] max-w-md mx-auto md:mx-0 rounded-xl"
              style={{
                backgroundColor: `${categoryColor.text === '#020203' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                transform: 'rotate(-1.2deg)',
              }}
            />
          )}

          {/* Type column */}
          <div>
            {/* Giant date stamp */}
            <div
              className="font-mono font-bold leading-[0.9] tracking-tight mb-3"
              style={{ fontSize: 'clamp(44px, 9vw, 104px)' }}
            >
              <div
                className="font-mono font-bold uppercase mb-2"
                style={{
                  fontSize: 'clamp(10px, 1vw, 12px)',
                  letterSpacing: '0.25em',
                  opacity: 0.78,
                }}
              >
                {dayLine}
              </div>
              <div>{monthDay}</div>
            </div>

            <h1
              className="font-body font-extrabold leading-[0.95] tracking-tight mb-5"
              style={{ fontSize: 'clamp(38px, 6vw, 80px)' }}
            >
              <TitleWithUnderline
                title={event.title}
                word={underlineWord}
                color={markerColor}
              />
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
                ft.{' '}
                <span className="font-bold">{event.talent_name}</span>
              </p>
            ) : null}

            {/* Venue line */}
            {event.location && (
              <div className="flex items-center gap-3 text-sm md:text-base font-semibold opacity-95">
                <span
                  aria-hidden="true"
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: categoryColor.text }}
                />
                <Link
                  href={buildVenueUrl(event.location)}
                  className="underline decoration-1 underline-offset-4 hover:opacity-80 transition-opacity"
                >
                  {event.location.name}
                </Link>
                {event.location.address_line && (
                  <span className="opacity-70 font-normal">
                    · {event.location.address_line}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
