/**
 * HeroCard
 * =========
 * The big top summary card on admin Edit pages. Replaces the old sidebar
 * "Event Summary" + page-header chrome with a single bold visual anchor.
 *
 * Layout:
 *   [image]   [shape badge] [status pill] [extra slot]
 *             ──────────────────────────────────────────
 *             {title}              (large, slot)
 *             {subtitle rows}      (slot — date, venue, organizer, etc.)
 *             {footer slot}        (category dot + label + free badge)
 *
 * The card background is tinted with the category color at very low
 * opacity, applied via inline style so any of the 15 brand category
 * colors works without bloating Tailwind's safelist.
 *
 * Designed to be used by both Edit Event and Edit Series — the slots are
 * generic. The series page passes a different subtitle (recurrence label,
 * upcoming-count) and no image background.
 *
 * @module components/admin/form-shell/hero-card
 */
'use client';

import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  /** Optional category accent hex (drives the soft gradient + stripe). */
  accentHex?: string | null;
  /** Image URL for the left tile. Falls back to a placeholder when null. */
  imageUrl?: string | null;
  imageAlt?: string;
  badges?: React.ReactNode;
  /** Right-side slot (edit pencil, link to public page, etc.). */
  headerRight?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const DEFAULT_ACCENT = '#008bd2';

export function HeroCard({
  accentHex,
  imageUrl,
  imageAlt = '',
  badges,
  headerRight,
  title,
  subtitle,
  footer,
  className,
}: Props) {
  const accent = accentHex ?? DEFAULT_ACCENT;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-mist bg-pure shadow-card',
        className,
      )}
      style={{
        // Soft category-tinted gradient. Stays readable, but identifiable.
        backgroundImage: `linear-gradient(135deg, ${accent}14 0%, ${accent}03 60%, transparent 100%)`,
      }}
    >
      <div
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: accent }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-5 p-5 sm:p-6 pl-7 sm:pl-8">
        {/* Image tile */}
        <div
          className="relative w-full aspect-[4/3] sm:w-40 sm:h-40 sm:aspect-square rounded-xl overflow-hidden bg-cloud border border-mist shrink-0"
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              sizes="160px"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-silver">
              <ImageOff className="w-8 h-8" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 min-w-0">
          {/* Badges row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">{badges}</div>
            {headerRight && <div className="flex items-center gap-2">{headerRight}</div>}
          </div>

          {/* Title */}
          <div className="text-h2 sm:text-h1 font-semibold text-ink leading-tight">
            {title}
          </div>

          {/* Subtitle rows */}
          {subtitle && (
            <div className="flex flex-col gap-1 text-sm text-zinc">{subtitle}</div>
          )}

          {/* Footer (category, free badge, etc.) */}
          {footer && (
            <div className="flex items-center gap-2 flex-wrap pt-2 mt-1 border-t border-mist/70">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
