/**
 * HOME PAGE — v3 Redesign
 * =======================
 * Jamie opens Happenlist on a Thursday evening. She doesn't know
 * what she wants to do — she just wants to discover something cool.
 *
 * Flow:
 * 1. HERO — "Good evening, Milwaukee" + the best event right now
 * 2. EDITOR'S PICKS — 3-4 handpicked featured events
 * 3. EVENTS BY CATEGORY — real events grouped by top categories
 * 4. THIS WEEKEND — dark section, horizontal scroll
 * 5. JUST ADDED — numbered list of new events
 * 6. CTA — brand blue block
 */

export const revalidate = 60; // ISR: rebuild homepage every 60 seconds

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, ArrowRight, Repeat } from 'lucide-react';
import { Container } from '@/components/layout';
import {
  HeroSlideshow,
  JustAddedRows,
  FilterPills,
} from '@/components/homepage';
import { getEvents, getFeaturedEvents } from '@/data/events';
import { getCategories } from '@/data/categories';
import { getThisWeekendRange } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { getCategoryColor } from '@/lib/constants/category-colors';
import type { EventCard as EventCardType } from '@/types';

// ---------------------------------------------------------------------------
// EVENT CARD (inline for homepage — compact, no external dependency)
// ---------------------------------------------------------------------------

function HomepageEventCard({ event }: { event: EventCardType }) {
  const colors = getCategoryColor(event.category_slug);
  const d = new Date(event.start_datetime);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = d.getDate();
  const dayLabel = isToday ? 'TODAY' : isTomorrow ? 'TMR' : month;
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase();

  return (
    <Link
      href={`/event/${event.slug}`}
      className="group bg-pure rounded-lg overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-base focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
    >
      {/* Image */}
      <div className="relative aspect-[3/2] bg-cloud overflow-hidden">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-slow"
            sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 30vw"
          />
        ) : (
          /* PLACEHOLDER: Event needs a real image */
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: colors.light }}
          >
            <span className="text-h1 font-bold" style={{ color: colors.accent }}>
              {event.title.charAt(0)}
            </span>
          </div>
        )}
        {/* Category badge */}
        {event.category_name && (
          <span
            className="absolute top-3 left-3 px-2.5 py-1 rounded-sm text-caption uppercase font-semibold tracking-wider"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            {event.category_name}
          </span>
        )}
        {/* Price badge */}
        {event.is_free && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-sm text-caption uppercase font-semibold tracking-wider bg-emerald text-pure">
            Free
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Date block */}
          <div className="flex-shrink-0 text-center w-10">
            <span className="block text-caption text-blue font-semibold leading-tight">{dayLabel}</span>
            <span className="block text-h2 font-bold text-ink leading-none">{day}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-h4 font-bold text-ink line-clamp-2 group-hover:text-blue transition-colors">
              {event.title}
            </h3>
            <p className="text-body-sm text-zinc mt-1 truncate">
              {event.location_name && `${event.location_name} · `}{time}
            </p>
            {event.recurrence_label && (
              <p className="flex items-center gap-1 text-[11px] text-zinc/80 mt-0.5">
                <Repeat className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                <span>
                  {event.recurrence_label}
                  {event.upcoming_count != null && event.upcoming_count > 0 && (
                    <span className="text-zinc/60"> &middot; {event.upcoming_count} more</span>
                  )}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// COMPACT CARD (for horizontal scroll on mobile — smaller, tighter)
// ---------------------------------------------------------------------------

function CompactEventCard({ event, dark = false }: { event: EventCardType; dark?: boolean }) {
  const colors = getCategoryColor(event.category_slug);
  const d = new Date(event.start_datetime);
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase();

  return (
    <Link
      href={`/event/${event.slug}`}
      className={`group flex-shrink-0 w-64 sm:w-72 rounded-lg overflow-hidden transition-colors snap-start ${
        dark
          ? 'bg-night border border-pure/5 hover:border-pure/15'
          : 'bg-pure shadow-card hover:shadow-card-hover'
      }`}
    >
      <div className="relative aspect-[3/2] bg-cloud overflow-hidden">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-slow"
            sizes="(max-width: 640px) 64vw, 288px"
          />
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: colors.accent + '33' }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-display font-bold ${dark ? 'text-pure/20' : 'text-ink/10'}`}>
                {event.title.charAt(0)}
              </span>
            </div>
          </div>
        )}
        {/* Time badge overlay */}
        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-sm bg-ink/80 backdrop-blur-sm text-caption text-pure font-medium">
          {dayName} · {time}
        </span>
      </div>
      <div className="p-3">
        {event.category_name && (
          <span
            className="inline-block px-2 py-0.5 rounded-sm text-caption uppercase font-semibold tracking-wider mb-1.5"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            {event.category_name}
          </span>
        )}
        <h3 className={`text-body-sm font-bold line-clamp-2 transition-colors ${
          dark ? 'text-pure group-hover:text-blue-light' : 'text-ink group-hover:text-blue'
        }`}>
          {event.title}
        </h3>
        <p className={`text-caption mt-1 truncate ${dark ? 'text-silver' : 'text-zinc'}`}>
          {event.location_name}
        </p>
        {event.recurrence_label && (
          <p className={`flex items-center gap-1 text-[10px] mt-1 ${dark ? 'text-silver/70' : 'text-zinc/70'}`}>
            <Repeat className="w-2.5 h-2.5 flex-shrink-0" aria-hidden="true" />
            <span>
              {event.recurrence_label}
              {event.upcoming_count != null && event.upcoming_count > 0 && (
                <> &middot; {event.upcoming_count} more</>
              )}
            </span>
          </p>
        )}
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------------------

export default async function HomePage() {
  // Fetch data in parallel
  const [featuredEvents, categories, weekendData, recentData] = await Promise.all([
    getFeaturedEvents({ limit: 5 }),
    getCategories(),
    getEvents({ dateRange: getThisWeekendRange(), limit: 8 }),
    // Just Added: collapse series so a recurring yoga class with 50 ingested
    // instances doesn't push everything else off the list. Each series shows
    // its next upcoming date with a "N more dates" chip.
    getEvents({ limit: 6, orderBy: 'date-desc', collapseSeries: true }),
  ]);

  const weekendEvents = weekendData.events;
  const recentEvents = recentData.events;

  // Pick the top 3 categories that have events — fetch events for each
  const topCategories = categories.slice(0, 3);
  const categoryEventsResults = await Promise.all(
    topCategories.map(cat =>
      getEvents({ categorySlug: cat.slug, limit: 4, collapseSeries: true })
    )
  );
  const categoryEvents = topCategories.map((cat, i) => ({
    category: cat,
    events: categoryEventsResults[i].events,
    total: categoryEventsResults[i].total,
  })).filter(c => c.events.length > 0);

  // Hero slideshow
  const heroEvents = featuredEvents.slice(0, 5).map(e => ({
    id: e.id,
    slug: e.slug,
    title: e.title,
    image_url: e.image_url,
    category_slug: e.category_slug,
    category_name: e.category_name,
    venue_name: e.location_name,
    start_datetime: e.start_datetime,
    price_type: e.price_type,
    price_min: e.price_low,
  }));

  // Weekend sidebar
  const weekendSidebar = weekendEvents.slice(0, 5).map(e => ({
    title: e.title,
    slug: e.slug,
    category_slug: e.category_slug,
    start_datetime: e.start_datetime,
    venue_name: e.location_name,
  }));

  // Filter pills
  const filterPills = [
    { label: 'Today', href: ROUTES.eventsToday },
    { label: 'This Weekend', href: ROUTES.eventsWeekend },
    { label: 'Free Events', href: `${ROUTES.events}?free=true` },
    ...categories.slice(0, 6).map(c => ({
      label: c.name,
      href: `${ROUTES.events}/${c.slug}`,
    })),
  ];

  // Just Added
  const justAddedEvents = recentEvents.map(e => ({
    slug: e.slug,
    title: e.title,
    category_slug: e.category_slug,
    category_name: e.category_name,
    start_datetime: e.start_datetime,
    price_type: e.price_type,
    price_min: e.price_low,
    venue_name: e.location_name,
    // Surface recurrence so the list can show "· weekly" next to a series
    // event — otherwise a collapsed series row looks like a one-off.
    recurrence_label: e.recurrence_label,
  }));

  return (
    <>
      {/* ============================================
          1. HERO — dark, slideshow, greeting
          ============================================ */}
      <section>
        <HeroSlideshow
          events={heroEvents}
          weekendEvents={weekendSidebar}
          weekendTotal={weekendData.total}
        />
        <div className="bg-ink pb-6">
          <div className="container-page">
            <FilterPills pills={filterPills} />
          </div>
        </div>
      </section>

      {/* ============================================
          2. EDITOR'S PICKS — the best events this week
          Clean row of cards. No stats, no gimmicks.
          ============================================ */}
      {featuredEvents.length > 0 && (
        <section className="py-12 md:py-16 bg-white">
          <Container>
            <div className="flex items-end justify-between mb-6">
              <h2 className="text-h2 text-ink font-bold">Editor&apos;s Picks</h2>
              <Link
                href={ROUTES.events}
                className="text-body-sm text-blue font-semibold hover:underline flex items-center gap-1"
              >
                See all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Desktop: grid. Mobile: horizontal scroll */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredEvents.slice(0, 3).map((event) => (
                <HomepageEventCard key={event.id} event={event} />
              ))}
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:hidden scroll-fade-r snap-x-mandatory">
              {featuredEvents.slice(0, 4).map((event) => (
                <CompactEventCard key={event.id} event={event} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ============================================
          3. EVENTS BY CATEGORY
          Real events grouped by their top categories.
          Jamie browses by interest, not by taxonomy.
          ============================================ */}
      {categoryEvents.map((section, sectionIdx) => {
        const colors = getCategoryColor(section.category.slug);
        const isAlt = sectionIdx % 2 === 1;

        return (
          <section
            key={section.category.id}
            className={`py-12 md:py-14 ${isAlt ? 'bg-cloud' : 'bg-white'}`}
          >
            <Container>
              <div className="flex items-end justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colors.accent }}
                  />
                  <h2 className="text-h2 text-ink font-bold">
                    {section.category.name}
                  </h2>
                </div>
                <Link
                  href={`${ROUTES.events}/${section.category.slug}`}
                  className="text-body-sm text-blue font-semibold hover:underline flex items-center gap-1"
                >
                  See all {section.category.name.toLowerCase()} <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Desktop: grid. Mobile: horizontal scroll */}
              <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {section.events.slice(0, 4).map((event) => (
                  <HomepageEventCard key={event.id} event={event} />
                ))}
              </div>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:hidden scroll-fade-r snap-x-mandatory">
                {section.events.slice(0, 4).map((event) => (
                  <CompactEventCard key={event.id} event={event} />
                ))}
              </div>
            </Container>
          </section>
        );
      })}

      {/* ============================================
          4. THIS WEEKEND — dark section
          "What should I do this weekend?"
          ============================================ */}
      {weekendEvents.length > 0 && (
        <section className="py-12 md:py-16 bg-ink">
          <Container>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-h2 text-pure font-bold">This Weekend</h2>
              <Link
                href={ROUTES.eventsWeekend}
                className="text-body-sm text-blue-light font-semibold hover:underline flex items-center gap-1"
              >
                See all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Desktop: 4-col grid. Mobile: horizontal scroll */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {weekendEvents.slice(0, 8).map((event) => (
                <CompactEventCard key={event.id} event={event} dark />
              ))}
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 md:hidden scroll-fade-r snap-x-mandatory">
              {weekendEvents.slice(0, 8).map((event) => (
                <CompactEventCard key={event.id} event={event} dark />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ============================================
          5. JUST ADDED — numbered list rows
          Quick scan of what's new
          ============================================ */}
      {recentEvents.length > 0 && (
        <section className="py-12 md:py-16 bg-white">
          <Container>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-h2 text-ink font-bold">Just Added</h2>
              <Link
                href={ROUTES.events}
                className="text-body-sm text-blue font-semibold hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <JustAddedRows events={justAddedEvents} />
          </Container>
        </section>
      )}

      {/* ============================================
          6. CTA — brand blue
          ============================================ */}
      <section className="py-16 md:py-20 bg-blue">
        <Container>
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-h1 md:text-display text-pure font-bold">
              Find your next experience
            </h2>
            <p className="text-body text-pure/70 mt-4 mb-8">
              Hundreds of events happening in Milwaukee every week.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href={ROUTES.events}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-pure text-blue font-bold rounded-md hover:bg-cloud transition-colors"
              >
                Browse Events <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href={ROUTES.submitNew}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-pure/30 text-pure font-bold rounded-md hover:bg-pure/10 transition-colors"
              >
                Submit an Event
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
