# 🗓️ Happenlist

> Milwaukee's go-to events directory. Discover concerts, festivals, family activities, and more happening in your city.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

---

## Overview

Happenlist is a modern, mobile-first events directory for Milwaukee. It helps locals discover upcoming events across categories like music, sports, food & drink, family activities, and more.

### Key Goals

- **Simple Discovery**: Browse events by date, category, venue, or organizer
- **Mobile-First**: Responsive design that works beautifully on all devices
- **Admin Friendly**: Easy-to-use admin dashboard for managing events
- **Fast & Modern**: Built with Next.js 14, Server Components, and edge-ready

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Validation** | Zod |
| **Icons** | Lucide React |
| **Hosting** | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Supabase project

### 1. Clone & Install

```bash
git clone <repo-url>
cd happenlist
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Site URL (for auth redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Set Up the Database

Run the SQL migration in your Supabase dashboard:

1. Go to your Supabase project → SQL Editor
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Run the migration

This creates all tables, RLS policies, and seeds initial data (categories, tags).

### 4. Create an Admin User

In Supabase Dashboard → Authentication → Users:
1. Click "Add User" → "Create New User"
2. Enter email and password
3. This user can now access `/admin`

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Project Structure

```
happenlist/
├── app/                      # Next.js App Router pages
│   ├── (public)/            # Public pages (home, events, venues, etc.)
│   │   ├── page.tsx         # Home page
│   │   ├── events/          # Events listing & detail
│   │   ├── venues/          # Venues listing & detail
│   │   └── organizers/      # Organizers listing & detail
│   ├── (auth)/              # Auth pages
│   │   └── login/           # Admin login
│   ├── admin/               # Admin dashboard pages
│   │   ├── page.tsx         # Dashboard
│   │   ├── events/          # Event management
│   │   ├── venues/          # Venue management
│   │   └── organizers/      # Organizer management
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
│
├── components/               # React components
│   ├── ui/                  # UI primitives (Button, Card, Input, etc.)
│   ├── layout/              # Layout components (Header, Footer, Sidebar)
│   ├── events/              # Event-specific components
│   ├── categories/          # Category components
│   ├── forms/               # Form components
│   └── shared/              # Shared components
│
├── lib/                      # Utilities and business logic
│   ├── supabase/            # Supabase client utilities
│   │   ├── client.ts        # Browser client
│   │   ├── server.ts        # Server client
│   │   └── middleware.ts    # Middleware client
│   ├── queries/             # Data fetching functions
│   │   ├── events.ts        # Event queries
│   │   ├── venues.ts        # Venue queries
│   │   ├── organizers.ts    # Organizer queries
│   │   ├── categories.ts    # Category queries
│   │   └── tags.ts          # Tag queries
│   ├── actions/             # Server actions (mutations)
│   │   ├── auth.ts          # Auth actions
│   │   ├── events.ts        # Event CRUD
│   │   ├── venues.ts        # Venue CRUD
│   │   └── organizers.ts    # Organizer CRUD
│   ├── validations/         # Zod schemas
│   ├── utils/               # Utility functions
│   └── constants.ts         # App constants
│
├── types/                    # TypeScript types
│   ├── database.ts          # Database table types
│   ├── extended.ts          # Types with relations
│   ├── api.ts               # API types
│   └── forms.ts             # Form input types
│
├── styles/                   # CSS styles
│   └── tokens.css           # Design tokens (CSS variables)
│
├── supabase/                 # Supabase configuration
│   └── migrations/          # SQL migrations
│
└── middleware.ts             # Next.js middleware (auth protection)
```

---

## Database Schema

### Entity Relationship

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Categories  │     │    Events    │     │    Venues    │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id           │     │ id           │     │ id           │
│ name         │◄────│ category_id  │     │ name         │
│ slug         │     │ venue_id     │────►│ slug         │
│ icon         │     │ organizer_id │     │ address      │
│ color        │     │ title        │     │ city         │
└──────────────┘     │ slug         │     │ website_url  │
                     │ start_at     │     └──────────────┘
┌──────────────┐     │ end_at       │
│  Organizers  │     │ status       │     ┌──────────────┐
├──────────────┤     │ is_featured  │     │     Tags     │
│ id           │     │ is_free      │     ├──────────────┤
│ name         │◄────│ price_min    │     │ id           │
│ slug         │     │ price_max    │     │ name         │
│ description  │     └──────────────┘     │ slug         │
│ website_url  │           │              └──────────────┘
└──────────────┘           │                    ▲
                           │                    │
                     ┌──────────────┐           │
                     │  Event_Tags  │───────────┘
                     ├──────────────┤
                     │ event_id     │
                     │ tag_id       │
                     └──────────────┘
```

### Tables

| Table | Description |
|-------|-------------|
| `categories` | Event categories (Music, Sports, etc.) |
| `tags` | Event tags (Free, Family-Friendly, etc.) |
| `venues` | Event locations |
| `organizers` | Event organizers/promoters |
| `events` | The main events table |
| `event_tags` | Many-to-many relationship between events and tags |
| `event_types` | Types of events (single, recurring, multi-day) |

---

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ Public Pages│    │ Admin Pages │    │   Forms     │     │
│  │  (SSR)      │    │   (SSR)     │    │ (Client)    │     │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘     │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                       NEXT.JS SERVER                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Queries   │    │ Middleware  │    │   Actions   │     │
│  │ (lib/queries)│   │ (auth check)│    │(lib/actions)│     │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘     │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                        SUPABASE                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  PostgreSQL │    │    Auth     │    │   Storage   │     │
│  │  (RLS)      │    │             │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Key Patterns

1. **Server Components First**: Pages are server components by default for optimal performance
2. **Client Components for Interactivity**: Forms and interactive elements use `'use client'`
3. **Server Actions for Mutations**: All data mutations go through server actions
4. **Zod for Validation**: All inputs are validated with Zod schemas
5. **RLS for Security**: Row Level Security protects data at the database level

---

## Key Features

### Public Features
- 🏠 **Home Page**: Featured events, categories, and upcoming events
- 📅 **Events Listing**: Browse, filter by date/category, paginate
- 🎫 **Event Detail**: Full event info, venue, organizer, related events
- 📍 **Venues**: Browse venues and their events
- 👥 **Organizers**: Browse organizers and their events

### Admin Features
- 📊 **Dashboard**: Quick stats and recent activity
- 📝 **Event Management**: Create, edit, publish, archive events
- 📍 **Venue Management**: Add and edit venues
- 👥 **Organizer Management**: Add and edit organizers
- 🔐 **Protected Routes**: Auth-protected admin area

---

## Event States

Events flow through these states:

```
┌─────────┐     ┌───────────┐     ┌───────────┐
│  Draft  │────►│ Published │────►│ Archived  │
└─────────┘     └───────────┘     └───────────┘
                      │
                      ▼
                ┌───────────┐
                │ Cancelled │
                └───────────┘
```

| Status | Description |
|--------|-------------|
| `draft` | Event is being created, not visible to public |
| `published` | Event is live and visible on the site |
| `cancelled` | Event was cancelled (still visible with notice) |
| `archived` | Event is hidden (soft deleted) |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only) |
| `NEXT_PUBLIC_SITE_URL` | No | Site URL for auth redirects |

---

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy!

Vercel automatically detects Next.js and configures the build.

### Manual Deployment

```bash
# Build the app
npm run build

# Start production server
npm start
```

---

## Development Tips

### Logging

The app uses a custom logger (`lib/utils/logger.ts`) with emoji prefixes for easy scanning:

```typescript
logger.info('📅 Creating event', { title: 'Jazz Fest' })
logger.warn('⚠️ Event not found', { slug: 'missing-event' })
logger.error('❌ Database error', { error })
```

### Adding New Features

1. **New Page**: Create in `app/(public)/` or `app/admin/`
2. **New Query**: Add to `lib/queries/`
3. **New Action**: Add to `lib/actions/`
4. **New Component**: Add to `components/`
5. **New Type**: Add to `types/`

### Testing Queries

Use the Supabase Dashboard SQL Editor to test queries before implementing them.

---

## License

MIT © Happenlist

---

Built with ❤️ in Milwaukee 🦌
