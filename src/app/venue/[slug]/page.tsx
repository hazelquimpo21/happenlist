/**
 * VENUE DETAIL PAGE
 * =================
 * Individual venue page with upcoming events.
 */

export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import {
  MapPin,
  Globe,
  Phone,
  ExternalLink,
} from 'lucide-react';
import { Container, Breadcrumbs } from '@/components/layout';
import { Button, Badge } from '@/components/ui';
import { EventGrid, SectionHeader } from '@/components/events';
import { VenueJsonLd } from '@/components/seo';
import { VenueMap } from '@/components/maps';
import { VenueSocialLinks } from '@/components/venues';
import { SuperadminBar } from '@/components/admin-anywhere';
import { getVenue } from '@/data/venues';
import { getEvents } from '@/data/events';
import { getSession, isSuperAdmin } from '@/lib/auth';
import { getBestImageUrl } from '@/lib/utils';

interface VenuePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate metadata for the venue page.
 */
export async function generateMetadata({
  params,
}: VenuePageProps): Promise<Metadata> {
  const { slug } = await params;
  const venue = await getVenue({ slug });

  if (!venue) {
    return { title: 'Venue Not Found' };
  }

  const description = venue.description ||
    `Upcoming events at ${venue.name}. Find concerts, shows, and more.`;
  
  // Use validated image URL for Open Graph (fall back to external Google photo)
  const ogImage = getBestImageUrl(venue.image_url, venue.external_image_url);

  return {
    title: venue.name,
    description,
    openGraph: {
      title: venue.name,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

/**
 * Venue detail page.
 */
export default async function VenuePage({ params }: VenuePageProps) {
  const { slug } = await params;

  console.log('🏛️ [VenuePage] Rendering venue:', slug);

  // Fetch venue and session in parallel
  const [venue, { session }] = await Promise.all([
    getVenue({ slug }),
    getSession(),
  ]);

  if (!venue) {
    console.log('⚠️ [VenuePage] Venue not found');
    notFound();
  }

  // Check if current user is superadmin
  const userIsSuperAdmin = session ? isSuperAdmin(session.email) : false;

  // Fetch upcoming events at this venue
  const { events } = await getEvents({
    locationId: venue.id,
    limit: 12,
  });

  console.log('✅ [VenuePage] Venue loaded:', venue.name);

  // Format full address
  const fullAddress = [
    venue.address_line,
    venue.address_line_2,
    venue.city,
    venue.state,
    venue.postal_code,
  ]
    .filter(Boolean)
    .join(', ');

  // Google Maps URL
  const mapsUrl = fullAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
    : null;

  return (
    <>
      {/* Structured data for SEO */}
      <VenueJsonLd venue={venue} />

      {/* Superadmin bar */}
      {userIsSuperAdmin && (
        <SuperadminBar
          entityType="venue"
          entityName={venue.name}
          entityId={venue.id}
        />
      )}

      <Container className="py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Venues', href: '/venues' },
            { label: venue.name },
          ]}
          className="mb-6"
        />

        {/* Venue header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Hero image */}
          {(() => {
            const heroImage = getBestImageUrl(venue.image_url, venue.external_image_url);
            return heroImage ? (
              <div className="relative aspect-video rounded-lg overflow-hidden mb-6">
                <Image
                  src={heroImage}
                  alt={venue.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            ) : null;
          })()}

          {/* Venue name */}
          <div className="mb-6">
            <Badge variant="secondary" className="mb-3">
              Venue
            </Badge>
            <h1 className="font-body text-h1 text-ink">
              {venue.name}
            </h1>
          </div>

          {/* Description */}
          {venue.description && (
            <div className="mb-8">
              <h2 className="font-body text-h3 text-ink mb-4">
                About This Venue
              </h2>
              <div className="prose-event whitespace-pre-wrap">
                {venue.description}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Venue info card */}
            <div className="p-6 bg-pure rounded-lg border border-mist">
              {/* Address */}
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-5 h-5 text-emerald mt-0.5" />
                <div>
                  <p className="font-medium text-ink">Address</p>
                  <p className="text-body-sm text-zinc">
                    {fullAddress || 'Address not available'}
                  </p>
                </div>
              </div>

              {/* Website */}
              {venue.website_url && (
                <div className="flex items-start gap-3 mb-4">
                  <Globe className="w-5 h-5 text-emerald mt-0.5" />
                  <div>
                    <p className="font-medium text-ink">Website</p>
                    <a
                      href={venue.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-body-sm text-blue hover:text-orange-dark transition-colors"
                    >
                      Visit website
                    </a>
                  </div>
                </div>
              )}

              {/* Phone */}
              {venue.phone && (
                <div className="flex items-start gap-3 mb-6">
                  <Phone className="w-5 h-5 text-emerald mt-0.5" />
                  <div>
                    <p className="font-medium text-ink">Phone</p>
                    <a
                      href={`tel:${venue.phone}`}
                      className="text-body-sm text-blue hover:text-orange-dark transition-colors"
                    >
                      {venue.phone}
                    </a>
                  </div>
                </div>
              )}

              {/* Social media links */}
              <VenueSocialLinks
                socialLinks={venue.social_links as Record<string, string> | null}
                className="mb-4"
              />

              {/* Map link */}
              {mapsUrl && (
                <Button
                  href={mapsUrl}
                  external
                  fullWidth
                  variant="secondary"
                  rightIcon={<ExternalLink className="w-4 h-4" />}
                >
                  Get Directions
                </Button>
              )}
            </div>

            {/* Interactive Map (if coordinates available) */}
            {venue.latitude && venue.longitude && (
              <VenueMap
                latitude={Number(venue.latitude)}
                longitude={Number(venue.longitude)}
                venueName={venue.name}
                address={fullAddress || undefined}
                venueType={venue.venue_type}
                height="200px"
                zoom={15}
              />
            )}
          </div>
        </div>
      </div>

        {/* Upcoming events at this venue */}
        <section>
          <SectionHeader
            title="Upcoming Events"
            subtitle={`Events happening at ${venue.name}`}
          />
          <EventGrid
            events={events}
            columns={4}
            emptyTitle="No upcoming events"
            emptyMessage="Check back soon for events at this venue!"
          />
        </section>
      </Container>
    </>
  );
}
