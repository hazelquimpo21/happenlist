// ============================================================================
// 🏠 HAPPENLIST - Home Page
// ============================================================================
// The main landing page showcasing featured events and categories.
// Uses Server Components for optimal performance and SEO.
// ============================================================================

import Link from 'next/link'
import { ArrowRight, Calendar, MapPin, Users } from 'lucide-react'
import { Button } from '@/components/ui'
import { EventCard } from '@/components/events/event-card'
import { EventCardSkeleton } from '@/components/events/event-card-skeleton'
import { CategoryBadge } from '@/components/categories/category-badge'
import { getEvents, getFeaturedEvents } from '@/lib/queries/events'
import { getCategories } from '@/lib/queries/categories'
import { ROUTES } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'
import { Suspense } from 'react'

// ============================================================================
// 📋 Metadata
// ============================================================================

export const metadata = {
  title: 'Happenlist - Discover Milwaukee Events',
  description:
    "Milwaukee's go-to events directory. Find concerts, festivals, family activities, and more happening in your city.",
}

// ============================================================================
// 🏠 Home Page Component
// ============================================================================

export default async function HomePage() {
  logger.info('🏠 Rendering home page')

  return (
    <div>
      {/* ========================================
          🦸 Hero Section
          ======================================== */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16 md:py-24">
        <div className="page-container text-center">
          <h1 className="text-display-lg font-bold text-text-primary">
            Discover What's Happening
            <br />
            <span className="text-primary">in Milwaukee</span>
          </h1>

          <p className="mt-6 text-body-lg text-text-secondary max-w-2xl mx-auto">
            Your go-to guide for concerts, festivals, family fun, and everything
            in between. Never miss out on Milwaukee's best events.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href={ROUTES.events}>
                Browse All Events
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>

            <Button asChild variant="secondary" size="lg">
              <Link href={ROUTES.venues}>Explore Venues</Link>
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-center">
            <div>
              <div className="flex items-center justify-center gap-2 text-primary">
                <Calendar className="w-5 h-5" />
                <span className="text-heading-lg font-bold">100+</span>
              </div>
              <p className="text-body-sm text-text-secondary">Events</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 text-primary">
                <MapPin className="w-5 h-5" />
                <span className="text-heading-lg font-bold">50+</span>
              </div>
              <p className="text-body-sm text-text-secondary">Venues</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 text-primary">
                <Users className="w-5 h-5" />
                <span className="text-heading-lg font-bold">30+</span>
              </div>
              <p className="text-body-sm text-text-secondary">Organizers</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          📂 Categories Section
          ======================================== */}
      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesSection />
      </Suspense>

      {/* ========================================
          ⭐ Featured Events Section
          ======================================== */}
      <Suspense fallback={<FeaturedEventsSkeleton />}>
        <FeaturedEventsSection />
      </Suspense>

      {/* ========================================
          📅 Upcoming Events Section
          ======================================== */}
      <Suspense fallback={<UpcomingEventsSkeleton />}>
        <UpcomingEventsSection />
      </Suspense>

      {/* ========================================
          📢 Call to Action Section
          ======================================== */}
      <section className="bg-primary/5 py-16">
        <div className="page-container text-center">
          <h2 className="text-heading-lg font-bold text-text-primary">
            Have an Event to Share?
          </h2>
          <p className="mt-4 text-body-md text-text-secondary max-w-lg mx-auto">
            Are you an organizer? Get in touch with us to list your events on
            Happenlist and reach more people in Milwaukee.
          </p>
          <Button asChild variant="secondary" className="mt-6">
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

// ============================================================================
// 📂 Categories Section
// ============================================================================

async function CategoriesSection() {
  const categories = await getCategories()

  if (categories.length === 0) {
    return null
  }

  return (
    <section className="py-12 md:py-16">
      <div className="page-container">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-heading-md font-bold text-text-primary">
            Browse by Category
          </h2>
        </div>

        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={ROUTES.categoryEvents(category.slug)}
              className="hover:opacity-80 transition-opacity"
            >
              <CategoryBadge category={category} size="lg" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function CategoriesSkeleton() {
  return (
    <section className="py-12 md:py-16">
      <div className="page-container">
        <div className="h-8 w-48 bg-background rounded animate-pulse mb-8" />
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-24 bg-background rounded-full animate-pulse"
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// ⭐ Featured Events Section
// ============================================================================

async function FeaturedEventsSection() {
  const { events: featuredEvents } = await getFeaturedEvents(3)

  if (featuredEvents.length === 0) {
    return null
  }

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="page-container">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-heading-md font-bold text-text-primary">
            ⭐ Featured Events
          </h2>
          <Link
            href={ROUTES.events}
            className="text-body-sm font-medium text-primary hover:text-primary-dark flex items-center gap-1"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredEvents.map((event) => (
            <EventCard key={event.id} event={event} variant="featured" />
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturedEventsSkeleton() {
  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="page-container">
        <div className="h-8 w-48 bg-surface rounded animate-pulse mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// 📅 Upcoming Events Section
// ============================================================================

async function UpcomingEventsSection() {
  const { events, total } = await getEvents({ limit: 6 })

  if (events.length === 0) {
    return null
  }

  return (
    <section className="py-12 md:py-16">
      <div className="page-container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-heading-md font-bold text-text-primary">
              Upcoming Events
            </h2>
            <p className="text-body-sm text-text-secondary mt-1">
              {total} events coming up in Milwaukee
            </p>
          </div>
          <Link
            href={ROUTES.events}
            className="text-body-sm font-medium text-primary hover:text-primary-dark flex items-center gap-1"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {total > 6 && (
          <div className="mt-8 text-center">
            <Button asChild variant="secondary">
              <Link href={ROUTES.events}>
                View All {total} Events
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

function UpcomingEventsSkeleton() {
  return (
    <section className="py-12 md:py-16">
      <div className="page-container">
        <div className="h-8 w-48 bg-background rounded animate-pulse mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
