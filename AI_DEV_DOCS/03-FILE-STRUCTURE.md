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
│   │   ├── (auth)/                         # Auth pages group (Phase 3)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   └── callback/
│   │   │       └── route.ts                # OAuth callback
│   │   │
│   │   ├── my/                             # User pages (Phase 3)
│   │   │   ├── layout.tsx                  # Requires auth
│   │   │   ├── hearts/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   │
│   │   ├── dashboard/                      # Organizer dashboard (Phase 4)
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
│   │   │   └── hearts/
│   │   │       └── route.ts                # Hearts toggle API (Phase 3)
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
│   │   │   ├── header.tsx
│   │   │   ├── header-nav.tsx
│   │   │   ├── header-search.tsx
│   │   │   ├── mobile-menu.tsx
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
│   │   ├── auth/                           # Auth components (Phase 3)
│   │   │   ├── index.ts
│   │   │   ├── login-form.tsx
│   │   │   ├── signup-form.tsx
│   │   │   ├── auth-provider.tsx
│   │   │   └── user-menu.tsx
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
│   │   │   └── url.ts                      # URL builders
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
│   │   └── hearts/                         # Phase 3
│   │       ├── index.ts
│   │       ├── get-user-hearts.ts
│   │       └── toggle-heart.ts
│   │
│   ├── hooks/                              # React hooks
│   │   ├── index.ts
│   │   ├── use-debounce.ts
│   │   ├── use-media-query.ts
│   │   ├── use-infinite-scroll.ts
│   │   └── use-heart.ts                    # Phase 3
│   │
│   ├── types/                              # TypeScript types
│   │   ├── index.ts
│   │   ├── event.ts
│   │   ├── venue.ts
│   │   ├── organizer.ts
│   │   ├── category.ts
│   │   ├── filters.ts
│   │   └── api.ts
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
        ├── 00006_create_profiles.sql
        ├── 00007_create_views.sql
        ├── 00008_create_functions.sql
        └── 00009_seed_categories.sql
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
