# SEO Specification

## Overview

Events have unique SEO requirements: they're time-sensitive, location-based, and benefit heavily from structured data. This spec covers technical SEO, Schema.org markup, and strategies for maximizing organic discovery.

---

## URL Structure

### Clean, Descriptive URLs

| Page | URL Pattern | Example |
|------|-------------|---------|
| Home | `/` | `/` |
| Event listing | `/events` | `/events` |
| Event detail | `/events/[slug]` | `/events/summer-fest-2025` |
| Category | `/events/category/[slug]` | `/events/category/music` |
| Venue | `/venues/[slug]` | `/venues/fiserv-forum` |
| Organizer | `/organizers/[slug]` | `/organizers/milwaukee-film` |

### Slug Generation Rules

```typescript
// lib/utils/slugify.ts

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')     // Remove special chars
    .replace(/\s+/g, '-')          // Spaces to hyphens
    .replace(/-+/g, '-')           // Collapse multiple hyphens
    .substring(0, 100)             // Limit length
}

// For events, optionally include date for uniqueness
export function eventSlug(title: string, startDate: Date): string {
  const base = slugify(title)
  const dateStr = format(startDate, 'MMM-yyyy').toLowerCase()
  return `${base}-${dateStr}`  // "summer-fest-jan-2025"
}
```

### URL Best Practices

- Keep slugs under 60 characters when possible
- Use hyphens, not underscores
- Lowercase only
- Include primary keyword (event name)
- Avoid dates in URLs unless needed for uniqueness (they age poorly)
- No query parameters for canonical content

---

## Meta Tags

### Base Layout Meta

```typescript
// app/layout.tsx

import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://happenlist.com'),
  title: {
    default: 'Happenlist | Milwaukee Events & Things to Do',
    template: '%s | Happenlist',
  },
  description: 'Discover the best events in Milwaukee. Concerts, festivals, family activities, food & drink, and more. Your curated guide to what\'s happening in MKE.',
  keywords: ['Milwaukee events', 'things to do Milwaukee', 'Milwaukee concerts', 'Milwaukee festivals', 'MKE events'],
  authors: [{ name: 'Happenlist' }],
  creator: 'Happenlist',
  publisher: 'Happenlist',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://happenlist.com',
    siteName: 'Happenlist',
    title: 'Happenlist | Milwaukee Events & Things to Do',
    description: 'Discover the best events in Milwaukee.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Happenlist - Milwaukee Events',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Happenlist | Milwaukee Events',
    description: 'Discover the best events in Milwaukee.',
    images: ['/og-image.jpg'],
    creator: '@happenlist',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}
```

### Event Detail Page Meta

```typescript
// app/(public)/events/[slug]/page.tsx

import type { Metadata } from 'next'
import { getEventBySlug } from '@/lib/queries/events'
import { formatEventDate } from '@/lib/utils/dates'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getEventBySlug(params.slug)
  
  if (!event) {
    return {
      title: 'Event Not Found',
    }
  }
  
  const formattedDate = formatEventDate(event.start_at, 'full')
  const venue = event.venue?.name || 'Milwaukee'
  
  // Build rich description
  const description = event.description
    ? `${event.description.substring(0, 150)}...`
    : `${event.title} on ${formattedDate} at ${venue}. Find tickets, times, and more on Happenlist.`
  
  // Title format: "Event Name - Date | Happenlist"
  const title = `${event.title} - ${formatEventDate(event.start_at, 'short')}`
  
  return {
    title,
    description,
    keywords: [
      event.title,
      event.category?.name,
      event.venue?.name,
      'Milwaukee events',
      formatEventDate(event.start_at, 'month-year'),
    ].filter(Boolean),
    openGraph: {
      type: 'website', // Use 'article' for blog posts
      title: event.title,
      description,
      url: `https://happenlist.com/events/${event.slug}`,
      images: event.image_url
        ? [
            {
              url: event.image_url,
              width: 800,
              height: 600,
              alt: event.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description,
      images: event.image_url ? [event.image_url] : undefined,
    },
    alternates: {
      canonical: `https://happenlist.com/events/${event.slug}`,
    },
  }
}
```

### Category Page Meta

```typescript
// app/(public)/events/category/[slug]/page.tsx

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug)
  
  if (!category) {
    return { title: 'Category Not Found' }
  }
  
  return {
    title: `${category.name} Events in Milwaukee`,
    description: `Discover ${category.name.toLowerCase()} events in Milwaukee. Find upcoming concerts, shows, and activities curated by Happenlist.`,
    alternates: {
      canonical: `https://happenlist.com/events/category/${category.slug}`,
    },
  }
}
```

### Venue Page Meta

```typescript
// app/(public)/venues/[slug]/page.tsx

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const venue = await getVenueBySlug(params.slug)
  
  if (!venue) {
    return { title: 'Venue Not Found' }
  }
  
  const address = [venue.address, venue.city, venue.state].filter(Boolean).join(', ')
  
  return {
    title: `Events at ${venue.name}`,
    description: `Upcoming events at ${venue.name} in ${venue.city}. ${address}. Find tickets and event details on Happenlist.`,
    alternates: {
      canonical: `https://happenlist.com/venues/${venue.slug}`,
    },
  }
}
```

---

## Structured Data (Schema.org)

### Event Schema

This is critical for Google's event rich results.

```typescript
// lib/utils/structured-data.ts

import type { EventWithRelations } from '@/types'

export function generateEventSchema(event: EventWithRelations) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description,
    startDate: event.start_at, // ISO 8601 format
    endDate: event.end_at || undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    
    // Images (Google prefers multiple sizes)
    image: [
      event.image_url,
      event.flyer_url,
    ].filter(Boolean),
    
    // Location
    location: event.venue ? {
      '@type': 'Place',
      name: event.venue.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: event.venue.address,
        addressLocality: event.venue.city,
        addressRegion: event.venue.state,
        postalCode: event.venue.zip,
        addressCountry: 'US',
      },
      geo: event.venue.lat && event.venue.lng ? {
        '@type': 'GeoCoordinates',
        latitude: event.venue.lat,
        longitude: event.venue.lng,
      } : undefined,
    } : undefined,
    
    // Organizer
    organizer: event.organizer ? {
      '@type': 'Organization',
      name: event.organizer.name,
      url: event.organizer.website,
    } : undefined,
    
    // Offers (tickets/pricing)
    offers: generateOfferSchema(event),
    
    // Performer (if applicable, for concerts)
    // performer: { '@type': 'PerformingGroup', name: '...' },
  }
  
  return schema
}

function generateOfferSchema(event: EventWithRelations) {
  if (event.is_free) {
    return {
      '@type': 'Offer',
      price: 0,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: event.ticket_url || `https://happenlist.com/events/${event.slug}`,
    }
  }
  
  if (event.price_min || event.price_max) {
    return {
      '@type': 'AggregateOffer',
      lowPrice: event.price_min || event.price_max,
      highPrice: event.price_max || event.price_min,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: event.ticket_url || `https://happenlist.com/events/${event.slug}`,
    }
  }
  
  return undefined
}

// For cancelled events
export function generateCancelledEventSchema(event: EventWithRelations) {
  return {
    ...generateEventSchema(event),
    eventStatus: 'https://schema.org/EventCancelled',
  }
}

// For postponed events
export function generatePostponedEventSchema(event: EventWithRelations) {
  return {
    ...generateEventSchema(event),
    eventStatus: 'https://schema.org/EventPostponed',
  }
}
```

### Injecting Schema into Pages

```typescript
// app/(public)/events/[slug]/page.tsx

import { generateEventSchema } from '@/lib/utils/structured-data'

export default async function EventPage({ params }: Props) {
  const event = await getEventBySlug(params.slug)
  
  if (!event) {
    notFound()
  }
  
  const eventSchema = generateEventSchema(event)
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
      />
      <EventDetail event={event} />
    </>
  )
}
```

### Organization Schema (Site-wide)

```typescript
// app/layout.tsx

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Happenlist',
  url: 'https://happenlist.com',
  logo: 'https://happenlist.com/logo.png',
  sameAs: [
    'https://twitter.com/happenlist',
    'https://instagram.com/happenlist',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'hello@happenlist.com',
    contactType: 'customer service',
  },
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Happenlist',
  url: 'https://happenlist.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://happenlist.com/events?search={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationSchema, websiteSchema]),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### BreadcrumbList Schema

```typescript
// components/shared/breadcrumbs.tsx

interface BreadcrumbItem {
  name: string
  url: string
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-text-secondary">
        {items.map((item, index) => (
          <span key={item.url}>
            {index > 0 && <span className="mx-2">/</span>}
            {index === items.length - 1 ? (
              <span>{item.name}</span>
            ) : (
              <Link href={item.url} className="hover:underline">
                {item.name}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </>
  )
}
```

---

## Sitemap

### Dynamic Sitemap Generation

```typescript
// app/sitemap.ts

import { MetadataRoute } from 'next'
import { createServerClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServerClient()
  const baseUrl = 'https://happenlist.com'
  
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
      changeFrequency: 'hourly',
      priority: 0.9,
    },
  ]
  
  // Categories
  const { data: categories } = await supabase
    .from('categories')
    .select('slug, updated_at')
  
  const categoryPages: MetadataRoute.Sitemap = (categories || []).map((cat) => ({
    url: `${baseUrl}/events/category/${cat.slug}`,
    lastModified: new Date(cat.updated_at),
    changeFrequency: 'daily',
    priority: 0.8,
  }))
  
  // Published events (only upcoming + recent past)
  const { data: events } = await supabase
    .from('events')
    .select('slug, updated_at, start_at')
    .eq('status', 'published')
    .gte('start_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
    .order('start_at', { ascending: true })
    .limit(1000)
  
  const eventPages: MetadataRoute.Sitemap = (events || []).map((event) => ({
    url: `${baseUrl}/events/${event.slug}`,
    lastModified: new Date(event.updated_at),
    changeFrequency: 'weekly',
    priority: isUpcoming(event.start_at) ? 0.8 : 0.5,
  }))
  
  // Venues
  const { data: venues } = await supabase
    .from('venues')
    .select('slug, updated_at')
  
  const venuePages: MetadataRoute.Sitemap = (venues || []).map((venue) => ({
    url: `${baseUrl}/venues/${venue.slug}`,
    lastModified: new Date(venue.updated_at),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))
  
  // Organizers
  const { data: organizers } = await supabase
    .from('organizers')
    .select('slug, updated_at')
  
  const organizerPages: MetadataRoute.Sitemap = (organizers || []).map((org) => ({
    url: `${baseUrl}/organizers/${org.slug}`,
    lastModified: new Date(org.updated_at),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))
  
  return [
    ...staticPages,
    ...categoryPages,
    ...eventPages,
    ...venuePages,
    ...organizerPages,
  ]
}

function isUpcoming(startAt: string): boolean {
  return new Date(startAt) > new Date()
}
```

### Sitemap Index (for large sites)

If you exceed 50,000 URLs, split into multiple sitemaps:

```typescript
// app/sitemap/[id]/route.ts

// Generates: /sitemap/0.xml, /sitemap/1.xml, etc.
```

---

## Robots.txt

```typescript
// app/robots.ts

import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/login',
          '/*.json$',
        ],
      },
    ],
    sitemap: 'https://happenlist.com/sitemap.xml',
  }
}
```

---

## Date Handling for SEO

### Event Freshness Signals

Google prioritizes upcoming events. Handle dates strategically:

```typescript
// lib/utils/dates.ts

import { format, formatDistanceToNow, isPast, isToday, isTomorrow, isThisWeek } from 'date-fns'
import { toZonedTime, format as formatTz } from 'date-fns-tz'

const TIMEZONE = 'America/Chicago'

/**
 * Format for display - human-friendly
 */
export function formatEventDate(dateStr: string, style: 'full' | 'short' | 'month-year' = 'full'): string {
  const date = toZonedTime(new Date(dateStr), TIMEZONE)
  
  switch (style) {
    case 'full':
      return format(date, 'EEEE, MMMM d, yyyy') // "Saturday, January 15, 2025"
    case 'short':
      return format(date, 'MMM d') // "Jan 15"
    case 'month-year':
      return format(date, 'MMMM yyyy') // "January 2025"
  }
}

/**
 * Relative date for UI ("Tomorrow", "This Saturday", etc.)
 */
export function formatRelativeDate(dateStr: string): string {
  const date = toZonedTime(new Date(dateStr), TIMEZONE)
  
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  if (isThisWeek(date)) return format(date, 'EEEE') // "Saturday"
  
  return format(date, 'MMM d') // "Jan 15"
}

/**
 * Time formatting
 */
export function formatEventTime(dateStr: string): string {
  const date = toZonedTime(new Date(dateStr), TIMEZONE)
  return format(date, 'h:mm a') // "7:00 PM"
}

/**
 * ISO format for Schema.org (required format)
 */
export function toISOWithTimezone(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toISOString()
}

/**
 * Check if event is in the past
 */
export function isEventPast(dateStr: string): boolean {
  return isPast(new Date(dateStr))
}
```

### Past Event Handling

Don't delete past events—they have SEO value:

1. **Keep indexed** for 30-90 days after
2. **Add "Past Event" indicator** in UI
3. **noindex after 90 days** (optional)
4. **Show related upcoming events**

```typescript
// app/(public)/events/[slug]/page.tsx

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getEventBySlug(params.slug)
  
  if (!event) {
    return { title: 'Event Not Found' }
  }
  
  const isPast = isEventPast(event.start_at)
  const daysSinceEvent = differenceInDays(new Date(), new Date(event.start_at))
  
  // Noindex events older than 90 days
  const shouldNoindex = isPast && daysSinceEvent > 90
  
  return {
    title: `${event.title} - ${formatEventDate(event.start_at, 'short')}`,
    robots: shouldNoindex ? { index: false, follow: true } : undefined,
    // ... rest of metadata
  }
}
```

### Event Status in Title (When Relevant)

```typescript
function getEventTitle(event: EventWithRelations): string {
  const baseTitle = `${event.title} - ${formatEventDate(event.start_at, 'short')}`
  
  if (event.status === 'cancelled') {
    return `[CANCELLED] ${baseTitle}`
  }
  
  return baseTitle
}
```

---

## Open Graph Images

### Dynamic OG Images (Optional Enhancement)

Use Next.js OG image generation for social sharing:

```typescript
// app/(public)/events/[slug]/opengraph-image.tsx

import { ImageResponse } from 'next/og'
import { getEventBySlug } from '@/lib/queries/events'
import { formatEventDate } from '@/lib/utils/dates'

export const runtime = 'edge'
export const alt = 'Event details'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { slug: string } }) {
  const event = await getEventBySlug(params.slug)
  
  if (!event) {
    return new ImageResponse(
      <div style={{ display: 'flex', fontSize: 48 }}>Event not found</div>,
      { ...size }
    )
  }
  
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          width: '100%',
          height: '100%',
          backgroundColor: '#f9f6f1',
          padding: 60,
        }}
      >
        {/* Category badge */}
        <div
          style={{
            backgroundColor: event.category?.color || '#22c55e',
            color: 'white',
            padding: '8px 16px',
            borderRadius: 20,
            fontSize: 20,
            marginBottom: 20,
          }}
        >
          {event.category?.name || 'Event'}
        </div>
        
        {/* Event title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: '#282420',
            marginBottom: 20,
            lineHeight: 1.1,
          }}
        >
          {event.title}
        </div>
        
        {/* Date and venue */}
        <div style={{ fontSize: 32, color: '#666', display: 'flex', gap: 20 }}>
          <span>{formatEventDate(event.start_at, 'full')}</span>
          {event.venue && <span>• {event.venue.name}</span>}
        </div>
        
        {/* Happenlist branding */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            right: 60,
            fontSize: 24,
            color: '#22c55e',
          }}
        >
          happenlist.com
        </div>
      </div>
    ),
    { ...size }
  )
}
```

---

## Performance & Core Web Vitals

Google uses Core Web Vitals as ranking signals:

### LCP (Largest Contentful Paint)

```typescript
// Optimize hero images
<Image
  src={event.image_url}
  alt={event.title}
  width={800}
  height={600}
  priority  // Preload above-fold images
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

### CLS (Cumulative Layout Shift)

```typescript
// Always specify dimensions for images
<div className="relative aspect-[4/3]">
  <Image fill ... />
</div>

// Reserve space for dynamic content
<div className="min-h-[200px]">
  {isLoading ? <Skeleton /> : <Content />}
</div>
```

### FID/INP (Interaction to Next Paint)

```typescript
// Use Server Components by default
// Minimize client-side JS
// Lazy load non-critical components
import dynamic from 'next/dynamic'

const ShareButton = dynamic(() => import('./share-button'), {
  loading: () => <Skeleton className="w-10 h-10" />,
})
```

---

## Canonical URLs

Prevent duplicate content issues:

```typescript
// Always set canonical on filterable pages
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  // Canonical should be the base URL without filters
  return {
    alternates: {
      canonical: 'https://happenlist.com/events',
    },
  }
}

// For paginated content, each page gets its own canonical
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = searchParams.page || '1'
  
  return {
    alternates: {
      canonical: page === '1' 
        ? 'https://happenlist.com/events'
        : `https://happenlist.com/events?page=${page}`,
    },
  }
}
```

---

## Internal Linking Strategy

### Contextual Links

```typescript
// Event detail page
<section>
  <h2>More from {event.organizer.name}</h2>
  <EventList events={organizerEvents} />
  <Link href={`/organizers/${event.organizer.slug}`}>
    View all events by {event.organizer.name}
  </Link>
</section>

<section>
  <h2>More at {event.venue.name}</h2>
  <EventList events={venueEvents} />
  <Link href={`/venues/${event.venue.slug}`}>
    View all events at {event.venue.name}
  </Link>
</section>

<section>
  <h2>More {event.category.name} Events</h2>
  <EventList events={categoryEvents} />
  <Link href={`/events/category/${event.category.slug}`}>
    Browse all {event.category.name} events
  </Link>
</section>
```

### Footer Links

```typescript
// Include category links for crawlability
<footer>
  <nav aria-label="Categories">
    <h3>Browse by Category</h3>
    <ul>
      {categories.map(cat => (
        <li key={cat.id}>
          <Link href={`/events/category/${cat.slug}`}>{cat.name}</Link>
        </li>
      ))}
    </ul>
  </nav>
</footer>
```

---

## Analytics & Search Console

### Setup Checklist

1. **Google Search Console**
   - Verify ownership
   - Submit sitemap
   - Monitor indexing status
   - Check for crawl errors

2. **Google Analytics 4** or **Plausible**
   - Track page views
   - Monitor top events
   - Analyze search queries

3. **Rich Results Testing**
   - Test event pages with Google's Rich Results Test
   - Validate Schema.org markup

### Tracking Event Views

```typescript
// For future conversion tracking
export function trackEventView(event: EventWithRelations) {
  // Analytics event
  gtag('event', 'view_event', {
    event_id: event.id,
    event_name: event.title,
    event_category: event.category?.name,
    event_date: event.start_at,
    is_free: event.is_free,
  })
}

export function trackTicketClick(event: EventWithRelations) {
  gtag('event', 'click_ticket', {
    event_id: event.id,
    event_name: event.title,
    ticket_url: event.ticket_url,
  })
}
```

---

## SEO Checklist

### Per-Page Requirements

- [ ] Unique, descriptive `<title>` (50-60 chars)
- [ ] Unique `<meta description>` (150-160 chars)
- [ ] Canonical URL set
- [ ] Open Graph tags (title, description, image)
- [ ] Twitter Card tags
- [ ] Structured data (Schema.org)
- [ ] Semantic HTML (`<main>`, `<article>`, `<nav>`, etc.)
- [ ] Proper heading hierarchy (single `<h1>`)
- [ ] Alt text on all images
- [ ] Internal links to related content

### Technical Requirements

- [ ] Mobile-friendly (responsive)
- [ ] Fast loading (< 3s LCP)
- [ ] No layout shifts (CLS < 0.1)
- [ ] Valid HTML
- [ ] HTTPS everywhere
- [ ] XML sitemap submitted
- [ ] robots.txt configured
- [ ] 404 page exists
- [ ] Redirects for changed URLs
