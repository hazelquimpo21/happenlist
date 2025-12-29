# File Structure

## Project Organization

```
happenlist/
├── app/                        # Next.js App Router
│   ├── (public)/              # Public routes (no auth)
│   │   ├── page.tsx           # Home page
│   │   ├── events/
│   │   │   ├── page.tsx       # Event listing
│   │   │   └── [slug]/
│   │   │       └── page.tsx   # Event detail
│   │   ├── venues/
│   │   │   ├── page.tsx       # Venue listing
│   │   │   └── [slug]/
│   │   │       └── page.tsx   # Venue detail
│   │   ├── organizers/
│   │   │   ├── page.tsx       # Organizer listing
│   │   │   └── [slug]/
│   │   │       └── page.tsx   # Organizer detail
│   │   └── categories/
│   │       └── [slug]/
│   │           └── page.tsx   # Category events
│   │
│   ├── (admin)/               # Admin routes (auth required)
│   │   ├── layout.tsx         # Admin layout with nav
│   │   └── admin/
│   │       ├── page.tsx       # Admin dashboard
│   │       ├── events/
│   │       │   ├── page.tsx   # Event list (admin)
│   │       │   ├── new/
│   │       │   │   └── page.tsx
│   │       │   └── [id]/
│   │       │       └── edit/
│   │       │           └── page.tsx
│   │       ├── venues/
│   │       │   ├── page.tsx
│   │       │   ├── new/
│   │       │   │   └── page.tsx
│   │       │   └── [id]/
│   │       │       └── edit/
│   │       │           └── page.tsx
│   │       └── organizers/
│   │           ├── page.tsx
│   │           ├── new/
│   │           │   └── page.tsx
│   │           └── [id]/
│   │               └── edit/
│   │                   └── page.tsx
│   │
│   ├── (auth)/                # Auth routes
│   │   └── login/
│   │       └── page.tsx
│   │
│   ├── api/                   # API routes (if needed)
│   │   └── revalidate/
│   │       └── route.ts       # On-demand revalidation
│   │
│   ├── layout.tsx             # Root layout
│   ├── globals.css            # Global styles
│   ├── not-found.tsx          # 404 page
│   └── error.tsx              # Error boundary
│
├── components/
│   ├── ui/                    # Base UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   ├── checkbox.tsx
│   │   ├── badge.tsx
│   │   ├── card.tsx
│   │   ├── skeleton.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── avatar.tsx
│   │   ├── separator.tsx
│   │   └── index.ts           # Barrel export
│   │
│   ├── layout/                # Layout components
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── nav.tsx
│   │   ├── mobile-nav.tsx
│   │   ├── admin-sidebar.tsx
│   │   └── admin-header.tsx
│   │
│   ├── events/                # Event-specific components
│   │   ├── event-card.tsx
│   │   ├── event-card-skeleton.tsx
│   │   ├── event-list.tsx
│   │   ├── event-filters.tsx
│   │   ├── event-detail.tsx
│   │   ├── event-meta.tsx
│   │   ├── event-tags.tsx
│   │   └── event-share.tsx
│   │
│   ├── venues/                # Venue components
│   │   ├── venue-card.tsx
│   │   ├── venue-list.tsx
│   │   └── venue-info.tsx
│   │
│   ├── organizers/            # Organizer components
│   │   ├── organizer-card.tsx
│   │   ├── organizer-list.tsx
│   │   └── organizer-info.tsx
│   │
│   ├── categories/            # Category components
│   │   ├── category-badge.tsx
│   │   ├── category-list.tsx
│   │   └── category-nav.tsx
│   │
│   ├── forms/                 # Form components
│   │   ├── event-form.tsx
│   │   ├── venue-form.tsx
│   │   ├── organizer-form.tsx
│   │   ├── image-upload.tsx
│   │   ├── date-time-picker.tsx
│   │   ├── tag-select.tsx
│   │   ├── venue-select.tsx
│   │   ├── organizer-select.tsx
│   │   └── form-field.tsx
│   │
│   └── shared/                # Shared/utility components
│       ├── search-input.tsx
│       ├── pagination.tsx
│       ├── empty-state.tsx
│       ├── loading-spinner.tsx
│       ├── error-message.tsx
│       ├── confirm-dialog.tsx
│       ├── toast.tsx
│       └── seo.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser client
│   │   ├── server.ts          # Server client
│   │   ├── middleware.ts      # Auth middleware helpers
│   │   └── storage.ts         # Storage helpers
│   │
│   ├── queries/               # Database queries (read)
│   │   ├── events.ts
│   │   ├── venues.ts
│   │   ├── organizers.ts
│   │   ├── categories.ts
│   │   └── tags.ts
│   │
│   ├── actions/               # Server actions (write)
│   │   ├── events.ts
│   │   ├── venues.ts
│   │   ├── organizers.ts
│   │   └── auth.ts
│   │
│   ├── validations/           # Zod schemas
│   │   ├── shared.ts
│   │   ├── event.ts
│   │   ├── venue.ts
│   │   ├── organizer.ts
│   │   └── filters.ts
│   │
│   ├── utils/
│   │   ├── dates.ts           # Date formatting/parsing
│   │   ├── slugify.ts         # Slug generation
│   │   ├── cn.ts              # Class name utility
│   │   ├── format.ts          # General formatting
│   │   └── url.ts             # URL helpers
│   │
│   └── constants.ts           # App constants
│
├── hooks/                     # Custom React hooks
│   ├── use-debounce.ts
│   ├── use-media-query.ts
│   ├── use-toast.ts
│   └── use-filters.ts
│
├── types/
│   ├── database.ts            # Database table types
│   ├── extended.ts            # Types with relations
│   ├── api.ts                 # API/query types
│   ├── forms.ts               # Form input types
│   └── utils.ts               # Utility types
│
├── styles/
│   └── tokens.css             # CSS custom properties
│
├── public/
│   ├── images/
│   │   ├── logo.svg
│   │   ├── placeholder-event.jpg
│   │   └── placeholder-venue.jpg
│   ├── fonts/
│   └── favicon.ico
│
├── scripts/
│   ├── seed.ts                # Database seeding
│   └── generate-types.ts      # Supabase type generation
│
├── middleware.ts              # Next.js middleware (auth)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local.example
```

---

## Module Guidelines

### Maximum File Length: 400 Lines

When a file approaches 400 lines, split it:

**Components** → Extract sub-components
```
event-form.tsx (350 lines)
↓ Split into:
event-form.tsx (main form, 150 lines)
event-form-fields.tsx (form fields, 120 lines)
event-form-actions.tsx (submit/cancel, 80 lines)
```

**Queries** → Split by entity or operation
```
events.ts (380 lines)
↓ Split into:
events.ts (list/filter queries, 200 lines)
event-detail.ts (single event queries, 100 lines)
event-stats.ts (count/aggregate queries, 80 lines)
```

**Types** → Split by domain
```
Already organized: database.ts, extended.ts, api.ts, forms.ts
```

---

## Import Aliases

Configure in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["components/*"],
      "@/lib/*": ["lib/*"],
      "@/types/*": ["types/*"],
      "@/hooks/*": ["hooks/*"]
    }
  }
}
```

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | kebab-case.tsx | `event-card.tsx` |
| Pages | page.tsx (Next.js convention) | `app/events/page.tsx` |
| Layouts | layout.tsx | `app/(admin)/layout.tsx` |
| Utilities | camelCase.ts | `slugify.ts` |
| Types | camelCase.ts | `database.ts` |
| Hooks | use-*.ts | `use-debounce.ts` |
| Server Actions | entity.ts | `lib/actions/events.ts` |
| Queries | entity.ts | `lib/queries/events.ts` |
| Validations | entity.ts | `lib/validations/event.ts` |

---

## Component File Structure

Each component file should follow this order:

```typescript
// 1. 'use client' directive (if needed)
'use client'

// 2. Imports (organized per README)
import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import type { Event } from '@/types/database'

// 3. Type definitions (component-specific)
interface EventCardProps {
  event: Event
  showVenue?: boolean
}

// 4. Component definition
export function EventCard({ event, showVenue = true }: EventCardProps) {
  // Hooks first
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Derived values
  const formattedDate = format(new Date(event.start_at), 'MMM d')
  
  // Event handlers
  const handleClick = () => setIsExpanded(!isExpanded)
  
  // Render
  return (
    <div>...</div>
  )
}

// 5. Sub-components (if small, otherwise separate file)
function EventCardSkeleton() {
  return <div>...</div>
}

// 6. Named exports at bottom
export { EventCardSkeleton }
```

---

## Route Groups

### `(public)` — Public Routes
- No authentication required
- SEO optimized (metadata, OG tags)
- Server Components by default
- Static generation where possible

### `(admin)` — Admin Routes
- Authentication required
- Protected by middleware
- Shared admin layout (sidebar, header)
- Server Components with client interactivity

### `(auth)` — Authentication Routes
- Login page
- (Future: signup, password reset)
- Redirects if already authenticated

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        Page (Server)                         │
│                                                              │
│  1. Receive params/searchParams                              │
│  2. Call query functions (lib/queries/*)                     │
│  3. Pass data to components                                  │
│                                                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Query Functions                            │
│                   (lib/queries/*)                            │
│                                                              │
│  - Create Supabase server client                            │
│  - Execute typed queries                                     │
│  - Return typed results                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     Components                               │
│                                                              │
│  Server Components:                                          │
│  - Receive data as props                                     │
│  - Render UI                                                 │
│                                                              │
│  Client Components:                                          │
│  - Handle interactivity                                      │
│  - Call Server Actions for mutations                         │
│                                                              │
└────────────────────────┬────────────────────────────────────┘
                         │ (mutations only)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Server Actions                             │
│                   (lib/actions/*)                            │
│                                                              │
│  - Validate input with Zod                                   │
│  - Execute mutation                                          │
│  - Revalidate affected paths                                 │
│  - Return ActionResponse                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```
