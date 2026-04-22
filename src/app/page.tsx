/**
 * HOME PAGE — B1 Redesign
 * =======================
 * Flow (per B1 spec, 2026-04-22):
 *   1. HERO — ice band + centered segmented picker
 *   2. ROW 1 — HeroFeaturedCard (big) + TabbedDiscovery (Popular / New / This weekend)
 *   3. EVENTS BY CATEGORY — real events grouped by top categories (locked display order)
 *   4. THIS WEEKEND — dark section, horizontal scroll compact cards
 *   5. JUST ADDED — numbered list rows
 *   6. CTA — brand blue block
 *
 * The old HeroSlideshow + FilterPills experience was replaced in the B1
 * redesign — the spec calls for a single ice-band hero with the picker as
 * the primary discovery surface.
 */

export const revalidate = 60; // ISR: rebuild homepage every 60 seconds

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, ArrowRight, Repeat } from 'lucide-react';
import { Container } from '@/components/layout';
import {
  HomeHero,
  HeroFeaturedCard,
  TabbedDiscovery,
  JustAddedRows,
} from '@/components/homepage';
import {
  getEvents,
  getFeaturedEvents,
  getPopularEvents,
  getNewEvents,
  getThisWeekendEvents,
} from '@/data/events';
import { getCategories } from '@/data/categories';
import { getThisWeekendRange } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { getCategoryColor } from '@/lib/constants/category-colors';
import { sortCategoriesByDisplayOrder } from '@/lib/constants/category-order';
import type { EventCard as EventCardType } from '@/types';
import type { CategoryPopoverItem } from '@/components/events/filters/b1/segments/category-popover';

// ---------------------------------------------------------------------------
// COMPACT CARD (for horizontal scroll — weekend section)
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
// HOMEPAGE EVENT CARD (used in category browse sections)
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
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: colors.light }}
          >
            <span className="text-h1 font-bold" style={{ color: colors.accent }}>
              {event.title.charAt(0)}
            </span>
          </div>
        )}
        {event.category_name && (
          <span
            className="absolute top-3 left-3 px-2.5 py-1 rounded-sm text-caption uppercase font-semibold tracking-wider"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            {event.category_name}
          </span>
        )}
        {event.is_free && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-sm text-caption uppercase font-semibold tracking-wider bg-emerald text-pure">
            Free
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start gap-3">
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
// PAGE
// ---------------------------------------------------------------------------

export default async function HomePage() {
  // Fetch everything in parallel. The three trending feeds are independent
  // queries with small fetchLimits; doubling up the network cost is cheap
  // compared to serializing them.
  const [
    featuredEvents,
    categories,
    weekendData,
    recentData,
    popularEvents,
    newEvents,
    weekendTabEvents,
    totalEventsData,
  ] = await Promise.all([
    getFeaturedEvents({ limit: 5 }),
    getCategories(),
    getEvents({ dateRange: getThisWeekendRange(), limit: 8 }),
    getEvents({ limit: 6, orderBy: 'date-desc', collapseSeries: true }),
    getPopularEvents(4),
    getNewEvents(4),
    getThisWeekendEvents(4),
    // Lightweight count-only fetch for the hero subtitle.
    getEvents({ limit: 1, collapseSeries: true }),
  ]);

  const weekendEvents = weekendData.events;
  const recentEvents = recentData.events;

  // Picker needs a lean category shape.
  const pickerCategories: CategoryPopoverItem[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  }));

  // Category browse sections — walk the canonical display order, pick the
  // first 3 that have events. This replaces the prior "first 3 by DB order"
  // behavior with a design-locked order per B1 spec.
  const orderedCategories = sortCategoriesByDisplayOrder(categories, (c) => c.slug);
  const categoryEventsResults = await Promise.all(
    orderedCategories.slice(0, 6).map((cat) =>
      getEvents({ categorySlug: cat.slug, limit: 4, collapseSeries: true })
    )
  );
  const categoryEvents = orderedCategories
    .slice(0, 6)
    .map((cat, i) => ({
      category: cat,
      events: categoryEventsResults[i].events,
      total: categoryEventsResults[i].total,
    }))
    .filter((c) => c.events.length > 0)
    .slice(0, 3);

  const justAddedEvents = recentEvents.map((e) => ({
    slug: e.slug,
    title: e.title,
    category_slug: e.category_slug,
    category_name: e.category_name,
    start_datetime: e.start_datetime,
    price_type: e.price_type,
    price_min: e.price_low,
    venue_name: e.location_name,
    recurrence_label: e.recurrence_label,
  }));

  const heroFeatured = featuredEvents[0];

  return (
    <>
      {/* ============================================
          1. HERO — ice band + segmented picker
          ============================================ */}
      <HomeHero eventCount={totalEventsData.total} categories={pickerCategories} />

      {/* ============================================
          2. ROW 1 — featured card + tabbed discovery
          ============================================ */}
      <section className="py-10 md:py-12">
        <Container>
          <div className="flex flex-col gap-5 md:flex-row">
            {heroFeatured && <HeroFeaturedCard event={heroFeatured} />}
            <TabbedDiscovery
              popular={popularEvents}
              newest={newEvents}
              weekend={weekendTabEvents}
            />
          </div>
        </Container>
      </section>

      {/* ============================================
          3. EVENTS BY CATEGORY
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
                  <h2 className="text-h2 text-ink font-bold">{section.category.name}</h2>
                </div>
                <Link
                  href={`${ROUTES.events}/${section.category.slug}`}
                  className="text-body-sm text-blue font-semibold hover:underline flex items-center gap-1"
                >
                  See all {section.category.name.toLowerCase()} <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
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
