# Happenlist Documentation

> A Milwaukee events directory built with Next.js and Supabase

## Quick Start for AI Developers

Read these documents in order:

1. **[PRD.md](./PRD.md)** — Product vision, personas, and feature requirements by phase
2. **[TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md)** — Stack, architecture, and infrastructure decisions
3. **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** — Complete Supabase schema with SQL migrations
4. **[DATA_TYPES.md](./DATA_TYPES.md)** — TypeScript interfaces and Zod schemas
5. **[FILE_STRUCTURE.md](./FILE_STRUCTURE.md)** — Project organization and module boundaries
6. **[API_SPEC.md](./API_SPEC.md)** — API routes, server actions, and data fetching patterns
7. **[UI_SPEC.md](./UI_SPEC.md)** — Screens, components, and user flows
8. **[STYLE_GUIDE.md](./STYLE_GUIDE.md)** — Design tokens, colors, typography, spacing
9. **[COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)** — Reusable component specifications
10. **[ADMIN_SPEC.md](./ADMIN_SPEC.md)** — Curator workflows and admin interface

---

## Project Overview

**Happenlist** is a curated events directory for Milwaukee. Phase 1 focuses on a clean, public-facing browse experience with admin-only event creation.

### Core Principles

- **Curator-first**: Single admin creates all content in Phase 1
- **Milwaukee-focused**: No multi-tenancy complexity yet
- **Browse-first**: No auth required to discover events
- **Mobile-friendly**: Responsive design, touch-optimized
- **Fast**: Static generation where possible, minimal client JS

### Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (admin only in Phase 1)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Image Storage**: Supabase Storage

### Development Phases

| Phase | Focus | Auth Required |
|-------|-------|---------------|
| 1 | Core events, venues, organizers, public browse | Admin only |
| 2 | Series (recurring events, camps, classes) | Admin only |
| 3 | User accounts, bookmarking, notifications | Public signup |
| 4 | Business owner accounts, self-service submissions | Business signup |

---

## Code Guidelines

### File Size Limits
- **Maximum 400 lines per file**
- Split large components into smaller, focused pieces
- Extract hooks, utilities, and constants into separate files

### Naming Conventions
- **Files**: `kebab-case.tsx` for components, `camelCase.ts` for utilities
- **Components**: `PascalCase`
- **Functions/Variables**: `camelCase`
- **Constants**: `SCREAMING_SNAKE_CASE`
- **Database tables**: `snake_case`
- **TypeScript types**: `PascalCase`

### Import Organization
```typescript
// 1. React/Next imports
import { useState } from 'react'
import Link from 'next/link'

// 2. Third-party libraries
import { format } from 'date-fns'

// 3. Internal aliases (@/)
import { Button } from '@/components/ui/button'
import { getEvents } from '@/lib/queries/events'

// 4. Relative imports
import { EventCardSkeleton } from './event-card-skeleton'

// 5. Types
import type { Event } from '@/types/database'
```

### Component Patterns
- Prefer Server Components by default
- Use `'use client'` only when necessary (interactivity, hooks)
- Colocate related files (component + styles + tests)
- Extract reusable logic into custom hooks

---

## Current Phase: 1

Implement Phase 1 features only. Do not build Phase 2-4 features, but ensure the architecture supports future expansion.

**Phase 1 Deliverables:**
- Public event browsing (list + detail views)
- Category and tag filtering
- Date-based filtering
- Venue and organizer pages
- Admin event/venue/organizer management
- Responsive design
- SEO optimization
