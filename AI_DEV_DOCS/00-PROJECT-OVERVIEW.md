# Happenlist: Project Overview

## What is Happenlist?

Happenlist is a local events directory web application that connects people with happenings in their area. It features events, venues (locations), and event organizers as its core entities.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Styling | Tailwind CSS |
| Hosting | Vercel (recommended) |
| Image Storage | Supabase Storage |

## Design Philosophy

- **Warm & Editorial**: Inspired by well-designed local magazines
- **Retro-Modern**: Serif headlines, warm creams, soft rounded cards
- **Clean & Stylish**: Minimal clutter, generous whitespace
- **Mobile-First**: Responsive design prioritizing mobile experience

## Development Phases

### Phase 1: Foundation (MVP)
- Public event browsing
- Event, venue, and organizer detail pages
- Category and date filtering
- Search functionality
- SEO optimization with Schema.org structured data
- Admin-only content entry (via Supabase Studio initially)

### Phase 2: Series & Recurring
- Multi-session events (camps, classes, workshop series)
- True recurring events (weekly, monthly)
- Series detail pages
- "Part of a series" badges and linking

### Phase 3: Users & Hearts
- User authentication (sign up, log in)
- Heart/save events
- "My Hearts" page
- Email preferences (optional)

### Phase 4: Organizer Accounts
- Organizer user type
- Dashboard for managing events
- Event submission and editing
- Organization team management
- Approval workflow (optional)

## Core Entities

```
EVENTS ←→ LOCATIONS (many-to-one)
EVENTS ←→ ORGANIZERS (many-to-one)
EVENTS ←→ CATEGORIES (many-to-one)
EVENTS ←→ HEARTS (one-to-many, Phase 3)
EVENTS ←→ SERIES (many-to-one, Phase 2)
```

## URL Structure

```
/                                    → Home
/events                              → Events index
/events/today                        → Today's events
/events/this-weekend                 → Weekend events
/events/[year]/[month]               → Month archive
/events/[category-slug]              → Category filtered
/event/[slug]-[YYYY-MM-DD]           → Event detail
/venues                              → Venues index
/venue/[slug]                        → Venue detail
/organizers                          → Organizers index
/organizer/[slug]                    → Organizer detail
/search                              → Search results
```

## Code Organization Principles

1. **Maximum 400 lines per file** - Split larger files into logical modules
2. **Colocation** - Keep related files together (component + styles + tests)
3. **Single Responsibility** - Each file/function does one thing well
4. **Reusable Components** - Build a component library, not page-specific code
5. **Type Safety** - Full TypeScript coverage with strict mode
6. **Server Components by Default** - Use client components only when needed

## Key Dependencies

```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "typescript": "^5.0.0",
  "@supabase/supabase-js": "^2.0.0",
  "@supabase/ssr": "^0.1.0",
  "tailwindcss": "^3.4.0",
  "lucide-react": "^0.300.0",
  "date-fns": "^3.0.0",
  "slugify": "^1.6.0"
}
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key (server only)
NEXT_PUBLIC_SITE_URL=https://happenlist.com
```
