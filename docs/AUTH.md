# Authentication & User System

> Complete guide to auth, user roles, hearts, follows, and profile management.

---

## Quick Start

### 1. Install Dependencies

```bash
npm install @supabase/ssr @supabase/supabase-js sonner
npm install @radix-ui/react-dropdown-menu @radix-ui/react-dialog
```

### 2. Configure Environment

```env
# .env.local

# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Admin emails (comma-separated)
ADMIN_EMAILS=admin@example.com,you@example.com

# Site URL (for auth redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Configure Supabase Auth

1. **Enable Email Provider**: Dashboard > Authentication > Providers > Email
2. **Enable Magic Link**: Check "Confirm email" and "Magic Link"
3. **Add Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback`

### 4. Run SQL Migrations

```sql
-- In Supabase Dashboard > SQL Editor
-- Run: supabase/migrations/00010_user_profiles_and_hearts.sql
-- Run: supabase/migrations/00011_user_auth_complete.sql
```

---

## Architecture Overview

```
               USER REQUEST
                    |
                    v
    +-------------------------------+
    |        SUPABASE AUTH          |
    |   (Magic Link / Email Auth)   |
    +---------------+---------------+
                    |
                    v
    +-------------------------------+
    |       NEXT.JS MIDDLEWARE      |
    |    (Route Protection)         |
    +---------------+---------------+
                    |
                    v
    +-------------------------------+
    |        AUTH PROVIDER          |
    |   (React Context + useAuth)   |
    +-------------------------------+
```

### Auth Flow

```
1. User clicks "Sign In"
   |
   +---> /auth/login page
         |
         +---> User enters email, clicks "Send Magic Link"
               |
               +---> Supabase sends magic link email

2. User clicks link in email
   |
   +---> /auth/callback route
         |
         +---> Verifies token, creates session
               |
               +---> Redirects to original destination

3. App loads with session
   |
   +---> AuthProvider reads session from cookies
         |
         +---> All components access via useAuth()
```

---

## User Roles

| Role | Detection | Access |
|------|-----------|--------|
| **Guest** | No session | Browse only |
| **Attendee** | Has session | Submit, heart, follow |
| **Organizer** | Has approved claim | Manage their events |
| **Admin** | Email in `ADMIN_EMAILS` | Everything |

### Role Hierarchy

```
ADMIN         Full access + approval workflows
   |
ORGANIZER     Manage their organizer's events
   |
ATTENDEE      Submit events, heart, follow, profile
   |
GUEST         Browse events (read-only)
```

### Permissions Matrix

| Action | Guest | Attendee | Organizer | Admin |
|--------|-------|----------|-----------|-------|
| Browse events | Yes | Yes | Yes | Yes |
| View event details | Yes | Yes | Yes | Yes |
| Heart/save events | No | Yes | Yes | Yes |
| Follow organizers | No | Yes | Yes | Yes |
| Submit events | No | Yes | Yes | Yes |
| View own submissions | No | Yes | Yes | Yes |
| Manage organizer | No | No | Own only | All |
| Approve events | No | No | No | Yes |
| Access /admin/* | No | No | No | Yes |

---

## Authentication States

| State | `isLoading` | `session` | UI |
|-------|-------------|-----------|-----|
| **Loading** | `true` | `null` | Show skeleton |
| **Logged Out** | `false` | `null` | Show "Sign In" |
| **Logged In** | `false` | `UserSession` | Show user menu |

### UserSession Object

```typescript
interface UserSession {
  id: string;              // Supabase user ID (UUID)
  email: string;           // User's email
  name: string | null;     // Display name
  avatarUrl: string | null;
  role: 'guest' | 'attendee' | 'organizer' | 'admin';
  isAdmin: boolean;        // Quick admin check
  organizerId: string | null;
  createdAt: string;
}
```

---

## Key Files

### Auth Routes

```
src/app/auth/
├── login/page.tsx       # Magic link login form
├── callback/route.ts    # Handle magic link tokens
└── logout/route.ts      # Sign out and redirect
```

### Auth Context & Hooks

```
src/contexts/auth-context.tsx   # AuthProvider + context
src/hooks/use-auth.ts           # useAuth() hook
src/lib/auth/session.ts         # Server-side session utils
src/lib/auth/is-admin.ts        # Admin check
```

### Auth Components

```
src/components/auth/
├── login-form.tsx       # Email input form
├── user-menu.tsx        # Dropdown for logged-in users
└── user-avatar.tsx      # Avatar with initials fallback
```

### User Features

```
src/app/my/
├── hearts/page.tsx      # Saved events
├── submissions/page.tsx # User's event submissions
└── settings/page.tsx    # Profile settings

src/app/api/
├── hearts/route.ts      # Heart toggle API
├── follows/route.ts     # Follow toggle API
└── profile/route.ts     # Profile CRUD API
```

---

## Usage Examples

### Basic Auth Check

```tsx
'use client';

import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { session, isLoading } = useAuth();

  if (isLoading) return <Skeleton />;
  if (!session) return <LoginPrompt />;

  return <div>Hello, {session.name || session.email}!</div>;
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
        initialHearted={false}
        showCount
      />
    </div>
  );
}
```

### Protected Server Component

```tsx
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

  if (!session?.isAdmin) return null;

  return <div>Admin controls...</div>;
}
```

---

## API Reference

### Hearts API

```typescript
// Toggle heart
POST /api/hearts
Body: { eventId: string }
Response: { success: true, hearted: boolean, heartCount: number }

// Get user's hearts
GET /api/hearts?limit=20&offset=0&includePast=true
Response: { success: true, events: HeartedEvent[], total: number }

// Check specific events
GET /api/hearts?eventIds=uuid1,uuid2
Response: { success: true, hearts: { uuid1: true, uuid2: false } }
```

### Follows API

```typescript
// Toggle follow
POST /api/follows
Body: { entityType: 'organizer'|'venue'|'category', entityId: string }
Response: { success: true, following: boolean }

// Get user's follows
GET /api/follows?type=organizer
Response: { success: true, follows: Follow[] }
```

### Profile API

```typescript
// Get profile
GET /api/profile
Response: { success: true, profile: Profile }

// Update profile
PATCH /api/profile
Body: { display_name?: string, email_notifications?: boolean }
Response: { success: true, profile: Profile }
```

---

## Database Schema

### Tables

```sql
-- User profiles (linked to auth.users)
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  display_name TEXT,
  avatar_url TEXT,
  email_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Saved events
hearts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  event_id UUID REFERENCES events,
  created_at TIMESTAMPTZ,
  UNIQUE(user_id, event_id)
)

-- Following organizers/venues/categories
user_follows (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  entity_type TEXT,  -- 'organizer', 'venue', 'category'
  entity_id UUID,
  notify_new_events BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  UNIQUE(user_id, entity_type, entity_id)
)

-- Organizer claims
organizer_users (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  organizer_id UUID REFERENCES organizers,
  role TEXT DEFAULT 'member',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ
)
```

### RLS Policies

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | Own | Auto | Own | - |
| hearts | Own | Own | - | Own |
| user_follows | Own | Own | Own | Own |
| organizer_users | Own+Team | Own | - | - |

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Magic link not received | Email in spam | Check spam; verify Supabase email settings |
| Callback 500 error | Token expired/used | Tokens single-use; request new link |
| Session not persisting | Cookie issue | Verify `NEXT_PUBLIC_SITE_URL` matches URL |
| "Permission denied" | RLS policy | Check Supabase policies |
| Redirect loop | Middleware | Check matcher patterns |

### Debug Logging

```
[Auth] Starting: signIn
[Auth] Magic link sent (email: user@example.com)
[AuthCallback] Auth callback received
[AuthContext] User signed in (email: user@example.com)
[AuthContext] User signed out
[Middleware] Redirecting to login...
```

---

## Test Checklist

- [ ] Can access `/auth/login`
- [ ] Can enter email and submit
- [ ] Magic link email is received
- [ ] Clicking link logs user in
- [ ] Header shows user menu
- [ ] User menu dropdown works
- [ ] Can sign out
- [ ] Session persists on refresh
- [ ] Admin routes blocked for non-admins
- [ ] Protected routes redirect to login
- [ ] Heart button toggles correctly
- [ ] My Hearts page shows saved events
- [ ] Profile settings save correctly
