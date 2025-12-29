/**
 * JSON-LD STRUCTURED DATA COMPONENTS
 * ===================================
 * Schema.org structured data for rich search results.
 */

import type { EventWithDetails, Venue, Organizer } from '@/types';
import { SITE_CONFIG } from '@/lib/constants';

/**
 * JSON-LD script component.
 */
function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Organization schema for the site.
 */
export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    logo: `${SITE_CONFIG.url}/logo.png`,
    sameAs: [],
  };

  return <JsonLdScript data={data} />;
}

/**
 * Website schema for search functionality.
 */
export function WebsiteJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return <JsonLdScript data={data} />;
}

interface EventJsonLdProps {
  event: EventWithDetails;
}

/**
 * Event schema for individual events.
 */
export function EventJsonLd({ event }: EventJsonLdProps) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description || event.short_description,
    startDate: event.start_datetime,
    endDate: event.end_datetime,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: event.image_url,
  };

  // Location
  if (event.location) {
    data.location = {
      '@type': 'Place',
      name: event.location.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: event.location.address_line,
        addressLocality: event.location.city,
        addressRegion: event.location.state,
        postalCode: event.location.postal_code,
        addressCountry: 'US',
      },
    };
  }

  // Organizer
  if (event.organizer) {
    data.organizer = {
      '@type': 'Organization',
      name: event.organizer.name,
      url: event.organizer.website_url,
    };
  }

  // Offers/pricing
  if (event.is_free) {
    data.isAccessibleForFree = true;
  } else if (event.price_low !== null) {
    data.offers = {
      '@type': 'Offer',
      price: event.price_low,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: event.ticket_url,
    };

    // Add price range if available
    if (event.price_high !== null && event.price_high > event.price_low) {
      data.offers = {
        '@type': 'AggregateOffer',
        lowPrice: event.price_low,
        highPrice: event.price_high,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: event.ticket_url,
      };
    }
  }

  return <JsonLdScript data={data} />;
}

interface VenueJsonLdProps {
  venue: Venue;
}

/**
 * Place schema for venues.
 */
export function VenueJsonLd({ venue }: VenueJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: venue.name,
    description: venue.description,
    url: venue.website_url,
    telephone: venue.phone,
    image: venue.image_url,
    address: {
      '@type': 'PostalAddress',
      streetAddress: venue.address_line,
      addressLocality: venue.city,
      addressRegion: venue.state,
      postalCode: venue.postal_code,
      addressCountry: 'US',
    },
  };

  return <JsonLdScript data={data} />;
}

interface OrganizerJsonLdProps {
  organizer: Organizer;
}

/**
 * Organization schema for event organizers.
 */
export function OrganizerJsonLd({ organizer }: OrganizerJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: organizer.name,
    description: organizer.description,
    url: organizer.website_url,
    logo: organizer.logo_url,
    email: organizer.email,
    telephone: organizer.phone,
  };

  return <JsonLdScript data={data} />;
}

interface BreadcrumbJsonLdProps {
  items: { name: string; url: string }[];
}

/**
 * Breadcrumb schema for navigation.
 */
export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <JsonLdScript data={data} />;
}
