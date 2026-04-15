'use client';

/**
 * HERO SLIDESHOW
 * ==============
 * Full-bleed rotating hero that cycles through featured events.
 * Each slide = full event image + gradient overlay + event info.
 * Crossfade transition. Auto-pause on hover. Swipeable on mobile.
 *
 * Inspo: Groove (full-dark hero), Athlete Showcase (arrow nav)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TimeAwareGreeting } from './time-aware-greeting';
import { getCategoryColor } from '@/lib/constants/category-colors';

interface HeroEvent {
  id: string;
  slug: string;
  title: string;
  image_url: string | null;
  category_slug: string | null;
  category_name: string | null;
  venue_name: string | null;
  start_datetime: string;
  price_type: string | null;
  price_min: number | null;
}

interface HeroSlideshowProps {
  events: HeroEvent[];
  /** Quick-glance events for the sidebar */
  weekendEvents?: { title: string; slug: string; category_slug: string | null; start_datetime: string; venue_name: string | null }[];
  weekendTotal?: number;
}

/** Format event time for hero display */
function formatHeroDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

  if (isToday) return `Tonight · ${time}`;
  if (isTomorrow) return `Tomorrow · ${time}`;
  return `${dayName} · ${time}`;
}

function formatPrice(type: string | null, min: number | null): string {
  if (!type || type === 'free') return 'Free';
  if (min) return `$${min}`;
  return '';
}

// Placeholder images for events without images
const PLACEHOLDERS = [
  { bg: 'bg-blue', description: 'Concert venue with stage lights and crowd energy' },
  { bg: 'bg-orange', description: 'Food festival with colorful market stalls' },
  { bg: 'bg-teal', description: 'Art gallery opening night with installations' },
  { bg: 'bg-plum', description: 'Nightlife scene with ambient lighting' },
  { bg: 'bg-golden', description: 'Outdoor festival with golden hour lighting' },
];

export function HeroSlideshow({ events, weekendEvents, weekendTotal }: HeroSlideshowProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartRef = useRef<number>(0);

  const slideCount = events.length || 1;

  const goTo = useCallback((index: number) => {
    setCurrent((index + slideCount) % slideCount);
  }, [slideCount]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-advance
  useEffect(() => {
    if (isPaused || events.length <= 1) return;
    intervalRef.current = setInterval(next, 7000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, next, events.length]);

  // Swipe handling
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  // If no events, show compact placeholder hero
  if (events.length === 0) {
    return (
      <section className="relative bg-ink">
        {/* PLACEHOLDER: Replace with a hero image of Milwaukee skyline or lakefront */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue/20 to-plum/10" />
        <div className="relative container-page py-16 md:py-24">
          <TimeAwareGreeting />
          <h1 className="text-h1 md:text-display text-pure font-bold mt-4 max-w-xl">
            Discover amazing events in Milwaukee
          </h1>
        </div>
      </section>
    );
  }

  const event = events[current];
  const colors = getCategoryColor(event.category_slug);

  return (
    <section
      className="relative bg-ink overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      <div className="relative min-h-[50vh] md:min-h-[55vh]">
        {events.map((evt, i) => {
          const ph = PLACEHOLDERS[i % PLACEHOLDERS.length];
          return (
            <div
              key={evt.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              {evt.image_url ? (
                <Image
                  src={evt.image_url}
                  alt={evt.title}
                  fill
                  className="object-cover"
                  priority={i === 0}
                  sizes="100vw"
                />
              ) : (
                /* PLACEHOLDER: Needs real event image. Each slide should have a photo. */
                <div className={`absolute inset-0 ${ph.bg}`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-pure/20 text-body-sm font-medium max-w-xs text-center">
                      {ph.description}
                    </span>
                  </div>
                </div>
              )}
              {/* Gradient overlay */}
              <div className="absolute inset-0 gradient-overlay-bottom" />
            </div>
          );
        })}
      </div>

      {/* Content overlay */}
      <div className="absolute inset-0 z-20 flex flex-col justify-between pointer-events-none">
        {/* Top: greeting + category badge */}
        <div className="container-page pt-8 md:pt-12 pointer-events-auto">
          <TimeAwareGreeting />
        </div>

        {/* Bottom: event info + sidebar */}
        <div className="container-page pb-8 md:pb-12 pointer-events-auto">
          <div className="flex flex-col md:flex-row md:items-end md:gap-8">
            {/* Event info — left side */}
            <div className="flex-1 max-w-2xl">
              {/* Category badge */}
              {event.category_name && (
                <span
                  className="inline-block px-3 py-1 rounded-sm text-caption uppercase font-semibold tracking-wider mb-4"
                  style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                  {event.category_name}
                </span>
              )}

              <p className="text-body-sm text-pure/70 mb-2 font-medium">
                {formatHeroDate(event.start_datetime)}
              </p>

              <Link href={`/event/${event.slug}`} className="group">
                <h2 className="text-h1 md:text-display text-pure font-bold group-hover:text-blue-light transition-colors">
                  {event.title}
                </h2>
              </Link>

              <div className="flex items-center gap-3 mt-3 text-body-sm text-pure/70">
                {event.venue_name && <span>{event.venue_name}</span>}
                {event.venue_name && formatPrice(event.price_type, event.price_min) && (
                  <span className="text-pure/30">·</span>
                )}
                {formatPrice(event.price_type, event.price_min) && (
                  <span className={event.price_type === 'free' ? 'text-emerald font-semibold' : ''}>
                    {formatPrice(event.price_type, event.price_min)}
                  </span>
                )}
              </div>
            </div>

            {/* Quick-glance sidebar — desktop only */}
            {weekendEvents && weekendEvents.length > 0 && (
              <div className="hidden lg:block w-80 bg-night/80 backdrop-blur-sm rounded-lg p-5 border border-pure/10">
                <p className="text-caption uppercase tracking-wider text-blue-light font-semibold mb-4">
                  This Weekend
                </p>
                <div className="space-y-3">
                  {weekendEvents.slice(0, 4).map((we) => {
                    const wColors = getCategoryColor(we.category_slug);
                    const d = new Date(we.start_datetime);
                    const dayTime = `${d.toLocaleDateString('en-US', { weekday: 'short' })} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()}`;
                    return (
                      <Link
                        key={we.slug}
                        href={`/event/${we.slug}`}
                        className="flex items-start gap-3 group"
                      >
                        <span
                          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: wColors.accent }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-body-sm text-pure font-medium truncate group-hover:text-blue-light transition-colors">
                            {we.title}
                          </p>
                          <p className="text-caption text-pure/50">{dayTime}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {weekendTotal && weekendTotal > 4 && (
                  <Link
                    href="/events/this-weekend"
                    className="block mt-4 text-caption text-blue-light font-semibold hover:underline"
                  >
                    {weekendTotal} events this weekend →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Navigation: dots + arrows */}
          {events.length > 1 && (
            <div className="flex items-center justify-between mt-6">
              {/* Dots */}
              <div className="flex items-center gap-2">
                {events.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i === current
                        ? 'bg-pure w-6'
                        : 'bg-pure/30 hover:bg-pure/50'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>

              {/* Arrows — desktop */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={prev}
                  className="w-10 h-10 rounded-full border border-pure/20 flex items-center justify-center text-pure/70 hover:bg-pure/10 hover:text-pure transition-colors"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={next}
                  className="w-10 h-10 rounded-full border border-pure/20 flex items-center justify-center text-pure/70 hover:bg-pure/10 hover:text-pure transition-colors"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
