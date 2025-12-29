# Happenlist: Code Patterns

## Overview

This document contains reusable code patterns and snippets for common tasks. Copy and adapt these patterns when building features.

---

## Component Patterns

### Basic Server Component

```typescript
// src/components/events/event-card.tsx
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EventPrice } from './event-price';
import { formatEventDate } from '@/lib/utils/dates';
import { buildEventUrl } from '@/lib/utils/url';
import type { EventCard as EventCardType } from '@/types';

interface EventCardProps {
  event: EventCardType;
  showCategory?: boolean;
}

export function EventCard({ event, showCategory = true }: EventCardProps) {
  return (
    <Card hover className="overflow-hidden">
      <Link href={buildEventUrl(event)} className="block">
        {/* Image */}
        <div className="relative aspect-video">
          {event.thumbnail_url || event.image_url ? (
            <Image
              src={event.thumbnail_url || event.image_url!}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full bg-sand" />
          )}
          
          {showCategory && event.category_name && (
            <Badge variant="category" className="absolute bottom-3 left-3">
              {event.category_name}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-body-sm text-stone mb-1">
            {formatEventDate(event.start_datetime, { format: 'short' })}
          </p>
          
          <h3 className="font-display text-h3 text-charcoal mb-1 line-clamp-2">
            {event.title}
          </h3>
          
          {event.location_name && (
            <p className="text-body-sm text-stone mb-2">
              {event.location_name}
            </p>
          )}
          
          <EventPrice event={event} size="sm" />
        </div>
      </Link>
    </Card>
  );
}
```

### Client Component with State

```typescript
// src/components/search/search-bar.tsx
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

export function SearchBar({ placeholder = 'Search...', className }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }, [query, router]);

  const handleClear = useCallback(() => {
    setQuery('');
  }, []);

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className={cn(
        'flex items-center gap-3 h-12 px-4',
        'rounded-full bg-warm-white border border-sand',
        'focus-within:border-coral focus-within:ring-2 focus-within:ring-coral-light',
        'transition-all'
      )}>
        <Search className="w-5 h-5 text-stone flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-charcoal placeholder:text-stone"
        />
        {query && (
          <button type="button" onClick={handleClear}>
            <X className="w-5 h-5 text-stone hover:text-charcoal" />
          </button>
        )}
      </div>
    </form>
  );
}
```

### Component with Loading State

```typescript
// src/components/events/event-grid.tsx
import { EventCard } from './event-card';
import { EventCardSkeleton } from './event-card-skeleton';
import type { EventCard as EventCardType } from '@/types';

interface EventGridProps {
  events: EventCardType[];
  loading?: boolean;
  skeletonCount?: number;
  emptyMessage?: string;
}

export function EventGrid({ 
  events, 
  loading = false, 
  skeletonCount = 8,
  emptyMessage = 'No events found' 
}: EventGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-stone">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
```

---

## Page Patterns

### Basic Page with Data Fetching

```typescript
// src/app/events/page.tsx
import { Suspense } from 'react';
import { Container } from '@/components/layout/container';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { EventGrid } from '@/components/events';
import { EventGridSkeleton } from '@/components/events/event-grid-skeleton';
import { getEvents } from '@/data/events';
import { getCategories } from '@/data/categories';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events',
  description: 'Browse upcoming events in your area.',
};

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function EventsPage({ searchParams }: PageProps) {
  const category = typeof searchParams.category === 'string' 
    ? searchParams.category 
    : undefined;

  const [{ events, total }, categories] = await Promise.all([
    getEvents({ categorySlug: category, limit: 24 }),
    getCategories(),
  ]);

  return (
    <Container className="py-8">
      <Breadcrumbs 
        items={[
          { label: 'Home', href: '/' },
          { label: 'Events' },
        ]} 
      />

      <h1 className="font-display text-h1 text-charcoal mt-6 mb-8">
        Events
      </h1>

      <div className="flex gap-8">
        {/* Filters sidebar would go here */}
        
        <div className="flex-1">
          <p className="text-body-sm text-stone mb-4">
            {total} events found
          </p>
          
          <Suspense fallback={<EventGridSkeleton />}>
            <EventGrid events={events} />
          </Suspense>
        </div>
      </div>
    </Container>
  );
}
```

### Dynamic Route Page

```typescript
// src/app/event/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { Container } from '@/components/layout/container';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { EventHero } from '@/components/events/event-hero';
import { EventDetails } from '@/components/events/event-details';
import { RelatedEvents } from '@/components/events/related-events';
import { EventJsonLd } from '@/components/seo/event-json-ld';
import { getEvent, getRelatedEvents } from '@/data/events';
import type { Metadata } from 'next';

interface PageProps {
  params: { slug: string };
}

// Parse slug format: "event-name-2025-02-14"
function parseEventSlug(fullSlug: string) {
  const dateMatch = fullSlug.match(/-(\d{4}-\d{2}-\d{2})$/);
  if (!dateMatch) return null;
  
  const date = dateMatch[1];
  const slug = fullSlug.replace(`-${date}`, '');
  
  return { slug, date };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const parsed = parseEventSlug(params.slug);
  if (!parsed) return { title: 'Event Not Found' };

  const event = await getEvent({ slug: parsed.slug, instanceDate: parsed.date });
  if (!event) return { title: 'Event Not Found' };

  return {
    title: event.meta_title || event.title,
    description: event.meta_description || event.description?.slice(0, 155),
    openGraph: {
      title: event.title,
      description: event.description || undefined,
      images: event.image_url ? [event.image_url] : undefined,
    },
  };
}

export default async function EventPage({ params }: PageProps) {
  const parsed = parseEventSlug(params.slug);
  if (!parsed) notFound();

  const event = await getEvent({ slug: parsed.slug, instanceDate: parsed.date });
  if (!event) notFound();

  const relatedEvents = await getRelatedEvents({
    categoryId: event.category_id || undefined,
    excludeEventId: event.id,
    limit: 4,
  });

  return (
    <>
      <EventJsonLd event={event} />
      
      <Container className="py-8">
        <Breadcrumbs
          items={[
            { label: 'Events', href: '/events' },
            ...(event.category ? [{ 
              label: event.category.name, 
              href: `/events/${event.category.slug}` 
            }] : []),
            { label: event.title },
          ]}
        />

        <EventHero event={event} />
        <EventDetails event={event} />

        {relatedEvents.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-h2 text-charcoal mb-6">
              Similar Events
            </h2>
            <EventGrid events={relatedEvents} />
          </section>
        )}
      </Container>
    </>
  );
}
```

---

## Data Fetching Patterns

### Basic Query Function

```typescript
// src/data/events/get-events.ts
import { createClient } from '@/lib/supabase/server';
import type { EventCard, EventQueryParams } from '@/types';

export async function getEvents(params: EventQueryParams = {}): Promise<{
  events: EventCard[];
  total: number;
}> {
  const {
    search,
    categorySlug,
    dateRange,
    isFree,
    orderBy = 'date-asc',
    page = 1,
    limit = 24,
  } = params;

  const supabase = await createClient();
  const offset = (page - 1) * limit;

  // Build query
  let query = supabase
    .from('events')
    .select(`
      id, title, slug, start_datetime, instance_date,
      image_url, thumbnail_url, price_type, price_low, price_high,
      is_free, heart_count,
      category:categories(name, slug),
      location:locations(name, slug)
    `, { count: 'exact' })
    .eq('status', 'published')
    .gte('instance_date', new Date().toISOString().split('T')[0]);

  // Apply filters
  if (search) {
    query = query.textSearch('title', search);
  }

  if (categorySlug) {
    // Need to filter by joined table
    query = query.eq('category.slug', categorySlug);
  }

  if (dateRange?.start) {
    query = query.gte('instance_date', dateRange.start);
  }

  if (dateRange?.end) {
    query = query.lte('instance_date', dateRange.end);
  }

  if (isFree) {
    query = query.eq('is_free', true);
  }

  // Apply sorting
  const sortConfig = {
    'date-asc': { column: 'instance_date', ascending: true },
    'date-desc': { column: 'instance_date', ascending: false },
    'name-asc': { column: 'title', ascending: true },
    'popular': { column: 'heart_count', ascending: false },
  }[orderBy];

  query = query.order(sortConfig.column, { ascending: sortConfig.ascending });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }

  return {
    events: transformEvents(data || []),
    total: count || 0,
  };
}

function transformEvents(data: any[]): EventCard[] {
  return data.map(event => ({
    id: event.id,
    title: event.title,
    slug: event.slug,
    start_datetime: event.start_datetime,
    instance_date: event.instance_date,
    image_url: event.image_url,
    thumbnail_url: event.thumbnail_url,
    price_type: event.price_type,
    price_low: event.price_low,
    price_high: event.price_high,
    is_free: event.is_free,
    heart_count: event.heart_count,
    category_name: event.category?.name || null,
    category_slug: event.category?.slug || null,
    location_name: event.location?.name || null,
    location_slug: event.location?.slug || null,
  }));
}
```

### Single Record Query

```typescript
// src/data/events/get-event.ts
import { createClient } from '@/lib/supabase/server';
import type { EventWithDetails } from '@/types';

interface GetEventParams {
  slug: string;
  instanceDate: string;
}

export async function getEvent(params: GetEventParams): Promise<EventWithDetails | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      category:categories(id, name, slug, icon),
      location:locations(
        id, name, slug, city, address_line, state, 
        postal_code, latitude, longitude, website_url
      ),
      organizer:organizers(id, name, slug, logo_url, description, website_url)
    `)
    .eq('slug', params.slug)
    .eq('instance_date', params.instanceDate)
    .eq('status', 'published')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching event:', error);
    throw error;
  }

  return data as EventWithDetails;
}
```

---

## Hook Patterns

### Debounce Hook

```typescript
// src/hooks/use-debounce.ts
'use client';

import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

### Media Query Hook

```typescript
// src/hooks/use-media-query.ts
'use client';

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    
    setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// Usage
const isMobile = useMediaQuery('(max-width: 768px)');
```

### URL Filter State Hook

```typescript
// src/hooks/use-filters.ts
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export function useFilters<T extends Record<string, any>>() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => {
    const obj: Record<string, string | string[]> = {};
    searchParams.forEach((value, key) => {
      const existing = obj[key];
      if (existing) {
        obj[key] = Array.isArray(existing) 
          ? [...existing, value] 
          : [existing, value];
      } else {
        obj[key] = value;
      }
    });
    return obj as T;
  }, [searchParams]);

  const setFilters = useCallback((newFilters: Partial<T>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newFilters).forEach(([key, value]) => {
      params.delete(key);
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.set(key, String(value));
        }
      }
    });

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  return { filters, setFilters, clearFilters };
}
```

---

## Utility Patterns

### className Utility

```typescript
// src/lib/utils/cn.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Date Formatting

```typescript
// src/lib/utils/dates.ts
import { format, isToday, isTomorrow, parseISO } from 'date-fns';

export function formatEventDate(
  dateString: string,
  options: { format?: 'short' | 'long' | 'relative'; includeTime?: boolean } = {}
): string {
  const { format: fmt = 'short', includeTime = true } = options;
  const date = parseISO(dateString);

  if (fmt === 'relative') {
    if (isToday(date)) {
      return includeTime ? `Today at ${format(date, 'h:mm a')}` : 'Today';
    }
    if (isTomorrow(date)) {
      return includeTime ? `Tomorrow at ${format(date, 'h:mm a')}` : 'Tomorrow';
    }
  }

  const dateStr = fmt === 'long' 
    ? format(date, 'EEEE, MMMM d, yyyy')
    : format(date, 'MMM d');

  return includeTime ? `${dateStr} · ${format(date, 'h:mm a')}` : dateStr;
}
```

### Price Formatting

```typescript
// src/lib/utils/price.ts
interface PriceData {
  price_type: string;
  price_low: number | null;
  price_high: number | null;
  is_free: boolean;
}

export function formatPrice(data: PriceData): string {
  if (data.is_free || data.price_type === 'free') return 'Free';
  
  switch (data.price_type) {
    case 'fixed':
      return data.price_low ? `$${data.price_low}` : 'Free';
    case 'range':
      return `$${data.price_low}–$${data.price_high}`;
    case 'varies':
      return 'Prices vary';
    case 'donation':
      return 'Pay what you can';
    default:
      return data.price_low ? `$${data.price_low}` : '';
  }
}
```

---

## API Route Patterns

### GET with Search Params

```typescript
// src/app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getEvents } from '@/data/events';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const params = {
    search: searchParams.get('q') || undefined,
    categorySlug: searchParams.get('category') || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '24'),
  };

  try {
    const result = await getEvents(params);
    return NextResponse.json(result);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
```

### POST with Body

```typescript
// src/app/api/hearts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse body
  const body = await request.json();
  const { eventId } = body;
  
  if (!eventId) {
    return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
  }

  try {
    // Toggle heart logic here...
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Heart error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

---

## Error Handling Pattern

```typescript
// Consistent error handling in data functions
export async function getEvent(params: GetEventParams): Promise<EventWithDetails | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('slug', params.slug)
      .single();

    if (error) {
      // Not found is expected, return null
      if (error.code === 'PGRST116') return null;
      
      // Log unexpected errors
      console.error('[getEvent] Database error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    // Re-throw to let page handle it
    console.error('[getEvent] Unexpected error:', error);
    throw error;
  }
}
```
