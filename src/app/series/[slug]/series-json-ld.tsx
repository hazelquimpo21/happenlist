/**
 * SERIES JSON-LD STRUCTURED DATA
 * ==============================
 * Generates Schema.org structured data for series.
 * Helps search engines understand and display series info.
 */

import type { SeriesWithDetails, SeriesEvent } from '@/types';

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface SeriesJsonLdProps {
  /** Full series data */
  series: SeriesWithDetails;
  /** Events in the series */
  events: SeriesEvent[];
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Renders JSON-LD structured data for a series.
 * Uses Course schema for classes, EventSeries for others.
 *
 * @example
 * ```tsx
 * <SeriesJsonLd series={series} events={events} />
 * ```
 */
export function SeriesJsonLd({ series, events }: SeriesJsonLdProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://happenlist.com';
  const seriesUrl = `${siteUrl}/series/${series.slug}`;

  // Use Course schema for classes/workshops, EventSeries for others
  const isEducational = ['class', 'workshop', 'camp'].includes(series.series_type);

  // Build JSON-LD object
  const jsonLd = isEducational
    ? buildCourseSchema(series, events, seriesUrl)
    : buildEventSeriesSchema(series, events, seriesUrl);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd, null, 0) }}
    />
  );
}

// ============================================================================
// SCHEMA BUILDERS
// ============================================================================

/**
 * Build Course schema for educational series.
 * https://schema.org/Course
 */
function buildCourseSchema(
  series: SeriesWithDetails,
  events: SeriesEvent[],
  url: string
): object {
  const startDate = series.start_date || events[0]?.instance_date;
  const endDate = series.end_date || events[events.length - 1]?.instance_date;

  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: series.title,
    description: series.description || series.short_description,
    url,
    ...(series.image_url && { image: series.image_url }),

    // Provider (organizer)
    ...(series.organizer && {
      provider: {
        '@type': 'Organization',
        name: series.organizer.name,
        ...(series.organizer.website_url && { url: series.organizer.website_url }),
        ...(series.organizer.logo_url && {
          logo: series.organizer.logo_url,
        }),
      },
    }),

    // Location
    ...(series.location && {
      location: {
        '@type': 'Place',
        name: series.location.name,
        address: {
          '@type': 'PostalAddress',
          ...(series.location.address_line && {
            streetAddress: series.location.address_line,
          }),
          addressLocality: series.location.city,
        },
      },
    }),

    // Offer (pricing)
    offers: {
      '@type': 'Offer',
      category: series.is_free ? 'Free' : 'Paid',
      ...(series.price_low && {
        price: series.price_low,
        priceCurrency: 'USD',
      }),
      ...(series.registration_url && { url: series.registration_url }),
    },

    // Course schedule (hasCourseInstance)
    ...(events.length > 0 && {
      hasCourseInstance: events.slice(0, 10).map((event) => ({
        '@type': 'CourseInstance',
        name: event.title,
        startDate: event.start_datetime,
        ...(event.end_datetime && { endDate: event.end_datetime }),
        ...(event.location_name && {
          location: {
            '@type': 'Place',
            name: event.location_name,
          },
        }),
      })),
    }),

    // Number of sessions
    ...(series.total_sessions && {
      numberOfCredits: series.total_sessions,
    }),

    // Date range
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),

    // Category
    ...(series.category && {
      about: {
        '@type': 'Thing',
        name: series.category.name,
      },
    }),
  };
}

/**
 * Build EventSeries schema for non-educational series.
 * https://schema.org/EventSeries
 */
function buildEventSeriesSchema(
  series: SeriesWithDetails,
  events: SeriesEvent[],
  url: string
): object {
  const startDate = series.start_date || events[0]?.instance_date;
  const endDate = series.end_date || events[events.length - 1]?.instance_date;

  return {
    '@context': 'https://schema.org',
    '@type': 'EventSeries',
    name: series.title,
    description: series.description || series.short_description,
    url,
    ...(series.image_url && { image: series.image_url }),

    // Organizer
    ...(series.organizer && {
      organizer: {
        '@type': 'Organization',
        name: series.organizer.name,
        ...(series.organizer.website_url && { url: series.organizer.website_url }),
      },
    }),

    // Location
    ...(series.location && {
      location: {
        '@type': 'Place',
        name: series.location.name,
        address: {
          '@type': 'PostalAddress',
          addressLocality: series.location.city,
        },
      },
    }),

    // Sub-events
    ...(events.length > 0 && {
      subEvent: events.slice(0, 10).map((event) => ({
        '@type': 'Event',
        name: event.title,
        startDate: event.start_datetime,
        ...(event.end_datetime && { endDate: event.end_datetime }),
        ...(event.location_name && {
          location: {
            '@type': 'Place',
            name: event.location_name,
          },
        }),
      })),
    }),

    // Offers
    offers: {
      '@type': 'Offer',
      category: series.is_free ? 'Free' : 'Paid',
      ...(series.price_low && {
        price: series.price_low,
        priceCurrency: 'USD',
      }),
    },

    // Date range
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),

    // Event attendance mode
    eventAttendanceMode: series.location
      ? 'https://schema.org/OfflineEventAttendanceMode'
      : 'https://schema.org/OnlineEventAttendanceMode',

    // Status
    eventStatus: 'https://schema.org/EventScheduled',
  };
}
