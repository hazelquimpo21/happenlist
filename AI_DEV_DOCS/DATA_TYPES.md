# Data Types & Validation Schemas

## TypeScript Interfaces

### Database Types

These types mirror the database schema exactly. Auto-generate from Supabase CLI when possible.

```typescript
// types/database.ts

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'archived'

export interface EventType {
  id: string
  name: string
  slug: string
  description: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  color: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Venue {
  id: string
  name: string
  slug: string
  address: string | null
  city: string
  state: string
  zip: string | null
  lat: number | null
  lng: number | null
  website: string | null
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface Organizer {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  website: string | null
  instagram_handle: string | null
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  title: string
  slug: string
  description: string | null
  type_id: string | null
  category_id: string | null
  venue_id: string | null
  organizer_id: string | null
  start_at: string
  end_at: string | null
  is_all_day: boolean
  image_url: string | null
  flyer_url: string | null
  source_url: string | null
  ticket_url: string | null
  price_min: number | null
  price_max: number | null
  is_free: boolean
  status: EventStatus
  created_at: string
  updated_at: string
}

export interface EventTag {
  event_id: string
  tag_id: string
}
```

---

### Extended Types (with relations)

```typescript
// types/extended.ts

import type { Event, Category, Venue, Organizer, Tag, EventType } from './database'

/**
 * Event with all related data populated
 */
export interface EventWithRelations extends Event {
  category: Category | null
  venue: Venue | null
  organizer: Organizer | null
  event_type: EventType | null
  tags: Tag[]
}

/**
 * Venue with event counts
 */
export interface VenueWithEvents extends Venue {
  events: Event[]
  upcoming_event_count: number
}

/**
 * Organizer with event counts
 */
export interface OrganizerWithEvents extends Organizer {
  events: Event[]
  upcoming_event_count: number
}

/**
 * Category with event count
 */
export interface CategoryWithCount extends Category {
  event_count: number
}
```

---

### API/Query Types

```typescript
// types/api.ts

import type { EventStatus } from './database'

/**
 * Filter params for event queries
 */
export interface EventFilters {
  category?: string        // category slug
  tags?: string[]          // tag slugs
  dateFrom?: string        // ISO date string
  dateTo?: string          // ISO date string
  isFree?: boolean
  search?: string          // keyword search
  status?: EventStatus     // admin only
  venueId?: string
  organizerId?: string
}

/**
 * Sort options for event queries
 */
export type EventSortOption = 'date' | 'created' | 'title'

/**
 * Pagination params
 */
export interface PaginationParams {
  page?: number
  limit?: number
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

/**
 * Server action response
 */
export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }
```

---

### Form Input Types

```typescript
// types/forms.ts

/**
 * Event form input (for create/edit)
 */
export interface EventFormInput {
  title: string
  description?: string
  type_id?: string
  category_id?: string
  venue_id?: string
  organizer_id?: string
  start_at: string          // ISO datetime
  end_at?: string           // ISO datetime
  is_all_day: boolean
  image_url?: string
  flyer_url?: string
  source_url?: string
  ticket_url?: string
  price_min?: number
  price_max?: number
  is_free: boolean
  status: 'draft' | 'published'
  tag_ids: string[]
}

/**
 * Venue form input
 */
export interface VenueFormInput {
  name: string
  address?: string
  city: string
  state: string
  zip?: string
  lat?: number
  lng?: number
  website?: string
  image_url?: string
}

/**
 * Organizer form input
 */
export interface OrganizerFormInput {
  name: string
  description?: string
  logo_url?: string
  website?: string
  instagram_handle?: string
}
```

---

## Zod Validation Schemas

### Shared Schemas

```typescript
// lib/validations/shared.ts

import { z } from 'zod'

export const slugSchema = z
  .string()
  .min(1, 'Required')
  .max(255)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format')

export const urlSchema = z
  .string()
  .url('Invalid URL')
  .max(500)
  .optional()
  .or(z.literal(''))

export const imageUrlSchema = z
  .string()
  .url('Invalid image URL')
  .max(500)
  .optional()
  .or(z.literal(''))

export const priceSchema = z
  .number()
  .min(0, 'Price must be positive')
  .max(99999, 'Price too high')
  .optional()
```

---

### Event Schemas

```typescript
// lib/validations/event.ts

import { z } from 'zod'
import { urlSchema, imageUrlSchema, priceSchema } from './shared'

export const eventStatusSchema = z.enum(['draft', 'published', 'cancelled', 'archived'])

export const eventFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title too long'),
  
  description: z
    .string()
    .max(10000, 'Description too long')
    .optional(),
  
  type_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
  venue_id: z.string().uuid().optional(),
  organizer_id: z.string().uuid().optional(),
  
  start_at: z
    .string()
    .datetime({ message: 'Invalid start date/time' }),
  
  end_at: z
    .string()
    .datetime({ message: 'Invalid end date/time' })
    .optional()
    .or(z.literal('')),
  
  is_all_day: z.boolean().default(false),
  
  image_url: imageUrlSchema,
  flyer_url: imageUrlSchema,
  source_url: urlSchema,
  ticket_url: urlSchema,
  
  price_min: priceSchema,
  price_max: priceSchema,
  is_free: z.boolean().default(false),
  
  status: eventStatusSchema.default('draft'),
  
  tag_ids: z.array(z.string().uuid()).default([]),
}).refine(
  (data) => {
    if (data.end_at && data.end_at !== '') {
      return new Date(data.end_at) > new Date(data.start_at)
    }
    return true
  },
  {
    message: 'End date must be after start date',
    path: ['end_at'],
  }
).refine(
  (data) => {
    if (data.price_min !== undefined && data.price_max !== undefined) {
      return data.price_max >= data.price_min
    }
    return true
  },
  {
    message: 'Maximum price must be greater than minimum',
    path: ['price_max'],
  }
)

export type EventFormData = z.infer<typeof eventFormSchema>
```

---

### Venue Schemas

```typescript
// lib/validations/venue.ts

import { z } from 'zod'
import { urlSchema, imageUrlSchema } from './shared'

export const venueFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name too long'),
  
  address: z
    .string()
    .max(500, 'Address too long')
    .optional(),
  
  city: z
    .string()
    .min(1, 'City is required')
    .max(100)
    .default('Milwaukee'),
  
  state: z
    .string()
    .min(1, 'State is required')
    .max(50)
    .default('WI'),
  
  zip: z
    .string()
    .max(20)
    .optional(),
  
  lat: z
    .number()
    .min(-90)
    .max(90)
    .optional(),
  
  lng: z
    .number()
    .min(-180)
    .max(180)
    .optional(),
  
  website: urlSchema,
  image_url: imageUrlSchema,
})

export type VenueFormData = z.infer<typeof venueFormSchema>
```

---

### Organizer Schemas

```typescript
// lib/validations/organizer.ts

import { z } from 'zod'
import { urlSchema, imageUrlSchema } from './shared'

export const organizerFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name too long'),
  
  description: z
    .string()
    .max(5000, 'Description too long')
    .optional(),
  
  logo_url: imageUrlSchema,
  website: urlSchema,
  
  instagram_handle: z
    .string()
    .max(100)
    .regex(/^@?[a-zA-Z0-9._]*$/, 'Invalid Instagram handle')
    .optional()
    .transform((val) => val?.replace(/^@/, '')), // Remove @ if present
})

export type OrganizerFormData = z.infer<typeof organizerFormSchema>
```

---

### Filter/Search Schemas

```typescript
// lib/validations/filters.ts

import { z } from 'zod'

export const eventFiltersSchema = z.object({
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  isFree: z.coerce.boolean().optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

export type EventFiltersInput = z.infer<typeof eventFiltersSchema>
```

---

## Utility Types

```typescript
// types/utils.ts

/**
 * Make specific keys optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Make specific keys required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

/**
 * Extract non-null type
 */
export type NonNullableFields<T> = {
  [K in keyof T]: NonNullable<T[K]>
}

/**
 * Database insert type (omit auto-generated fields)
 */
export type InsertType<T> = Omit<T, 'id' | 'created_at' | 'updated_at' | 'slug'>

/**
 * Database update type (all fields optional except id)
 */
export type UpdateType<T> = Partial<Omit<T, 'id' | 'created_at'>> & { id: string }
```

---

## Constants

```typescript
// lib/constants.ts

export const EVENT_STATUSES = ['draft', 'published', 'cancelled', 'archived'] as const

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

export const DATE_FORMATS = {
  display: 'MMM d, yyyy',           // Jan 5, 2025
  displayWithTime: 'MMM d, yyyy h:mm a', // Jan 5, 2025 7:00 PM
  displayTime: 'h:mm a',            // 7:00 PM
  input: 'yyyy-MM-dd',              // 2025-01-05
  inputDateTime: "yyyy-MM-dd'T'HH:mm", // 2025-01-05T19:00
  iso: "yyyy-MM-dd'T'HH:mm:ssXXX", // ISO 8601
} as const

export const TIMEZONE = 'America/Chicago'

export const IMAGE_LIMITS = {
  thumbnail: { maxSize: 2 * 1024 * 1024, width: 800, height: 600 },
  flyer: { maxSize: 5 * 1024 * 1024, width: 1200, height: 1600 },
  venue: { maxSize: 2 * 1024 * 1024, width: 800, height: 600 },
  organizer: { maxSize: 1 * 1024 * 1024, width: 400, height: 400 },
} as const

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
```
