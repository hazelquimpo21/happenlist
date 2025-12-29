# Admin Specification

## Overview

The admin interface is designed for a single curator (Hazel) to efficiently manage events, venues, and organizers. Speed and ease of use are priorities—adding an event should take under 5 minutes.

---

## Authentication

### Login Flow

```
/login
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    Happenlist Admin                         │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Email                                                 │  │
│  │ [_______________________________________]             │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Password                                              │  │
│  │ [_______________________________________]             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  [          Sign In          ]                              │
│                                                             │
│  [Error message appears here if login fails]               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Session Management

- Use Supabase Auth with email/password
- Session persists via cookies (handled by Supabase SSR)
- Middleware checks auth on all `/admin/*` routes
- Redirect to `/login` if unauthenticated
- Redirect to `/admin` if already authenticated on `/login`

### Middleware Implementation

```typescript
// middleware.ts

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          response.cookies.set({ name, value, ...options })
        },
        remove: (name, options) => {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )
  
  const { data: { session } } = await supabase.auth.getSession()
  
  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  // Redirect logged-in users from login page
  if (request.nextUrl.pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }
  
  return response
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
}
```

---

## Admin Layout

### Sidebar Navigation

```
┌──────────────────────────────────────────────────────────────────────┐
│ ┌────────────┐                                                       │
│ │            │  Happenlist Admin                                     │
│ │   Logo     │                                                       │
│ │            │  ─────────────────────────────────                   │
│ ├────────────┤                                                       │
│ │            │                                                       │
│ │ Dashboard  │  [Main content area]                                 │
│ │ Events     │                                                       │
│ │ Venues     │                                                       │
│ │ Organizers │                                                       │
│ │            │                                                       │
│ │ ────────── │                                                       │
│ │            │                                                       │
│ │ Categories │                                                       │
│ │ Tags       │                                                       │
│ │            │                                                       │
│ │ ────────── │                                                       │
│ │            │                                                       │
│ │ View Site →│                                                       │
│ │ Logout     │                                                       │
│ │            │                                                       │
│ └────────────┘                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### Layout Component

```typescript
// app/(admin)/layout.tsx

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { AdminHeader } from '@/components/layout/admin-header'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }
  
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="lg:pl-64">
        <AdminHeader user={session.user} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

---

## Dashboard

### `/admin`

**Purpose**: Quick overview and shortcuts

**Stats Cards**:
- Total published events
- Events this week
- Draft events (action needed)
- Total venues
- Total organizers

**Quick Actions**:
- Add new event (primary CTA)
- Add new venue
- Add new organizer

**Recent Activity**:
- Last 10 events created/updated
- Quick status indicators

```typescript
// app/(admin)/admin/page.tsx

import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, Calendar, MapPin, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getAdminStats, getRecentEvents } from '@/lib/queries/admin'

export default async function AdminDashboard() {
  const stats = await getAdminStats()
  const recentEvents = await getRecentEvents(10)
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-display-sm">Dashboard</h1>
        <Button asChild>
          <Link href="/admin/events/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Link>
        </Button>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Published Events"
          value={stats.publishedEvents}
          icon={<Calendar />}
        />
        <StatCard
          title="This Week"
          value={stats.eventsThisWeek}
          icon={<Calendar />}
        />
        <StatCard
          title="Drafts"
          value={stats.draftEvents}
          icon={<Calendar />}
          highlight={stats.draftEvents > 0}
        />
        <StatCard
          title="Venues"
          value={stats.venues}
          icon={<MapPin />}
        />
      </div>
      
      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button variant="secondary" asChild>
          <Link href="/admin/venues/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Venue
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/admin/organizers/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Organizer
          </Link>
        </Button>
      </div>
      
      {/* Recent Events */}
      <section>
        <h2 className="text-heading-md mb-4">Recent Events</h2>
        <RecentEventsTable events={recentEvents} />
      </section>
    </div>
  )
}
```

---

## Event Management

### Event List (`/admin/events`)

**Features**:
- Table view with columns: Title, Date, Status, Category, Actions
- Search by title
- Filter by status (All, Published, Draft, Archived)
- Filter by category
- Sort by date or created_at
- Pagination
- Bulk actions: Publish, Unpublish, Delete (future)

**Actions per row**:
- Edit
- Duplicate
- View (opens public page)
- Delete (with confirmation)

```typescript
// Data table columns
const columns = [
  { key: 'title', label: 'Event', sortable: true },
  { key: 'start_at', label: 'Date', sortable: true },
  { key: 'venue', label: 'Venue', sortable: false },
  { key: 'category', label: 'Category', sortable: false },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'actions', label: '', sortable: false },
]
```

### Event Form (`/admin/events/new` and `/admin/events/[id]/edit`)

**Form Sections**:

1. **Basic Info**
   - Title* (text input)
   - Description (textarea with character count)
   - Event Type (select)
   - Category (select)

2. **Date & Time**
   - Start Date* (date picker)
   - Start Time* (time picker)
   - End Date (date picker)
   - End Time (time picker)
   - All Day toggle (hides time pickers)

3. **Location**
   - Venue (searchable select with "Add new" option)
   - Organizer (searchable select with "Add new" option)

4. **Media**
   - Thumbnail Image (upload)
   - Flyer Image (upload)

5. **Links**
   - Ticket URL (URL input)
   - Source URL (URL input, for attribution)

6. **Pricing**
   - Free Event toggle
   - Price Min (number, disabled if free)
   - Price Max (number, disabled if free)

7. **Tags**
   - Multi-select checkboxes

8. **Status**
   - Radio: Draft / Published

**Form Actions**:
- Cancel (returns to list)
- Save as Draft
- Publish (validates required fields)

**Inline Entity Creation**:
When "Add new venue" or "Add new organizer" is clicked, open a modal with a simplified form. On save, the new entity is selected in the parent form.

---

### Event Form Component Structure

```
components/forms/
├── event-form.tsx           # Main form container (~200 lines)
├── event-form-basic.tsx     # Title, description, type, category (~100 lines)
├── event-form-datetime.tsx  # Date/time pickers (~120 lines)
├── event-form-location.tsx  # Venue/organizer selects (~100 lines)
├── event-form-media.tsx     # Image uploads (~80 lines)
├── event-form-links.tsx     # URLs and pricing (~100 lines)
├── event-form-tags.tsx      # Tag selection (~60 lines)
├── event-form-status.tsx    # Status radio (~40 lines)
└── event-form-actions.tsx   # Submit buttons (~50 lines)
```

### Form State Management

```typescript
// Use React Hook Form with Zod validation

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { eventFormSchema, type EventFormData } from '@/lib/validations/event'

export function EventForm({ event, onSubmit }: EventFormProps) {
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: event ? mapEventToFormData(event) : defaultValues,
  })
  
  const handleSubmit = form.handleSubmit(async (data) => {
    const result = await onSubmit(data)
    if (!result.success) {
      // Set field errors from server
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, errors]) => {
          form.setError(field as any, { message: errors[0] })
        })
      }
    }
  })
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form sections */}
    </form>
  )
}
```

---

## Venue Management

### Venue List (`/admin/venues`)

**Table Columns**:
- Name
- Address (truncated)
- Event Count
- Actions (Edit, Delete)

**Search**: By name

### Venue Form (`/admin/venues/new` and `/admin/venues/[id]/edit`)

**Fields**:
- Name* (text)
- Address (text)
- City (text, default: Milwaukee)
- State (text, default: WI)
- Zip (text)
- Website (URL)
- Image (upload)

**Future Enhancement**: Google Places autocomplete for address

---

## Organizer Management

### Organizer List (`/admin/organizers`)

**Table Columns**:
- Name (with logo thumbnail)
- Website
- Instagram
- Event Count
- Actions (Edit, Delete)

### Organizer Form (`/admin/organizers/new` and `/admin/organizers/[id]/edit`)

**Fields**:
- Name* (text)
- Description (textarea)
- Logo (upload)
- Website (URL)
- Instagram Handle (text, auto-strips @)

---

## Category & Tag Management

### Categories (`/admin/categories`)

**Display**: Card grid showing each category with:
- Icon
- Name
- Color swatch
- Event count

**Inline Editing**: Click to edit name, icon, color
**Reordering**: Drag-and-drop to change sort_order

### Tags (`/admin/tags`)

**Display**: Simple list with event counts
**Actions**: Edit name, Delete (with warning if events use it)

---

## Reusable Admin Components

### Data Table

```typescript
// components/admin/data-table.tsx

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T) => void
}

interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (row: T) => React.ReactNode
  width?: string
}
```

### Searchable Select

```typescript
// components/forms/searchable-select.tsx

interface SearchableSelectProps {
  value: string | undefined
  onChange: (value: string) => void
  onSearch: (query: string) => Promise<Option[]>
  onCreate?: (name: string) => Promise<Option>
  placeholder?: string
  label?: string
}

interface Option {
  value: string
  label: string
}
```

### Confirm Dialog

```typescript
// components/admin/confirm-dialog.tsx

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void | Promise<void>
}
```

### Status Badge

```typescript
// components/admin/status-badge.tsx

type EventStatus = 'draft' | 'published' | 'cancelled' | 'archived'

const statusConfig: Record<EventStatus, { label: string; variant: BadgeVariant }> = {
  draft: { label: 'Draft', variant: 'warning' },
  published: { label: 'Published', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'error' },
  archived: { label: 'Archived', variant: 'default' },
}
```

---

## Admin Queries

```typescript
// lib/queries/admin.ts

export async function getAdminStats() {
  const supabase = createServerClient()
  
  const [published, drafts, thisWeek, venues, organizers] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('events').select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('start_at', startOfWeek(new Date()).toISOString())
      .lte('start_at', endOfWeek(new Date()).toISOString()),
    supabase.from('venues').select('*', { count: 'exact', head: true }),
    supabase.from('organizers').select('*', { count: 'exact', head: true }),
  ])
  
  return {
    publishedEvents: published.count ?? 0,
    draftEvents: drafts.count ?? 0,
    eventsThisWeek: thisWeek.count ?? 0,
    venues: venues.count ?? 0,
    organizers: organizers.count ?? 0,
  }
}

export async function getRecentEvents(limit = 10) {
  const supabase = createServerClient()
  
  const { data } = await supabase
    .from('events')
    .select(`
      id, title, slug, start_at, status,
      category:categories(name, color),
      venue:venues(name)
    `)
    .order('updated_at', { ascending: false })
    .limit(limit)
  
  return data ?? []
}
```

---

## Workflow Optimizations

### Duplicate Event

For recurring similar events (e.g., weekly trivia), allow duplicating:

1. Click "Duplicate" on existing event
2. New event created as draft with:
   - Same title + " (copy)"
   - Same venue, organizer, category, tags
   - Same description, images, links
   - Blank dates (user must fill in)
3. Redirect to edit form

### Quick Status Toggle

In the event list, allow inline status toggle:
- Click status badge to toggle draft ↔ published
- Confirm dialog for unpublish
- Toast notification on success

### Keyboard Shortcuts (Future)

- `Cmd+N`: New event
- `Cmd+S`: Save form
- `Escape`: Cancel / Close modal

---

## Error Handling

### Form Errors

- Display inline under each field
- Scroll to first error on submit
- Server-side errors mapped to fields when possible

### API Errors

- Toast notification for failures
- Retry option where appropriate
- Detailed error in console for debugging

### Optimistic Updates

- Show immediate UI feedback
- Rollback on error
- Use for status toggles, delete operations

---

## Mobile Admin

The admin should be usable on mobile for quick edits:

- Sidebar collapses to hamburger menu
- Forms stack vertically
- Tables become card lists
- Touch-friendly tap targets (min 44px)

Priority mobile tasks:
- View recent events
- Quick status changes
- View stats

Lower priority (desktop preferred):
- Creating new events
- Editing with image uploads
