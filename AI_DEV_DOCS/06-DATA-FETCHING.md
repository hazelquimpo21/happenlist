# Happenlist: Data Fetching & API

## Overview

This document defines data fetching patterns, API routes, and query functions for the application.

---

## Data Fetching Philosophy

1. **Server Components First** - Fetch data in Server Components where possible
2. **Colocation** - Keep data fetching logic in dedicated `/data` modules
3. **Type Safety** - Full TypeScript types for all queries and responses
4. **Caching** - Leverage Next.js caching and Supabase query patterns
5. **Error Handling** - Consistent error handling across all queries

---

## Supabase Client Setup

### Server Client

**File:** `src/lib/supabase/server.ts`

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore - called from Server Component
          }
        },
      },
    }
  );
}
```

### Browser Client

**File:** `src/lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

---

## Type Definitions

**File:** `src/types/event.ts`

```typescript
import type { Database } from '@/lib/supabase/types';

// Base types from database
type EventRow = Database['public']['Tables']['events']['Row'];
type LocationRow = Database['public']['Tables']['locations']['Row'];
type OrganizerRow = Database['public']['Tables']['organizers']['Row'];
type CategoryRow = Database['public']['Tables']['categories']['Row'];

// Event with joined relations
// Note: EventRow includes all event fields from the database including:
// - description, short_description, happenlist_summary, organizer_description
// - price_details (for detailed pricing info)
// - image_url, flyer_url (both Supabase hosted)
export interface EventWithDetails extends EventRow {
  category: Pick<CategoryRow, 'id' | 'name' | 'slug' | 'icon'> | null;
  location: Pick<LocationRow, 'id' | 'name' | 'slug' | 'city' | 'address_line' | 'latitude' | 'longitude'> | null;
  organizer: Pick<OrganizerRow, 'id' | 'name' | 'slug' | 'logo_url'> | null;
}

// Simplified event for cards/lists
export interface EventCard {
  id: string;
  title: string;
  slug: string;
  start_datetime: string;
  instance_date: string;
  image_url: string | null;
  thumbnail_url: string | null;
  price_type: string;
  price_low: number | null;
  price_high: number | null;
  is_free: boolean;
  heart_count: number;
  category_name: string | null;
  category_slug: string | null;
  location_name: string | null;
  location_slug: string | null;
}
```

**File:** `src/types/filters.ts`

```typescript
export interface EventFilters {
  search?: string;
  categorySlug?: string;
  categoryIds?: string[];
  dateRange?: {
    start: string;  // YYYY-MM-DD
    end?: string;   // YYYY-MM-DD
  };
  isFree?: boolean;
  priceRange?: {
    min?: number;
    max?: number;
  };
  venueTypes?: string[];
  organizerId?: string;
  locationId?: string;
  excludeEventId?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export type SortOption = 'date-asc' | 'date-desc' | 'name-asc' | 'popular';

export interface EventQueryParams extends EventFilters, PaginationParams {
  orderBy?: SortOption;
}
```

---

## Data Functions

### Events

**File:** `src/data/events/get-events.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import type { EventQueryParams, EventCard } from '@/types';

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
    excludeEventId,
  } = params;

  const supabase = await createClient();
  const offset = (page - 1) * limit;

  let query = supabase
    .from('events')
    .select(`
      id,
      title,
      slug,
      start_datetime,
      instance_date,
      image_url,
      thumbnail_url,
      price_type,
      price_low,
      price_high,
      is_free,
      heart_count,
      category:categories(name, slug),
      location:locations(name, slug)
    `, { count: 'exact' })
    .eq('status', 'published')
    .gte('instance_date', new Date().toISOString().split('T')[0]);

  // Apply filters
  if (search) {
    query = query.textSearch('title', search, { type: 'websearch' });
  }

  if (categorySlug) {
    query = query.eq('categories.slug', categorySlug);
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

  if (excludeEventId) {
    query = query.neq('id', excludeEventId);
  }

  // Apply sorting
  switch (orderBy) {
    case 'date-asc':
      query = query.order('instance_date', { ascending: true })
                   .order('start_datetime', { ascending: true });
      break;
    case 'date-desc':
      query = query.order('instance_date', { ascending: false });
      break;
    case 'name-asc':
      query = query.order('title', { ascending: true });
      break;
    case 'popular':
      query = query.order('heart_count', { ascending: false });
      break;
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  // Transform to EventCard format
  const events: EventCard[] = (data || []).map(transformToEventCard);

  return {
    events,
    total: count || 0,
  };
}
```

**File:** `src/data/events/get-event.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import type { EventWithDetails } from '@/types';

interface GetEventParams {
  slug: string;
  instanceDate: string;  // YYYY-MM-DD
}

export async function getEvent(params: GetEventParams): Promise<EventWithDetails | null> {
  const { slug, instanceDate } = params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      category:categories(id, name, slug, icon),
      location:locations(id, name, slug, city, address_line, address_line_2, state, postal_code, latitude, longitude, website_url),
      organizer:organizers(id, name, slug, logo_url, description, website_url)
    `)
    .eq('slug', slug)
    .eq('instance_date', instanceDate)
    .eq('status', 'published')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return data as EventWithDetails;
}
```

**File:** `src/data/events/get-featured-events.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import type { EventCard } from '@/types';

export async function getFeaturedEvents(params: { limit?: number } = {}): Promise<EventCard[]> {
  const { limit = 6 } = params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select(`
      id, title, slug, start_datetime, instance_date,
      image_url, thumbnail_url, price_type, price_low, price_high,
      is_free, heart_count,
      category:categories(name, slug),
      location:locations(name, slug)
    `)
    .eq('status', 'published')
    .eq('is_featured', true)
    .gte('instance_date', new Date().toISOString().split('T')[0])
    .order('featured_order', { ascending: true })
    .limit(limit);

  if (error) throw error;

  return (data || []).map(transformToEventCard);
}
```

**File:** `src/data/events/get-related-events.ts`

```typescript
export async function getRelatedEvents(params: {
  categoryId?: string;
  locationId?: string;
  organizerId?: string;
  excludeEventId: string;
  limit?: number;
}): Promise<EventCard[]> {
  const { categoryId, locationId, organizerId, excludeEventId, limit = 4 } = params;
  const supabase = await createClient();

  let query = supabase
    .from('events')
    .select(`
      id, title, slug, start_datetime, instance_date,
      image_url, thumbnail_url, price_type, price_low, price_high,
      is_free, heart_count,
      category:categories(name, slug),
      location:locations(name, slug)
    `)
    .eq('status', 'published')
    .gte('instance_date', new Date().toISOString().split('T')[0])
    .neq('id', excludeEventId);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (locationId) {
    query = query.eq('location_id', locationId);
  }

  if (organizerId) {
    query = query.eq('organizer_id', organizerId);
  }

  query = query
    .order('instance_date', { ascending: true })
    .limit(limit);

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(transformToEventCard);
}
```

---

### Venues

**File:** `src/data/venues/get-venues.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import type { Venue } from '@/types';

interface GetVenuesParams {
  search?: string;
  orderBy?: 'name' | 'event_count';
  page?: number;
  limit?: number;
}

export async function getVenues(params: GetVenuesParams = {}): Promise<{
  venues: Venue[];
  total: number;
}> {
  const { search, orderBy = 'name', page = 1, limit = 24 } = params;
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  let query = supabase
    .from('locations')
    .select('*', { count: 'exact' })
    .eq('is_active', true);

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  if (orderBy === 'name') {
    query = query.order('name', { ascending: true });
  }
  // Note: event_count would require a view or computed column

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    venues: data || [],
    total: count || 0,
  };
}
```

**File:** `src/data/venues/get-venue.ts`

```typescript
export async function getVenue(params: { slug: string }): Promise<Venue | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}
```

**File:** `src/data/venues/get-venue-events.ts`

```typescript
export async function getVenueEvents(params: {
  venueId: string;
  excludeEventId?: string;
  limit?: number;
}): Promise<EventCard[]> {
  const { venueId, excludeEventId, limit = 12 } = params;
  
  return getEvents({
    locationId: venueId,
    excludeEventId,
    limit,
    orderBy: 'date-asc',
  }).then(r => r.events);
}
```

---

### Categories

**File:** `src/data/categories/get-categories.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import type { Category } from '@/types';

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return data || [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}
```

---

### Search

**File:** `src/data/search/search-all.ts`

```typescript
import { createClient } from '@/lib/supabase/server';

interface SearchResults {
  events: EventCard[];
  venues: Venue[];
  organizers: Organizer[];
}

export async function searchAll(query: string): Promise<SearchResults> {
  const supabase = await createClient();

  // Parallel searches
  const [eventsResult, venuesResult, organizersResult] = await Promise.all([
    supabase
      .from('events')
      .select(`
        id, title, slug, start_datetime, instance_date,
        image_url, thumbnail_url, price_type, price_low, price_high,
        is_free, heart_count,
        category:categories(name, slug),
        location:locations(name, slug)
      `)
      .eq('status', 'published')
      .gte('instance_date', new Date().toISOString().split('T')[0])
      .textSearch('title', query, { type: 'websearch' })
      .limit(12),

    supabase
      .from('locations')
      .select('*')
      .eq('is_active', true)
      .ilike('name', `%${query}%`)
      .limit(6),

    supabase
      .from('organizers')
      .select('*')
      .eq('is_active', true)
      .ilike('name', `%${query}%`)
      .limit(6),
  ]);

  return {
    events: (eventsResult.data || []).map(transformToEventCard),
    venues: venuesResult.data || [],
    organizers: organizersResult.data || [],
  };
}
```

---

### Hearts (Phase 4)

**File:** `src/data/hearts/toggle-heart.ts`

```typescript
import { createClient } from '@/lib/supabase/client';

export async function toggleHeart(eventId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if already hearted
  const { data: existing } = await supabase
    .from('hearts')
    .select('id')
    .eq('user_id', user.id)
    .eq('event_id', eventId)
    .single();

  if (existing) {
    // Remove heart
    await supabase
      .from('hearts')
      .delete()
      .eq('id', existing.id);
    return false;
  } else {
    // Add heart
    await supabase
      .from('hearts')
      .insert({ user_id: user.id, event_id: eventId });
    return true;
  }
}
```

**File:** `src/data/hearts/get-user-hearts.ts`

```typescript
export async function getUserHearts(): Promise<EventCard[]> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('hearts')
    .select(`
      event:events(
        id, title, slug, start_datetime, instance_date,
        image_url, thumbnail_url, price_type, price_low, price_high,
        is_free, heart_count,
        category:categories(name, slug),
        location:locations(name, slug)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || [])
    .map(h => h.event)
    .filter(Boolean)
    .map(transformToEventCard);
}

export async function isEventHearted(eventId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('hearts')
    .select('id')
    .eq('user_id', user.id)
    .eq('event_id', eventId)
    .single();

  return !!data;
}
```

---

## API Routes

### Search API

**File:** `src/app/api/search/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { searchAll } from '@/data/search';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({ events: [], venues: [], organizers: [] });
  }

  try {
    const results = await searchAll(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
```

### Hearts API (Phase 4)

**File:** `src/app/api/hearts/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { eventId } = await request.json();
  if (!eventId) {
    return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
  }

  try {
    // Check if already hearted
    const { data: existing } = await supabase
      .from('hearts')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .single();

    if (existing) {
      // Remove heart
      await supabase.from('hearts').delete().eq('id', existing.id);
      return NextResponse.json({ hearted: false });
    } else {
      // Add heart
      await supabase.from('hearts').insert({ user_id: user.id, event_id: eventId });
      return NextResponse.json({ hearted: true });
    }
  } catch (error) {
    console.error('Heart toggle error:', error);
    return NextResponse.json({ error: 'Failed to toggle heart' }, { status: 500 });
  }
}
```

---

### Submission Data (Phase 3) ✅ IMPLEMENTED

**File:** `src/data/submit/draft-actions.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import type { EventDraftData, SeriesDraftData, EventDraft } from '@/types/submission';

// Create a new draft
export async function createDraft(params: {
  userId: string;
  userEmail: string;
  userName?: string;
  draftData?: EventDraftData;
  seriesDraftData?: SeriesDraftData | null;
}): Promise<{ draft: EventDraft | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('event_drafts')
    .insert({
      user_id: params.userId,
      user_email: params.userEmail,
      user_name: params.userName,
      draft_data: params.draftData || {},
      series_draft_data: params.seriesDraftData || null,
      current_step: 1,
      completed_steps: [],
    })
    .select()
    .single();

  if (error) return { draft: null, error: error.message };
  return { draft: data, error: null };
}

// Update existing draft
export async function updateDraft(
  draftId: string,
  updates: {
    draftData?: EventDraftData;
    seriesDraftData?: SeriesDraftData | null;
    currentStep?: number;
    completedSteps?: number[];
  }
): Promise<{ success: boolean; error: string | null }> {
  // Implementation...
}

// Get user's drafts
export async function getUserDrafts(
  userEmail: string
): Promise<{ drafts: EventDraft[]; error: string | null }> {
  // Implementation...
}
```

**File:** `src/data/submit/submit-event.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import type { EventDraftData, SeriesDraftData } from '@/types/submission';

export async function submitEvent(params: {
  draftId?: string | null;
  draftData: EventDraftData;
  seriesDraftData?: SeriesDraftData | null;
  userEmail: string;
  userName?: string;
}): Promise<{
  eventId: string | null;
  seriesId: string | null;
  error: string | null;
}> {
  const supabase = await createClient();

  // 1. Create location if needed (new address vs existing venue)
  // 2. Create series if seriesDraftData provided
  // 3. Create event with pending_review status
  // 4. Link draft to submitted event
  // 5. Log submission in audit log

  // Returns eventId for redirect
}

export async function resubmitEvent(params: {
  eventId: string;
  draftData: EventDraftData;
  userEmail: string;
}): Promise<{ success: boolean; error: string | null }> {
  // Update event and change status from changes_requested → pending_review
}
```

**File:** `src/data/submit/get-submissions.ts`

```typescript
import { createClient } from '@/lib/supabase/server';

export async function getUserSubmissions(params: {
  userEmail: string;
  status?: string[];
  limit?: number;
}): Promise<{
  submissions: SubmissionWithDetails[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('v_my_submissions')
    .select('*')
    .eq('submitted_by_email', params.userEmail)
    .order('created_at', { ascending: false })
    .limit(params.limit || 50);

  // Returns submissions with category, location, series info
}

export async function getSubmissionCounts(
  userEmail: string
): Promise<{
  counts: Record<EventStatus, number>;
  error: string | null;
}> {
  // Returns count by status: { draft: 1, pending_review: 2, ... }
}
```

**File:** `src/data/admin/event-actions.ts`

```typescript
import { createClient } from '@/lib/supabase/server';

export async function approveEvents(params: {
  eventIds: string[];
  adminEmail: string;
}): Promise<{ succeeded: string[]; failed: string[] }> {
  // Updates status → published, logs to admin_audit_log
}

export async function rejectEvents(params: {
  eventIds: string[];
  reason: string;
  adminEmail: string;
}): Promise<{ succeeded: string[]; failed: string[] }> {
  // Updates status → rejected with reason
}

export async function requestEventChanges(params: {
  eventId: string;
  message: string;
  adminEmail: string;
}): Promise<{ success: boolean; error: string | null }> {
  // Updates status → changes_requested with message
}

export async function softDeleteEvent(params: {
  eventId: string;
  reason?: string;
  adminEmail: string;
}): Promise<{ success: boolean; error: string | null }> {
  // Sets deleted_at, deleted_by, delete_reason
}

export async function restoreEvent(params: {
  eventId: string;
  adminEmail: string;
}): Promise<{ success: boolean; error: string | null }> {
  // Clears deleted_at, deleted_by
}
```

---

### Submission API Routes (Phase 3) ✅ IMPLEMENTED

**File:** `src/app/api/submit/draft/route.ts`

```typescript
// POST: Create new draft
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = await request.json();
  const result = await createDraft({
    userId: session.id,
    userEmail: session.email,
    ...body,
  });

  return NextResponse.json(result);
}
```

**File:** `src/app/api/submit/draft/[id]/route.ts`

```typescript
// PATCH: Update draft
export async function PATCH(request: NextRequest, { params }) {
  // Verify ownership, update draft
}

// DELETE: Delete draft
export async function DELETE(request: NextRequest, { params }) {
  // Verify ownership, delete draft
}
```

**File:** `src/app/api/submit/event/route.ts`

```typescript
// POST: Submit event for review
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { draftId, draftData, seriesDraftData } = await request.json();

  const result = await submitEvent({
    draftId,
    draftData,
    seriesDraftData,
    userEmail: session.email,
    userName: session.name,
  });

  return NextResponse.json(result);
}
```

---

## Utility Functions

**File:** `src/lib/utils/dates.ts`

```typescript
import { format, isToday, isTomorrow, isThisWeek, startOfDay, endOfDay, startOfWeek, endOfWeek, addDays } from 'date-fns';

export function formatEventDate(dateString: string, options: {
  format?: 'short' | 'long' | 'relative';
  includeTime?: boolean;
} = {}): string {
  const { format: fmt = 'short', includeTime = true } = options;
  const date = new Date(dateString);

  if (fmt === 'relative') {
    if (isToday(date)) return includeTime ? `Today at ${format(date, 'h:mm a')}` : 'Today';
    if (isTomorrow(date)) return includeTime ? `Tomorrow at ${format(date, 'h:mm a')}` : 'Tomorrow';
  }

  if (fmt === 'short') {
    const dateStr = format(date, 'MMM d');
    return includeTime ? `${dateStr} · ${format(date, 'h:mm a')}` : dateStr;
  }

  // long format
  const dateStr = format(date, 'EEEE, MMMM d, yyyy');
  return includeTime ? `${dateStr} at ${format(date, 'h:mm a')}` : dateStr;
}

export function getTodayRange() {
  const today = new Date();
  return {
    start: format(startOfDay(today), 'yyyy-MM-dd'),
    end: format(endOfDay(today), 'yyyy-MM-dd'),
  };
}

export function getThisWeekendRange() {
  const today = new Date();
  const friday = addDays(startOfWeek(today, { weekStartsOn: 1 }), 4);
  const sunday = addDays(friday, 2);
  return {
    start: format(friday, 'yyyy-MM-dd'),
    end: format(endOfDay(sunday), 'yyyy-MM-dd'),
  };
}
```

**File:** `src/lib/utils/price.ts`

```typescript
export function formatPrice(event: {
  price_type: string;
  price_low: number | null;
  price_high: number | null;
  is_free: boolean;
}): string {
  if (event.is_free) return 'Free';

  switch (event.price_type) {
    case 'free':
      return 'Free';
    case 'fixed':
      return event.price_low ? `$${event.price_low}` : 'Free';
    case 'range':
      return `$${event.price_low}–$${event.price_high}`;
    case 'varies':
      return 'Prices vary';
    case 'donation':
      return 'Pay what you can';
    default:
      return event.price_low ? `$${event.price_low}` : '';
  }
}
```

**File:** `src/lib/utils/url.ts`

```typescript
export function buildEventUrl(event: { slug: string; instance_date: string }): string {
  return `/event/${event.slug}-${event.instance_date}`;
}

export function buildVenueUrl(venue: { slug: string }): string {
  return `/venue/${venue.slug}`;
}

export function buildOrganizerUrl(organizer: { slug: string }): string {
  return `/organizer/${organizer.slug}`;
}

export function buildCategoryUrl(category: { slug: string }): string {
  return `/events/${category.slug}`;
}
```
