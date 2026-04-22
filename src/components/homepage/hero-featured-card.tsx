/**
 * =============================================================================
 * HERO FEATURED CARD — B1 big featured-event card
 * =============================================================================
 *
 * Large card (min-h 360px) rendered next to TabbedDiscovery on the homepage.
 * Full-bleed event hero image with a bottom-to-top dark gradient overlay;
 * category badge top-left; title + eyebrow + meta stacked bottom.
 *
 * Fallback: when the event has no image, we use a 45°-striped gradient in
 * the category's own color (matches the design prototype's placeholder).
 *
 * This is a server component — no interaction state; just a large Link.
 */

import Link from 'next/link';
import Image from 'next/image';
import type { EventCard } from '@/types';
import { getCategoryColor } from '@/lib/constants/category-colors';

interface HeroFeaturedCardProps {
  event: EventCard;
}

function formatEyebrow(instanceDate: string, startDatetime: string): string {
  const d = new Date(`${instanceDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  let dayLabel: string;
  if (diffDays === 0) dayLabel = 'TONIGHT';
  else if (diffDays === 1) dayLabel = 'TOMORROW';
  else dayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d).toUpperCase();

  const t = new Date(startDatetime);
  const h = t.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${dayLabel} · ${h12}${ampm}`;
}

export function HeroFeaturedCard({ event }: HeroFeaturedCardProps) {
  const color = getCategoryColor(event.category_slug);
  const eyebrow = formatEyebrow(event.instance_date, event.start_datetime);
  const img = event.image_url;

  return (
    <Link
      href={`/event/${event.slug}`}
      className="group relative block min-h-[300px] flex-1 overflow-hidden rounded-[20px] shadow-card transition-transform hover:-translate-y-1 hover:shadow-card-lifted md:min-h-[360px]"
      style={
        img
          ? undefined
          : {
              background: `repeating-linear-gradient(45deg, ${color.bg} 0 40px, ${color.accent}cc 40px 80px)`,
            }
      }
    >
      {img && (
        <Image
          src={img}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-slow group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 70vw"
          priority
        />
      )}
      {/* Dark gradient overlay: clear at top, heavy at bottom */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(2,2,3,0.0) 40%, rgba(2,2,3,0.88) 100%)',
        }}
        aria-hidden="true"
      />

      {/* Category badge */}
      {event.category_name && (
        <span
          className="absolute left-6 top-6 inline-block rounded-full px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.05em]"
          style={{ backgroundColor: color.bg, color: color.text }}
        >
          {event.category_name}
        </span>
      )}

      {/* Bottom text */}
      <div className="absolute inset-x-6 bottom-6 text-pure">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.05em]">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] md:text-[40px]">
          {event.title}
        </h2>
        <p className="mt-2 text-[14px] opacity-85">
          {[
            event.location_name,
            event.is_free ? 'Free' : event.price_low ? `$${event.price_low}` : null,
            event.heart_count > 0 ? `${event.heart_count} hearted` : null,
          ]
            .filter(Boolean)
            .join(' \u00b7 ')}
        </p>
      </div>
    </Link>
  );
}
