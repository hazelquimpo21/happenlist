/**
 * VENUE DETAIL PAGE
 * =================
 * Individual venue page with upcoming events.
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin,
  Globe,
  Phone,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { Container, Breadcrumbs } from '@/components/layout';
import { Button, Badge } from '@/components/ui';
import { EventGrid, SectionHeader } from '@/components/events';
import { VenueJsonLd } from '@/components/seo';
import { getVenue } from '@/data/venues';
import { getEvents } from '@/data/events';

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

  return {
    title: venue.name,
    description,
    openGraph: {
      title: venue.name,
      description,
      images: venue.image_url ? [venue.image_url] : undefined,
    },
  };
}

/**
 * Venue detail page.
 */
export default async function VenuePage({ params }: VenuePageProps) {
  const { slug } = await params;

  console.log('🏛️ [VenuePage] Rendering venue:', slug);

  // Fetch venue
  const venue = await getVenue({ slug });

  if (!venue) {
    console.log('⚠️ [VenuePage] Venue not found');
    notFound();
  }

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
          {venue.image_url && (
            <div className="relative aspect-video rounded-lg overflow-hidden mb-6">
              <Image
                src={venue.image_url}
                alt={venue.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Venue name */}
          <div className="mb-6">
            <Badge variant="secondary" className="mb-3">
              Venue
            </Badge>
            <h1 className="font-display text-h1 text-charcoal">
              {venue.name}
            </h1>
          </div>

          {/* Description */}
          {venue.description && (
            <div className="mb-8">
              <h2 className="font-display text-h3 text-charcoal mb-4">
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
            <div className="p-6 bg-warm-white rounded-lg border border-sand">
              {/* Address */}
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-5 h-5 text-sage mt-0.5" />
                <div>
                  <p className="font-medium text-charcoal">Address</p>
                  <p className="text-body-sm text-stone">
                    {fullAddress || 'Address not available'}
                  </p>
                </div>
              </div>

              {/* Website */}
              {venue.website_url && (
                <div className="flex items-start gap-3 mb-4">
                  <Globe className="w-5 h-5 text-sage mt-0.5" />
                  <div>
                    <p className="font-medium text-charcoal">Website</p>
                    <a
                      href={venue.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-body-sm text-coral hover:text-coral-dark transition-colors"
                    >
                      Visit website
                    </a>
                  </div>
                </div>
              )}

              {/* Phone */}
              {venue.phone && (
                <div className="flex items-start gap-3 mb-6">
                  <Phone className="w-5 h-5 text-sage mt-0.5" />
                  <div>
                    <p className="font-medium text-charcoal">Phone</p>
                    <a
                      href={`tel:${venue.phone}`}
                      className="text-body-sm text-coral hover:text-coral-dark transition-colors"
                    >
                      {venue.phone}
                    </a>
                  </div>
                </div>
              )}

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
