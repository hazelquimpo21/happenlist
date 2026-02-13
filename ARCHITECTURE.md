# Happenlist Technical Architecture Guide

> A consolidated reference for developers and AI agents working on the Happenlist codebase.
> Covers data flow, conventions, patterns, and troubleshooting.

---

## Table of Contents

1. [Data Flow](#1-data-flow)
2. [Key Architecture Principles](#2-key-architecture-principles)
3. [State Management](#3-state-management)
4. [Auth Flow](#4-auth-flow)
5. [Image System](#5-image-system)
6. [Component Taxonomy](#6-component-taxonomy)
7. [Performance Optimizations](#7-performance-optimizations)
8. [URL Patterns](#8-url-patterns)
9. [API Routes Reference](#9-api-routes-reference)
10. [Common Development Tasks](#10-common-development-tasks)
11. [Logging Conventions](#11-logging-conventions)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Data Flow

Every user request follows a consistent pipeline from URL to rendered page. The data layer is strictly separated from rendering.

```
  Browser Request (e.g. GET /events?category=music&page=2)
       |
       v
  +------------------------------------------------------------------+
  |  NEXT.JS MIDDLEWARE  (src/middleware.ts)                          |
  |  - Refreshes Supabase auth session via cookies                   |
  |  - PKCE code verifier handling                                   |
  +------------------------------------------------------------------+
       |
       v
  +------------------------------------------------------------------+
  |  SERVER COMPONENT  (src/app/events/page.tsx)                     |
  |                                                                  |
  |  - Reads searchParams (category, page, free, q, goodFor, etc.)   |
  |  - Calls data layer functions, never queries DB directly         |
  |  - Passes fetched data as props to presentation components       |
  |                                                                  |
  |  const [{ events, total }, categories] = await Promise.all([     |
  |    getEvents({ categorySlug, page, limit: 24 }),                 |
  |    getCategories(),                                              |
  |  ]);                                                             |
  |  return <EventGrid events={events} />;                           |
  +------------------------------------------------------------------+
       |
       v
  +------------------------------------------------------------------+
  |  DATA LAYER  (src/data/events/get-events.ts)                     |
  |                                                                  |
  |  - Creates a server Supabase client                              |
  |  - Builds a typed query with filters, joins, pagination          |
  |  - Transforms raw rows into typed EventCard objects              |
  |                                                                  |
  |  const supabase = await createClient();                          |
  |  const { data, count } = await supabase                          |
  |    .from('events')                                               |
  |    .select('id, title, ..., category:categories(name, slug)',    |
  |            { count: 'exact' })                                   |
  |    .eq('status', 'published')                                    |
  |    .gte('instance_date', today);                                 |
  +------------------------------------------------------------------+
       |
       v
  +------------------------------------------------------------------+
  |  SUPABASE / POSTGRESQL                                           |
  |                                                                  |
  |  - Uses performance indexes (idx_events_status_date, etc.)       |
  |  - RLS policies restrict visibility by status and ownership      |
  |  - Returns JSON data to the data layer                           |
  +------------------------------------------------------------------+
       |
       v
  +------------------------------------------------------------------+
  |  PRESENTATION COMPONENTS  (src/components/events/event-grid.tsx) |
  |                                                                  |
  |  - Receives typed props (EventCard[])                            |
  |  - Renders UI; no data fetching logic                            |
  |  - EventGrid maps over events to render EventCard components     |
  |  - EventCard is wrapped in React.memo for grid performance       |
  +------------------------------------------------------------------+
       |
       v
  HTML streamed to browser via React Server Components
```

**Key invariant**: Components never import from `src/data/`. Pages (in `src/app/`) call the data layer and thread results down as props.

---

## 2. Key Architecture Principles

### Server Components by Default

All page components in `src/app/` are React Server Components. The `'use client'` directive is only added when the component needs:
- Browser event handlers (onClick, onChange)
- React hooks (useState, useEffect, useContext)
- Browser-only APIs (window, localStorage)

Client components live primarily in `src/components/` and are kept as small and leaf-level as possible.

### Data Fetching in src/data/ Only

All database queries live in `src/data/`. Components never import Supabase clients or execute queries. This provides:
- A single place to audit all database access
- Easy query reuse across multiple pages
- Clean separation between data logic and rendering logic

```
src/data/
  events/        getEvents, getEvent, getFeaturedEvents
  venues/        getVenues, searchVenues
  categories/    getCategories, getCategoryBySlug
  series/        getSeries, getSeriesDetail
  organizers/    getOrganizers
  user/          getHearts, checkHearts, toggleHeart, getFollows, toggleFollow,
                 getProfile, updateProfile
  admin/         getAdminStats, getAdminEvent, getPendingEvents, eventActions
  superadmin/    superadminEventActions
  submit/        submitEvent, draftActions, getSubmissions, searchSeries
```

### URL-Based State for Filters

Filters, pagination, and search are driven by URL search parameters, not component state. This enables:
- Shareable links (`/events?category=music&free=true`)
- Browser back/forward navigation
- SEO-friendly crawlable filter pages
- Server-side data fetching without client waterfalls

The page component reads `searchParams` and passes them to the data layer.

### Separation of Concerns

| Folder | Responsibility | Rule |
|--------|---------------|------|
| `src/app/` | Routing, page layouts, metadata, API routes | Calls data layer, passes props to components |
| `src/components/` | UI rendering, user interaction | Receives props, never fetches data |
| `src/data/` | Database queries, data transformation | Returns typed objects, no UI logic |
| `src/lib/` | Pure utility functions, Supabase clients, auth helpers | Stateless, reusable |
| `src/types/` | TypeScript type definitions | Types and interfaces only |
| `src/contexts/` | React context providers | Auth state management |
| `src/hooks/` | Custom React hooks | Reusable client-side logic |

---

## 3. State Management

Happenlist uses four distinct types of state, each with a clear owner.

| State Type | Location | Examples | Mutated By |
|------------|----------|----------|------------|
| **Server state** | Supabase PostgreSQL via `src/data/` layer | Events, venues, categories, hearts, follows | API routes, data layer mutations |
| **Auth state** | `AuthContext` (`src/contexts/auth-context.tsx`) + Supabase session | Current user, role, login status | `signIn()`, `signOut()`, `onAuthStateChange` listener |
| **URL state** | Next.js `searchParams` and route params | Category filter, page number, search query, date range | `<a>` tags and `router.push()` |
| **UI state** | Local component `useState` | Modal open/closed, loading spinners, form inputs | Component event handlers |

### Why No Global Client State Library

There is no Redux, Zustand, or similar. The reasons:
- Server Components fetch data on the server, so client caches are unnecessary.
- Filters live in the URL, so there is no need for a client-side filter store.
- Auth is the only truly global client state, handled by a single React context.
- Local UI state (modals, drawers) is scoped to the component that owns it.

---

## 4. Auth Flow

### Magic Link Authentication

Happenlist uses Supabase Auth with passwordless magic links. No passwords are stored.

```
1. User visits /auth/login
   --> LoginForm component renders email input

2. User enters email and clicks "Send Magic Link"
   --> AuthContext.signIn(email) calls supabase.auth.signInWithOtp()
   --> Supabase sends an email with a one-time magic link
   --> The link points to /auth/callback?code=...&next=/events

3. User clicks the link in their email
   --> Browser navigates to /auth/callback
   --> Callback route exchanges the code for a session
   --> Supabase sets auth cookies via middleware
   --> User is redirected to the `next` URL or homepage

4. AuthProvider detects the session change
   --> onAuthStateChange fires with SIGNED_IN event
   --> buildUserSession() creates a UserSession object
   --> All components using useAuth() re-render with the new session
```

### User Roles

Roles are determined at login time by checking the user's email against environment variables. There is no database roles table for this.

| Role | Detection | Capabilities |
|------|-----------|-------------|
| **Guest** | Not logged in | Browse published events, search |
| **Attendee** | Any authenticated user | Heart events, follow series, submit events |
| **Organizer** | Has associated organizer profile | Submit events, manage own events |
| **Admin** | Email listed in `ADMIN_EMAILS` env var | Approve/reject events, view admin dashboard, manage pending queue |
| **Superadmin** | Email listed in `SUPERADMIN_EMAILS` env var | All admin powers plus: edit any event from any page, delete any event, change any event status, access superadmin API routes |

Role detection happens in `src/contexts/auth-context.tsx` via:
- `src/lib/auth/is-admin.ts` -- checks `ADMIN_EMAILS` env var
- `src/lib/auth/is-superadmin.ts` -- checks `SUPERADMIN_EMAILS` env var
- Superadmins are automatically also admins

### Session Management

- The Next.js middleware (`src/middleware.ts`) runs on every non-static request
- It creates a Supabase server client that reads/writes auth cookies
- It calls `supabase.auth.getUser()` to refresh expired tokens
- Without this middleware, the PKCE auth flow breaks

---

## 5. Image System

### Three Image Slots

Each event row in the database can have up to three image URLs plus a raw debug URL:

| Field | Purpose | Typical Source |
|-------|---------|---------------|
| `image_url` | Main hero image displayed on detail page | Re-hosted to Supabase Storage |
| `thumbnail_url` | Card image displayed in grids and lists | Re-hosted to Supabase Storage |
| `flyer_url` | Event flyer/poster, viewable in lightbox | Re-hosted to Supabase Storage |
| `raw_image_url` | Original scraped URL (debugging only) | External CDN, never displayed directly |

### Image Selection and Validation

The `getBestImageUrl()` function in `src/lib/utils/image.ts` selects the first valid image URL from an ordered list of candidates:

```typescript
getBestImageUrl(event.thumbnail_url, event.image_url, event.flyer_url)
```

Each URL is validated by `isValidImageUrl()` which:
1. Rejects known page URL patterns (Instagram posts, Eventbrite event pages, Facebook event pages)
2. Accepts URLs with known image extensions (.jpg, .png, .webp, etc.)
3. Accepts URLs matching known image CDN patterns (Supabase Storage, Cloudinary, Instagram CDN, Eventbrite CDN, etc.)
4. Accepts URLs with image-related query parameters (w, h, format, fit, crop)
5. Conservatively rejects anything it cannot classify

### Re-hosting to Supabase Storage

External image URLs from scrapers are re-hosted to Supabase Storage via the `/api/images/upload` endpoint. This ensures:
- Images remain available even if the original source goes down
- Consistent performance from a single CDN
- Compatibility with Next.js Image optimization

### Fallback to Letter Placeholders

When no valid image URL exists, the `EventImage` component renders a letter-based placeholder using the first character of the event title. This prevents broken image icons and maintains visual consistency in grids.

### Display Flow

```
EventCard
  --> EventImage component
       --> Tries src prop (image_url) via isValidImageUrl()
       --> Falls back to fallbackSrc prop (thumbnail_url)
       --> Falls back to letter placeholder (first char of title)
       --> Renders via next/image with lazy loading (or priority for above-fold)
```

---

## 6. Component Taxonomy

### UI Components (src/components/ui/)

Base building blocks with no business logic. Accept generic props and styling variants.

| Component | Purpose |
|-----------|---------|
| `Button` | Primary CTA, ghost, and danger variants |
| `Badge` | Category tags, status indicators |
| `Card` | Content containers with consistent shadows |
| `Input` | Form inputs with validation states |
| `Skeleton` | Loading placeholders matching content shape |
| `Spinner` | Animated loading indicator |

### Event Components (src/components/events/)

Event-specific UI built on top of base components.

| Component | Purpose |
|-----------|---------|
| `EventCard` | Primary card for listings (React.memo wrapped) |
| `EventImage` | Smart image with CDN validation and letter fallback |
| `EventGrid` | Responsive CSS grid of EventCards with empty state |
| `EventPrice` | Price formatting (Free, $15, $15-$25, See details) |
| `EventDate` | Date formatting (Feb 14) |
| `EventDateTime` | Full date and time formatting |
| `EventLinks` | External links (tickets, website, social) |
| `SectionHeader` | Section title with optional "See all" link |
| `FlyerLightbox` | Fullscreen flyer/poster viewer overlay |

### Layout Components (src/components/layout/)

Page structure shared across all routes.

| Component | Purpose |
|-----------|---------|
| `Header` | Logo, navigation, search bar, auth controls |
| `HeaderAuth` | Auth-aware portion of header (login button or user menu) |
| `MobileMenu` | Slide-out navigation for small screens |
| `Footer` | Site links, copyright |
| `Container` | Max-width wrapper with horizontal padding |
| `Breadcrumbs` | Hierarchical navigation breadcrumbs |

### Series Components (src/components/series/)

Recurring event series UI.

| Component | Purpose |
|-----------|---------|
| `SeriesCard` | Card for series listings |
| `SeriesGrid` | Grid of SeriesCards |
| `SeriesTypeBadge` | Badge showing recurrence type (weekly, monthly, etc.) |
| `SeriesHeader` | Series detail page header |
| `SeriesPrice` | Price display for series |
| `SeriesLinkBadge` | External link badge for series |
| `SeriesEventsList` | List of upcoming instances in a series |
| `SeriesSkeleton` | Loading skeleton for series cards |

### Auth Components (src/components/auth/)

Authentication UI.

| Component | Purpose |
|-----------|---------|
| `LoginForm` | Email input + magic link send button |
| `UserMenu` | Dropdown with profile, hearts, settings, sign out |
| `UserAvatar` | User avatar with initial fallback |

### Admin Components (src/components/admin/)

Admin dashboard UI (accessible at /admin routes).

| Component | Purpose |
|-----------|---------|
| `AdminHeader` | Admin area header and navigation |
| `AdminSidebar` | Admin navigation sidebar |
| `AdminEventCard` | Event card with admin action buttons |
| `AdminEventFilters` | Status and date filters for admin event list |
| `StatCard` | Dashboard statistic display card |

### Superadmin Components (src/components/admin-anywhere/)

Superadmin edit-from-any-page system.

| Component | Purpose |
|-----------|---------|
| `AdminToolbar` | Floating toolbar on any page for superadmins |
| `QuickEditDrawer` | Slide-out drawer for editing event fields inline |
| `QuickEditForm` | Form fields inside the quick edit drawer |
| `StatusBadgeSelect` | Inline status changer with visual badge |

### Other Component Groups

| Group | Location | Components |
|-------|----------|------------|
| Submit | `src/components/submit/` | FormWrapper, StepProgress, Step1-7 (multi-step event submission wizard) |
| Hearts | `src/components/hearts/` | HeartButton, HeartButtonCompact |
| Search | `src/components/search/` | SearchBar |
| Categories | `src/components/categories/` | CategoryGrid |
| Maps | `src/components/maps/` | VenueMap, AddressSearch |
| Venues | `src/components/venues/` | VenueSocialLinks |
| SEO | `src/components/seo/` | JsonLd (structured data for search engines) |
| Superadmin | `src/components/superadmin/` | EventEditForm |

---

## 7. Performance Optimizations

### Database Indexes

The migration at `supabase/migrations/20260106_performance_indexes.sql` adds 20+ indexes. The most critical:

```sql
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_status_date ON events(status, instance_date DESC);
CREATE INDEX idx_events_category_id ON events(category_id);
CREATE INDEX idx_hearts_user_id ON hearts(user_id);
```

These ensure that the primary event listing query (filter by status, sort by date) uses an index scan rather than a sequential scan.

### React.memo on EventCard

`EventCard` is wrapped in `React.memo()` to prevent unnecessary re-renders in grids of 24+ cards. When a parent component re-renders (e.g., a filter changes), only cards with changed data re-render.

### next/image Lazy Loading

All event images use the Next.js `<Image>` component, which provides:
- Automatic WebP/AVIF conversion
- Responsive srcset generation
- Lazy loading by default for below-the-fold images
- `priority={true}` for above-the-fold images to improve LCP

### Disabled Router Cache for Fresh Data

Pages that display live data use `export const dynamic = 'force-dynamic'` to bypass the Next.js router cache. This ensures users always see current event listings and counts rather than stale cached data.

### Admin Stats Optimization

Admin dashboard statistics use SQL `COUNT` aggregations with indexes rather than fetching all events and filtering in JavaScript. This is critical at scale (10K+ events).

---

## 8. URL Patterns

### Public Pages

| Route | Description | Key Params |
|-------|-------------|------------|
| `/` | Homepage with featured events and categories | -- |
| `/events` | All events listing with filters | `?category=`, `?free=true`, `?q=`, `?goodFor=`, `?from=`, `?to=`, `?page=` |
| `/events/today` | Events happening today | -- |
| `/events/this-weekend` | Events this weekend | -- |
| `/events/archive/[year]/[month]` | Past events archive | -- |
| `/events/[slug]` | Alternate event detail route | -- |
| `/event/[slug]` | Event detail page | -- |
| `/venues` | All venues listing | -- |
| `/venue/[slug]` | Venue detail with upcoming events | -- |
| `/series` | All recurring event series | -- |
| `/series/[slug]` | Series detail with upcoming instances | -- |
| `/organizers` | All organizers listing | -- |
| `/organizer/[slug]` | Organizer detail with their events | -- |
| `/search` | Search results page | `?q=` |
| `/about` | About page | -- |
| `/contact` | Contact page | -- |

### Auth Pages

| Route | Description |
|-------|-------------|
| `/auth/login` | Login page with magic link form |
| `/auth/callback` | OAuth/magic link callback handler |

### Authenticated User Pages (src/app/my/)

| Route | Description |
|-------|-------------|
| `/my/hearts` | User's hearted/saved events |
| `/my/submissions` | User's submitted events and drafts |
| `/my/settings` | Profile and notification settings |

### Event Submission Pages (src/app/submit/)

| Route | Description |
|-------|-------------|
| `/submit/new` | Multi-step event submission wizard |
| `/submit/success` | Submission confirmation page |

### Admin Pages (src/app/admin/)

| Route | Description |
|-------|-------------|
| `/admin` | Admin dashboard with stats |
| `/admin/events` | All events management list |
| `/admin/events/pending` | Pending approval queue |
| `/admin/events/[id]` | Admin event detail view |
| `/admin/events/[id]/edit` | Admin event edit form |
| `/admin/activity` | Admin activity log |

---

## 9. API Routes Reference

All API routes live in `src/app/api/` and use Next.js Route Handlers.

### Scraper

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/scraper/events` | POST | Ingest events from external scrapers |

### Images

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/images/upload` | POST | Upload/re-host an image to Supabase Storage |
| `/api/images/test` | GET | Test image upload configuration |

### User Interactions

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/hearts` | POST | Toggle heart on/off for an event |
| `/api/follows` | POST | Toggle follow on/off for a series |
| `/api/profile` | GET/PATCH | Read or update the current user's profile |

### Event Submission

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/submit/event` | POST | Submit a completed event for review |
| `/api/submit/draft` | POST | Create or list event drafts |
| `/api/submit/draft/[id]` | PATCH/DELETE | Update or delete a specific draft |
| `/api/submit/venues/search` | GET | Search venues during event submission |
| `/api/submit/series/search` | GET | Search series during event submission |

### Admin Event Actions

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/events/[id]/approve` | POST | Approve a pending event |
| `/api/admin/events/[id]/reject` | POST | Reject a pending event |
| `/api/admin/events/[id]/request-changes` | POST | Request changes on a submission |
| `/api/admin/events/[id]/delete` | DELETE | Soft-delete an event |
| `/api/admin/events/[id]/restore` | POST | Restore a soft-deleted event |
| `/api/admin/migrate-images` | POST | Batch re-host external images to Supabase Storage |

### Superadmin Event Actions

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/superadmin/events/[id]` | PATCH | Edit any event's fields (superadmin only) |
| `/api/superadmin/events/[id]/status` | PATCH | Change any event's status (superadmin only) |
| `/api/superadmin/events/[id]/restore` | POST | Restore any soft-deleted event (superadmin only) |

---

## 10. Common Development Tasks

### Adding a New Page

1. Create the route folder and page file:
   ```
   src/app/my-new-page/page.tsx
   ```
2. The page component is a Server Component by default. Fetch data from the data layer:
   ```typescript
   import { getEvents } from '@/data/events';

   export default async function MyNewPage() {
     const { events } = await getEvents({ limit: 10 });
     return <div>{/* render events */}</div>;
   }
   ```
3. Add a `loading.tsx` in the same folder for the loading skeleton state.
4. Add navigation links in `src/components/layout/header.tsx` if needed.
5. Export metadata for SEO:
   ```typescript
   export const metadata: Metadata = {
     title: 'My New Page',
     description: 'Description for search engines.',
   };
   ```

### Adding a New Database Field to Events

1. **Database**: Add the column in Supabase SQL Editor:
   ```sql
   ALTER TABLE events ADD COLUMN my_field text;
   ```
2. **Types**: Add the field to the relevant type in `src/types/event.ts` (e.g., `EventCard`, `EventWithDetails`).
3. **Data layer**: Add the field to the `select()` call in `src/data/events/get-events.ts` and update the `transformToEventCard()` function.
4. **Component**: Display the field in the appropriate component (e.g., `src/components/events/event-card.tsx`).
5. **Admin**: If editable, add the field to the admin edit form and the superadmin quick-edit form.

### Adding a New Component

1. Create the file in the appropriate subfolder:
   ```
   src/components/events/my-component.tsx
   ```
2. Follow existing patterns: typed props interface, JSDoc comment block, Tailwind styling.
3. If the component needs browser interactivity, add `'use client'` at the top.
4. Export it from the folder's `index.ts` barrel file (if one exists).
5. Import and use it in pages or other components.

### Adding a New API Route

1. Create the route handler:
   ```
   src/app/api/my-route/route.ts
   ```
2. Export the HTTP method handler:
   ```typescript
   import { NextRequest, NextResponse } from 'next/server';

   export async function POST(request: NextRequest) {
     // Authenticate, validate, execute, respond
     return NextResponse.json({ success: true });
   }
   ```
3. For authenticated routes, verify the session using `supabase.auth.getUser()`.
4. For admin routes, check the user's email with `isAdmin()` or `requireSuperAdmin()`.

### Adding a New Data Layer Function

1. Create or update a file in the appropriate `src/data/` subfolder.
2. Import and use `createClient` from `@/lib/supabase/server` for server-side queries.
3. Return strongly typed results.
4. Add emoji-prefixed console.log statements for debugging (see Logging Conventions below).
5. Export the function from the subfolder's `index.ts` barrel file.

---

## 11. Logging Conventions

Happenlist uses an emoji-prefixed `console.log` pattern for visual scanning in development. There are two approaches used in the codebase:

### Inline Emoji Logging (in data layer and pages)

Used in `src/data/` functions and page components for lightweight tracing:

```typescript
console.log('📋 [getEvents] Fetching events with params:', { search, categorySlug });
console.log(`✅ [getEvents] Found ${events.length} events (total: ${count})`);
console.error('❌ [getEvents] Error fetching events:', error);
console.warn('⚠️ [EventCard] Invalid date:', dateString);
```

### Structured Logger (in auth and admin features)

The `createLogger()` utility from `src/lib/utils/logger.ts` provides richer structured logging with timing, context, and action-specific prefixes:

```typescript
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('MyModule');

logger.info('Operation started');           // ℹ️  [MyModule] Operation started
logger.success('Done', { duration: 42 });   // ✅ [MyModule] Done (42ms)
logger.warn('Heads up');                     // ⚠️  [MyModule] Heads up
logger.error('Failed', error);              // ❌ [MyModule] Failed
logger.debug('Details', { metadata: {} });  // 🔍 [MyModule] Details (dev only)
```

The logger also supports timed operations:

```typescript
const timer = logger.time('fetchEvents');
// ... do work ...
timer.success('Fetched 24 events');   // ✅ [MyModule] Fetched 24 events (123ms)
timer.error('Query failed', error);   // ❌ [MyModule] Failed: fetchEvents - Query failed (45ms)
```

### Standard Prefixes

| Emoji | Meaning |
|-------|---------|
| `📋` | Fetching / listing data |
| `✅` | Success |
| `❌` | Error |
| `⚠️` | Warning |
| `🔍` | Debug / search |
| `🔐` | Auth operation |
| `🦸` | Superadmin operation |
| `🎉` | Notable success (sign in, approval) |
| `👋` | Sign out |
| `✏️` | Edit operation |
| `🗑️` | Delete operation |
| `📢` | Publish operation |

---

## 12. Troubleshooting

### Images Not Showing

1. **Check the image URL in the database.** Open the event row in Supabase and inspect `image_url`, `thumbnail_url`, and `flyer_url`. Run the URL through `isValidImageUrl()` logic mentally:
   - If it is a page URL (e.g., `instagram.com/p/ABC123/`), it will be rejected. The fix is to re-host the actual image via `/api/images/upload`.
   - If it points to an unrecognized CDN, add the pattern to `IMAGE_CDN_PATTERNS` in `src/lib/utils/image.ts`.

2. **Check the Supabase Storage bucket.** Ensure the `event-images` bucket exists and its policy allows public reads.

3. **Check next.config.ts image domains.** The `images.remotePatterns` configuration must include the domain of the image URL. Add missing domains as needed.

4. **Check browser DevTools.** Open Network tab, filter by Img, and look for 400/404 responses on image requests. A 400 from `/_next/image` usually means the domain is not in `remotePatterns`.

### Slow Page Loads

1. **Run the performance indexes migration.** If the database is missing indexes, listing queries will do sequential scans. Apply `supabase/migrations/20260106_performance_indexes.sql`.

2. **Check for unnecessary `count: 'exact'`.** The `count: 'exact'` option in Supabase queries adds overhead. Only use it when you need to display total counts or pagination.

3. **Add `priority={true}` to above-the-fold images.** The first few EventCards visible without scrolling should have `priority` set so the browser fetches images immediately.

4. **Check Supabase logs.** In the Supabase Dashboard, go to Logs and look for queries taking more than 100ms. These may need additional indexes or query restructuring.

### Auth Not Working

1. **Check `NEXT_PUBLIC_SITE_URL`.** This must exactly match the domain the user is visiting (e.g., `http://localhost:3000` in development, `https://happenlist.com` in production). If it mismatches, the magic link callback URL will be wrong.

2. **Check Supabase Auth URL Configuration.** In the Supabase Dashboard under Authentication > URL Configuration, verify the Site URL and Redirect URLs include your domain.

3. **Verify the `/auth/callback` route exists.** The magic link redirects to this route. If it is missing or broken, the auth code exchange will fail silently.

4. **Check middleware is running.** The middleware at `src/middleware.ts` must run on auth routes to handle cookie management. Verify its matcher pattern does not exclude `/auth/callback`.

5. **Check environment variables.** Both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be set. If they are missing, the middleware logs a warning and skips auth entirely.

### Admin Features Not Visible

1. **Check `ADMIN_EMAILS` env var.** The user's email must be in the comma-separated list. Emails are compared case-insensitively.

2. **Check `SUPERADMIN_EMAILS` env var.** For superadmin features (edit-from-any-page toolbar, quick edit drawer), the email must be in this separate list.

3. **Refresh the session.** After changing environment variables, the user must sign out and sign back in for the role to update. The role is determined at session creation time.

### Hearts / Follows Not Working

1. **Check authentication.** Hearts and follows require a logged-in user. Verify `useAuth()` returns an active session.

2. **Check RLS policies.** The `hearts` and `follows` tables in Supabase must have Row Level Security policies that allow authenticated users to insert/delete their own rows.

3. **Check the API routes.** `/api/hearts` and `/api/follows` must be accessible. Look for 401 or 500 errors in the browser network tab.

---

*Last updated: February 2026*
