# 🏗️ Happenlist Architecture Guide

> **For Developers & Future You** — A comprehensive guide to how Happenlist works, what goes where, and how data flows through the application.

---

## 📖 Table of Contents

1. [Quick Start](#-quick-start)
2. [Tech Stack](#-tech-stack)
3. [Folder Structure](#-folder-structure)
4. [Data Flow](#-data-flow)
5. [State Management](#-state-management)
6. [Image System](#-image-system)
7. [Database Schema](#-database-schema)
8. [Component Taxonomy](#-component-taxonomy)
9. [Performance Optimizations](#-performance-optimizations)
10. [Commands Reference](#-commands-reference)

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Run the development server
npm run dev

# 4. Open http://localhost:3000
```

### Environment Variables You Need

```env
# Supabase (get these from your Supabase project settings)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# For admin features (comma-separated list of admin emails)
ADMIN_EMAILS=you@example.com,admin@happenlist.com

# Site URL (for auth redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why We Use It |
|-------|------------|---------------|
| **Framework** | Next.js 14+ (App Router) | Server components, great DX, Vercel deployment |
| **Language** | TypeScript | Type safety, better developer experience |
| **Database** | Supabase (PostgreSQL) | Real-time, auth, storage, RLS security |
| **Auth** | Supabase Auth (Magic Links) | No passwords, simple flow |
| **Styling** | Tailwind CSS | Rapid UI development, consistent design |
| **Icons** | Lucide React | Lightweight, consistent icon set |
| **Dates** | date-fns | Lightweight date manipulation |
| **Hosting** | Vercel | Zero-config Next.js deployment |

---

## 📁 Folder Structure

```
happenlist/
├── src/
│   ├── app/                    # 📄 Pages & Routes (Next.js App Router)
│   │   ├── page.tsx            #    Homepage
│   │   ├── events/             #    Event listings
│   │   ├── event/[slug]/       #    Event detail page
│   │   ├── venue/[slug]/       #    Venue detail page
│   │   ├── auth/               #    Login, callback, logout
│   │   ├── my/                 #    User pages (hearts, submissions)
│   │   ├── admin/              #    Admin pages (approval queue)
│   │   └── api/                #    API routes
│   │
│   ├── components/             # 🧩 Reusable UI Components
│   │   ├── ui/                 #    Base components (Button, Card, Input)
│   │   ├── layout/             #    Header, Footer, Container
│   │   ├── events/             #    EventCard, EventGrid, EventImage
│   │   ├── auth/               #    LoginForm, UserMenu
│   │   ├── submit/             #    Event submission form steps
│   │   └── admin-anywhere/     #    Superadmin edit from any page
│   │
│   ├── data/                   # 📊 Data Fetching Layer
│   │   ├── events/             #    getEvents, getEvent, getFeaturedEvents
│   │   ├── venues/             #    getVenues, getVenue
│   │   ├── categories/         #    getCategories
│   │   ├── user/               #    getHearts, toggleHeart
│   │   └── admin/              #    getAdminStats, event actions
│   │
│   ├── lib/                    # 🔧 Utilities & Helpers
│   │   ├── supabase/           #    Supabase client (server & browser)
│   │   ├── utils/              #    Date, price, URL, image utils
│   │   └── auth/               #    Session helpers
│   │
│   ├── types/                  # 📋 TypeScript Types
│   │   ├── event.ts            #    Event, EventCard, EventWithDetails
│   │   ├── venue.ts            #    Venue types
│   │   └── filters.ts          #    Filter types
│   │
│   ├── contexts/               # 🌐 React Contexts
│   │   └── auth-context.tsx    #    AuthProvider, useAuth hook
│   │
│   └── hooks/                  # 🪝 Custom React Hooks
│       ├── use-auth.ts         #    Authentication hook
│       └── use-heart.ts        #    Heart/save functionality
│
├── supabase/
│   └── migrations/             # 📦 SQL Migrations
│       └── 20260106_performance_indexes.sql
│
└── public/                     # 🖼️ Static Assets
    ├── favicon.ico
    └── og-image.jpg
```

### Key Principle: **Separation of Concerns**

| Folder | Responsibility |
|--------|----------------|
| `app/` | Routing, page layouts, metadata |
| `components/` | UI rendering (no data fetching) |
| `data/` | Database queries (no UI logic) |
| `lib/` | Pure utility functions |
| `types/` | Type definitions only |

---

## 🔄 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER REQUEST                             │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  📄 PAGE (src/app/events/page.tsx)                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ // Server Component - runs on server                        ││
│  │ const { events } = await getEvents({ limit: 24 });          ││
│  │ return <EventGrid events={events} />;                       ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  📊 DATA LAYER (src/data/events/get-events.ts)                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ const { data } = await supabase                             ││
│  │   .from('events')                                           ││
│  │   .select('id, title, image_url, ..., category:categories()')││
│  │   .eq('status', 'published');                               ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  💾 DATABASE (Supabase/PostgreSQL)                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ events table:                                               ││
│  │   - Uses idx_events_status_date index                       ││
│  │   - RLS policy: only published events readable              ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  🧩 COMPONENT (src/components/events/event-grid.tsx)            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ events.map(event => <EventCard event={event} />)            ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 State Management

### Where State Lives

| State Type | Location | Example |
|------------|----------|---------|
| **Server State** | Database via `data/` layer | Events, venues, categories |
| **Auth State** | `AuthContext` + Supabase session | Current user, login status |
| **URL State** | Next.js params/searchParams | Filters, pagination, search query |
| **UI State** | Local component `useState` | Modal open/closed, loading states |

### Auth State Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  🔐 AUTH FLOW                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User clicks "Sign In"                                       │
│     └─► /auth/login page renders LoginForm                      │
│                                                                 │
│  2. User enters email, clicks "Send Magic Link"                 │
│     └─► Supabase sends email with magic link                    │
│                                                                 │
│  3. User clicks link in email                                   │
│     └─► /auth/callback handles token                            │
│     └─► Creates Supabase session                                │
│     └─► AuthContext updates via onAuthStateChange               │
│                                                                 │
│  4. User is now logged in                                       │
│     └─► useAuth() returns { user, session, isLoggedIn: true }   │
│     └─► Header shows UserMenu instead of "Sign In"              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🖼️ Image System

### How Images Work

```
┌─────────────────────────────────────────────────────────────────┐
│  🖼️ IMAGE DISPLAY FLOW                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Database Fields:                                               │
│  ├── image_url      → Main hero image (Supabase hosted)         │
│  ├── thumbnail_url  → Card thumbnail (Supabase hosted)          │
│  ├── flyer_url      → Event flyer/poster (Supabase hosted)      │
│  └── raw_image_url  → Original scraped URL (for debugging)      │
│                                                                 │
│  Component Flow:                                                │
│  ┌────────────────────┐                                         │
│  │    EventCard       │                                         │
│  │    ┌────────────┐  │                                         │
│  │    │ EventImage │◄─┼─── Uses image_url OR thumbnail_url      │
│  │    │            │  │                                         │
│  │    │ ┌────────┐ │  │                                         │
│  │    │ │ next/  │ │  │    1. Tries image_url first             │
│  │    │ │ image  │ │  │    2. Falls back to thumbnail_url       │
│  │    │ └────────┘ │  │    3. Falls back to letter placeholder  │
│  │    └────────────┘  │                                         │
│  └────────────────────┘                                         │
│                                                                 │
│  Validation:                                                    │
│  └── getBestImageUrl() validates URLs before rendering          │
│  └── Rejects page URLs (instagram.com/p/xxx)                    │
│  └── Accepts CDN URLs (scontent.cdninstagram.com/xxx.jpg)       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Image Validation Rules

| ✅ Valid Image URLs | ❌ Invalid (Page) URLs |
|---------------------|------------------------|
| `https://supabase.co/storage/.../image.jpg` | `https://instagram.com/p/ABC123/` |
| `https://scontent.cdninstagram.com/...` | `https://eventbrite.com/e/event-123` |
| `https://img.evbuc.com/...` | `https://facebook.com/events/456` |

---

## 💾 Database Schema

### Core Entities

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ CATEGORIES  │       │  LOCATIONS  │       │ ORGANIZERS  │
│ ─────────── │       │ ─────────── │       │ ─────────── │
│ id          │       │ id          │       │ id          │
│ name        │       │ name        │       │ name        │
│ slug        │       │ slug        │       │ slug        │
│ icon        │       │ city        │       │ logo_url    │
│ sort_order  │       │ address     │       │ website_url │
└──────┬──────┘       └──────┬──────┘       └──────┬──────┘
       │                     │                     │
       │ category_id         │ location_id         │ organizer_id
       │                     │                     │
       └──────────┬──────────┴──────────┬──────────┘
                  │                     │
                  ▼                     │
           ┌─────────────┐              │
           │   EVENTS    │◄─────────────┘
           │ ─────────── │
           │ id          │
           │ title       │
           │ slug        │
           │ instance_date │
           │ start_datetime │
           │ image_url   │
           │ thumbnail_url │
           │ status      │
           │ is_free     │
           │ price_low   │
           │ price_high  │
           └─────────────┘
```

### Event Status Values

| Status | Description | Visibility |
|--------|-------------|------------|
| `draft` | User is still editing | Only owner |
| `pending_review` | Submitted, awaiting admin | Owner + Admins |
| `changes_requested` | Admin requested edits | Owner + Admins |
| `published` | Live and visible | Everyone |
| `rejected` | Not approved | Owner + Admins |
| `cancelled` | Event cancelled | Everyone |

---

## 🧩 Component Taxonomy

### UI Components (`src/components/ui/`)

Base building blocks — no business logic, just styling.

```
Button          → Primary CTA, ghost, danger variants
Badge           → Category tags, status indicators
Card            → Content containers with shadows
Input           → Form inputs with validation states
Skeleton        → Loading placeholders
Spinner         → Loading indicator
```

### Event Components (`src/components/events/`)

Event-specific UI — uses base components.

```
EventCard       → Card for event listings (uses EventImage)
EventImage      → Smart image with fallback placeholders
EventGrid       → Responsive grid of EventCards
EventPrice      → Price formatting ($15, Free, $15-$25)
EventDate       → Date formatting (Feb 14 · 7:00 PM)
SectionHeader   → Section title with "See all" link
FlyerLightbox   → Fullscreen flyer viewer
```

### Layout Components (`src/components/layout/`)

Page structure — consistent across all pages.

```
Header          → Logo, nav, search, auth
Footer          → Links, copyright
Container       → Max-width wrapper with padding
Breadcrumbs     → Navigation breadcrumbs
```

---

## ⚡ Performance Optimizations

### What We've Optimized

| Optimization | Before | After | Impact |
|--------------|--------|-------|--------|
| Admin stats query | Fetch all events, filter in JS | SQL COUNT with indexes | 100x faster for 10K+ events |
| Event images | No images shown | next/image with lazy loading | Better LCP, less bandwidth |
| EventCard | Re-renders on parent update | `React.memo()` wrapped | Fewer re-renders in grids |
| Database queries | Missing indexes | Added 20+ indexes | 5-10x faster queries |

### Database Indexes Added

Run this SQL in Supabase to add performance indexes:

```sql
-- See: supabase/migrations/20260106_performance_indexes.sql

-- Most important indexes:
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_status_date ON events(status, instance_date DESC);
CREATE INDEX idx_events_category_id ON events(category_id);
CREATE INDEX idx_hearts_user_id ON hearts(user_id);
```

### Image Loading Strategy

```
1. Above-the-fold images    → priority={true}  (loaded immediately)
2. Below-the-fold images    → lazy loaded      (loaded on scroll)
3. Failed/missing images    → letter fallback  (no broken images)
```

---

## 📋 Commands Reference

### Development

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Database

```bash
# Generate TypeScript types from Supabase
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts

# Run a migration
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Paste contents of migration file
# 3. Click "Run"
```

### Debugging

```bash
# Check if images are loading correctly
# Open browser DevTools → Network → Img
# Look for 400/404 errors on image requests

# Check database query performance
# Supabase Dashboard → Logs → Postgres Logs
# Look for slow queries (>100ms)
```

---

## 🔍 Common Tasks

### Add a New Event Field

1. **Database**: Add column in Supabase SQL Editor
2. **Types**: Update `src/types/event.ts`
3. **Data**: Update query in `src/data/events/get-events.ts`
4. **Component**: Display in `src/components/events/event-card.tsx`

### Add a New Page

1. Create folder in `src/app/` (e.g., `src/app/new-page/`)
2. Add `page.tsx` (Server Component by default)
3. Add `loading.tsx` for loading state
4. Add to navigation in `src/components/layout/header.tsx`

### Add a New Component

1. Create file in appropriate folder (e.g., `src/components/events/my-component.tsx`)
2. Export from `index.ts` in that folder
3. Use in pages/components as needed

---

## 🆘 Troubleshooting

### Images Not Showing

1. Check if `image_url` is a valid image URL (not a page URL)
2. Check Supabase storage bucket is public
3. Check `next.config.ts` has the image domain allowed

### Slow Page Loads

1. Run the performance indexes migration
2. Check if using `count: 'exact'` unnecessarily
3. Add `priority={true}` to above-the-fold images

### Auth Not Working

1. Check `NEXT_PUBLIC_SITE_URL` matches your domain
2. Check Supabase auth settings → URL Configuration
3. Check `/auth/callback` route exists

---

## 📖 Internal Documentation

| Doc | Description |
|-----|-------------|
| [docs/AUTH.md](./docs/AUTH.md) | Authentication, user roles, sessions |
| [docs/EVENTS.md](./docs/EVENTS.md) | Event submission, approval, series |
| [docs/ADMIN-ANYWHERE.md](./docs/ADMIN-ANYWHERE.md) | Superadmin edit from any page |

---

## 📚 Further Reading

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

*Last updated: January 2026*
