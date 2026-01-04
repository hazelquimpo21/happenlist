# Happenlist Documentation

## Quick Reference

**What is this?** A complete specification for building Happenlist, a local events directory web application.

**Tech Stack:** Next.js 14 (App Router) + TypeScript + Supabase + Tailwind CSS

**Design:** Retro-modern, warm creams, serif headlines, editorial feel

---

## 🚨 Current Status & Priority

### 🔴 CRITICAL BUG: Auth Routes Missing

**Problem**: Users cannot log in. The `/submit/new` page redirects to `/auth/login`, but that page doesn't exist (404 error).

**Impact**: Event submission is completely broken.

**Solution**: Implement auth routes as detailed in:
- `21-USER-AUTH-IMPLEMENTATION.md` (full guide)
- `22-AUTH-QUICK-REFERENCE.md` (quick patterns)

**Files needed (in order):**
1. `src/app/auth/login/page.tsx`
2. `src/app/auth/callback/route.ts`
3. `src/components/auth/auth-provider.tsx`
4. Update `src/components/layout/header.tsx`

---

## Documentation Index

| Doc | Description | Read When... |
|-----|-------------|--------------|
| [00-PROJECT-OVERVIEW.md](./00-PROJECT-OVERVIEW.md) | High-level project info, tech stack, phases | Starting the project |
| [01-DESIGN-SYSTEM.md](./01-DESIGN-SYSTEM.md) | Colors, typography, spacing, shadows | Building any UI |
| [02-DATABASE-SCHEMA.md](./02-DATABASE-SCHEMA.md) | Tables, indexes, RLS policies | Setting up Supabase |
| [03-FILE-STRUCTURE.md](./03-FILE-STRUCTURE.md) | Directory organization, naming | Creating new files |
| [04-COMPONENTS.md](./04-COMPONENTS.md) | Component specs, props, variants | Building components |
| [05-PAGES.md](./05-PAGES.md) | Page layouts, data requirements | Building pages |
| [06-DATA-FETCHING.md](./06-DATA-FETCHING.md) | Queries, API routes, utilities | Fetching data |
| [07-SEO-STRATEGY.md](./07-SEO-STRATEGY.md) | URLs, metadata, structured data | Optimizing for search |
| [08-FEATURES.md](./08-FEATURES.md) | Filtering, search, hearts, auth | Implementing features |
| [09-IMPLEMENTATION-GUIDE.md](./09-IMPLEMENTATION-GUIDE.md) | Step-by-step build order | Following the plan |
| [10-CODE-PATTERNS.md](./10-CODE-PATTERNS.md) | Reusable code snippets | Writing code |
| [11-IMAGE-SCRAPING.md](./11-IMAGE-SCRAPING.md) | Image extraction & Supabase hosting | Handling event images |
| [20-EVENT-FLOWS-ARCHITECTURE.md](./20-EVENT-FLOWS-ARCHITECTURE.md) | Event submission, approval, admin flows | Building event management |
| [21-USER-AUTH-IMPLEMENTATION.md](./21-USER-AUTH-IMPLEMENTATION.md) | **🔴 START HERE** - Auth, roles, permissions | Implementing user system |
| [22-AUTH-QUICK-REFERENCE.md](./22-AUTH-QUICK-REFERENCE.md) | Quick patterns & checklist for auth | Quick reference during coding |

---

## Key Decisions Summary

### Data Model
- **Events** are the core entity, linked to Locations, Organizers, and Categories
- **Recurring events** use expand-with-template pattern (real rows per instance)
- **Event URLs** include date for uniqueness: `/event/slug-YYYY-MM-DD`
- **Pricing** supports: free, fixed, range, varies, donation

### Architecture
- **Server Components by default** - client only when needed
- **Data fetching in `/data` folder** - not in components
- **URL-based filter state** - for shareability and SEO
- **Maximum 400 lines per file** - split into modules

### Design
- **Warm palette**: cream backgrounds, coral accents, sage for "free"
- **Typography**: Fraunces (display), Inter (body)
- **Cards**: 20px radius, subtle shadows, lift on hover

---

## Development Phases

### Phase 1: Foundation (MVP) ✅ COMPLETE
- Public event browsing
- Event, venue, organizer pages
- Filtering and search
- SEO optimization

### Phase 2: Series & Recurring ✅ COMPLETE
- Multi-session events
- Workshop/class series
- Series detail pages

### Phase 3a: Event Submission ✅ COMPLETE
- Multi-step submission form
- Draft auto-save
- Admin review queue
- Approve/reject/request-changes flow

### Phase 3b: User Authentication 🔴 IN PROGRESS
- **Critical bug**: `/auth/login` page doesn't exist!
- Magic link authentication
- Session management
- Protected routes
- See `21-USER-AUTH-IMPLEMENTATION.md`

### Phase 4: Hearts & Profiles 📋 PLANNED
- Save/heart events
- User profiles table
- My Hearts page
- Account settings

### Phase 5: Organizer Claiming 📋 PLANNED
- Claim organizer profiles
- Verification system
- Organizer dashboard

---

## Quick Start Commands

```bash
# Create project
npx create-next-app@latest happenlist --typescript --tailwind --eslint --app --src-dir

# Install dependencies
npm install @supabase/supabase-js @supabase/ssr lucide-react date-fns slugify

# Generate Supabase types
npx supabase gen types typescript --project-id your-project-id > src/lib/supabase/types.ts

# Run dev server
npm run dev
```

---

## File Naming Cheat Sheet

| Type | Convention | Example |
|------|------------|---------|
| Components | kebab-case | `event-card.tsx` |
| Pages | folder/page.tsx | `events/page.tsx` |
| Hooks | use-*.ts | `use-debounce.ts` |
| Utils | kebab-case | `format-date.ts` |
| Types | kebab-case | `event.ts` |

---

## Import Aliases

```typescript
import { EventCard } from '@/components/events';
import { getEvents } from '@/data/events';
import { formatEventDate } from '@/lib/utils/dates';
import type { Event } from '@/types';
```

---

## Color Quick Reference

| Color | Hex | Use For |
|-------|-----|---------|
| Cream | `#FDF8F3` | Page backgrounds |
| Warm White | `#FFFEFA` | Cards |
| Sand | `#E8E0D5` | Borders, dividers |
| Stone | `#9C9487` | Secondary text |
| Charcoal | `#2D2A26` | Primary text |
| Coral | `#E07A5F` | CTAs, hearts, accents |
| Sage | `#87A878` | "Free" badges, success |

---

## Questions?

If something is unclear, check the specific doc for that topic. Each doc is self-contained with examples and specifications.
