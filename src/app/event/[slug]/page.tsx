/**
 * EVENT DETAIL PAGE
 * =================
 * Individual event page with full details.
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  ExternalLink,
  Share2,
  User,
} from 'lucide-react';
import { Container, Breadcrumbs } from '@/components/layout';
import { Button, Badge } from '@/components/ui';
import { EventGrid, SectionHeader, EventPrice } from '@/components/events';
import { EventJsonLd } from '@/components/seo';
import { getEvent, getEvents } from '@/data/events';
import { parseEventSlug, buildVenueUrl, buildOrganizerUrl, getBestImageUrl } from '@/lib/utils';
import { formatEventDate } from '@/lib/utils/dates';

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate metadata for the event page.
 */
export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseEventSlug(slug);

  if (!parsed) {
    return { title: 'Event Not Found' };
  }

  const event = await getEvent({
    slug: parsed.slug,
    instanceDate: parsed.date,
  });

  if (!event) {
    return { title: 'Event Not Found' };
  }

  const title = event.meta_title || event.title;
  const description =
    event.meta_description ||
    event.short_description ||
    event.description?.slice(0, 155);
  
  // Use validated image URL for Open Graph
  const ogImage = getBestImageUrl(event.image_url, event.flyer_url);

  return {
    title,
    description,
    openGraph: {
      title: event.title,
      description: description || undefined,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

/**
 * Event detail page.
 */
export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;

  console.log('🎫 [EventPage] Rendering event:', slug);

  // Parse slug to get event slug and date
  const parsed = parseEventSlug(slug);

  if (!parsed) {
    console.log('⚠️ [EventPage] Invalid slug format');
    notFound();
  }

  // Fetch event
  const event = await getEvent({
    slug: parsed.slug,
    instanceDate: parsed.date,
  });

  if (!event) {
    console.log('⚠️ [EventPage] Event not found');
    notFound();
  }

  // Fetch related events (same category)
  const { events: relatedEvents } = await getEvents({
    excludeEventId: event.id,
    limit: 4,
  });

  console.log('✅ [EventPage] Event loaded:', event.title);

  // Format full address
  const fullAddress = event.location
    ? [
        event.location.address_line,
        event.location.address_line_2,
        event.location.city,
        event.location.state,
        event.location.postal_code,
      ]
        .filter(Boolean)
        .join(', ')
    : null;

  return (
    <>
      {/* Structured data for SEO */}
      <EventJsonLd event={event} />

      <Container className="py-8">
        {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/events' },
          ...(event.category
            ? [
                {
                  label: event.category.name,
                  href: `/events?category=${event.category.slug}`,
                },
              ]
            : []),
          { label: event.title },
        ]}
        className="mb-6"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Hero image */}
          {(() => {
            const heroImage = getBestImageUrl(event.image_url, event.flyer_url);
            return heroImage ? (
              <div className="relative aspect-video rounded-lg overflow-hidden mb-6">
                <Image
                  src={heroImage}
                  alt={event.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              // Placeholder for events without valid images
              <div className="relative aspect-video rounded-lg overflow-hidden mb-6 bg-gradient-to-br from-sand to-stone/20 flex items-center justify-center">
                <span className="text-stone/30 text-6xl font-display">
                  {event.title.charAt(0).toUpperCase()}
                </span>
              </div>
            );
          })()}

          {/* Event title and category */}
          <div className="mb-6">
            {event.category && (
              <Badge variant="category" className="mb-3">
                {event.category.name}
              </Badge>
            )}
            <h1 className="font-display text-h1 text-charcoal">
              {event.title}
            </h1>
          </div>

          {/* Description */}
          {event.description && (
            <div className="mb-8">
              <h2 className="font-display text-h3 text-charcoal mb-4">
                About This Event
              </h2>
              <div className="prose-event whitespace-pre-wrap">
                {event.description}
              </div>
            </div>
          )}

          {/* Organizer */}
          {event.organizer && (
            <div className="p-6 bg-warm-white rounded-lg border border-sand">
              <h2 className="font-display text-h4 text-charcoal mb-4">
                Presented By
              </h2>
              <Link
                href={buildOrganizerUrl(event.organizer)}
                className="flex items-center gap-4 group"
              >
                <div className="w-16 h-16 rounded-full bg-sand flex items-center justify-center overflow-hidden">
                  {event.organizer.logo_url ? (
                    <Image
                      src={event.organizer.logo_url}
                      alt={event.organizer.name}
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-stone" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-charcoal group-hover:text-coral transition-colors">
                    {event.organizer.name}
                  </p>
                  <p className="text-body-sm text-stone">View all events</p>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Event info card */}
            <div className="p-6 bg-warm-white rounded-lg border border-sand">
              {/* Date & Time */}
              <div className="flex items-start gap-3 mb-4">
                <Calendar className="w-5 h-5 text-coral mt-0.5" />
                <div>
                  <p className="font-medium text-charcoal">
                    {formatEventDate(event.start_datetime, { format: 'long', includeTime: false })}
                  </p>
                  {!event.is_all_day && (
                    <p className="text-body-sm text-stone">
                      {formatEventDate(event.start_datetime, { format: 'short', includeTime: true }).split(' - ')[1] || formatEventDate(event.start_datetime, { format: 'short' })}
                    </p>
                  )}
                </div>
              </div>

              {/* Location */}
              {event.location && (
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="w-5 h-5 text-coral mt-0.5" />
                  <div>
                    <Link
                      href={buildVenueUrl(event.location)}
                      className="font-medium text-charcoal hover:text-coral transition-colors"
                    >
                      {event.location.name}
                    </Link>
                    {fullAddress && (
                      <p className="text-body-sm text-stone">{fullAddress}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="flex items-start gap-3 mb-6">
                <Ticket className="w-5 h-5 text-coral mt-0.5" />
                <EventPrice event={event} showDetails />
              </div>

              {/* CTA Button */}
              {event.ticket_url ? (
                <Button
                  href={event.ticket_url}
                  external
                  fullWidth
                  rightIcon={<ExternalLink className="w-4 h-4" />}
                >
                  Get Tickets
                </Button>
              ) : (
                <Button href={event.ticket_url || '#'} fullWidth disabled>
                  More Info Coming Soon
                </Button>
              )}
            </div>

            {/* Share button (placeholder) */}
            <Button variant="ghost" fullWidth leftIcon={<Share2 className="w-4 h-4" />}>
              Share Event
            </Button>
          </div>
        </div>
      </div>

      {/* Related events */}
      {relatedEvents.length > 0 && (
        <section className="mt-16">
          <SectionHeader title="You Might Also Like" />
          <EventGrid events={relatedEvents} columns={4} />
        </section>
      )}
      </Container>
    </>
  );
}
