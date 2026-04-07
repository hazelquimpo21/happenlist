/**
 * HOME PAGE
 * =========
 * Main landing page with bold hero, bento featured grid,
 * color-blocked categories, and topographic texture.
 */

export const dynamic = 'force-dynamic';

import { Search, Calendar, CalendarDays, Ticket, ChevronRight } from 'lucide-react';
import { Container } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { EventGrid, SectionHeader } from '@/components/events';
import { CategoryGrid } from '@/components/categories';
import { getEvents, getFeaturedEvents } from '@/data/events';
import { getCategories } from '@/data/categories';
import { getThisWeekendRange, getThisWeekRange } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

export default async function HomePage() {
  // Fetch data in parallel
  const [featuredEvents, categories, weekendData, thisWeekData] = await Promise.all([
    getFeaturedEvents({ limit: 6 }),
    getCategories(),
    getEvents({
      dateRange: getThisWeekendRange(),
      limit: 4,
    }),
    getEvents({
      dateRange: getThisWeekRange(),
      limit: 1,
    }),
  ]);

  const weekendEvents = weekendData.events;
  const thisWeekCount = thisWeekData.total;

  return (
    <>
      {/* ============================================
          HERO SECTION — cream background + topo texture
          ============================================ */}
      <section className="bg-cream bg-topo py-16 md:py-24 border-b border-sand">
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            {/* Headline */}
            <h1 className="font-display text-hero text-charcoal mb-6 leading-[1.1]">
              Discover what&apos;s
              <span className="block text-coral font-bold scale-105 origin-center">
                happening
              </span>
            </h1>

            {/* Big stat number */}
            <div className="mb-8">
              <span className="font-display text-stat text-coral tabular-nums">
                {thisWeekCount}
              </span>
              <span className="text-body text-stone ml-2">
                events this week
              </span>
            </div>

            {/* Search bar */}
            <form action={ROUTES.search} method="GET" className="mb-8">
              <div className="flex gap-2 max-w-lg mx-auto">
                <Input
                  name="q"
                  placeholder="Search events, venues, organizers..."
                  leftIcon={<Search className="w-5 h-5" />}
                  className="flex-1"
                />
                <Button type="submit" variant="primary">
                  Search
                </Button>
              </div>
            </form>

            {/* Quick filter pills */}
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                href={ROUTES.eventsToday}
                variant="secondary"
                size="sm"
                leftIcon={<Calendar className="w-4 h-4" />}
                className="rounded-full border-2 font-semibold hover:border-coral hover:text-coral"
              >
                Today
              </Button>
              <Button
                href={ROUTES.eventsWeekend}
                variant="secondary"
                size="sm"
                leftIcon={<CalendarDays className="w-4 h-4" />}
                className="rounded-full border-2 font-semibold hover:border-coral hover:text-coral"
              >
                This Weekend
              </Button>
              <Button
                href={`${ROUTES.events}?free=true`}
                variant="secondary"
                size="sm"
                leftIcon={<Ticket className="w-4 h-4" />}
                className="rounded-full border-2 font-semibold hover:border-coral hover:text-coral"
              >
                Free Events
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* ============================================
          FEATURED EVENTS — bento grid
          ============================================ */}
      {featuredEvents.length > 0 && (
        <section className="py-12">
          <Container>
            <SectionHeader
              title="Featured Events"
              viewAllHref={ROUTES.events}
            />
            <EventGrid events={featuredEvents} variant="bento" />
          </Container>
        </section>
      )}

      {/* ============================================
          BROWSE BY CATEGORY — color-blocked cards
          ============================================ */}
      {categories.length > 0 && (
        <section className="py-12 bg-warm-white">
          <Container>
            <SectionHeader title="Browse by Category" />
            <CategoryGrid categories={categories} />
          </Container>
        </section>
      )}

      {/* ============================================
          THIS WEEKEND
          ============================================ */}
      {weekendEvents.length > 0 && (
        <section className="py-12">
          <Container>
            <SectionHeader
              title="This Weekend"
              viewAllHref={ROUTES.eventsWeekend}
            />
            <EventGrid events={weekendEvents} columns={4} />
          </Container>
        </section>
      )}

      {/* ============================================
          CALL TO ACTION — coral + topo texture
          ============================================ */}
      <section className="py-16 bg-coral bg-topo-light">
        <Container>
          <div className="text-center">
            <h2 className="font-display text-h1 md:text-display text-warm-white mb-4">
              Find your next experience
            </h2>
            <p className="text-coral-light text-body mb-6 max-w-lg mx-auto">
              Explore hundreds of events happening near you. From live music to
              workshops, there&apos;s something for everyone.
            </p>
            <Button
              href={ROUTES.events}
              variant="secondary"
              className="bg-warm-white text-coral border-warm-white hover:bg-cream"
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Browse All Events
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
