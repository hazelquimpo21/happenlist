/**
 * EVENT DETAIL PAGE
 * =================
 * Individual event page with full details.
 *
 * Features:
 * - Full event information display
 * - Related events section
 * - SEO structured data
 * - Admin toolbar for superadmins (edit from anywhere!)
 */

export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Ticket,
  ExternalLink,
  Share2,
  User,
  Sparkles,
  Quote,
  Baby,
  Users,
} from 'lucide-react';
import { Container, Breadcrumbs } from '@/components/layout';
import { Button, Badge } from '@/components/ui';
import { EventGrid, SectionHeader, EventPrice, EventDateTime, EventLinks, FlyerLightbox } from '@/components/events';
import { HeartButton } from '@/components/hearts';
import { EventJsonLd } from '@/components/seo';
import { AdminToolbar, type AdminToolbarEvent } from '@/components/admin-anywhere';
import { VenueMap } from '@/components/maps';
import { getEvent, getEvents } from '@/data/events';
import { checkSingleHeart } from '@/data/user';
import { getSession, isSuperAdmin } from '@/lib/auth';
import { parseEventSlug, buildVenueUrl, buildOrganizerUrl, getBestImageUrl } from '@/lib/utils';
import { formatAgeRange, getGoodForTags } from '@/types';
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

  // Fetch event and session in parallel
  const [event, { session }] = await Promise.all([
    getEvent({
      slug: parsed.slug,
      instanceDate: parsed.date,
    }),
    getSession(),
  ]);

  if (!event) {
    console.log('⚠️ [EventPage] Event not found');
    notFound();
  }

  // Check if current user is superadmin
  const userIsSuperAdmin = session ? isSuperAdmin(session.email) : false;

  if (userIsSuperAdmin) {
    console.log('🛡️ [EventPage] Superadmin detected, showing admin toolbar');
  }

  // Fetch related events and heart status in parallel
  const [{ events: relatedEvents }, isHearted] = await Promise.all([
    getEvents({
      excludeEventId: event.id,
      limit: 4,
    }),
    session ? checkSingleHeart(session.id, event.id) : Promise.resolve(false),
  ]);

  console.log('✅ [EventPage] Event loaded:', event.title);

  // Build admin toolbar event data (only if superadmin)
  const adminToolbarEvent: AdminToolbarEvent | null = userIsSuperAdmin
    ? {
        id: event.id,
        title: event.title,
        slug: event.slug,
        status: event.status,
        instance_date: event.instance_date,
        start_datetime: event.start_datetime,
        end_datetime: event.end_datetime,
        description: event.description,
        short_description: event.short_description,
        price_type: event.price_type,
        price_low: event.price_low,
        price_high: event.price_high,
        is_free: event.is_free,
        ticket_url: event.ticket_url,
        is_all_day: event.is_all_day,
        // External links
        website_url: event.website_url,
        instagram_url: event.instagram_url,
        facebook_url: event.facebook_url,
        registration_url: event.registration_url,
        // Good For audience tags
        good_for: event.good_for || [],
        series_id: event.series_id,
        series_title: event.series?.title || null,
      }
    : null;

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

      {/* Admin toolbar for superadmins */}
      {adminToolbarEvent && (
        <AdminToolbar
          event={adminToolbarEvent}
          isSuperAdmin={userIsSuperAdmin}
        />
      )}

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
          {/* Hero image (only shown when no flyer exists) */}
          {!event.flyer_url && (() => {
            const heroImage = getBestImageUrl(event.image_url, null);
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
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-sand to-stone/20 flex items-center justify-center mb-6">
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
            
            {/* One-line summary */}
            {event.short_description && (
              <p className="mt-3 text-lg text-stone italic">
                {event.short_description}
              </p>
            )}
          </div>

          {/* Good For audience tags */}
          {event.good_for && event.good_for.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              <span className="text-sm text-stone mr-1 self-center">Good for:</span>
              {getGoodForTags(event.good_for).map((tag) => (
                <a
                  key={tag.slug}
                  href={`/events?goodFor=${tag.slug}`}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-80 ${tag.color}`}
                >
                  {tag.label}
                </a>
              ))}
            </div>
          )}

          {/* Happenlist Editorial Summary */}
          {event.happenlist_summary && (
            <div className="mb-8 p-6 bg-coral/5 rounded-lg border border-coral/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-coral" />
                <h2 className="font-display text-h4 text-charcoal">
                  Happenlist Highlights
                </h2>
              </div>
              <div className="prose-event text-charcoal/90">
                {event.happenlist_summary}
              </div>
            </div>
          )}

          {/* Organizer Description (Verbatim) */}
          {event.organizer_description && (
            <div className="mb-8 p-6 bg-warm-white rounded-lg border border-sand">
              <div className="flex items-center gap-2 mb-3">
                <Quote className="w-5 h-5 text-stone" />
                <h2 className="font-display text-h4 text-charcoal">
                  From the Organizer
                </h2>
              </div>
              <div className="prose-event whitespace-pre-wrap text-charcoal/80 italic">
                {event.organizer_description}
              </div>
            </div>
          )}

          {/* Price Details Section (if exists and has detailed info) */}
          {event.price_details && (
            <div className="mb-8 p-4 bg-sage/10 rounded-lg border border-sage/30">
              <h3 className="font-display text-h4 text-charcoal mb-2 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-sage" />
                Pricing Details
              </h3>
              <p className="text-charcoal/80">
                {event.price_details}
              </p>
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
            {/* Event flyer (top of sidebar) */}
            {event.flyer_url && (
              <FlyerLightbox
                flyerUrl={event.flyer_url}
                alt={`${event.title} event flyer`}
                eventTitle={event.title}
                className="w-full"
              />
            )}

            {/* Event info card */}
            <div className="p-6 bg-warm-white rounded-lg border border-sand">
              {/* Date */}
              <div className="flex items-start gap-3 mb-4">
                <Calendar className="w-5 h-5 text-coral mt-0.5" />
                <div>
                  <p className="font-medium text-charcoal">
                    {formatEventDate(event.start_datetime, { format: 'long', includeTime: false })}
                  </p>
                </div>
              </div>

              {/* Time (Start & End) */}
              <div className="mb-4">
                <EventDateTime
                  startDatetime={event.start_datetime}
                  endDatetime={event.end_datetime}
                  isAllDay={event.is_all_day}
                  timezone={event.timezone}
                  variant="full"
                  showIcon
                />
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
              <div className="flex items-start gap-3 mb-4">
                <Ticket className="w-5 h-5 text-coral mt-0.5" />
                <EventPrice event={event} showDetails />
              </div>

              {/* Age / audience info */}
              {(event.age_restriction || event.is_family_friendly || event.age_low != null || event.age_high != null) && (
                <div className="flex items-start gap-3 mb-6">
                  <Baby className="w-5 h-5 text-coral mt-0.5" />
                  <div>
                    {(() => {
                      const ageRange = formatAgeRange(event.age_low, event.age_high);
                      return ageRange ? (
                        <p className="font-medium text-charcoal">{ageRange}</p>
                      ) : event.age_restriction ? (
                        <p className="font-medium text-charcoal">{event.age_restriction}</p>
                      ) : null;
                    })()}
                    {event.is_family_friendly && (
                      <p className="text-body-sm text-sage flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        Family Friendly
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Primary CTA Button */}
              {event.ticket_url ? (
                <Button
                  href={event.ticket_url}
                  external
                  fullWidth
                  rightIcon={<ExternalLink className="w-4 h-4" />}
                >
                  Get Tickets
                </Button>
              ) : event.registration_url ? (
                <Button
                  href={event.registration_url}
                  external
                  fullWidth
                  rightIcon={<ExternalLink className="w-4 h-4" />}
                >
                  Register / RSVP
                </Button>
              ) : event.website_url ? (
                <Button
                  href={event.website_url}
                  external
                  fullWidth
                  rightIcon={<ExternalLink className="w-4 h-4" />}
                >
                  Learn More
                </Button>
              ) : null}
            </div>

            {/* External Links */}
            {(event.website_url || event.instagram_url || event.facebook_url || event.registration_url) && (
              <div className="p-4 bg-warm-white rounded-lg border border-sand">
                <h3 className="text-body-sm font-medium text-charcoal mb-3">
                  Links & More
                </h3>
                <EventLinks
                  websiteUrl={event.website_url}
                  instagramUrl={event.instagram_url}
                  facebookUrl={event.facebook_url}
                  registrationUrl={event.registration_url}
                  variant="full"
                />
              </div>
            )}

            {/* Interactive Map (if venue has coordinates) */}
            {event.location?.latitude && event.location?.longitude && (
              <VenueMap
                latitude={Number(event.location.latitude)}
                longitude={Number(event.location.longitude)}
                venueName={event.location.name}
                address={fullAddress || undefined}
                venueType={event.location.venue_type}
                height="180px"
                zoom={15}
              />
            )}

            {/* Save & Share buttons */}
            <div className="flex gap-3">
              <HeartButton
                eventId={event.id}
                initialHearted={isHearted}
                initialCount={event.heart_count ?? 0}
                size="lg"
                className="flex-1 bg-warm-white border border-sand hover:border-coral/30"
              />
              <Button variant="ghost" className="flex-1" leftIcon={<Share2 className="w-4 h-4" />}>
                Share
              </Button>
            </div>
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
