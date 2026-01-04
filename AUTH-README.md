# 🔐 Happenlist Authentication System

> **A complete magic link auth system for Happenlist**
> Built with Supabase Auth, React Context, and Next.js 14
>
> **Status**: ✅ IMPLEMENTED (Phase 4 Complete)
> **Updated**: 2026-01-04

---

## 📋 Table of Contents

1. [Quick Start](#-quick-start)
2. [How It Works](#-how-it-works)
3. [Architecture](#-architecture)
4. [User States](#-user-states)
5. [File Structure](#-file-structure)
6. [Setup Instructions](#-setup-instructions)
7. [Using Auth in Components](#-using-auth-in-components)
8. [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### 1. Run the Database Migrations

```bash
# In Supabase Dashboard → SQL Editor
# Run these migrations in order:
# 1. supabase/migrations/00010_user_profiles_and_hearts.sql
# 2. supabase/migrations/00011_user_auth_complete.sql
```

### 2. Configure Supabase Auth

```bash
# Supabase Dashboard → Authentication → Providers → Email
# ✅ Enable Email Provider
# ✅ Enable "Confirm email"
# ✅ Enable "Magic Link"
```

### 3. Set Redirect URLs

```bash
# Supabase Dashboard → Authentication → URL Configuration
# Add to "Redirect URLs":
#   http://localhost:3000/auth/callback
#   https://your-domain.com/auth/callback
```

### 4. Set Environment Variables

```env
# .env.local

# Already set (from your Supabase setup):
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Add these:
ADMIN_EMAILS=your@email.com,another@admin.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5. Install Packages

```bash
npm install @radix-ui/react-dropdown-menu @radix-ui/react-dialog sonner
```

### 6. Start the App!

```bash
npm run dev
```

---

## 🔄 How It Works

### Magic Link Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  1️⃣ USER CLICKS "LOGIN"                                                 │
│     │                                                                   │
│     └─→ Goes to /auth/login                                            │
│                                                                         │
│  2️⃣ USER ENTERS EMAIL                                                   │
│     │                                                                   │
│     └─→ LoginForm calls signIn(email)                                  │
│         └─→ Supabase sends magic link email                            │
│                                                                         │
│  3️⃣ USER CLICKS LINK IN EMAIL                                          │
│     │                                                                   │
│     └─→ Opens /auth/callback?token_hash=xxx&type=magiclink            │
│         └─→ Route handler verifies token with Supabase                 │
│         └─→ Session cookie is set                                      │
│         └─→ Redirects to intended page (or home)                       │
│                                                                         │
│  4️⃣ USER IS NOW LOGGED IN! 🎉                                           │
│     │                                                                   │
│     └─→ AuthProvider updates session state                             │
│     └─→ Header shows user avatar + menu                                │
│     └─→ User can access protected pages                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Session Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  APP LOADS                                                              │
│     │                                                                   │
│     └─→ AuthProvider initializes                                       │
│         └─→ Creates Supabase browser client                            │
│         └─→ Checks for existing session                                │
│         └─→ Listens for auth state changes                             │
│                                                                         │
│  SESSION EXISTS?                                                        │
│     │                                                                   │
│     ├─→ YES: Build UserSession, update state                          │
│     │        └─→ isLoading = false, session = {...}                   │
│     │                                                                   │
│     └─→ NO:  Set session to null                                       │
│              └─→ isLoading = false, session = null                    │
│                                                                         │
│  AUTH STATE CHANGES (Supabase events)                                   │
│     │                                                                   │
│     ├─→ SIGNED_IN:     Update session                                  │
│     ├─→ SIGNED_OUT:    Clear session                                   │
│     ├─→ TOKEN_REFRESH: Update session (background)                     │
│     └─→ USER_UPDATED:  Update session                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🏗 Architecture

### Core Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **AuthProvider** | `src/contexts/auth-context.tsx` | Wraps app, provides session state |
| **useAuth** | `src/hooks/use-auth.ts` | Hook to access auth context |
| **LoginForm** | `src/components/auth/login-form.tsx` | Email input + magic link send |
| **UserMenu** | `src/components/auth/user-menu.tsx` | Logged-in user dropdown |
| **UserAvatar** | `src/components/auth/user-avatar.tsx` | Avatar with initials fallback |
| **HeaderAuth** | `src/components/layout/header-auth.tsx` | Auth controls in header |
| **MobileMenu** | `src/components/layout/mobile-menu.tsx` | Mobile nav with auth |

### Routes

| Route | Type | Purpose |
|-------|------|---------|
| `/auth/login` | Page | Login form with magic link |
| `/auth/callback` | Route Handler | Processes magic link tokens |
| `/auth/logout` | Route Handler | Signs out and redirects home |

### Data Flow

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    Supabase      │────▶│   AuthProvider   │────▶│   Components     │
│    Auth          │     │   (Context)      │     │   (via useAuth)  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
        │                        │                        │
        │  onAuthStateChange     │  session, isLoading    │
        │  Token refresh         │  signIn, signOut       │
        │                        │                        │
```

---

## 👤 User States

### Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  🔑 ADMIN (Super Admin)                                                 │
│  └── Detection: email in ADMIN_EMAILS env var                          │
│  └── Access: Everything + /admin/*                                     │
│                                                                         │
│  📣 ORGANIZER (Verified Organizer)                                      │
│  └── Detection: organizers.user_id = current user + claim_verified    │
│  └── Access: Attendee + organizer dashboard                            │
│                                                                         │
│  👤 ATTENDEE (Logged In User)                                           │
│  └── Detection: Has valid session                                      │
│  └── Access: Submit events, save hearts, /my/* pages                   │
│                                                                         │
│  🌐 GUEST (Anonymous)                                                   │
│  └── Detection: No session                                             │
│  └── Access: Browse only, no save/submit                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### UserSession Type

```typescript
interface UserSession {
  id: string;           // Supabase user ID
  email: string;        // User email
  name: string | null;  // Display name
  avatarUrl: string | null;
  role: 'guest' | 'attendee' | 'organizer' | 'admin';
  isAdmin: boolean;     // Quick admin check
  organizerId: string | null;  // If verified organizer
  createdAt: string;
}
```

---

## 📁 File Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx           # 📄 Login page
│   │   ├── callback/
│   │   │   └── route.ts           # 🔧 Magic link handler
│   │   └── logout/
│   │       └── route.ts           # 🔧 Logout handler
│   │
│   ├── my/                        # 🔐 Protected user pages
│   │   ├── hearts/
│   │   │   └── page.tsx           # ❤️ Saved events
│   │   ├── settings/
│   │   │   ├── page.tsx           # ⚙️ Profile settings page
│   │   │   └── profile-form.tsx   # 📝 Profile edit form
│   │   └── submissions/
│   │       └── page.tsx           # 📋 User submissions
│   │
│   ├── api/
│   │   ├── hearts/
│   │   │   └── route.ts           # ❤️ Hearts API
│   │   ├── follows/
│   │   │   └── route.ts           # 👀 Follows API
│   │   └── profile/
│   │       └── route.ts           # 👤 Profile API
│   │
│   └── layout.tsx                 # 🔄 Wraps app with AuthProvider
│
├── components/
│   ├── auth/
│   │   ├── index.ts               # 📤 Barrel export
│   │   ├── login-form.tsx         # 📝 Email input form
│   │   ├── user-avatar.tsx        # 🖼️ Avatar component
│   │   └── user-menu.tsx          # 📋 User dropdown menu
│   │
│   ├── hearts/
│   │   ├── index.ts               # 📤 Barrel export
│   │   └── heart-button.tsx       # ❤️ Toggle heart button
│   │
│   └── layout/
│       ├── header.tsx             # 🔄 Updated with auth
│       ├── header-auth.tsx        # 🔐 Auth controls
│       └── mobile-menu.tsx        # 📱 Mobile nav drawer
│
├── contexts/
│   ├── index.ts                   # 📤 Barrel export
│   └── auth-context.tsx           # 🔐 Auth context + provider
│
├── data/
│   └── user/
│       ├── index.ts               # 📤 Barrel export
│       ├── toggle-heart.ts        # ❤️ Heart/unheart event
│       ├── get-hearts.ts          # ❤️ Get user hearts
│       ├── check-hearts.ts        # ❤️ Check heart status
│       ├── toggle-follow.ts       # 👀 Follow/unfollow
│       ├── get-follows.ts         # 👀 Get user follows
│       ├── get-profile.ts         # 👤 Get user profile
│       └── update-profile.ts      # 👤 Update profile
│
├── hooks/
│   ├── index.ts                   # 📤 Barrel export
│   ├── use-auth.ts                # 🪝 Auth hook
│   └── use-heart.ts               # ❤️ Heart state hook
│
├── lib/
│   ├── auth/
│   │   ├── index.ts               # 📤 Exports
│   │   ├── session.ts             # 🔧 Session utilities
│   │   └── is-admin.ts            # 🔑 Admin check
│   └── constants/
│       └── routes.ts              # 🗺️ Route definitions
│
├── middleware.ts                  # 🛡️ Route protection
│
├── types/
│   └── user.ts                    # 📝 Auth types
│
└── supabase/
    └── migrations/
        ├── 00010_user_profiles_and_hearts.sql
        └── 00011_user_auth_complete.sql
```

---

## ⚙️ Setup Instructions

### Step 1: Supabase Configuration

1. **Enable Email Auth**
   - Go to: Supabase Dashboard → Authentication → Providers
   - Enable "Email" provider
   - Check "Confirm email"
   - Check "Magic Link"

2. **Set Redirect URLs**
   - Go to: Authentication → URL Configuration
   - Add your callback URLs:
     - `http://localhost:3000/auth/callback` (dev)
     - `https://yourdomain.com/auth/callback` (prod)

3. **Email Templates** (optional)
   - Go to: Authentication → Email Templates
   - Customize the "Magic Link" template

### Step 2: Environment Variables

Create/update `.env.local`:

```env
# Supabase (should already exist)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Auth Config
ADMIN_EMAILS=admin@yoursite.com,you@yoursite.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Step 3: Run Database Migration

```sql
-- In Supabase SQL Editor, run:
-- supabase/migrations/00010_user_profiles_and_hearts.sql

-- This creates:
-- ✅ profiles table
-- ✅ hearts table
-- ✅ Auto-create profile trigger
-- ✅ Heart count sync trigger
```

### Step 4: Verify Setup

```bash
npm run dev
```

Then test:
1. Click "Login" in header
2. Enter your email
3. Check email for magic link
4. Click link
5. Verify you're logged in (avatar shows in header)

---

## 💻 Using Auth in Components

### Basic Usage

```tsx
'use client';

import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { session, isLoading, signIn, signOut } = useAuth();

  // Show loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Not logged in
  if (!session) {
    return (
      <button onClick={() => signIn('user@example.com')}>
        Login
      </button>
    );
  }

  // Logged in!
  return (
    <div>
      <p>Hello, {session.name}!</p>
      <p>Role: {session.role}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Check Admin Status

```tsx
import { useAuth } from '@/hooks/use-auth';

function AdminOnlyFeature() {
  const { session } = useAuth();

  if (!session?.isAdmin) {
    return null; // Hide for non-admins
  }

  return <div>Admin controls here</div>;
}
```

### Redirect After Login

```tsx
// In login form
const { signIn } = useAuth();

// User will be redirected to /submit/new after login
await signIn(email, '/submit/new');
```

### Conditional Rendering

```tsx
import { useAuth } from '@/hooks/use-auth';

function EventCard({ event }) {
  const { session } = useAuth();

  return (
    <div>
      <h3>{event.title}</h3>

      {/* Only show heart button if logged in */}
      {session && <HeartButton eventId={event.id} />}

      {/* Show different CTA based on auth */}
      {session ? (
        <button>Save Event</button>
      ) : (
        <a href="/auth/login?redirect=/events">Login to Save</a>
      )}
    </div>
  );
}
```

---

## 🔧 Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| **Magic link not received** | Email not in allow list | Check Supabase email settings |
| **Callback 500 error** | Token already used | Tokens are single-use; request new link |
| **Session not persisting** | Cookie issue | Verify `NEXT_PUBLIC_SITE_URL` matches actual URL |
| **"permission denied"** | RLS policy issue | Check database policies |
| **Redirect loop** | Middleware misconfigured | Check middleware matcher patterns |

### Debug Logging

All auth operations are logged with emoji prefixes:

```
🔐 ▶️ [Auth] Starting: signIn
🔐 ✅ [Auth] Magic link sent (email: user@example.com)
🔐 📨 [AuthCallback] Auth callback received
🎉 [AuthContext] User signed in (email: user@example.com)
👋 [AuthContext] User signed out
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
- [ ] Admin email shows admin badge
- [ ] Protected routes redirect to login

---

## 📚 Related Documentation

- [21-USER-AUTH-IMPLEMENTATION.md](./AI_DEV_DOCS/21-USER-AUTH-IMPLEMENTATION.md) - Full implementation guide
- [22-AUTH-QUICK-REFERENCE.md](./AI_DEV_DOCS/22-AUTH-QUICK-REFERENCE.md) - Quick reference card
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth) - Official docs

---

## 🎉 That's It!

You now have a complete authentication system with:

- ✅ Magic link login (no passwords!)
- ✅ User session management
- ✅ Role-based access (guest, attendee, organizer, admin)
- ✅ User menu with avatar
- ✅ Mobile-friendly auth
- ✅ Toast notifications
- ✅ Beautiful, accessible UI
- ✅ Hearts system (save/unsave events)
- ✅ Follows system (follow organizers/venues/categories)
- ✅ Profile settings page
- ✅ Route protection middleware

**Questions?** Check the troubleshooting section or the detailed implementation guide.

---

## 📋 What's Next?

**Still to implement:**
- [ ] Organizer claiming system (request to manage an organizer)
- [ ] Organizer dashboard
- [ ] Email notifications
- [ ] Weekly digest emails

See `USER-AUTH-README.md` for the complete feature documentation.
