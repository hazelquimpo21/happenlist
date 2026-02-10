# Happenlist

**Discover Local Events** - A modern events directory for finding concerts, festivals, classes, workshops, and more in your area.

---

## Documentation

| Guide | Description |
|-------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Full system architecture, data flow, component taxonomy |
| [docs/AUTH.md](./docs/AUTH.md) | Authentication, user roles, hearts, follows |
| [docs/EVENTS.md](./docs/EVENTS.md) | Event submission, approval, series |
| [docs/EVENT-DETAIL-COMPONENTS.md](./docs/EVENT-DETAIL-COMPONENTS.md) | Event page: time display, external links |

---

## Quick Start

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

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        HAPPENLIST                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Next.js    │    │   Supabase   │    │  Tailwind    │       │
│  │  App Router  │◄──►│  PostgreSQL  │    │     CSS      │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    PAGES (Server Components)             │    │
│  │  /              Home page with featured events           │    │
│  │  /events        Events listing with filters              │    │
│  │  /events/today  Today's events                           │    │
│  │  /events/this-weekend  Weekend events                    │    │
│  │  /event/[slug]  Event detail page                        │    │
│  │  /venues        Venues listing                           │    │
│  │  /venue/[slug]  Venue detail page                        │    │
│  │  /organizers    Organizers listing                       │    │
│  │  /organizer/[slug]  Organizer detail page                │    │
│  │  /search        Search results page                      │    │
│  │  /auth/login    Magic link login                         │    │
│  │  /submit/new    Multi-step event submission              │    │
│  │  /my/submissions  User's submitted events                │    │
│  │  /admin/events  Admin review queue                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    DATA LAYER                            │    │
│  │  src/data/events/     Event fetching functions           │    │
│  │  src/data/venues/     Venue fetching functions           │    │
│  │  src/data/organizers/ Organizer fetching functions       │    │
│  │  src/data/categories/ Category fetching functions        │    │
│  │  src/data/submit/     Event submission & drafts          │    │
│  │  src/data/admin/      Admin review queue & actions       │    │
│  │  src/data/user/       User hearts, follows, profile      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
happenlist/
├── docs/                     # Documentation
│   ├── AUTH.md               # Auth system guide
│   └── EVENTS.md             # Event flows guide
├── ARCHITECTURE.md           # System architecture
│
├── supabase/
│   └── migrations/           # SQL migration files
│       └── 00001_initial_schema.sql
│
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page
│   │   ├── globals.css       # Global styles
│   │   ├── sitemap.ts        # Dynamic sitemap
│   │   ├── robots.ts         # Robots.txt
│   │   │
│   │   ├── events/           # Events pages
│   │   │   ├── page.tsx      # Events index
│   │   │   ├── today/page.tsx
│   │   │   └── this-weekend/page.tsx
│   │   │
│   │   ├── event/
│   │   │   └── [slug]/page.tsx  # Event detail
│   │   │
│   │   ├── venues/page.tsx      # Venues index
│   │   ├── venue/[slug]/page.tsx
│   │   │
│   │   ├── organizers/page.tsx  # Organizers index
│   │   ├── organizer/[slug]/page.tsx
│   │   │
│   │   └── search/page.tsx      # Search page
│   │
│   ├── components/           # React components
│   │   ├── ui/               # Base UI components
│   │   │   ├── button.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── spinner.tsx
│   │   │
│   │   ├── layout/           # Layout components
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── container.tsx
│   │   │   └── breadcrumbs.tsx
│   │   │
│   │   ├── events/           # Event-specific components
│   │   │   ├── event-card.tsx
│   │   │   ├── event-grid.tsx
│   │   │   ├── event-price.tsx
│   │   │   ├── event-date.tsx
│   │   │   └── section-header.tsx
│   │   │
│   │   ├── categories/       # Category components
│   │   │   └── category-grid.tsx
│   │   │
│   │   ├── search/           # Search components
│   │   │   └── search-bar.tsx
│   │   │
│   │   └── seo/              # SEO components
│   │       └── json-ld.tsx
│   │
│   ├── data/                 # Data fetching functions
│   │   ├── events/
│   │   │   ├── get-events.ts
│   │   │   ├── get-event.ts
│   │   │   └── get-featured-events.ts
│   │   ├── venues/
│   │   │   └── get-venues.ts
│   │   ├── organizers/
│   │   │   └── get-organizers.ts
│   │   └── categories/
│   │       └── get-categories.ts
│   │
│   ├── lib/                  # Utility libraries
│   │   ├── supabase/         # Supabase client
│   │   │   ├── client.ts     # Browser client
│   │   │   ├── server.ts     # Server client
│   │   │   └── types.ts      # Database types
│   │   │
│   │   ├── constants/        # App constants
│   │   │   ├── config.ts     # Site config
│   │   │   └── routes.ts     # Route definitions
│   │   │
│   │   └── utils/            # Helper functions
│   │       ├── cn.ts         # Class names
│   │       ├── dates.ts      # Date formatting
│   │       ├── price.ts      # Price formatting
│   │       ├── url.ts        # URL builders
│   │       └── slug.ts       # Slug utilities
│   │
│   ├── hooks/                # React hooks
│   │   ├── use-debounce.ts
│   │   └── use-media-query.ts
│   │
│   └── types/                # TypeScript types
│       ├── event.ts
│       ├── venue.ts
│       ├── organizer.ts
│       ├── category.ts
│       └── filters.ts
│
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

---

## Database Schema

```
┌─────────────────┐       ┌─────────────────┐
│   categories    │       │   locations     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ name            │       │ name            │
│ slug (unique)   │       │ slug (unique)   │
│ description     │       │ address_line    │
│ icon            │       │ city            │
│ display_order   │       │ state           │
│ is_active       │       │ venue_type      │
└────────┬────────┘       │ is_active       │
         │                └────────┬────────┘
         │                         │
         ▼                         ▼
┌─────────────────────────────────────────────────┐
│                    events                        │
├─────────────────────────────────────────────────┤
│ id (PK)                                          │
│ title                                            │
│ slug (unique per instance_date)                  │
│ description                                      │
│ start_datetime                                   │
│ end_datetime                                     │
│ instance_date (for recurring events)             │
│ price_type (free|fixed|range|varies)             │
│ price_low / price_high                           │
│ is_free                                          │
│ status (draft|published|cancelled)               │
│ category_id (FK)  ──────────────────────────────►│
│ location_id (FK)  ──────────────────────────────►│
│ organizer_id (FK) ──────────────────────────────►│
└─────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   organizers    │
                    ├─────────────────┤
                    │ id (PK)         │
                    │ name            │
                    │ slug (unique)   │
                    │ description     │
                    │ logo_url        │
                    │ website_url     │
                    │ is_active       │
                    └─────────────────┘
```

---

## Entity States

### Event Status
| Status | Description |
|--------|-------------|
| `draft` | Event is being created, not visible to public |
| `pending_review` | Submitted for admin review |
| `published` | Event is live and visible to everyone |
| `changes_requested` | Admin requested edits from submitter |
| `rejected` | Rejected by admin |
| `cancelled` | Event was cancelled, may still show with strikethrough |

### Price Types
| Type | Description | Example Display |
|------|-------------|-----------------|
| `free` | No cost to attend | "Free" |
| `fixed` | Single price | "$25" |
| `range` | Price range | "$15 - $50" |
| `varies` | Variable pricing | "Varies" |

### Venue Types
| Type | Description |
|------|-------------|
| `venue` | Fixed location like theater, club |
| `outdoor` | Parks, outdoor spaces |
| `online` | Virtual/online events |
| `various` | Multiple or varying locations |
| `tbd` | Location to be announced |

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER REQUEST                             │
│                    (e.g., /events?category=music)                │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVER COMPONENT                            │
│                      (EventsPage)                                │
│                                                                  │
│  1. Parse URL search params                                      │
│  2. Call data fetching function                                  │
│  3. Render component with data                                   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATA FETCHING                                │
│                   (getEvents)                                    │
│                                                                  │
│  1. Create Supabase server client                                │
│  2. Build query with filters                                     │
│  3. Execute query against database                               │
│  4. Transform response to TypeScript types                       │
│  5. Log results with emoji indicators                            │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SUPABASE                                   │
│                    (PostgreSQL)                                  │
│                                                                  │
│  - Row Level Security (RLS) enabled                              │
│  - Optimized indexes on common queries                           │
│  - Automatic timestamps                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Design System

### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `cream` | #F9F6F0 | Page backgrounds |
| `warm-white` | #FFFDF9 | Cards, sections |
| `sand` | #E8E2D9 | Borders, dividers |
| `stone` | #7A7670 | Secondary text |
| `charcoal` | #2D2A26 | Primary text |
| `coral` | #E86C5D | Primary accent, CTAs |
| `sage` | #7B9E87 | Secondary accent, success |

### Typography
| Token | Font | Size | Usage |
|-------|------|------|-------|
| `text-h1` | Fraunces | 2.5rem | Page titles |
| `text-h2` | Fraunces | 2rem | Section headers |
| `text-h3` | Fraunces | 1.5rem | Card titles |
| `text-body` | Inter | 1rem | Body text |
| `text-body-sm` | Inter | 0.875rem | Meta, captions |

### Spacing Scale
```
4 → 8 → 12 → 16 → 24 → 32 → 48 → 64 → 96 → 128
```

---

## URL Patterns

### SEO-Friendly URLs
| Pattern | Example | Description |
|---------|---------|-------------|
| `/events` | `/events` | All events |
| `/events?category=music` | `/events?category=music` | Filtered by category |
| `/events/today` | `/events/today` | Today's events |
| `/events/this-weekend` | `/events/this-weekend` | Weekend events |
| `/event/[slug]-[date]` | `/event/jazz-night-2025-02-14` | Event detail |
| `/venue/[slug]` | `/venue/pabst-theater` | Venue detail |
| `/organizer/[slug]` | `/organizer/jazz-collective` | Organizer detail |
| `/search?q=[query]` | `/search?q=music` | Search results |

---

## Console Logging

All data operations include emoji-prefixed logging for easy debugging:

```
📋 [getEvents] Fetching events with params: { categorySlug: 'music' }
✅ [getEvents] Found 12 events (total: 45)

🏛️ [getVenue] Fetching venue: pabst-theater
✅ [getVenue] Found venue: Pabst Theater

👥 [getOrganizer] Fetching organizer: jazz-collective
⚠️ [getOrganizer] Organizer not found

❌ [getEvents] Error fetching events: { message: 'Connection failed' }
```

### Logging Legend
| Emoji | Meaning |
|-------|---------|
| 📋 | Fetching list data |
| 🎫 | Event-related operation |
| 🏛️ | Venue-related operation |
| 👥 | Organizer-related operation |
| 🔍 | Search operation |
| ✅ | Success |
| ⚠️ | Warning (not found, etc.) |
| ❌ | Error |

---

## Commands Reference

```bash
# Development
npm run dev          # Start dev server on port 3000
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database (Supabase)
# Run migrations in Supabase Dashboard > SQL Editor
# Or use Supabase CLI:
supabase migration up
```

---

## Environment Variables

Create a `.env.local` file with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Site URL (for sitemap generation)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Admin Emails (comma-separated list for admin access)
ADMIN_EMAILS=admin@example.com,admin2@example.com
```

---

## Phase 1 Features (MVP) ✅

- [x] Browse all events
- [x] Filter by category
- [x] View today's events
- [x] View weekend events
- [x] Event detail pages
- [x] Venue pages
- [x] Organizer pages
- [x] Full-text search
- [x] SEO with Schema.org structured data
- [x] Dynamic sitemap
- [x] Responsive design

---

## Phase 2 Features (Series & Recurring) ✅

- [x] Series system (classes, camps, workshops, festivals)
- [x] Recurring events with recurrence rules
- [x] Series index page at `/series`
- [x] Series detail pages with event listings
- [x] Series filtering by type and category
- [x] Series badges on event cards

---

## Phase 3 Features (Event Management) ✅

- [x] Magic link authentication (passwordless)
- [x] 7-step event submission form with auto-save
- [x] Event drafts for work-in-progress submissions
- [x] User submissions dashboard at `/my/submissions`
- [x] Admin review queue at `/admin/events`
- [x] Admin approve/reject/request-changes workflow
- [x] Status badges with color-coded indicators
- [x] Admin audit logging

---

## Phase 4 Features (User Features) ✅

- [x] Heart/save events with optimistic UI
- [x] My Hearts page at `/my/hearts`
- [x] Follow organizers, venues, categories
- [x] User profile settings at `/my/settings`
- [x] Route protection middleware
- [x] Mobile navigation drawer

---

## Future Phases

### Phase 5: Organizer Features
- Organizer claiming (request to manage an organizer)
- Organizer dashboard
- Team management

### Phase 6: Enhanced Features
- Email notifications
- Weekly digest emails
- Analytics dashboard
- Ticket integration

---

## Contributing

1. Follow the file structure conventions
2. Keep files under 400 lines
3. Add console logging with emojis
4. Write clear TypeScript types
5. Use Tailwind CSS with design tokens

---

Built with Next.js 16, Supabase, and Tailwind CSS.
