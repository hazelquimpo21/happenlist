# API Specification

## Overview

Happenlist uses Next.js Server Components and Server Actions instead of traditional REST APIs. This document covers data fetching patterns and mutation interfaces.

---

## Query Functions

All read operations go through typed query functions in `lib/queries/`.

### Events Queries

```typescript
// lib/queries/events.ts

import { createServerClient } from '@/lib/supabase/server'
import type { EventWithRelations, EventFilters, PaginatedResponse } from '@/types'

/**
 * Get paginated list of published events with filters
 */
export async function getEvents(
  filters: EventFilters = {},
  page = 1,
  limit = 20
): Promise<PaginatedResponse<EventWithRelations>> {
  const supabase = createServerClient()
  const offset = (page - 1) * limit
  
  let query = supabase
    .from('events')
    .select(`
      *,
      category:categories(*),
      venue:venues(*),
      organizer:organizers(*),
      event_type:event_types(*),
      tags:event_tags(tag:tags(*))
    `, { count: 'exact' })
    .eq('status', 'published')
    .gte('start_at', new Date().toISOString())
    .order('start_at', { ascending: true })
    .range(offset, offset + limit - 1)
  
  // Apply filters
  if (filters.category) {
    query = query.eq('category.slug', filters.category)
  }
  if (filters.dateFrom) {
    query = query.gte('start_at', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('start_at', filters.dateTo)
  }
  if (filters.isFree) {
    query = query.eq('is_free', true)
  }
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }
  
  const { data, error, count } = await query
  
  if (error) throw new Error(error.message)
  
  return {
    data: transformEvents(data),
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
      hasMore: offset + limit < (count ?? 0)
    }
  }
}

/**
 * Get single event by slug
 */
export async function getEventBySlug(
  slug: string
): Promise<EventWithRelations | null> {
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      category:categories(*),
      venue:venues(*),
      organizer:organizers(*),
      event_type:event_types(*),
      tags:event_tags(tag:tags(*))
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw new Error(error.message)
  }
  
  return transformEvent(data)
}

/**
 * Get events by venue
 */
export async function getEventsByVenue(
  venueId: string,
  includesPast = false
): Promise<EventWithRelations[]> {
  const supabase = createServerClient()
  
  let query = supabase
    .from('events')
    .select(`
      *,
      category:categories(*),
      venue:venues(*),
      organizer:organizers(*),
      tags:event_tags(tag:tags(*))
    `)
    .eq('venue_id', venueId)
    .eq('status', 'published')
    .order('start_at', { ascending: true })
  
  if (!includesPast) {
    query = query.gte('start_at', new Date().toISOString())
  }
  
  const { data, error } = await query
  
  if (error) throw new Error(error.message)
  
  return transformEvents(data)
}

/**
 * Get events by organizer
 */
export async function getEventsByOrganizer(
  organizerId: string,
  includesPast = false
): Promise<EventWithRelations[]> {
  const supabase = createServerClient()
  
  let query = supabase
    .from('events')
    .select(`
      *,
      category:categories(*),
      venue:venues(*),
      organizer:organizers(*),
      tags:event_tags(tag:tags(*))
    `)
    .eq('organizer_id', organizerId)
    .eq('status', 'published')
    .order('start_at', { ascending: true })
  
  if (!includesPast) {
    query = query.gte('start_at', new Date().toISOString())
  }
  
  const { data, error } = await query
  
  if (error) throw new Error(error.message)
  
  return transformEvents(data)
}

/**
 * Get events by category
 */
export async function getEventsByCategory(
  categorySlug: string,
  page = 1,
  limit = 20
): Promise<PaginatedResponse<EventWithRelations>> {
  // Implementation similar to getEvents with category filter
}

/**
 * Get all events for admin (includes drafts)
 */
export async function getAdminEvents(
  filters: EventFilters & { status?: string } = {},
  page = 1,
  limit = 20
): Promise<PaginatedResponse<EventWithRelations>> {
  // Similar to getEvents but no status filter by default
  // Requires authenticated user (enforced by RLS)
}

/**
 * Get single event by ID for admin editing
 */
export async function getAdminEventById(
  id: string
): Promise<EventWithRelations | null> {
  // Get by ID instead of slug, includes all statuses
}

// Transform helpers
function transformEvent(data: any): EventWithRelations {
  return {
    ...data,
    tags: data.tags?.map((et: any) => et.tag) ?? []
  }
}

function transformEvents(data: any[]): EventWithRelations[] {
  return data?.map(transformEvent) ?? []
}
```

---

### Venues Queries

```typescript
// lib/queries/venues.ts

import { createServerClient } from '@/lib/supabase/server'
import type { Venue, VenueWithEvents } from '@/types'

/**
 * Get all venues
 */
export async function getVenues(): Promise<Venue[]> {
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .order('name')
  
  if (error) throw new Error(error.message)
  
  return data
}

/**
 * Get venue by slug with upcoming events
 */
export async function getVenueBySlug(
  slug: string
): Promise<VenueWithEvents | null> {
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('slug', slug)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  
  // Get upcoming event count
  const { count } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('venue_id', data.id)
    .eq('status', 'published')
    .gte('start_at', new Date().toISOString())
  
  return {
    ...data,
    events: [], // Events fetched separately
    upcoming_event_count: count ?? 0
  }
}

/**
 * Search venues by name (for autocomplete)
 */
export async function searchVenues(
  query: string,
  limit = 10
): Promise<Venue[]> {
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(limit)
  
  if (error) throw new Error(error.message)
  
  return data
}
```

---

### Categories & Tags Queries

```typescript
// lib/queries/categories.ts

import { createServerClient } from '@/lib/supabase/server'
import type { Category, CategoryWithCount } from '@/types'

/**
 * Get all categories with event counts
 */
export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')
  
  if (error) throw new Error(error.message)
  
  // Get counts for each category
  const withCounts = await Promise.all(
    data.map(async (category) => {
      const { count } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id)
        .eq('status', 'published')
        .gte('start_at', new Date().toISOString())
      
      return {
        ...category,
        event_count: count ?? 0
      }
    })
  )
  
  return withCounts
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(
  slug: string
): Promise<Category | null> {
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  
  return data
}


// lib/queries/tags.ts

import { createServerClient } from '@/lib/supabase/server'
import type { Tag } from '@/types'

/**
 * Get all tags
 */
export async function getTags(): Promise<Tag[]> {
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name')
  
  if (error) throw new Error(error.message)
  
  return data
}
```

---

## Server Actions

All write operations use Server Actions in `lib/actions/`.

### Event Actions

```typescript
// lib/actions/events.ts

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { eventFormSchema } from '@/lib/validations/event'
import { slugify } from '@/lib/utils/slugify'
import type { ActionResponse, EventFormInput } from '@/types'

/**
 * Create new event
 */
export async function createEvent(
  input: EventFormInput
): Promise<ActionResponse<{ id: string; slug: string }>> {
  const supabase = createServerClient()
  
  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }
  
  // Validate
  const parsed = eventFormSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors
    }
  }
  
  const { tag_ids, ...eventData } = parsed.data
  
  // Generate slug
  const slug = await generateUniqueSlug(eventData.title, supabase)
  
  // Insert event
  const { data: event, error } = await supabase
    .from('events')
    .insert({ ...eventData, slug })
    .select('id, slug')
    .single()
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  // Insert tags
  if (tag_ids.length > 0) {
    await supabase
      .from('event_tags')
      .insert(tag_ids.map(tagId => ({
        event_id: event.id,
        tag_id: tagId
      })))
  }
  
  // Revalidate
  revalidatePath('/events')
  revalidatePath('/admin/events')
  
  return { success: true, data: event }
}

/**
 * Update existing event
 */
export async function updateEvent(
  id: string,
  input: Partial<EventFormInput>
): Promise<ActionResponse<{ slug: string }>> {
  const supabase = createServerClient()
  
  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }
  
  // Partial validation
  const parsed = eventFormSchema.partial().safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors
    }
  }
  
  const { tag_ids, ...eventData } = parsed.data
  
  // Update event
  const { data: event, error } = await supabase
    .from('events')
    .update(eventData)
    .eq('id', id)
    .select('slug')
    .single()
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  // Update tags if provided
  if (tag_ids !== undefined) {
    // Delete existing
    await supabase
      .from('event_tags')
      .delete()
      .eq('event_id', id)
    
    // Insert new
    if (tag_ids.length > 0) {
      await supabase
        .from('event_tags')
        .insert(tag_ids.map(tagId => ({
          event_id: id,
          tag_id: tagId
        })))
    }
  }
  
  // Revalidate
  revalidatePath('/events')
  revalidatePath(`/events/${event.slug}`)
  revalidatePath('/admin/events')
  
  return { success: true, data: { slug: event.slug } }
}

/**
 * Delete event (soft delete - set to archived)
 */
export async function deleteEvent(
  id: string
): Promise<ActionResponse> {
  const supabase = createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }
  
  const { error } = await supabase
    .from('events')
    .update({ status: 'archived' })
    .eq('id', id)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath('/events')
  revalidatePath('/admin/events')
  
  return { success: true, data: undefined }
}

/**
 * Duplicate event
 */
export async function duplicateEvent(
  id: string
): Promise<ActionResponse<{ id: string; slug: string }>> {
  const supabase = createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }
  
  // Fetch original
  const { data: original } = await supabase
    .from('events')
    .select('*, event_tags(tag_id)')
    .eq('id', id)
    .single()
  
  if (!original) {
    return { success: false, error: 'Event not found' }
  }
  
  // Create copy
  const { id: _, slug: __, created_at, updated_at, event_tags, ...copyData } = original
  const newSlug = await generateUniqueSlug(`${original.title} (copy)`, supabase)
  
  const { data: newEvent, error } = await supabase
    .from('events')
    .insert({
      ...copyData,
      title: `${original.title} (copy)`,
      slug: newSlug,
      status: 'draft'
    })
    .select('id, slug')
    .single()
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  // Copy tags
  if (event_tags?.length > 0) {
    await supabase
      .from('event_tags')
      .insert(event_tags.map((et: any) => ({
        event_id: newEvent.id,
        tag_id: et.tag_id
      })))
  }
  
  revalidatePath('/admin/events')
  
  return { success: true, data: newEvent }
}

// Helper
async function generateUniqueSlug(title: string, supabase: any): Promise<string> {
  const baseSlug = slugify(title)
  let slug = baseSlug
  let counter = 1
  
  while (true) {
    const { data } = await supabase
      .from('events')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    
    if (!data) break
    
    slug = `${baseSlug}-${counter}`
    counter++
  }
  
  return slug
}
```

---

### Venue Actions

```typescript
// lib/actions/venues.ts

'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { venueFormSchema } from '@/lib/validations/venue'
import { slugify } from '@/lib/utils/slugify'
import type { ActionResponse, VenueFormInput } from '@/types'

export async function createVenue(
  input: VenueFormInput
): Promise<ActionResponse<{ id: string; slug: string }>> {
  const supabase = createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }
  
  const parsed = venueFormSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors
    }
  }
  
  const slug = slugify(parsed.data.name)
  
  const { data, error } = await supabase
    .from('venues')
    .insert({ ...parsed.data, slug })
    .select('id, slug')
    .single()
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath('/venues')
  revalidatePath('/admin/venues')
  
  return { success: true, data }
}

export async function updateVenue(
  id: string,
  input: Partial<VenueFormInput>
): Promise<ActionResponse<{ slug: string }>> {
  // Similar pattern to updateEvent
}

export async function deleteVenue(
  id: string
): Promise<ActionResponse> {
  // Soft delete or check for associated events first
}
```

---

### Organizer Actions

```typescript
// lib/actions/organizers.ts

'use server'

// Similar pattern to venues
export async function createOrganizer(input: OrganizerFormInput): Promise<ActionResponse<{ id: string; slug: string }>>
export async function updateOrganizer(id: string, input: Partial<OrganizerFormInput>): Promise<ActionResponse<{ slug: string }>>
export async function deleteOrganizer(id: string): Promise<ActionResponse>
```

---

### Auth Actions

```typescript
// lib/actions/auth.ts

'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export async function signIn(
  email: string,
  password: string
): Promise<{ error?: string }> {
  const supabase = createServerClient()
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) {
    return { error: error.message }
  }
  
  redirect('/admin')
}

export async function signOut(): Promise<void> {
  const supabase = createServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

---

## Revalidation Strategy

### Paths to Revalidate

| Action | Paths to Revalidate |
|--------|---------------------|
| Create event | `/events`, `/admin/events`, category page, venue page, organizer page |
| Update event | `/events`, `/events/[slug]`, `/admin/events`, related pages |
| Delete event | Same as create |
| Create venue | `/venues`, `/admin/venues` |
| Update venue | `/venues`, `/venues/[slug]`, `/admin/venues` |
| Create organizer | `/organizers`, `/admin/organizers` |
| Update organizer | `/organizers`, `/organizers/[slug]`, `/admin/organizers` |

### On-Demand Revalidation (Optional)

```typescript
// app/api/revalidate/route.ts

import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { secret, path, tag } = await request.json()
  
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
  }
  
  if (path) {
    revalidatePath(path)
  }
  
  if (tag) {
    revalidateTag(tag)
  }
  
  return NextResponse.json({ revalidated: true })
}
```
