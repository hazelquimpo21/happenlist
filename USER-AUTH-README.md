# 🔐 Happenlist User & Auth System

> **Complete guide to the authentication and user features system**
> Built with Supabase Auth, React Context, and Next.js 14

---

## 📋 Table of Contents

1. [Quick Start](#-quick-start)
2. [Architecture Overview](#-architecture-overview)
3. [User States & Roles](#-user-states--roles)
4. [Feature Taxonomy](#-feature-taxonomy)
5. [Database Schema](#-database-schema)
6. [File Structure](#-file-structure)
7. [API Reference](#-api-reference)
8. [Setup Instructions](#-setup-instructions)
9. [Component Usage](#-component-usage)
10. [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
npm install @supabase/ssr @supabase/supabase-js sonner
npm install @radix-ui/react-dropdown-menu @radix-ui/react-dialog
```

### Step 2: Run SQL Migrations

```bash
# In Supabase Dashboard → SQL Editor
# Run these in order:

1. supabase/migrations/00010_user_profiles_and_hearts.sql
2. supabase/migrations/00011_user_auth_complete.sql
```

### Step 3: Configure Environment

```env
# .env.local

# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Auth config
ADMIN_EMAILS=admin@example.com,you@example.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Step 4: Configure Supabase Auth

1. **Enable Email Provider**: Dashboard → Authentication → Providers → Email ✅
2. **Enable Magic Link**: Check "Confirm email" and "Magic Link" ✅
3. **Add Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback`

### Step 5: Start the App!

```bash
npm run dev
```

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HAPPENLIST AUTH SYSTEM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │   Supabase   │────▶│    Next.js   │────▶│   Browser    │                │
│  │     Auth     │     │   Middleware │     │    Client    │                │
│  └──────────────┘     └──────────────┘     └──────────────┘                │
│         │                    │                    │                         │
│         │                    │                    │                         │
│         ▼                    ▼                    ▼                         │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │  auth.users  │     │   Protected  │     │ AuthProvider │                │
│  │   (Supabase) │     │    Routes    │     │   (Context)  │                │
│  └──────────────┘     └──────────────┘     └──────────────┘                │
│         │                                          │                        │
│         │                                          │                        │
│         ▼                                          ▼                        │
│  ┌──────────────┐                          ┌──────────────┐                │
│  │   profiles   │                          │   useAuth()  │                │
│  │   (public)   │                          │    (Hook)    │                │
│  └──────────────┘                          └──────────────┘                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. USER CLICKS "LOGIN"
   │
   └──▶ /auth/login page
        │
        └──▶ LoginForm submits email
             │
             └──▶ Supabase sends magic link email

2. USER CLICKS MAGIC LINK
   │
   └──▶ /auth/callback route
        │
        ├──▶ Verifies token with Supabase
        ├──▶ Creates session (sets cookies)
        └──▶ Redirects to destination

3. APP LOADS WITH SESSION
   │
   └──▶ AuthProvider initializes
        │
        ├──▶ Reads session from cookies
        ├──▶ Builds UserSession object
        └──▶ Provides to all components via context
```

---

## 👤 User States & Roles

### Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  🔑 ADMIN (Level 4)                                                         │
│  ├── Detection: Email in ADMIN_EMAILS env var                              │
│  ├── Access: Everything + /admin/* routes                                  │
│  └── Can: Approve events, manage claims, view all data                     │
│                                                                             │
│  📣 ORGANIZER (Level 3)                                                     │
│  ├── Detection: Has approved claim in organizer_users table                │
│  ├── Access: Attendee + organizer dashboard                                │
│  └── Can: Manage their organizer's events, view analytics                  │
│                                                                             │
│  👤 ATTENDEE (Level 2)                                                      │
│  ├── Detection: Has valid Supabase session                                 │
│  ├── Access: Guest + protected routes (/my/*, /submit/*)                   │
│  └── Can: Submit events, save hearts, follow organizers                    │
│                                                                             │
│  🌐 GUEST (Level 1)                                                         │
│  ├── Detection: No session                                                 │
│  ├── Access: Public routes only                                            │
│  └── Can: Browse events, view details (read-only)                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Authentication States

| State | `isLoading` | `session` | Description |
|-------|-------------|-----------|-------------|
| **Loading** | `true` | `null` | Initial load, checking session |
| **Logged Out** | `false` | `null` | No valid session |
| **Logged In** | `false` | `UserSession` | Authenticated user |

### UserSession Object

```typescript
interface UserSession {
  id: string;           // Supabase user ID (UUID)
  email: string;        // User's email
  name: string | null;  // Display name
  avatarUrl: string | null;
  role: 'guest' | 'attendee' | 'organizer' | 'admin';
  isAdmin: boolean;     // Quick admin check
  organizerId: string | null;  // If verified organizer
  createdAt: string;    // ISO timestamp
}
```

---

## 📚 Feature Taxonomy

### 1. Hearts (Saved Events) ❤️

**Purpose**: Let users save events they're interested in

| Action | API | Component |
|--------|-----|-----------|
| Toggle heart | `POST /api/hearts` | `<HeartButton>` |
| Get all hearts | `GET /api/hearts` | `/my/hearts` page |
| Check if hearted | `GET /api/hearts?eventIds=...` | `useHeart()` hook |

**States**:
- `hearted: true` - Event is saved
- `hearted: false` - Event is not saved
- `loading: true` - Request in progress

### 2. Follows (Notifications) 👀

**Purpose**: Let users follow organizers/venues/categories for updates

| Action | API | Entity Types |
|--------|-----|--------------|
| Toggle follow | `POST /api/follows` | organizer, venue, category |
| Get follows | `GET /api/follows` | All or filtered by type |
| Check if following | `GET /api/follows?check...` | Single entity |

### 3. Profile (Settings) ⚙️

**Purpose**: User preferences and account info

| Action | API | Fields |
|--------|-----|--------|
| Get profile | `GET /api/profile` | All profile data |
| Update profile | `PATCH /api/profile` | display_name, notifications, etc. |

### 4. Organizer Claims 🏢

**Purpose**: Let users claim and manage organizer profiles

**Claim Flow**:
```
1. User finds organizer page
2. Clicks "Claim this organizer"
3. Submits claim request
4. Admin reviews and approves/rejects
5. If approved, user can manage organizer
```

**Claim States**:
- `pending` - Awaiting admin review
- `approved` - User can manage organizer
- `rejected` - Claim denied

---

## 🗄 Database Schema

### Tables Overview

```sql
-- Core auth (Supabase managed)
auth.users          -- Email, password, metadata

-- User data (public schema)
profiles            -- User preferences, display info
hearts              -- Saved events
user_follows        -- Following organizers/venues/categories
organizer_users     -- Organizer claims and team members

-- Support
email_queue         -- Outgoing email queue
organizer_claim_log -- Audit trail for claims
```

### Key Relationships

```
auth.users (1) ──────┬──────▶ (1) profiles
                     │
                     ├──────▶ (*) hearts ──────▶ events
                     │
                     ├──────▶ (*) user_follows ──┬──▶ organizers
                     │                           ├──▶ locations (venues)
                     │                           └──▶ categories
                     │
                     └──────▶ (*) organizer_users ──▶ organizers
```

### RLS Policies Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | Own | Auto-created | Own | - |
| hearts | Own | Own | - | Own |
| user_follows | Own | Own | Own | Own |
| organizer_users | Own + Team | Own (pending only) | - | - |

---

## 📁 File Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx        # 📄 Login page with magic link form
│   │   ├── callback/route.ts     # 🔧 Processes magic link tokens
│   │   └── logout/route.ts       # 🔧 Signs out and redirects
│   │
│   ├── my/
│   │   ├── hearts/page.tsx       # ❤️ Saved events page
│   │   ├── settings/
│   │   │   ├── page.tsx          # ⚙️ Profile settings page
│   │   │   └── profile-form.tsx  # 📝 Settings form component
│   │   └── submissions/page.tsx  # 📋 User's event submissions
│   │
│   ├── api/
│   │   ├── hearts/route.ts       # 💜 Hearts API
│   │   ├── follows/route.ts      # 👀 Follows API
│   │   └── profile/route.ts      # 👤 Profile API
│   │
│   └── layout.tsx                # 🔄 Root layout with AuthProvider
│
├── components/
│   ├── auth/
│   │   ├── index.ts              # 📤 Barrel exports
│   │   ├── login-form.tsx        # 📝 Email input + magic link
│   │   ├── user-avatar.tsx       # 🖼️ Avatar with initials fallback
│   │   └── user-menu.tsx         # 📋 User dropdown menu
│   │
│   ├── hearts/
│   │   ├── index.ts              # 📤 Barrel exports
│   │   └── heart-button.tsx      # ❤️ Heart toggle button
│   │
│   └── layout/
│       ├── header.tsx            # 🔝 Site header with auth
│       ├── header-auth.tsx       # 🔐 Auth controls
│       └── mobile-menu.tsx       # 📱 Mobile nav with auth
│
├── contexts/
│   └── auth-context.tsx          # 🔐 Auth context & provider
│
├── data/
│   └── user/
│       ├── index.ts              # 📤 Barrel exports
│       ├── toggle-heart.ts       # ❤️ Add/remove heart
│       ├── get-hearts.ts         # ❤️ Get user's hearts
│       ├── check-hearts.ts       # ❤️ Check heart status
│       ├── toggle-follow.ts      # 👀 Add/remove follow
│       ├── get-follows.ts        # 👀 Get user's follows
│       ├── get-profile.ts        # 👤 Get profile
│       └── update-profile.ts     # 👤 Update profile
│
├── hooks/
│   ├── index.ts                  # 📤 Barrel exports
│   ├── use-auth.ts               # 🔐 Auth hook
│   └── use-heart.ts              # ❤️ Heart hook with optimistic updates
│
├── lib/
│   ├── auth/
│   │   ├── index.ts              # 📤 Exports
│   │   ├── session.ts            # 🔧 Session utilities
│   │   └── is-admin.ts           # 🔑 Admin check
│   │
│   └── supabase/
│       ├── client.ts             # 🔧 Browser client
│       └── server.ts             # 🔧 Server client
│
├── types/
│   └── user.ts                   # 📝 Auth & user types
│
├── middleware.ts                 # 🛡️ Route protection
│
└── supabase/
    └── migrations/
        ├── 00010_user_profiles_and_hearts.sql
        └── 00011_user_auth_complete.sql
```

---

## 🔌 API Reference

### Hearts API

#### POST /api/hearts - Toggle Heart

```typescript
// Request
POST /api/hearts
Content-Type: application/json
{ "eventId": "uuid-here" }

// Response (success)
{
  "success": true,
  "hearted": true,
  "heartCount": 42
}

// Response (error)
{
  "success": false,
  "error": "Please sign in to save events",
  "code": "UNAUTHORIZED"
}
```

#### GET /api/hearts - Get Hearts

```typescript
// Get all hearts
GET /api/hearts?limit=20&offset=0&includePast=true

// Check specific events
GET /api/hearts?eventIds=uuid1,uuid2,uuid3

// Response (all hearts)
{
  "success": true,
  "events": [HeartedEvent, ...],
  "total": 42
}

// Response (check)
{
  "success": true,
  "hearts": { "uuid1": true, "uuid2": false }
}
```

### Follows API

#### POST /api/follows - Toggle Follow

```typescript
POST /api/follows
Content-Type: application/json
{
  "entityType": "organizer",  // or "venue" or "category"
  "entityId": "uuid-here",
  "notifyNewEvents": true     // optional
}

// Response
{
  "success": true,
  "following": true
}
```

### Profile API

#### GET /api/profile

```typescript
GET /api/profile

// Response
{
  "success": true,
  "profile": {
    "id": "uuid",
    "display_name": "Jane Doe",
    "email": "jane@example.com",
    "email_notifications": true,
    ...
  }
}
```

#### PATCH /api/profile

```typescript
PATCH /api/profile
Content-Type: application/json
{
  "display_name": "New Name",
  "email_notifications": false
}

// Response
{
  "success": true,
  "profile": { ... updated profile ... }
}
```

---

## ⚙️ Setup Instructions

### 1. Supabase Project Setup

1. Create project at [supabase.com](https://supabase.com)
2. Go to Settings → API
3. Copy `URL` and `anon key`
4. Add to `.env.local`

### 2. Enable Auth Providers

1. Dashboard → Authentication → Providers
2. Enable "Email" provider
3. Check "Confirm email" ✅
4. Check "Magic Link" ✅

### 3. Configure Redirect URLs

1. Dashboard → Authentication → URL Configuration
2. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-production-domain.com/auth/callback`

### 4. Run Database Migrations

1. Dashboard → SQL Editor
2. Create new query
3. Paste contents of `00010_user_profiles_and_hearts.sql`
4. Run
5. Repeat for `00011_user_auth_complete.sql`

### 5. Set Admin Emails

```env
# .env.local
ADMIN_EMAILS=admin@yoursite.com,you@yoursite.com
```

### 6. Verify Setup

```bash
npm run dev
# Visit http://localhost:3000/auth/login
# Enter your email
# Check inbox for magic link
# Click link
# Should be logged in!
```

---

## 💻 Component Usage

### Basic Auth Check

```tsx
'use client';

import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { session, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!session) return <div>Please log in</div>;

  return <div>Hello, {session.name}!</div>;
}
```

### Heart Button

```tsx
import { HeartButton } from '@/components/hearts';

function EventCard({ event }) {
  return (
    <div>
      <h2>{event.title}</h2>
      <HeartButton
        eventId={event.id}
        initialHearted={event.userHasHearted}
        initialCount={event.heart_count}
        showCount
      />
    </div>
  );
}
```

### Protected Route Pattern

```tsx
// Server component - check auth server-side
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirect=/protected-page');
  }

  return <div>Protected content for {user.email}</div>;
}
```

### Admin-Only Content

```tsx
'use client';

import { useAuth } from '@/hooks/use-auth';

function AdminPanel() {
  const { session } = useAuth();

  if (!session?.isAdmin) {
    return null; // Hide for non-admins
  }

  return <div>Admin controls...</div>;
}
```

---

## 🔧 Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Magic link not received | Email in spam | Check spam folder; verify Supabase email settings |
| Callback 500 error | Token expired/used | Tokens are single-use; request new link |
| Session not persisting | Cookie issue | Verify `NEXT_PUBLIC_SITE_URL` matches actual URL |
| "Permission denied" | RLS policy | Check database policies in Supabase dashboard |
| Redirect loop | Middleware issue | Check middleware matcher patterns |

### Debug Logging

All auth operations log with emoji prefixes:

```
🔐 [Auth] Starting: signIn
🔐 ✅ [Auth] Magic link sent (email: user@example.com)
📨 [AuthCallback] Auth callback received
🎉 [AuthContext] User signed in (email: user@example.com)
👋 [AuthContext] User signed out
🛡️ [Middleware] Redirecting to login...
```

### Test Checklist

- [ ] Can access `/auth/login`
- [ ] Can enter email and submit
- [ ] Magic link email is received
- [ ] Clicking link logs user in
- [ ] Header shows user avatar
- [ ] User menu dropdown works
- [ ] Can sign out
- [ ] Session persists on page refresh
- [ ] Admin routes blocked for non-admins
- [ ] Protected routes redirect to login
- [ ] Heart button toggles correctly
- [ ] My Hearts page shows saved events

---

## 🎉 You're All Set!

The auth system provides:

- ✅ Magic link login (no passwords!)
- ✅ User session management
- ✅ Role-based access control
- ✅ Protected routes via middleware
- ✅ Hearts (saved events) feature
- ✅ Follows (organizers/venues/categories)
- ✅ Profile settings
- ✅ Beautiful, accessible UI
- ✅ Comprehensive logging
- ✅ Error handling with toasts

---

## 📚 Related Documentation

- [AUTH-README.md](./AUTH-README.md) - Original auth quick start
- [AI_DEV_DOCS/21-USER-AUTH-IMPLEMENTATION.md](./AI_DEV_DOCS/21-USER-AUTH-IMPLEMENTATION.md) - Full implementation guide
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth) - Official Supabase docs

---

*Last updated: January 2026*
