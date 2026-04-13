# Happenlist

A local events directory that helps people discover concerts, festivals, classes, workshops, and more in their area. Think of it as a curated, editorial-style events guide for your city (currently focused on Milwaukee, WI).

---

## What This App Does

Happenlist lets people:

- **Browse events** by category, date, or keyword search
- **Discover venues and organizers** in their area
- **Save events** they're interested in (hearts)
- **Submit their own events** through a guided form
- **Follow organizers, venues, and categories** for updates

Admins can review and approve submitted events, and superadmins can edit events directly from any page.

Events are added in two ways:
1. **Manual submission** through the website's 7-step form
2. **Chrome extension scraper** that pulls events from other sites (the scraper's backend runs on Render)

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js (App Router) | Server-rendered React, routing, API routes |
| Language | TypeScript | Type safety across the codebase |
| Database | Supabase (PostgreSQL) | Data storage, auth, file storage, Row-Level Security |
| Auth | Supabase Auth (Magic Links) | Passwordless email login |
| Styling | Tailwind CSS | Utility-first CSS with custom design tokens |
| Icons | Custom SVGs + Lucide React | 15 bold category icons + utility icons |
| Dates | date-fns | Date formatting and manipulation |
| Maps | Mapbox GL | Venue maps and address autocomplete |
| Hosting | Vercel | Frontend + API deployment |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials (see below)

# 3. Run the development server
npm run dev

# 4. Open http://localhost:3000
```

### Environment Variables

Create `.env.local` with these values:

```env
# Supabase (required - get from your Supabase project settings)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Site URL (required - for auth redirects and sitemap)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Admin access (comma-separated email addresses)
ADMIN_EMAILS=admin@example.com
SUPERADMIN_EMAILS=superadmin@example.com

# Chrome extension scraper (shared secret for API auth)
SCRAPER_API_SECRET=your-secret-here

# Mapbox (for venue maps and address autocomplete)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your-token-here
```

### Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

---

## Project Structure

```
happenlist/
├── src/
│   ├── app/                    # Pages & Routes (Next.js App Router)
│   │   ├── page.tsx            # Homepage
│   │   ├── events/             # Event listings (all, today, this-weekend)
│   │   ├── event/[slug]/       # Event detail page
│   │   ├── venues/             # Venue listings
│   │   ├── venue/[slug]/       # Venue detail page
│   │   ├── organizers/         # Organizer listings
│   │   ├── organizer/[slug]/   # Organizer detail page
│   │   ├── series/             # Series listings (classes, camps, etc.)
│   │   ├── series/[slug]/      # Series detail page
│   │   ├── search/             # Search results
│   │   ├── auth/               # Login, callback, logout
│   │   ├── submit/             # Multi-step event submission form
│   │   ├── my/                 # User pages (hearts, submissions, settings)
│   │   ├── admin/              # Admin dashboard and review queue
│   │   └── api/                # API routes (scraper, images, hearts, etc.)
│   │
│   ├── components/             # Reusable UI Components
│   │   ├── ui/                 # Base components (Button, Card, Input, Badge)
│   │   ├── layout/             # Header, Footer, Container
│   │   ├── events/             # EventCard, EventGrid, EventImage
│   │   ├── series/             # SeriesCard, SeriesGrid
│   │   ├── auth/               # LoginForm, UserMenu
│   │   ├── submit/             # Event submission form steps
│   │   ├── admin-anywhere/     # Superadmin edit toolbar
│   │   ├── homepage/            # Hero slideshow, filter pills, just-added rows
│   │   ├── icons/              # Custom category SVG icons
│   │   ├── hearts/             # Heart/save button
│   │   ├── search/             # Search bar
│   │   ├── maps/               # Mapbox map and address search
│   │   └── seo/                # JSON-LD structured data
│   │
│   ├── data/                   # Data Fetching Layer (server-only)
│   │   ├── events/             # getEvents, getEvent, getFeaturedEvents
│   │   ├── venues/             # getVenues, getVenue
│   │   ├── organizers/         # getOrganizers, getOrganizer
│   │   ├── categories/         # getCategories
│   │   ├── series/             # getSeries, getSeriesDetail
│   │   ├── user/               # getHearts, toggleHeart, follows
│   │   ├── admin/              # getAdminStats, event actions
│   │   └── submit/             # Draft management, event submission
│   │
│   ├── lib/                    # Utilities & Configuration
│   │   ├── supabase/           # Supabase clients (server, browser, admin)
│   │   ├── utils/              # Date, price, URL, image, slug helpers
│   │   ├── constants/          # Routes, config, series limits
│   │   └── auth/               # Session helpers, admin checks
│   │
│   ├── types/                  # TypeScript Type Definitions
│   ├── contexts/               # React Contexts (auth)
│   └── hooks/                  # Custom React Hooks (auth, heart, debounce)
│
├── supabase/
│   └── migrations/             # SQL migration files
│
├── scripts/
│   └── venue-import/           # Bulk venue import from CSV
│
├── docs/                       # Documentation
│   ├── SCHEMA.md               # Database schema reference
│   ├── FEATURES.md             # Feature guide (auth, events, admin, filters, etc.)
│   ├── CHROME-EXTENSION.md     # Chrome extension scraper integration
│   ├── USER-STORIES.md         # User stories by persona
│   ├── filter-roadmap.md       # Smart Filters three-phase plan
│   └── phase-reports/          # Per-phase review reports
│
├── ARCHITECTURE.md             # Technical architecture deep dive
└── DESIGN-GUIDE.md             # Design system v3 decisions and pillars
```

---

## Design System (v3)

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `ink` | #020203 | Primary text, headlines |
| `night` | #141416 | Dark backgrounds (hero, weekend section) |
| `zinc` | #71717A | Secondary text, metadata |
| `mist` | #E4E4E7 | Borders, dividers |
| `cloud` | #F4F4F5 | Subtle backgrounds |
| `white` | #FAFAFA | Page background |
| `pure` | #FFFFFF | Card backgrounds |
| `blue` | #008bd2 | Primary brand, CTAs, links, selected states |
| `orange` | #d95927 | Secondary accent |
| `rose` | #F43F5E | Hearts |
| `emerald` | #009768 | "Free" badges, success |

Plus 15 unique category identity colors (see `CLAUDE.md` or `src/lib/constants/category-colors.ts`).

### Typography

- **Font**: Plus Jakarta Sans (sans-serif) - one family for everything
- **Scale**: `text-hero` (4.5rem) down to `text-caption` (0.75rem)

### Design Philosophy

Bold, multi-chromatic city festival poster aesthetic. Each event category has a unique color identity. Mobile-first with horizontal scroll cards. Browse-first UX designed for discovery mode.

For the full design reference, see [CLAUDE.md](./CLAUDE.md) and [DESIGN-GUIDE.md](./DESIGN-GUIDE.md).

---

## Documentation

| Doc | What's In It | When To Read It |
|-----|-------------|-----------------|
| [CLAUDE.md](./CLAUDE.md) | Design system, engineering standards, Smart Filters roadmap status | Every session — this is the primary AI context file |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Data flow, component patterns, state management, performance | Building features or debugging |
| [docs/FEATURES.md](./docs/FEATURES.md) | Auth, events, admin, series, maps, filters, view tracking | Understanding how features work |
| [docs/SCHEMA.md](./docs/SCHEMA.md) | Every database table, field, and relationship | Working with data or queries |
| [docs/filter-roadmap.md](./docs/filter-roadmap.md) | Three-phase Smart Filters plan, data audit, architectural decisions | Working on filters or sorts |
| [docs/CHROME-EXTENSION.md](./docs/CHROME-EXTENSION.md) | Scraper API, image upload, Render backend | Working on the Chrome extension |
| [docs/USER-STORIES.md](./docs/USER-STORIES.md) | User stories organized by persona | Planning features or understanding user needs |

---

## Features Overview

### Shipped

- Browse events with filtering by category, date, price, audience tags, distance, cost tier, age group
- Distance filtering with 15 Milwaukee neighborhoods + browser geolocation
- "Today's events" and "This weekend" quick views
- Past event archive pages by year and month
- Event, venue, and organizer detail pages with SEO
- Full-text search across events
- Series system (classes, camps, workshops, festivals, recurring, lifestyle, ongoing, exhibit, annual events)
- Recurring event collapsing in browse feeds
- Magic link authentication (passwordless)
- 7-step event submission form with auto-save drafts
- Admin review queue (approve / reject / request changes)
- Superadmin edit-from-anywhere toolbar
- Heart/save events, follow organizers/venues/categories
- User profile and settings
- Smart venue search with 3500+ pre-loaded Milwaukee venues
- Mapbox maps and address autocomplete
- Chrome extension scraper API with image re-hosting
- Dynamic sitemap and Schema.org structured data
- View tracking (accumulating data for trending sort)

### In Progress (Smart Filters Phase 3 — blocked on data bake)

- Vibe / atmosphere filters (clean data ready, UI not built)
- Trending + popularity sorts (needs ~4 weeks of view-tracking data)
- Drop-in vs ticketed filter (needs attendance_mode backfill)

### Future (not scoped)

- Organizer claiming and dashboards
- Email notifications and weekly digest
- Analytics dashboard
- Ticket integration

---

## How Events Get Into the System

```
                                    ┌─────────────────────┐
  Chrome Extension Scraper ────────>│                     │
  (backend on Render)               │  /api/scraper/      │
                                    │  events             │──> Admin Review Queue
  Website Submission Form ─────────>│                     │        │
  (7-step guided form)             │  Happenlist API     │        v
                                    │  (Next.js on        │    Published Events
  Manual Admin Entry ──────────────>│   Vercel)           │    (visible to all)
                                    └─────────────────────┘
```

All submitted events land in the admin review queue as `pending_review`. Admins approve, reject, or request changes before events go live.

---

Built with Next.js, Supabase, and Tailwind CSS.
