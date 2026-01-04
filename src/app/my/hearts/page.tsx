/**
 * MY HEARTS PAGE
 * ==============
 * Shows all events the user has saved (hearted).
 *
 * ROUTE: /my/hearts
 *
 * FEATURES:
 *   - Grid of hearted events
 *   - Toggle to show/hide past events
 *   - Remove hearts inline
 *   - Empty state with CTA to browse
 *
 * 🔒 REQUIRES: User must be authenticated
 *
 * @module app/my/hearts/page
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Heart, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { Container } from '@/components/layout';
import { HeartButton } from '@/components/hearts';
import { Badge } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { getHearts } from '@/data/user';
import { formatDate, formatTime } from '@/lib/utils/dates';
import { cn } from '@/lib/utils';
import type { HeartedEvent } from '@/types/user';

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: 'My Saved Events',
  description: 'Events you\'ve saved to attend later.',
};

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function MyHeartsPage() {
  // ---------------------------------------------------------------------------
  // 1. CHECK AUTH
  // ---------------------------------------------------------------------------

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirect=/my/hearts');
  }

  // ---------------------------------------------------------------------------
  // 2. FETCH HEARTS
  // ---------------------------------------------------------------------------

  const result = await getHearts({
    userId: user.id,
    limit: 100,
    includePast: true,
  });

  const events = result.success ? result.events : [];

  // ---------------------------------------------------------------------------
  // 3. SEPARATE UPCOMING VS PAST
  // ---------------------------------------------------------------------------

  const today = new Date().toISOString().slice(0, 10);

  const upcomingEvents = events.filter((e) => e.instance_date >= today);
  const pastEvents = events.filter((e) => e.instance_date < today);

  // ---------------------------------------------------------------------------
  // 4. RENDER
  // ---------------------------------------------------------------------------

  return (
    <div className="py-8 md:py-12">
      <Container>
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-display text-h2 md:text-h1 text-charcoal mb-2">
            ❤️ My Saved Events
          </h1>
          <p className="text-stone text-body">
            Events you&apos;ve saved to attend later
          </p>
        </div>

        {/* Empty State */}
        {events.length === 0 && (
          <EmptyState />
        )}

        {/* Upcoming Events Section */}
        {upcomingEvents.length > 0 && (
          <section className="mb-12">
            <SectionHeader
              title="Upcoming"
              count={upcomingEvents.length}
              icon="🗓️"
            />
            <HeartedEventsGrid events={upcomingEvents} />
          </section>
        )}

        {/* Past Events Section */}
        {pastEvents.length > 0 && (
          <section>
            <SectionHeader
              title="Past Events"
              count={pastEvents.length}
              icon="📅"
              muted
            />
            <HeartedEventsGrid events={pastEvents} isPast />
          </section>
        )}
      </Container>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Section header with title and count
 */
function SectionHeader({
  title,
  count,
  icon,
  muted = false,
}: {
  title: string;
  count: number;
  icon: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="text-xl">{icon}</span>
      <h2 className={cn(
        'font-display text-h4',
        muted ? 'text-stone' : 'text-charcoal'
      )}>
        {title}
      </h2>
      <Badge variant={muted ? 'outline' : 'secondary'}>
        {count}
      </Badge>
    </div>
  );
}

/**
 * Grid of hearted events
 */
function HeartedEventsGrid({
  events,
  isPast = false,
}: {
  events: HeartedEvent[];
  isPast?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <HeartedEventCard
          key={event.heart_id}
          event={event}
          isPast={isPast}
        />
      ))}
    </div>
  );
}

/**
 * Card for a single hearted event
 */
function HeartedEventCard({
  event,
  isPast = false,
}: {
  event: HeartedEvent;
  isPast?: boolean;
}) {
  return (
    <Link
      href={`/event/${event.slug}`}
      className={cn(
        'group block rounded-xl overflow-hidden',
        'bg-white border border-sand',
        'transition-all duration-200',
        'hover:shadow-medium hover:border-sand-dark',
        isPast && 'opacity-75 hover:opacity-100'
      )}
    >
      {/* Event Image */}
      <div className="aspect-[16/9] relative overflow-hidden bg-sand">
        {event.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.image_url}
            alt={event.title}
            className={cn(
              'w-full h-full object-cover',
              'transition-transform duration-300',
              'group-hover:scale-105',
              isPast && 'grayscale-[30%]'
            )}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-sand-dark" />
          </div>
        )}

        {/* Category Badge */}
        {event.category_name && (
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" size="sm">
              {event.category_name}
            </Badge>
          </div>
        )}

        {/* Past Badge */}
        {isPast && (
          <div className="absolute top-3 right-3">
            <Badge variant="outline" size="sm" className="bg-white/90">
              Past
            </Badge>
          </div>
        )}

        {/* Heart Button (positioned over image) */}
        <div className="absolute bottom-3 right-3">
          <HeartButton
            eventId={event.event_id}
            initialHearted={true}
            initialCount={event.heart_count || 0}
            size="sm"
            className="bg-white/90 backdrop-blur-sm shadow-sm"
          />
        </div>
      </div>

      {/* Event Info */}
      <div className="p-4">
        {/* Title */}
        <h3 className={cn(
          'font-display text-body-lg font-medium text-charcoal',
          'line-clamp-2 mb-2',
          'group-hover:text-coral transition-colors'
        )}>
          {event.title}
        </h3>

        {/* Date & Time */}
        <div className="flex items-center gap-2 text-body-sm text-stone mb-1">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span>
            {formatDate(event.instance_date, 'EEE, MMM d')}
            {event.start_datetime && (
              <span className="text-stone-light">
                {' '}at {formatTime(event.start_datetime)}
              </span>
            )}
          </span>
        </div>

        {/* Location */}
        {event.location_name && (
          <div className="flex items-center gap-2 text-body-sm text-stone">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              {event.location_name}
              {event.location_city && `, ${event.location_city}`}
            </span>
          </div>
        )}

        {/* Price */}
        {!isPast && (
          <div className="mt-3 pt-3 border-t border-sand">
            {event.is_free ? (
              <Badge variant="secondary" size="sm">Free</Badge>
            ) : event.price_low !== null ? (
              <span className="text-body-sm text-charcoal font-medium">
                ${event.price_low}
                {event.price_high && event.price_high !== event.price_low && (
                  <span className="text-stone"> - ${event.price_high}</span>
                )}
              </span>
            ) : (
              <span className="text-body-sm text-stone">See event</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

/**
 * Empty state when no hearts
 */
function EmptyState() {
  return (
    <div className="text-center py-16 px-4">
      {/* Icon */}
      <div className="mx-auto w-16 h-16 rounded-full bg-sand flex items-center justify-center mb-6">
        <Heart className="w-8 h-8 text-stone" />
      </div>

      {/* Message */}
      <h2 className="font-display text-h4 text-charcoal mb-2">
        No saved events yet
      </h2>
      <p className="text-stone mb-6 max-w-md mx-auto">
        When you find events you&apos;re interested in, tap the heart icon to save them here for later.
      </p>

      {/* CTA */}
      <Link
        href="/events"
        className={cn(
          'inline-flex items-center gap-2',
          'px-6 py-3 rounded-lg',
          'bg-coral text-white font-medium',
          'hover:bg-coral-dark transition-colors'
        )}
      >
        Browse Events
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
