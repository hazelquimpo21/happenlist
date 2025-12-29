# Technical Specification

## Technology Stack

### Core Framework
- **Next.js 14+** with App Router
- **React 18+** with Server Components
- **TypeScript** (strict mode)

### Database & Backend
- **Supabase**
  - PostgreSQL database
  - Row Level Security (RLS)
  - Supabase Auth
  - Supabase Storage (images)
  - Edge Functions (if needed)

### Styling
- **Tailwind CSS** with custom design tokens
- **CSS Variables** for theming
- **clsx** + **tailwind-merge** for conditional classes

### UI Components
- Custom components (no heavy UI library)
- **Lucide React** for icons
- **Radix UI** primitives for accessible interactions (dialog, dropdown, etc.)

### Forms & Validation
- **React Hook Form** for form state
- **Zod** for schema validation
- Server-side validation mirrors client schemas

### Date Handling
- **date-fns** for formatting and manipulation
- Store all dates in UTC
- Display in America/Chicago timezone

### Deployment
- **Vercel** for hosting
- Environment variables via Vercel dashboard
- Preview deployments for PRs

---

## Architecture Decisions

### Rendering Strategy

| Route | Strategy | Reason |
|-------|----------|--------|
| `/` (home) | SSG + ISR | Rarely changes, revalidate hourly |
| `/events` | SSR | Filters change URL, needs fresh data |
| `/events/[slug]` | SSG + ISR | Individual pages, revalidate on-demand |
| `/venues/[slug]` | SSG + ISR | Revalidate when events change |
| `/organizers/[slug]` | SSG + ISR | Revalidate when events change |
| `/categories/[slug]` | SSR | Filter variations |
| `/admin/*` | SSR | Always fresh, protected |

### Data Fetching Patterns

**Server Components (default)**
```typescript
// Direct database queries in Server Components
async function EventsPage({ searchParams }) {
  const events = await getEvents(searchParams)
  return <EventList events={events} />
}
```

**Server Actions (mutations)**
```typescript
// For admin forms
'use server'
async function createEvent(formData: FormData) {
  // Validate, insert, revalidate
}
```

**Client-Side (rare)**
- Only for highly interactive features
- Use SWR or React Query if needed
- Prefer server-first patterns

### Database Access

**Query Layer** (`/lib/queries/`)
- Typed query functions
- Single responsibility (one query per function)
- Return typed results
- Handle errors consistently

**Mutation Layer** (`/lib/actions/`)
- Server Actions for all mutations
- Validation with Zod
- Revalidate affected paths
- Return standardized responses

### Authentication Strategy

**Phase 1: Admin Only**
- Single admin account (email/password)
- Supabase Auth with RLS
- Middleware protects `/admin/*` routes
- No public signup

**Session Handling**
- Server-side session via Supabase SSR helpers
- Refresh tokens handled automatically
- Redirect to login on session expiry

---

## API Design

### No Traditional API Routes (Phase 1)

Instead of REST endpoints, use:
- **Server Components** for data fetching
- **Server Actions** for mutations
- **Route Handlers** only if external access needed

### Server Action Response Format

```typescript
type ActionResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }
```

### Error Handling

**Database Errors**
- Catch and log full error
- Return user-friendly message
- Never expose internal details

**Validation Errors**
- Return field-specific errors
- Display inline in forms

**Not Found**
- Use Next.js `notFound()` function
- Custom 404 page

---

## Image Handling

### Storage Structure

```
supabase-storage/
└── happenlist/
    ├── events/
    │   ├── thumbnails/
    │   │   └── {event-id}.webp
    │   └── flyers/
    │       └── {event-id}.webp
    ├── venues/
    │   └── {venue-id}.webp
    └── organizers/
        └── {organizer-id}.webp
```

### Upload Flow

1. Client selects file
2. Client-side validation (type, size)
3. Upload to Supabase Storage via signed URL
4. Store public URL in database
5. Use Supabase transforms for sizes (or pre-process)

### Image Requirements

| Type | Max Size | Dimensions | Format |
|------|----------|------------|--------|
| Event thumbnail | 2MB | 800x600 | WebP, JPG, PNG |
| Event flyer | 5MB | 1200x1600 | WebP, JPG, PNG |
| Venue image | 2MB | 800x600 | WebP, JPG, PNG |
| Organizer logo | 1MB | 400x400 | WebP, JPG, PNG |

---

## Security

### Row Level Security (RLS)

All tables have RLS enabled:

**Public Read**
```sql
-- Anyone can read published events
CREATE POLICY "Public can view published events"
ON events FOR SELECT
USING (status = 'published');
```

**Admin Write**
```sql
-- Only authenticated admin can insert/update/delete
CREATE POLICY "Admin can manage events"
ON events FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
```

### Input Validation

- All user input validated with Zod
- Server-side validation required (client is convenience)
- Sanitize HTML in descriptions (if allowing rich text)
- Validate URLs before storing

### Environment Variables

```bash
# Public (exposed to client)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Private (server only)
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Performance

### Optimization Strategies

**Static Generation**
- Pre-render as much as possible
- Use ISR for dynamic-ish content
- On-demand revalidation after admin changes

**Image Optimization**
- Use Next.js Image component
- Lazy load below-fold images
- Serve WebP with fallbacks
- Responsive srcset

**Bundle Size**
- Analyze with `@next/bundle-analyzer`
- Dynamic imports for heavy components
- No unnecessary client components

**Database**
- Indexes on filtered columns
- Limit query results
- Use `select` to fetch only needed columns

### Caching Strategy

| Resource | Cache Duration | Invalidation |
|----------|----------------|--------------|
| Event list | 5 minutes | On admin change |
| Event detail | 1 hour | On edit |
| Venue page | 1 hour | On event change |
| Static assets | 1 year | Versioned filenames |
| API responses | No cache | Always fresh |

---

## Testing Strategy

### Unit Tests
- Utility functions
- Validation schemas
- Data transformations

### Integration Tests
- Database queries
- Server actions
- Auth flows

### E2E Tests (optional Phase 1)
- Critical user paths
- Admin workflows

### Tools
- **Vitest** for unit/integration
- **Playwright** for E2E (if needed)
- **Testing Library** for component tests

---

## Development Workflow

### Local Setup

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local

# Run database migrations
pnpm db:migrate

# Seed initial data
pnpm db:seed

# Start dev server
pnpm dev
```

### Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "db:migrate": "supabase db push",
    "db:seed": "tsx scripts/seed.ts",
    "db:reset": "supabase db reset"
  }
}
```

### Git Workflow
- `main` branch is production
- Feature branches for development
- PR required for main (recommended)
- Vercel preview deployments

---

## Monitoring & Observability

### Phase 1 (Minimal)
- Vercel Analytics (built-in)
- Supabase Dashboard for DB metrics
- Console logging for errors

### Future
- Error tracking (Sentry)
- Custom analytics (Plausible/Posthog)
- Performance monitoring
