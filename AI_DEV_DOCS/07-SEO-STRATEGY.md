# Happenlist: SEO Strategy

## Overview

This document defines the SEO strategy including URL structure, metadata, structured data (Schema.org), sitemaps, and best practices for discoverability.

---

## URL Strategy

### Principles

1. **Human-readable** - URLs should be meaningful and descriptive
2. **Keyword-rich** - Include relevant terms for search
3. **Consistent** - Follow the same patterns throughout
4. **Stable** - URLs shouldn't change once created

### URL Structure

| Page Type | Pattern | Example |
|-----------|---------|---------|
| Events Index | `/events` | `/events` |
| Events Today | `/events/today` | `/events/today` |
| Events Weekend | `/events/this-weekend` | `/events/this-weekend` |
| Events by Month | `/events/[year]/[month]` | `/events/2025/february` |
| Events by Category | `/events/[category]` | `/events/music` |
| Event Detail | `/event/[slug]-[date]` | `/event/jazz-at-the-lake-2025-02-14` |
| Venues Index | `/venues` | `/venues` |
| Venue Detail | `/venue/[slug]` | `/venue/pabst-theater` |
| Organizers Index | `/organizers` | `/organizers` |
| Organizer Detail | `/organizer/[slug]` | `/organizer/milwaukee-jazz-collective` |
| Search | `/search?q=[query]` | `/search?q=jazz` |

### Slug Generation

**File:** `src/lib/utils/slug.ts`

```typescript
import slugify from 'slugify';

export function generateSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
}

// Event URLs include date for uniqueness (same event can repeat)
export function generateEventUrl(event: { slug: string; instance_date: string }): string {
  return `/event/${event.slug}-${event.instance_date}`;
}
```

---

## Metadata Strategy

### Page-Level Metadata

Each page defines metadata using Next.js `generateMetadata`:

**Event Detail Example:**

```typescript
// src/app/event/[slug]/page.tsx

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, date } = parseEventSlug(params.slug);
  const event = await getEvent({ slug, instanceDate: date });
  
  if (!event) {
    return { title: 'Event Not Found' };
  }

  const title = event.meta_title || event.title;
  const description = event.meta_description || 
    truncate(stripHtml(event.description), 155);

  return {
    title,
    description,
    openGraph: {
      title: event.title,
      description,
      type: 'website',
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/event/${params.slug}`,
      images: event.image_url ? [
        {
          url: event.image_url,
          width: 1200,
          height: 630,
          alt: event.title,
        }
      ] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description,
      images: event.image_url ? [event.image_url] : undefined,
    },
  };
}
```

### Metadata Templates

**Root Layout:**
```typescript
// src/app/layout.tsx

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
  title: {
    template: '%s | Happenlist',
    default: 'Happenlist - Discover Local Events',
  },
  description: 'Find concerts, festivals, classes, workshops, and more happening in your area.',
  keywords: ['events', 'local events', 'things to do', 'concerts', 'festivals'],
  authors: [{ name: 'Happenlist' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Happenlist',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@happenlist',
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

### Page-Specific Titles

| Page | Title Pattern |
|------|---------------|
| Home | Happenlist - Discover Local Events |
| Events Index | Events \| Happenlist |
| Events Today | Today's Events \| Happenlist |
| Events Category | {Category} Events \| Happenlist |
| Event Detail | {Event Title} \| Happenlist |
| Venue Detail | {Venue Name} - Events & Info \| Happenlist |
| Organizer Detail | {Organizer Name} - Upcoming Events \| Happenlist |

---

## Structured Data (Schema.org)

### Event Schema

**File:** `src/components/seo/event-json-ld.tsx`

```typescript
import type { EventWithDetails } from '@/types';

interface EventJsonLdProps {
  event: EventWithDetails;
}

export function EventJsonLd({ event }: EventJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description,
    startDate: event.start_datetime,
    endDate: event.end_datetime || undefined,
    eventStatus: getEventStatus(event.status),
    eventAttendanceMode: getAttendanceMode(event.location?.venue_type),
    
    // Location
    location: event.location ? {
      '@type': event.location.venue_type === 'online' ? 'VirtualLocation' : 'Place',
      name: event.location.name,
      ...(event.location.venue_type !== 'online' && {
        address: {
          '@type': 'PostalAddress',
          streetAddress: event.location.address_line,
          addressLocality: event.location.city,
          addressRegion: event.location.state,
          postalCode: event.location.postal_code,
          addressCountry: 'US',
        },
        geo: event.location.latitude ? {
          '@type': 'GeoCoordinates',
          latitude: event.location.latitude,
          longitude: event.location.longitude,
        } : undefined,
      }),
      ...(event.location.venue_type === 'online' && {
        url: event.ticket_url,
      }),
    } : undefined,
    
    // Images
    image: event.image_url ? [event.image_url] : undefined,
    
    // Pricing
    offers: buildOffers(event),
    
    // Organizer
    organizer: event.organizer ? {
      '@type': 'Organization',
      name: event.organizer.name,
      url: `${baseUrl}/organizer/${event.organizer.slug}`,
      logo: event.organizer.logo_url || undefined,
    } : undefined,
    
    // URL
    url: `${baseUrl}/event/${event.slug}-${event.instance_date}`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

function getEventStatus(status: string): string {
  switch (status) {
    case 'cancelled': return 'https://schema.org/EventCancelled';
    case 'postponed': return 'https://schema.org/EventPostponed';
    default: return 'https://schema.org/EventScheduled';
  }
}

function getAttendanceMode(venueType?: string): string {
  if (venueType === 'online') {
    return 'https://schema.org/OnlineEventAttendanceMode';
  }
  return 'https://schema.org/OfflineEventAttendanceMode';
}

function buildOffers(event: EventWithDetails) {
  if (event.is_free) {
    return {
      '@type': 'Offer',
      price: 0,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: event.ticket_url,
    };
  }

  if (event.price_type === 'range' && event.price_low && event.price_high) {
    return {
      '@type': 'AggregateOffer',
      lowPrice: event.price_low,
      highPrice: event.price_high,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: event.ticket_url,
      ...(event.on_sale_date && { validFrom: event.on_sale_date }),
    };
  }

  if (event.price_low) {
    return {
      '@type': 'Offer',
      price: event.price_low,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: event.ticket_url,
      ...(event.on_sale_date && { validFrom: event.on_sale_date }),
    };
  }

  return undefined;
}
```

### Venue Schema

**File:** `src/components/seo/venue-json-ld.tsx`

```typescript
import type { Venue } from '@/types';

interface VenueJsonLdProps {
  venue: Venue;
}

export function VenueJsonLd({ venue }: VenueJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: venue.name,
    description: venue.description,
    url: `${baseUrl}/venue/${venue.slug}`,
    image: venue.image_url,
    address: {
      '@type': 'PostalAddress',
      streetAddress: venue.address_line,
      addressLocality: venue.city,
      addressRegion: venue.state,
      postalCode: venue.postal_code,
      addressCountry: 'US',
    },
    geo: venue.latitude ? {
      '@type': 'GeoCoordinates',
      latitude: venue.latitude,
      longitude: venue.longitude,
    } : undefined,
    telephone: venue.phone,
    sameAs: venue.website_url,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

### Organizer Schema

**File:** `src/components/seo/organization-json-ld.tsx`

```typescript
import type { Organizer } from '@/types';

interface OrganizationJsonLdProps {
  organizer: Organizer;
}

export function OrganizationJsonLd({ organizer }: OrganizationJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: organizer.name,
    description: organizer.description,
    url: `${baseUrl}/organizer/${organizer.slug}`,
    logo: organizer.logo_url,
    sameAs: [
      organizer.website_url,
      organizer.social_links?.facebook,
      organizer.social_links?.instagram,
      organizer.social_links?.twitter,
    ].filter(Boolean),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

### Breadcrumbs Schema

**File:** `src/components/seo/breadcrumbs-json-ld.tsx`

```typescript
interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbsJsonLdProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbsJsonLd({ items }: BreadcrumbsJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

---

## Sitemap

**File:** `src/app/sitemap.ts`

```typescript
import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const supabase = await createClient();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/events/today`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/events/this-weekend`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/venues`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/organizers`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Categories
  const { data: categories } = await supabase
    .from('categories')
    .select('slug, updated_at')
    .eq('is_active', true);

  const categoryPages: MetadataRoute.Sitemap = (categories || []).map((cat) => ({
    url: `${baseUrl}/events/${cat.slug}`,
    lastModified: new Date(cat.updated_at),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // Events (published, future)
  const { data: events } = await supabase
    .from('events')
    .select('slug, instance_date, updated_at')
    .eq('status', 'published')
    .gte('instance_date', new Date().toISOString().split('T')[0])
    .order('instance_date', { ascending: true })
    .limit(1000);

  const eventPages: MetadataRoute.Sitemap = (events || []).map((event) => ({
    url: `${baseUrl}/event/${event.slug}-${event.instance_date}`,
    lastModified: new Date(event.updated_at),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // Venues
  const { data: venues } = await supabase
    .from('locations')
    .select('slug, updated_at')
    .eq('is_active', true);

  const venuePages: MetadataRoute.Sitemap = (venues || []).map((venue) => ({
    url: `${baseUrl}/venue/${venue.slug}`,
    lastModified: new Date(venue.updated_at),
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  // Organizers
  const { data: organizers } = await supabase
    .from('organizers')
    .select('slug, updated_at')
    .eq('is_active', true);

  const organizerPages: MetadataRoute.Sitemap = (organizers || []).map((org) => ({
    url: `${baseUrl}/organizer/${org.slug}`,
    lastModified: new Date(org.updated_at),
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [
    ...staticPages,
    ...categoryPages,
    ...eventPages,
    ...venuePages,
    ...organizerPages,
  ];
}
```

---

## Robots.txt

**File:** `src/app/robots.ts`

```typescript
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/my/',
          '/dashboard/',
          '/login',
          '/signup',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

---

## Canonical URLs

Prevent duplicate content by setting canonical URLs:

```typescript
// In generateMetadata
export async function generateMetadata({ params, searchParams }): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  
  // Strip query params for canonical (or keep essential ones)
  const canonicalUrl = `${baseUrl}/events/${params.categorySlug}`;

  return {
    // ...other metadata
    alternates: {
      canonical: canonicalUrl,
    },
  };
}
```

---

## Internal Linking Strategy

### Event Pages Should Link To:
- Venue page
- Organizer page
- Category page
- Related events (same category)
- Other events at same venue
- Other events by same organizer

### Venue Pages Should Link To:
- All upcoming events at venue
- Organizers who have events there

### Organizer Pages Should Link To:
- All upcoming events by organizer
- Venues where they have events

### Category Pages Should Link To:
- All events in category
- Sub-filters (this weekend, free, etc.)

---

## Performance Considerations

1. **Static Generation** - Generate static pages where possible
2. **Incremental Static Regeneration** - Use ISR for event pages
3. **Image Optimization** - Use Next.js Image component
4. **Core Web Vitals** - Monitor LCP, FID, CLS

```typescript
// Example: ISR for event pages
export const revalidate = 3600; // Revalidate every hour

// Or dynamic rendering with cache
export const dynamic = 'force-dynamic';
```
