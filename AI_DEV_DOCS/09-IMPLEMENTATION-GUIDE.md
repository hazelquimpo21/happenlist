# Happenlist: Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing Happenlist. Follow these phases in order, completing each before moving to the next.

---

## Phase 1: Foundation Setup

### Step 1.1: Project Initialization

```bash
# Create Next.js project
npx create-next-app@latest happenlist --typescript --tailwind --eslint --app --src-dir

# Install dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install lucide-react date-fns slugify
npm install -D @types/node
```

### Step 1.2: Configure Tailwind

Extend `tailwind.config.ts` with the design system tokens from `01-DESIGN-SYSTEM.md`:

- Add custom colors (cream, warm-white, sand, stone, charcoal, coral, sage)
- Add custom fonts (Fraunces, Inter)
- Add custom font sizes
- Add custom border radius values
- Add custom box shadows

### Step 1.3: Set Up Supabase

1. Create Supabase project at supabase.com
2. Copy connection credentials to `.env.local`
3. Create Supabase client files:
   - `src/lib/supabase/client.ts` (browser)
   - `src/lib/supabase/server.ts` (server)
4. Run database migrations from `02-DATABASE-SCHEMA.md`
5. Generate TypeScript types: `npx supabase gen types typescript`

### Step 1.4: Create Base UI Components

Build these first (from `04-COMPONENTS.md`):

1. `src/components/ui/button.tsx`
2. `src/components/ui/badge.tsx`
3. `src/components/ui/card.tsx`
4. `src/components/ui/input.tsx`
5. `src/components/ui/skeleton.tsx`
6. `src/components/ui/spinner.tsx`

**Testing checkpoint:** Create a test page that renders all UI components to verify styling.

### Step 1.5: Create Layout Components

1. `src/components/layout/container.tsx`
2. `src/components/layout/header.tsx` (basic version, no auth)
3. `src/components/layout/footer.tsx`
4. `src/components/layout/breadcrumbs.tsx`

### Step 1.6: Set Up Root Layout

Update `src/app/layout.tsx`:
- Import fonts (Google Fonts)
- Add Header and Footer
- Set up metadata defaults

---

## Phase 2: Core Data Layer

### Step 2.1: Type Definitions

Create all types from `06-DATA-FETCHING.md`:

1. `src/types/event.ts`
2. `src/types/venue.ts`
3. `src/types/organizer.ts`
4. `src/types/category.ts`
5. `src/types/filters.ts`
6. `src/types/index.ts` (barrel export)

### Step 2.2: Utility Functions

1. `src/lib/utils/cn.ts` - className utility
2. `src/lib/utils/dates.ts` - Date formatting
3. `src/lib/utils/price.ts` - Price formatting
4. `src/lib/utils/slug.ts` - Slug generation
5. `src/lib/utils/url.ts` - URL builders

### Step 2.3: Data Fetching Functions

Build in this order:

1. `src/data/categories/get-categories.ts`
2. `src/data/events/get-events.ts`
3. `src/data/events/get-event.ts`
4. `src/data/events/get-featured-events.ts`
5. `src/data/venues/get-venues.ts`
6. `src/data/venues/get-venue.ts`
7. `src/data/organizers/get-organizers.ts`
8. `src/data/organizers/get-organizer.ts`

**Testing checkpoint:** Write a test script that calls each data function and logs results.

---

## Phase 3: Event Components

### Step 3.1: Event Display Components

Build in this order:

1. `src/components/events/event-price.tsx` - Price display logic
2. `src/components/events/event-date.tsx` - Date formatting
3. `src/components/events/event-card.tsx` - Main card component
4. `src/components/events/event-card-skeleton.tsx` - Loading state
5. `src/components/events/event-grid.tsx` - Grid layout

### Step 3.2: Event Detail Components

1. `src/components/events/event-hero.tsx`
2. `src/components/events/event-details.tsx`
3. `src/components/events/event-location.tsx`
4. `src/components/events/related-events.tsx`

### Step 3.3: Featured Events

1. `src/components/events/featured-events.tsx`
2. `src/components/home/section-header.tsx`

---

## Phase 4: Core Pages

### Step 4.1: Home Page

**File:** `src/app/page.tsx`

Sections to implement:
1. Hero with search bar
2. Quick filter buttons
3. Featured events section
4. Category grid
5. This weekend section
6. Popular venues section

### Step 4.2: Events Index Page

**File:** `src/app/events/page.tsx`

Components needed:
1. Search bar
2. Date quick filters
3. Filter sidebar (categories, price, venue type)
4. Active filter pills
5. Sort dropdown
6. Event grid with pagination

### Step 4.3: Event Detail Page

**File:** `src/app/event/[slug]/page.tsx`

Sections:
1. Breadcrumbs
2. Hero image(s)
3. Event details (title, date, location, price)
4. Description
5. Organizer card
6. Related events
7. JSON-LD structured data

### Step 4.4: Date-Filtered Pages

1. `src/app/events/today/page.tsx`
2. `src/app/events/this-weekend/page.tsx`
3. `src/app/events/[year]/[month]/page.tsx`

### Step 4.5: Category Pages

**File:** `src/app/events/[categorySlug]/page.tsx`

Reuse events index components with category filter pre-applied.

---

## Phase 5: Venues & Organizers

### Step 5.1: Venue Components

1. `src/components/venues/venue-card.tsx`
2. `src/components/venues/venue-grid.tsx`
3. `src/components/venues/venue-header.tsx`
4. `src/components/venues/venue-events.tsx`

### Step 5.2: Venue Pages

1. `src/app/venues/page.tsx` - Index
2. `src/app/venue/[slug]/page.tsx` - Detail

### Step 5.3: Organizer Components

1. `src/components/organizers/organizer-card.tsx`
2. `src/components/organizers/organizer-header.tsx`
3. `src/components/organizers/organizer-events.tsx`

### Step 5.4: Organizer Pages

1. `src/app/organizers/page.tsx` - Index
2. `src/app/organizer/[slug]/page.tsx` - Detail

---

## Phase 6: Search

### Step 6.1: Search Components

1. `src/components/search/search-bar.tsx`
2. `src/components/search/search-suggestions.tsx`
3. `src/components/search/search-results.tsx`
4. `src/components/search/search-empty.tsx`

### Step 6.2: Search API

**File:** `src/app/api/search/route.ts`

### Step 6.3: Search Page

**File:** `src/app/search/page.tsx`

### Step 6.4: Integrate Search

- Add search to header
- Add hero search on home page

---

## Phase 7: SEO & Performance

### Step 7.1: Structured Data

1. `src/components/seo/event-json-ld.tsx`
2. `src/components/seo/venue-json-ld.tsx`
3. `src/components/seo/organization-json-ld.tsx`
4. `src/components/seo/breadcrumbs-json-ld.tsx`

Add JSON-LD to all detail pages.

### Step 7.2: Sitemap & Robots

1. `src/app/sitemap.ts`
2. `src/app/robots.ts`

### Step 7.3: Metadata

Ensure all pages have proper:
- Title (using template)
- Description
- Open Graph tags
- Canonical URLs

### Step 7.4: Performance

1. Implement image optimization with next/image
2. Add loading states (skeletons)
3. Configure caching/ISR where appropriate

---

## Phase 8: Filters & Interactions (Client-Side)

### Step 8.1: Filter State Management

1. `src/hooks/use-event-filters.ts`
2. `src/hooks/use-debounce.ts`

### Step 8.2: Filter Components

1. `src/components/filters/filter-sidebar.tsx`
2. `src/components/filters/filter-date.tsx`
3. `src/components/filters/filter-category.tsx`
4. `src/components/filters/filter-price.tsx`
5. `src/components/filters/filter-pills.tsx`
6. `src/components/filters/sort-dropdown.tsx`

### Step 8.3: Integrate Filters

Update events index to use client-side filtering with URL state.

---

## Phase 9: User Authentication (Phase 3 Feature)

### Step 9.1: Auth Setup

1. Configure Supabase Auth
2. Create `src/middleware.ts` for route protection
3. Create `src/components/auth/auth-provider.tsx`

### Step 9.2: Auth Pages

1. `src/app/(auth)/login/page.tsx`
2. `src/app/(auth)/signup/page.tsx`
3. `src/app/(auth)/callback/route.ts`

### Step 9.3: Auth UI

1. `src/components/auth/login-form.tsx`
2. `src/components/auth/signup-form.tsx`
3. `src/components/auth/user-menu.tsx`

Update header to show user state.

---

## Phase 10: Hearts/Saves (Phase 3 Feature)

### Step 10.1: Hearts Backend

1. Create hearts table (migration)
2. Set up RLS policies
3. Create `src/app/api/hearts/route.ts`

### Step 10.2: Hearts Components

1. `src/components/hearts/heart-button.tsx`
2. `src/hooks/use-heart.ts`

### Step 10.3: My Hearts Page

1. `src/app/my/hearts/page.tsx`
2. `src/data/hearts/get-user-hearts.ts`

### Step 10.4: Integrate Hearts

Add HeartButton to:
- Event cards
- Event detail page

---

## Testing Checkpoints

After each phase, verify:

### Phase 1-2
- [ ] Project runs without errors
- [ ] Tailwind styles apply correctly
- [ ] Supabase connection works
- [ ] Data functions return expected results

### Phase 3-4
- [ ] Event cards render correctly
- [ ] Home page displays all sections
- [ ] Events index shows events with pagination
- [ ] Event detail page shows all information

### Phase 5-6
- [ ] Venue and organizer pages work
- [ ] Search returns relevant results
- [ ] Search suggestions appear

### Phase 7
- [ ] SEO metadata appears in page source
- [ ] JSON-LD validates (use Google's testing tool)
- [ ] Sitemap generates correctly

### Phase 8
- [ ] Filters update URL params
- [ ] Filter changes reflect in event list
- [ ] Back/forward navigation works with filters

### Phase 9-10
- [ ] Sign up/login flows work
- [ ] Protected routes redirect to login
- [ ] Hearts persist across sessions
- [ ] My Hearts page shows saved events

---

## Common Pitfalls

1. **Server vs Client Components**
   - Default to Server Components
   - Only use 'use client' when needed (hooks, event handlers)
   - Pass data down from server to client components

2. **Supabase Auth in Server Components**
   - Always use the server client for data fetching
   - Use cookies() from next/headers

3. **URL State for Filters**
   - Keep filter state in URL for shareability
   - Use useSearchParams and useRouter

4. **TypeScript Strict Mode**
   - Handle null/undefined explicitly
   - Use proper type guards

5. **Image Optimization**
   - Always use next/image
   - Provide width/height or fill
   - Use appropriate sizes prop

---

## Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] Supabase production project created
- [ ] Database migrations applied to production
- [ ] RLS policies enabled
- [ ] Domain configured
- [ ] Analytics/monitoring set up
