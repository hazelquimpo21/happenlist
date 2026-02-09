/**
 * HOME PAGE
 * =========
 * Main landing page with featured events, categories, and quick filters.
 */

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Search, Calendar, CalendarDays, Ticket, ChevronRight } from 'lucide-react';
import { Container } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { EventGrid, SectionHeader } from '@/components/events';
import { CategoryGrid } from '@/components/categories';
import { getEvents, getFeaturedEvents } from '@/data/events';
import { getCategories } from '@/data/categories';
import { getThisWeekendRange } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

/**
 * Home page - the main entry point for discovering events.
 */
export default async function HomePage() {
  console.log('🏠 [HomePage] Rendering home page');

  // Fetch data in parallel
  const [featuredEvents, categories, weekendData] = await Promise.all([
    getFeaturedEvents({ limit: 6 }),
    getCategories(),
    getEvents({
      dateRange: getThisWeekendRange(),
      limit: 4,
    }),
  ]);

  const weekendEvents = weekendData.events;

  console.log('✅ [HomePage] Data loaded:', {
    featuredEvents: featuredEvents.length,
    categories: categories.length,
    weekendEvents: weekendEvents.length,
  });

  return (
    <>
      {/* ============================================
          HERO SECTION
          ============================================ */}
      <section className="bg-warm-white py-12 md:py-20 border-b border-sand">
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            {/* Headline */}
            <h1 className="font-display text-display text-charcoal mb-4">
              Discover what&apos;s{' '}
              <span className="text-coral">happening</span>
            </h1>

            {/* Subtitle */}
            <p className="text-body text-stone mb-8">
              Find concerts, festivals, classes, workshops, and more happening
              in your area.
            </p>

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

            {/* Quick filter buttons */}
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                href={ROUTES.eventsToday}
                variant="secondary"
                size="sm"
                leftIcon={<Calendar className="w-4 h-4" />}
              >
                Today
              </Button>
              <Button
                href={ROUTES.eventsWeekend}
                variant="secondary"
                size="sm"
                leftIcon={<CalendarDays className="w-4 h-4" />}
              >
                This Weekend
              </Button>
              <Button
                href={`${ROUTES.events}?free=true`}
                variant="secondary"
                size="sm"
                leftIcon={<Ticket className="w-4 h-4" />}
              >
                Free Events
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* ============================================
          FEATURED EVENTS
          ============================================ */}
      {featuredEvents.length > 0 && (
        <section className="py-12">
          <Container>
            <SectionHeader
              title="Featured Events"
              viewAllHref={ROUTES.events}
            />
            <EventGrid events={featuredEvents} columns={3} />
          </Container>
        </section>
      )}

      {/* ============================================
          BROWSE BY CATEGORY
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
          CALL TO ACTION
          ============================================ */}
      <section className="py-16 bg-coral">
        <Container>
          <div className="text-center">
            <h2 className="font-display text-h1 text-warm-white mb-4">
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
