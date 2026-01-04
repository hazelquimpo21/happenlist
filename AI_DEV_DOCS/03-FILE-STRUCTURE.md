# Happenlist: File Structure

## Overview

This document defines the complete file structure for the Happenlist Next.js application. The structure follows Next.js 14+ App Router conventions with a focus on modularity and maintainability.

## Key Principles

1. **Maximum 400 lines per file** - Split larger files into modules
2. **Colocation** - Keep related files together
3. **Feature-based organization** - Group by feature, not file type
4. **Barrel exports** - Use index.ts files for clean imports
5. **Server-first** - Default to Server Components; use 'use client' only when needed

---

## Complete Directory Structure

```
happenlist/
├── .env.local                    # Environment variables (git-ignored)
├── .env.example                  # Example env vars template
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json
├── README.md
│
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   ├── og-image.jpg              # Default Open Graph image
│   └── icons/                    # PWA icons, etc.
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home page
│   │   ├── globals.css           # Global styles
│   │   ├── not-found.tsx         # 404 page
│   │   ├── error.tsx             # Error boundary
│   │   ├── loading.tsx           # Global loading state
│   │   │
│   │   ├── (marketing)/          # Marketing pages group
│   │   │   ├── about/
│   │   │   │   └── page.tsx
│   │   │   └── contact/
│   │   │       └── page.tsx
│   │   │
│   │   ├── events/
│   │   │   ├── page.tsx                    # /events - Events index
│   │   │   ├── loading.tsx
│   │   │   ├── today/
│   │   │   │   └── page.tsx                # /events/today
│   │   │   ├── this-weekend/
│   │   │   │   └── page.tsx                # /events/this-weekend
│   │   │   ├── [year]/
│   │   │   │   └── [month]/
│   │   │   │       └── page.tsx            # /events/2025/february
│   │   │   └── [categorySlug]/
│   │   │       └── page.tsx                # /events/music
│   │   │
│   │   ├── event/
│   │   │   └── [slug]/
│   │   │       ├── page.tsx                # /event/jazz-at-the-lake-2025-02-14
│   │   │       ├── loading.tsx
│   │   │       └── opengraph-image.tsx     # Dynamic OG image
│   │   │
│   │   ├── venues/
│   │   │   ├── page.tsx                    # /venues
│   │   │   └── loading.tsx
│   │   │
│   │   ├── venue/
│   │   │   └── [slug]/
│   │   │       ├── page.tsx                # /venue/pabst-theater
│   │   │       └── loading.tsx
│   │   │
│   │   ├── organizers/
│   │   │   ├── page.tsx                    # /organizers
│   │   │   └── loading.tsx
│   │   │
│   │   ├── organizer/
│   │   │   └── [slug]/
│   │   │       ├── page.tsx                # /organizer/mke-jazz-collective
│   │   │       └── loading.tsx
│   │   │
│   │   ├── search/
│   │   │   └── page.tsx                    # /search?q=...
│   │   │
│   │   ├── auth/                           # Auth pages (Phase 3) ✅
│   │   │   ├── login/
│   │   │   │   └── page.tsx                # Magic link login page
│   │   │   ├── callback/
│   │   │   │   └── route.ts                # Magic link token handler
│   │   │   └── logout/
│   │   │       └── route.ts                # Sign out and redirect
│   │   │
│   │   ├── submit/                         # Event submission (Phase 3) ✅
│   │   │   ├── new/
│   │   │   │   ├── page.tsx                # Multi-step form page
│   │   │   │   └── submit-event-form.tsx   # Client form component
│   │   │   ├── edit/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx            # Edit draft/resubmit
│   │   │   └── success/
│   │   │       └── page.tsx                # Submission confirmed
│   │   │
│   │   ├── my/                             # User pages (Phase 3) ✅
│   │   │   └── submissions/
│   │   │       └── page.tsx                # User's submissions list
│   │   │
│   │   ├── admin/                          # Admin pages (Phase 3) ✅
│   │   │   └── events/
│   │   │       └── pending/
│   │   │           └── page.tsx            # Approval queue
│   │   │
│   │   ├── dashboard/                      # Organizer dashboard (Phase 5)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── events/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/                            # API Routes
│   │   │   ├── search/
│   │   │   │   └── route.ts                # Search API
│   │   │   ├── events/
│   │   │   │   └── route.ts                # Events API
│   │   │   ├── hearts/
│   │   │   │   └── route.ts                # Hearts toggle API (Phase 4)
│   │   │   │
│   │   │   ├── submit/                     # Submission APIs (Phase 3) ✅
│   │   │   │   ├── draft/
│   │   │   │   │   ├── route.ts            # POST: create draft
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── route.ts        # PATCH/DELETE: update/delete draft
│   │   │   │   ├── event/
│   │   │   │   │   └── route.ts            # POST: submit event
│   │   │   │   └── series/
│   │   │   │       └── search/
│   │   │   │           └── route.ts        # GET: search existing series
│   │   │   │
│   │   │   └── admin/                      # Admin APIs (Phase 3) ✅
│   │   │       └── events/
│   │   │           └── [id]/
│   │   │               ├── approve/
│   │   │               │   └── route.ts    # POST: approve event
│   │   │               ├── reject/
│   │   │               │   └── route.ts    # POST: reject event
│   │   │               └── request-changes/
│   │   │                   └── route.ts    # POST: request changes
│   │   │
│   │   └── sitemap.ts                      # Dynamic sitemap
│   │
│   ├── components/
│   │   ├── ui/                             # Base UI components
│   │   │   ├── index.ts                    # Barrel export
│   │   │   ├── button.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── dropdown.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── toast.tsx
│   │   │   └── spinner.tsx
│   │   │
│   │   ├── layout/                         # Layout components
│   │   │   ├── index.ts
│   │   │   ├── header.tsx                  # Main header component
│   │   │   ├── header-auth.tsx             # Auth controls (login/user menu)
│   │   │   ├── header-nav.tsx
│   │   │   ├── header-search.tsx
│   │   │   ├── mobile-menu.tsx             # Radix dialog drawer
│   │   │   ├── footer.tsx
│   │   │   ├── container.tsx
│   │   │   └── breadcrumbs.tsx
│   │   │
│   │   ├── events/                         # Event-specific components
│   │   │   ├── index.ts
│   │   │   ├── event-card.tsx
│   │   │   ├── event-card-skeleton.tsx
│   │   │   ├── event-grid.tsx
│   │   │   ├── event-list.tsx
│   │   │   ├── event-hero.tsx
│   │   │   ├── event-details.tsx
│   │   │   ├── event-sidebar.tsx
│   │   │   ├── event-price.tsx
│   │   │   ├── event-date.tsx
│   │   │   ├── event-location.tsx
│   │   │   ├── event-share.tsx
│   │   │   ├── featured-events.tsx
│   │   │   └── related-events.tsx
│   │   │
│   │   ├── venues/                         # Venue-specific components
│   │   │   ├── index.ts
│   │   │   ├── venue-card.tsx
│   │   │   ├── venue-grid.tsx
│   │   │   ├── venue-header.tsx
│   │   │   ├── venue-map.tsx
│   │   │   └── venue-events.tsx
│   │   │
│   │   ├── organizers/                     # Organizer-specific components
│   │   │   ├── index.ts
│   │   │   ├── organizer-card.tsx
│   │   │   ├── organizer-header.tsx
│   │   │   └── organizer-events.tsx
│   │   │
│   │   ├── categories/                     # Category components
│   │   │   ├── index.ts
│   │   │   ├── category-pill.tsx
│   │   │   ├── category-grid.tsx
│   │   │   └── category-filter.tsx
│   │   │
│   │   ├── filters/                        # Filter components
│   │   │   ├── index.ts
│   │   │   ├── filter-sidebar.tsx
│   │   │   ├── filter-date.tsx
│   │   │   ├── filter-category.tsx
│   │   │   ├── filter-price.tsx
│   │   │   ├── filter-pills.tsx
│   │   │   └── sort-dropdown.tsx
│   │   │
│   │   ├── search/                         # Search components
│   │   │   ├── index.ts
│   │   │   ├── search-bar.tsx
│   │   │   ├── search-results.tsx
│   │   │   ├── search-suggestions.tsx
│   │   │   └── search-empty.tsx
│   │   │
│   │   ├── hearts/                         # Heart/save components (Phase 3)
│   │   │   ├── index.ts
│   │   │   ├── heart-button.tsx
│   │   │   └── hearts-list.tsx
│   │   │
│   │   ├── auth/                           # Auth components (Phase 3) ✅
│   │   │   ├── index.ts                    # Barrel exports
│   │   │   ├── login-form.tsx              # Magic link email form
│   │   │   ├── user-menu.tsx               # Radix dropdown for logged-in users
│   │   │   └── user-avatar.tsx             # Avatar with initials fallback
│   │   │
│   │   ├── submit/                         # Submission components (Phase 3) ✅
│   │   │   ├── index.ts
│   │   │   ├── form-wrapper.tsx            # Form container with nav
│   │   │   ├── step-progress.tsx           # Progress indicator
│   │   │   └── steps/
│   │   │       ├── index.ts
│   │   │       ├── step-1-basic-info.tsx   # Title, category, description
│   │   │       ├── step-2-event-type.tsx   # Single/series/recurring
│   │   │       ├── step-3-datetime.tsx     # Date and time picker
│   │   │       ├── step-4-location.tsx     # Venue/address/virtual
│   │   │       ├── step-5-pricing.tsx      # Price type and amounts
│   │   │       ├── step-6-image.tsx        # Image upload
│   │   │       └── step-7-review.tsx       # Final review
│   │   │
│   │   ├── seo/                            # SEO components
│   │   │   ├── index.ts
│   │   │   ├── json-ld.tsx
│   │   │   ├── event-json-ld.tsx
│   │   │   ├── venue-json-ld.tsx
│   │   │   └── organization-json-ld.tsx
│   │   │
│   │   └── home/                           # Homepage-specific components
│   │       ├── index.ts
│   │       ├── hero.tsx
│   │       ├── hero-search.tsx
│   │       ├── quick-filters.tsx
│   │       └── section-header.tsx
│   │
│   ├── lib/                                # Utility libraries
│   │   ├── supabase/
│   │   │   ├── client.ts                   # Browser client
│   │   │   ├── server.ts                   # Server client
│   │   │   ├── middleware.ts               # Auth middleware helper
│   │   │   └── types.ts                    # Generated types
│   │   │
│   │   ├── utils/
│   │   │   ├── index.ts
│   │   │   ├── dates.ts                    # Date formatting utilities
│   │   │   ├── price.ts                    # Price formatting utilities
│   │   │   ├── slug.ts                     # Slug generation
│   │   │   ├── cn.ts                       # classNames utility
│   │   │   ├── url.ts                      # URL builders
│   │   │   └── logger.ts                   # Emoji-prefixed logging
│   │   │
│   │   ├── auth/                           # Auth utilities (Phase 3) ✅
│   │   │   ├── index.ts
│   │   │   ├── session.ts                  # getSession, requireAuth
│   │   │   └── is-admin.ts                 # Admin check via env
│   │   │
│   │   └── constants/
│   │       ├── index.ts
│   │       ├── routes.ts                   # Route constants
│   │       └── config.ts                   # App config
│   │
│   ├── data/                               # Data fetching layer
│   │   ├── events/
│   │   │   ├── index.ts
│   │   │   ├── get-events.ts
│   │   │   ├── get-event.ts
│   │   │   ├── get-featured-events.ts
│   │   │   └── get-related-events.ts
│   │   │
│   │   ├── venues/
│   │   │   ├── index.ts
│   │   │   ├── get-venues.ts
│   │   │   ├── get-venue.ts
│   │   │   └── get-venue-events.ts
│   │   │
│   │   ├── organizers/
│   │   │   ├── index.ts
│   │   │   ├── get-organizers.ts
│   │   │   ├── get-organizer.ts
│   │   │   └── get-organizer-events.ts
│   │   │
│   │   ├── categories/
│   │   │   ├── index.ts
│   │   │   └── get-categories.ts
│   │   │
│   │   ├── search/
│   │   │   ├── index.ts
│   │   │   └── search-events.ts
│   │   │
│   │   ├── hearts/                         # Phase 4
│   │   │   ├── index.ts
│   │   │   ├── get-user-hearts.ts
│   │   │   └── toggle-heart.ts
│   │   │
│   │   ├── submit/                         # Submission data (Phase 3) ✅
│   │   │   ├── index.ts
│   │   │   ├── draft-actions.ts            # CRUD for drafts
│   │   │   ├── submit-event.ts             # Submit and resubmit
│   │   │   ├── get-submissions.ts          # User submissions list
│   │   │   └── search-series.ts            # Search existing series
│   │   │
│   │   └── admin/                          # Admin data (Phase 3) ✅
│   │       ├── index.ts
│   │       └── event-actions.ts            # approve, reject, requestChanges, etc.
│   │
│   ├── contexts/                           # React contexts (Phase 3) ✅
│   │   ├── index.ts                        # Barrel exports
│   │   └── auth-context.tsx                # AuthProvider + useAuth
│   │
│   ├── hooks/                              # React hooks
│   │   ├── index.ts
│   │   ├── use-auth.ts                     # Re-export from auth-context ✅
│   │   ├── use-debounce.ts
│   │   ├── use-media-query.ts
│   │   ├── use-infinite-scroll.ts
│   │   └── use-heart.ts                    # Phase 4
│   │
│   ├── types/                              # TypeScript types
│   │   ├── index.ts
│   │   ├── event.ts
│   │   ├── venue.ts
│   │   ├── organizer.ts
│   │   ├── category.ts
│   │   ├── filters.ts
│   │   ├── api.ts
│   │   ├── user.ts                         # User/auth types (Phase 3) ✅
│   │   └── submission.ts                   # Submission types (Phase 3) ✅
│   │
│   └── middleware.ts                       # Next.js middleware (auth, etc.)
│
└── supabase/
    ├── config.toml                         # Supabase config
    └── migrations/                         # Database migrations
        ├── 00001_create_categories.sql
        ├── 00002_create_locations.sql
        ├── 00003_create_organizers.sql
        ├── 00004_create_events.sql
        ├── 00005_create_hearts.sql
        ├── 00006_series_and_recurring.sql  # Phase 2: Series
        ├── 00007_event_submission_flows.sql # Phase 3: Prep
        ├── 00008_event_management_complete.sql # Phase 3: Complete ✅
        └── 00010_user_profiles_and_hearts.sql # Phase 3: Auth tables ✅
```

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | kebab-case | `event-card.tsx` |
| Pages | kebab-case folders | `events/today/page.tsx` |
| Utilities | kebab-case | `format-date.ts` |
| Types | kebab-case | `event.ts` |
| Constants | kebab-case | `routes.ts` |
| Hooks | camelCase with `use-` prefix | `use-debounce.ts` |

---

## Import Aliases

Configure in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/data/*": ["./src/data/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"]
    }
  }
}
```

**Usage:**
```typescript
import { EventCard } from '@/components/events';
import { getEvents } from '@/data/events';
import { formatEventDate } from '@/lib/utils/dates';
import type { Event } from '@/types';
```

---

## Barrel Exports

Each component folder should have an `index.ts` that exports all public components:

```typescript
// src/components/events/index.ts
export { EventCard } from './event-card';
export { EventGrid } from './event-grid';
export { EventHero } from './event-hero';
// ... etc
```

This enables clean imports:
```typescript
import { EventCard, EventGrid, EventHero } from '@/components/events';
```

---

## Server vs Client Components

### Default to Server Components

Most components should be Server Components (no directive needed):

```typescript
// src/components/events/event-card.tsx
// This is a Server Component by default

import { Event } from '@/types';
import { formatEventDate } from '@/lib/utils/dates';

export function EventCard({ event }: { event: Event }) {
  return (
    <article>
      <h3>{event.title}</h3>
      <time>{formatEventDate(event.start_datetime)}</time>
    </article>
  );
}
```

### Use Client Components When Needed

Only add `'use client'` for:
- Event handlers (onClick, onChange, etc.)
- React hooks (useState, useEffect, etc.)
- Browser APIs
- Third-party client libraries

```typescript
// src/components/hearts/heart-button.tsx
'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';

export function HeartButton({ eventId }: { eventId: string }) {
  const [isHearted, setIsHearted] = useState(false);
  
  return (
    <button onClick={() => setIsHearted(!isHearted)}>
      <Heart fill={isHearted ? 'currentColor' : 'none'} />
    </button>
  );
}
```

### Composition Pattern

Wrap client components in server components when possible:

```typescript
// src/components/events/event-card.tsx (Server)
import { HeartButton } from '@/components/hearts';

export function EventCard({ event }: { event: Event }) {
  return (
    <article>
      <HeartButton eventId={event.id} /> {/* Client island */}
      <h3>{event.title}</h3>
    </article>
  );
}
```

---

## File Size Guidelines

If a file approaches 400 lines, split it:

| Original | Split Into |
|----------|------------|
| `event-card.tsx` (500 lines) | `event-card.tsx`, `event-card-image.tsx`, `event-card-meta.tsx` |
| `filter-sidebar.tsx` (600 lines) | `filter-sidebar.tsx`, `filter-date.tsx`, `filter-category.tsx`, `filter-price.tsx` |
| `get-events.ts` (400 lines) | `get-events.ts`, `build-events-query.ts`, `transform-event.ts` |
