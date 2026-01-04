# 🔐 User Authentication & Roles Implementation Guide

> **Purpose**: Complete implementation guide for authentication, user types, and role-based access
> **For**: AI/Claude Code implementation
> **Created**: 2026-01-03
> **Status**: ✅ PHASE 1 COMPLETE (Core Auth Implemented)

---

## 🎉 Implementation Status

**Phase 1 (Critical Auth)**: ✅ COMPLETE - Users can log in and out via magic link
**Phase 2 (Protected Routes)**: 📋 Pending - Middleware for route protection
**Phase 3 (Hearts)**: 📋 Pending - Save/favorite events
**Phase 4 (Profiles)**: 📋 Pending - User settings
**Phase 5 (Organizer Claiming)**: 📋 Pending - Claim organizer profiles

See `AUTH-README.md` in the project root for implementation details.

---

## 📋 Table of Contents

1. [Current State Assessment](#current-state-assessment)
2. [User Types & Permissions Matrix](#user-types--permissions-matrix)
3. [Database Schema Additions](#database-schema-additions)
4. [File Structure](#file-structure)
5. [Implementation Phases](#implementation-phases)
6. [Component Specifications](#component-specifications)
7. [API Routes](#api-routes)
8. [Auth Flow Diagrams](#auth-flow-diagrams)
9. [Header & Navigation States](#header--navigation-states)
10. [Protected Routes & Middleware](#protected-routes--middleware)
11. [Organizer Claiming System](#organizer-claiming-system)
12. [Hearts/Saved Events System](#heartssaved-events-system)
13. [Testing Checklist](#testing-checklist)
14. [Troubleshooting Guide](#troubleshooting-guide)

---

## Current State Assessment

### ✅ Phase 1 Complete (Core Auth)

| Component | Location | Notes |
|-----------|----------|-------|
| Session functions | `src/lib/auth/session.ts` | `getSession()`, `requireAuth()`, `signInWithMagicLink()`, `signOut()` |
| Admin detection | `src/lib/auth/is-admin.ts` | Checks `ADMIN_EMAILS` env var |
| **Login page** | `src/app/auth/login/page.tsx` | ✅ Magic link login with email form |
| **Callback route** | `src/app/auth/callback/route.ts` | ✅ Handles magic link token exchange |
| **Logout route** | `src/app/auth/logout/route.ts` | ✅ Signs out and redirects |
| **Auth context** | `src/contexts/auth-context.tsx` | ✅ Client-side session management |
| **useAuth hook** | `src/hooks/use-auth.ts` | ✅ Access auth state in components |
| **User types** | `src/types/user.ts` | ✅ UserSession, Profile, Heart types |
| **Login form** | `src/components/auth/login-form.tsx` | ✅ Email input with states |
| **User menu** | `src/components/auth/user-menu.tsx` | ✅ Radix dropdown for logged-in users |
| **User avatar** | `src/components/auth/user-avatar.tsx` | ✅ Avatar with initials fallback |
| **Header auth** | `src/components/layout/header-auth.tsx` | ✅ Auth controls in header |
| **Mobile menu** | `src/components/layout/mobile-menu.tsx` | ✅ Radix dialog drawer |
| Submission types | `src/types/submission.ts` | Complete event status types |
| Admin pages | `src/app/admin/*` | Dashboard, pending queue, event review |
| Submit form | `src/app/submit/new/*` | 7-step multi-form |
| My submissions | `src/app/my/submissions/*` | User's submitted events |
| Admin API routes | `src/app/api/admin/*` | Approve, reject, request-changes, delete, restore |
| Submit API routes | `src/app/api/submit/*` | Draft CRUD, event submission, series search |
| Logger utility | `src/lib/utils/logger.ts` | `createLogger()` with emoji prefixes |

### 📋 Remaining (Future Phases)

| Component | Priority | Status |
|-----------|----------|--------|
| `middleware.ts` | 🟡 HIGH | Phase 2 - Protected routes via middleware |
| Login modal | 🟡 HIGH | Phase 2 - Inline auth for actions |
| Profiles table + migration | 🟢 MEDIUM | Phase 4 - User preferences |
| Hearts system | 🟢 MEDIUM | Phase 3 - Save/favorite events |
| Organizer claiming | 🟢 MEDIUM | Phase 5 - Link users to organizers |

### ✅ Bugs Fixed

1. ~~**Broken login redirect**~~: `/auth/login` page now exists and works
2. ~~**Mobile menu non-functional**~~: Mobile menu drawer now implemented
3. ~~**No logout mechanism**~~: Logout route and UI menu item implemented

---

## User Types & Permissions Matrix

### Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER ROLE HIERARCHY                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  🔑 SUPER ADMIN                                                        │ │
│  │                                                                         │ │
│  │  Detection: email in ADMIN_EMAILS environment variable                  │ │
│  │                                                                         │ │
│  │  Permissions:                                                           │ │
│  │    ✅ All ORGANIZER permissions                                         │ │
│  │    ✅ All ATTENDEE permissions                                          │ │
│  │    ✅ Access /admin/* pages                                             │ │
│  │    ✅ Approve/reject/request-changes on any event                       │ │
│  │    ✅ Edit any event (published or not)                                 │ │
│  │    ✅ Soft delete/restore any event                                     │ │
│  │    ✅ View admin submission queue                                       │ │
│  │    ✅ View admin activity log                                           │ │
│  │    ✅ Bulk approve scraped events                                       │ │
│  │    ✅ Manage organizer verifications                                    │ │
│  │    ✅ Access admin API endpoints                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                              ▲                                               │
│                              │ inherits                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  📣 VERIFIED ORGANIZER                                                 │ │
│  │                                                                         │ │
│  │  Detection: organizers.user_id = auth.uid()                             │ │
│  │             AND organizers.claim_verified = true                        │ │
│  │                                                                         │ │
│  │  Permissions:                                                           │ │
│  │    ✅ All ATTENDEE permissions                                          │ │
│  │    ✅ View /organizer/dashboard (their org's dashboard)                 │ │
│  │    ✅ Edit their organizer profile                                      │ │
│  │    ✅ Submit events that auto-link to their organizer                   │ │
│  │    ✅ View analytics for their events (future)                          │ │
│  │    ⚙️ Optional: Auto-approve for trusted organizers (configurable)     │ │
│  │                                                                         │ │
│  │  Visual indicator: "Verified Organizer" badge on their events          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                              ▲                                               │
│                              │ inherits                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  👤 ATTENDEE (Authenticated User)                                      │ │
│  │                                                                         │ │
│  │  Detection: auth.uid() IS NOT NULL                                      │ │
│  │             (valid Supabase session exists)                             │ │
│  │                                                                         │ │
│  │  Permissions:                                                           │ │
│  │    ✅ All GUEST permissions                                             │ │
│  │    ✅ Submit events for review                                          │ │
│  │    ✅ Save drafts                                                       │ │
│  │    ✅ View /my/submissions                                              │ │
│  │    ✅ Edit own draft/changes_requested events                           │ │
│  │    ✅ Heart/save events                                                 │ │
│  │    ✅ View /my/hearts (saved events)                                    │ │
│  │    ✅ Claim an organizer profile                                        │ │
│  │    ✅ Manage account preferences                                        │ │
│  │                                                                         │ │
│  │  Visual indicator: Avatar/initial in header                             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                              ▲                                               │
│                              │ inherits                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  🌐 GUEST (Anonymous)                                                  │ │
│  │                                                                         │ │
│  │  Detection: auth.uid() IS NULL (no session)                             │ │
│  │                                                                         │ │
│  │  Permissions:                                                           │ │
│  │    ✅ Browse published events                                           │ │
│  │    ✅ View event details                                                │ │
│  │    ✅ View venue pages                                                  │ │
│  │    ✅ View organizer pages                                              │ │
│  │    ✅ View series pages                                                 │ │
│  │    ✅ Search events                                                     │ │
│  │    ✅ Filter events                                                     │ │
│  │    ❌ Submit events (redirected to login)                               │ │
│  │    ❌ Save/heart events (prompted to login)                             │ │
│  │    ❌ Access /my/* pages                                                │ │
│  │    ❌ Access /admin/* pages                                             │ │
│  │                                                                         │ │
│  │  Visual indicator: "Login" button in header                             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Permissions Quick Reference

| Action | Guest | Attendee | Organizer | Admin |
|--------|-------|----------|-----------|-------|
| Browse events | ✅ | ✅ | ✅ | ✅ |
| View event details | ✅ | ✅ | ✅ | ✅ |
| Search/filter | ✅ | ✅ | ✅ | ✅ |
| Submit events | ❌ | ✅ | ✅ | ✅ |
| Save drafts | ❌ | ✅ | ✅ | ✅ |
| Heart/save events | ❌ | ✅ | ✅ | ✅ |
| View own submissions | ❌ | ✅ | ✅ | ✅ |
| Edit own drafts | ❌ | ✅ | ✅ | ✅ |
| Edit organizer profile | ❌ | ❌ | ✅ (own) | ✅ (any) |
| View org dashboard | ❌ | ❌ | ✅ (own) | ✅ (any) |
| Approve events | ❌ | ❌ | ❌ | ✅ |
| Reject events | ❌ | ❌ | ❌ | ✅ |
| Access admin pages | ❌ | ❌ | ❌ | ✅ |
| Soft delete events | ❌ | ❌ | ❌ | ✅ |

---

## Database Schema Additions

### Migration: `00010_user_profiles_and_roles.sql`

```sql
-- ============================================================================
-- MIGRATION: 00010_user_profiles_and_roles.sql
-- ============================================================================
-- Adds:
--   • profiles table for user preferences
--   • Auto-create profile trigger
--   • Organizer claiming columns
--   • Hearts table for saved events
--
-- Run in Supabase SQL Editor after existing migrations.
-- ============================================================================

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
-- Stores user preferences and display information.
-- Auto-created when a user signs up via magic link.

CREATE TABLE IF NOT EXISTS profiles (
  -- Primary key matches auth.users.id
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info (email copied for convenience)
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  
  -- Preferences
  email_notifications BOOLEAN DEFAULT true,
  email_weekly_digest BOOLEAN DEFAULT false,
  timezone TEXT DEFAULT 'America/Chicago',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- RLS: Users can only access their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Note: INSERT is handled by trigger, no direct insert policy needed

-- Auto-update updated_at
DROP TRIGGER IF EXISTS set_updated_at ON profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE profiles IS 'User profiles with preferences. Auto-created on signup.';

-- ============================================================================
-- 2. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================================
-- When a user signs in via magic link for the first time, Supabase creates
-- a record in auth.users. This trigger creates a matching profile.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    -- Try to get name from metadata, otherwise use email prefix
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

COMMENT ON FUNCTION handle_new_user IS 'Creates a profile when a new user signs up';

-- ============================================================================
-- 3. EXTEND ORGANIZERS TABLE FOR CLAIMING
-- ============================================================================
-- Allow users to "claim" an organizer profile and manage their events.

ALTER TABLE organizers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS claim_verified BOOLEAN DEFAULT false;
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS claim_verification_token TEXT;
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS claim_verification_expires TIMESTAMPTZ;

-- Index for finding user's organizer profiles
CREATE INDEX IF NOT EXISTS idx_organizers_user_id 
  ON organizers(user_id) 
  WHERE user_id IS NOT NULL;

-- Update RLS to allow organizers to edit their own profiles
DROP POLICY IF EXISTS "Organizers can update own profile" ON organizers;
CREATE POLICY "Organizers can update own profile" ON organizers
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid() 
    AND claim_verified = true
  )
  WITH CHECK (
    user_id = auth.uid() 
    AND claim_verified = true
  );

COMMENT ON COLUMN organizers.user_id IS 'Links to auth.users when an organizer is claimed';
COMMENT ON COLUMN organizers.claim_verified IS 'True after verification (email or admin approval)';

-- ============================================================================
-- 4. HEARTS TABLE (Saved Events)
-- ============================================================================
-- Allows users to save/favorite events.

CREATE TABLE IF NOT EXISTS hearts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- One heart per user per event
  UNIQUE(user_id, event_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hearts_user ON hearts(user_id);
CREATE INDEX IF NOT EXISTS idx_hearts_event ON hearts(event_id);
CREATE INDEX IF NOT EXISTS idx_hearts_user_created ON hearts(user_id, created_at DESC);

-- RLS: Users can only manage their own hearts
ALTER TABLE hearts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own hearts" ON hearts;
CREATE POLICY "Users can view own hearts" ON hearts
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own hearts" ON hearts;
CREATE POLICY "Users can insert own hearts" ON hearts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own hearts" ON hearts;
CREATE POLICY "Users can delete own hearts" ON hearts
  FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE hearts IS 'User saved/favorited events';

-- ============================================================================
-- 5. UPDATE EVENT HEART COUNT FUNCTION
-- ============================================================================
-- Trigger to keep events.heart_count in sync.

CREATE OR REPLACE FUNCTION update_event_heart_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events SET heart_count = heart_count + 1 WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events SET heart_count = heart_count - 1 WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_heart_count ON hearts;
CREATE TRIGGER update_heart_count
  AFTER INSERT OR DELETE ON hearts
  FOR EACH ROW EXECUTE FUNCTION update_event_heart_count();

COMMENT ON FUNCTION update_event_heart_count IS 'Keeps events.heart_count in sync with hearts table';

-- ============================================================================
-- 6. HELPER VIEW: User Hearts with Event Details
-- ============================================================================

CREATE OR REPLACE VIEW v_user_hearts AS
SELECT
  h.id as heart_id,
  h.user_id,
  h.created_at as hearted_at,
  e.id as event_id,
  e.title,
  e.slug,
  e.instance_date,
  e.start_datetime,
  e.end_datetime,
  e.image_url,
  e.short_description,
  e.is_free,
  e.price_low,
  e.price_high,
  e.status,
  c.name as category_name,
  c.slug as category_slug,
  l.name as location_name,
  l.city as location_city
FROM hearts h
JOIN events e ON h.event_id = e.id
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN locations l ON e.location_id = l.id
WHERE e.status = 'published'
  AND e.deleted_at IS NULL
ORDER BY e.instance_date ASC;

COMMENT ON VIEW v_user_hearts IS 'User hearts with full event details for display';

-- ============================================================================
-- 7. ORGANIZER CLAIM LOG
-- ============================================================================
-- Audit log for organizer claim attempts and verifications.

CREATE TABLE IF NOT EXISTS organizer_claim_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL, -- 'claim_requested', 'verification_sent', 'verified', 'rejected', 'revoked'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claim_log_organizer ON organizer_claim_log(organizer_id);
CREATE INDEX IF NOT EXISTS idx_claim_log_user ON organizer_claim_log(user_id);

-- RLS: Only admins can view full log
ALTER TABLE organizer_claim_log ENABLE ROW LEVEL SECURITY;

-- No public read policy; admin access via service key

COMMENT ON TABLE organizer_claim_log IS 'Audit trail for organizer claim/verification actions';

-- ============================================================================
-- DONE!
-- ============================================================================
```

### TypeScript Types to Add

```typescript
// Add to src/types/user.ts (new file)

/**
 * USER TYPES
 * ==========
 * Type definitions for user authentication and profiles.
 */

// ============================================================================
// USER ROLES
// ============================================================================

/**
 * User role levels (hierarchical)
 */
export type UserRole = 'guest' | 'attendee' | 'organizer' | 'admin';

/**
 * User session with role information
 */
export interface UserSession {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isAdmin: boolean;
  organizerId: string | null; // If they've claimed an organizer
  createdAt: string;
}

// ============================================================================
// PROFILE TYPES
// ============================================================================

/**
 * User profile from database
 */
export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  email_notifications: boolean;
  email_weekly_digest: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
}

/**
 * Profile update payload
 */
export interface ProfileUpdateData {
  display_name?: string;
  avatar_url?: string;
  email_notifications?: boolean;
  email_weekly_digest?: boolean;
  timezone?: string;
}

// ============================================================================
// HEART TYPES
// ============================================================================

/**
 * Heart record from database
 */
export interface Heart {
  id: string;
  user_id: string;
  event_id: string;
  created_at: string;
}

/**
 * Heart with event details (from v_user_hearts view)
 */
export interface HeartedEvent {
  heart_id: string;
  user_id: string;
  hearted_at: string;
  event_id: string;
  title: string;
  slug: string;
  instance_date: string;
  start_datetime: string;
  end_datetime: string | null;
  image_url: string | null;
  short_description: string | null;
  is_free: boolean;
  price_low: number | null;
  price_high: number | null;
  status: string;
  category_name: string | null;
  category_slug: string | null;
  location_name: string | null;
  location_city: string | null;
}

// ============================================================================
// ORGANIZER CLAIM TYPES
// ============================================================================

/**
 * Organizer claim status
 */
export type ClaimStatus = 'unclaimed' | 'pending' | 'verified' | 'rejected';

/**
 * Organizer with claim info
 */
export interface OrganizerWithClaim {
  id: string;
  name: string;
  slug: string;
  user_id: string | null;
  claimed_at: string | null;
  claim_verified: boolean;
  claim_status: ClaimStatus;
}

/**
 * Claim request payload
 */
export interface ClaimOrganizerRequest {
  organizer_id: string;
  user_email: string;
  verification_method: 'email' | 'admin';
}

// ============================================================================
// AUTH CONTEXT TYPES
// ============================================================================

/**
 * Auth context value for React context
 */
export interface AuthContextValue {
  session: UserSession | null;
  isLoading: boolean;
  signIn: (email: string, redirectTo?: string) => Promise<{ success: boolean; error: string | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

// ============================================================================
// AUTH HELPER TYPES
// ============================================================================

/**
 * Magic link callback result
 */
export interface AuthCallbackResult {
  success: boolean;
  session: UserSession | null;
  redirectTo: string;
  error: string | null;
}

/**
 * Protected route check result
 */
export interface AuthCheckResult {
  authenticated: boolean;
  authorized: boolean;
  session: UserSession | null;
  redirectTo: string | null;
}
```

---

## File Structure

### New Files to Create

```
src/
├── app/
│   ├── auth/                              # AUTH ROUTES (NEW)
│   │   ├── login/
│   │   │   └── page.tsx                   # Magic link login page
│   │   ├── callback/
│   │   │   └── route.ts                   # Handle magic link token
│   │   └── logout/
│   │       └── route.ts                   # Sign out and redirect
│   │
│   ├── my/                                # USER PAGES
│   │   ├── hearts/
│   │   │   └── page.tsx                   # Saved events (NEW)
│   │   ├── settings/
│   │   │   └── page.tsx                   # Account settings (NEW)
│   │   └── submissions/
│   │       └── page.tsx                   # (EXISTS)
│   │
│   ├── organizer/                         # ORGANIZER PAGES (NEW)
│   │   ├── claim/
│   │   │   └── [slug]/
│   │   │       └── page.tsx               # Claim organizer flow
│   │   └── dashboard/
│   │       └── page.tsx                   # Organizer dashboard
│   │
│   └── api/
│       ├── auth/                          # AUTH API (NEW)
│       │   └── callback/
│       │       └── route.ts               # (Alternative callback location)
│       │
│       ├── hearts/                        # HEARTS API (NEW)
│       │   └── route.ts                   # POST: toggle, GET: list
│       │
│       ├── profile/                       # PROFILE API (NEW)
│       │   └── route.ts                   # GET/PUT profile
│       │
│       └── organizer/                     # ORGANIZER API (NEW)
│           ├── claim/
│           │   └── route.ts               # POST: request claim
│           └── verify/
│               └── route.ts               # GET: verify token
│
├── components/
│   ├── auth/                              # AUTH COMPONENTS (NEW)
│   │   ├── index.ts                       # Barrel export
│   │   ├── auth-provider.tsx              # Session context provider
│   │   ├── login-form.tsx                 # Email input form
│   │   ├── login-modal.tsx                # Modal wrapper for login
│   │   ├── user-menu.tsx                  # Logged-in user dropdown
│   │   ├── user-avatar.tsx                # Avatar with fallback
│   │   └── require-auth.tsx               # HOC for protected components
│   │
│   ├── hearts/                            # HEART COMPONENTS (NEW)
│   │   ├── index.ts
│   │   ├── heart-button.tsx               # Toggle heart button
│   │   └── hearts-list.tsx                # List of hearted events
│   │
│   └── layout/
│       ├── header.tsx                     # (UPDATE - add user menu)
│       └── mobile-menu.tsx                # Mobile nav drawer (NEW)
│
├── contexts/                              # REACT CONTEXTS (NEW)
│   ├── index.ts
│   └── auth-context.tsx                   # Auth context definition
│
├── data/
│   ├── auth/                              # AUTH DATA LAYER (NEW)
│   │   ├── index.ts
│   │   └── get-user-role.ts               # Determine user's role
│   │
│   ├── hearts/                            # HEARTS DATA LAYER (NEW)
│   │   ├── index.ts
│   │   ├── get-user-hearts.ts
│   │   ├── toggle-heart.ts
│   │   └── check-heart.ts
│   │
│   ├── profile/                           # PROFILE DATA LAYER (NEW)
│   │   ├── index.ts
│   │   ├── get-profile.ts
│   │   └── update-profile.ts
│   │
│   └── organizer/                         # ORGANIZER DATA LAYER (NEW)
│       ├── request-claim.ts
│       ├── verify-claim.ts
│       └── get-user-organizers.ts
│
├── hooks/                                 # CUSTOM HOOKS (NEW)
│   ├── index.ts
│   ├── use-auth.ts                        # Access auth context
│   ├── use-heart.ts                       # Heart toggle with optimistic update
│   └── use-require-auth.ts                # Redirect if not logged in
│
├── lib/
│   └── auth/
│       ├── index.ts                       # (UPDATE - add exports)
│       ├── session.ts                     # (EXISTS)
│       ├── is-admin.ts                    # (EXISTS)
│       └── get-role.ts                    # Determine role from session (NEW)
│
├── types/
│   └── user.ts                            # User/auth types (NEW)
│
└── middleware.ts                          # Route protection (NEW)
```

### Files to Update

```
src/
├── app/
│   └── layout.tsx                         # Wrap with AuthProvider
│
├── components/
│   └── layout/
│       └── header.tsx                     # Add user menu, login button
│
└── lib/
    └── auth/
        └── index.ts                       # Export new functions
```

---

## Implementation Phases

### Phase 1: Critical Auth Fix (DO FIRST)

**Goal**: Users can log in and out.

**Files to create:**

1. `src/app/auth/login/page.tsx`
2. `src/app/auth/callback/route.ts`
3. `src/app/auth/logout/route.ts`
4. `src/contexts/auth-context.tsx`
5. `src/components/auth/auth-provider.tsx`
6. `src/components/auth/login-form.tsx`
7. `src/components/auth/user-menu.tsx`
8. `src/components/auth/user-avatar.tsx`
9. `src/hooks/use-auth.ts`
10. `src/types/user.ts`

**Files to update:**

1. `src/app/layout.tsx` - Wrap with AuthProvider
2. `src/components/layout/header.tsx` - Add login/user menu
3. `src/lib/auth/index.ts` - Export new functions

**Testing checkpoint:**
- [ ] Can enter email and receive magic link
- [ ] Clicking link logs user in
- [ ] Header shows user avatar when logged in
- [ ] Can sign out
- [ ] Session persists on page refresh

---

### Phase 2: Protected Routes & Middleware

**Goal**: Clean route protection, better UX.

**Files to create:**

1. `src/middleware.ts`
2. `src/components/auth/login-modal.tsx`
3. `src/components/auth/require-auth.tsx`
4. `src/components/layout/mobile-menu.tsx`
5. `src/hooks/use-require-auth.ts`

**Files to update:**

1. `src/app/submit/new/page.tsx` - Use middleware instead of manual redirect
2. `src/app/my/submissions/page.tsx` - Use middleware
3. `src/app/admin/layout.tsx` - Use middleware

**Testing checkpoint:**
- [ ] Unauthenticated users redirected from /submit/*
- [ ] Unauthenticated users redirected from /my/*
- [ ] Non-admins redirected from /admin/*
- [ ] Login modal opens for inline auth
- [ ] Mobile menu works

---

### Phase 3: Hearts/Saved Events

**Goal**: Users can save favorite events.

**Database:**
- Run migration for `hearts` table

**Files to create:**

1. `src/app/my/hearts/page.tsx`
2. `src/app/api/hearts/route.ts`
3. `src/components/hearts/heart-button.tsx`
4. `src/components/hearts/hearts-list.tsx`
5. `src/data/hearts/get-user-hearts.ts`
6. `src/data/hearts/toggle-heart.ts`
7. `src/data/hearts/check-heart.ts`
8. `src/hooks/use-heart.ts`

**Files to update:**

1. `src/components/events/event-card.tsx` - Add heart button
2. Event detail pages - Add heart button

**Testing checkpoint:**
- [ ] Heart button shows on event cards
- [ ] Clicking heart saves event (optimistic update)
- [ ] Heart persists on refresh
- [ ] /my/hearts shows saved events
- [ ] Heart count updates on event

---

### Phase 4: User Profiles & Settings

**Goal**: Users can manage their account.

**Database:**
- Run migration for `profiles` table
- Profile auto-created on signup

**Files to create:**

1. `src/app/my/settings/page.tsx`
2. `src/app/api/profile/route.ts`
3. `src/data/profile/get-profile.ts`
4. `src/data/profile/update-profile.ts`

**Testing checkpoint:**
- [ ] Profile created on first login
- [ ] Can view settings page
- [ ] Can update display name
- [ ] Can toggle email preferences

---

### Phase 5: Organizer Claiming

**Goal**: Users can claim and manage organizer profiles.

**Database:**
- Run migration for organizer claim columns
- Run migration for claim log table

**Files to create:**

1. `src/app/organizer/claim/[slug]/page.tsx`
2. `src/app/organizer/dashboard/page.tsx`
3. `src/app/api/organizer/claim/route.ts`
4. `src/app/api/organizer/verify/route.ts`
5. `src/data/organizer/request-claim.ts`
6. `src/data/organizer/verify-claim.ts`
7. `src/data/organizer/get-user-organizers.ts`

**Files to update:**

1. `src/app/organizer/[slug]/page.tsx` - Add "Claim" button for unclaimed
2. `src/components/layout/user-menu.tsx` - Add "My Organizer" link

**Testing checkpoint:**
- [ ] "Claim this organizer" shows on unclaimed pages
- [ ] Claim request sends verification email
- [ ] Verification link sets claim_verified = true
- [ ] Dashboard shows organizer's events
- [ ] Can edit organizer profile

---

## Component Specifications

### AuthProvider (`src/components/auth/auth-provider.tsx`)

```typescript
/**
 * AUTH PROVIDER
 * =============
 * Client-side wrapper that provides authentication context.
 * Wraps the entire app in layout.tsx.
 * 
 * Features:
 * - Listens for Supabase auth state changes
 * - Provides session to all components via context
 * - Handles initial session load
 * - Auto-refreshes session
 */

'use client';

interface AuthProviderProps {
  children: React.ReactNode;
  initialSession?: UserSession | null;
}

// Implementation notes:
// 1. Use createBrowserClient from @supabase/ssr
// 2. Listen to onAuthStateChange
// 3. Fetch additional user data (profile, organizer status) on session change
// 4. Provide signIn, signOut, refresh methods
// 5. Show loading state during initial load
```

**Context value shape:**

```typescript
{
  session: UserSession | null,
  isLoading: boolean,
  signIn: (email: string, redirectTo?: string) => Promise<{success, error}>,
  signOut: () => Promise<void>,
  refresh: () => Promise<void>,
}
```

---

### LoginForm (`src/components/auth/login-form.tsx`)

```typescript
/**
 * LOGIN FORM
 * ==========
 * Email input form for magic link authentication.
 * 
 * Props:
 * - redirectTo?: string - Where to redirect after login
 * - onSuccess?: () => void - Called after magic link sent
 * - compact?: boolean - Smaller variant for modals
 * 
 * States:
 * 1. Initial: Email input + submit button
 * 2. Loading: Sending magic link
 * 3. Success: "Check your email" message + resend option
 * 4. Error: Error message + retry
 */

interface LoginFormProps {
  redirectTo?: string;
  onSuccess?: () => void;
  compact?: boolean;
}

// Visual structure:
// ┌──────────────────────────────────────────┐
// │  Enter your email                        │
// │  ┌────────────────────────────────────┐  │
// │  │ you@example.com                    │  │
// │  └────────────────────────────────────┘  │
// │                                          │
// │  [    Send Magic Link    ]               │
// │                                          │
// │  We'll email you a link to sign in.      │
// │  No password needed!                     │
// └──────────────────────────────────────────┘
//
// After submit:
// ┌──────────────────────────────────────────┐
// │  ✉️ Check your email!                    │
// │                                          │
// │  We sent a sign-in link to:              │
// │  you@example.com                         │
// │                                          │
// │  Click the link to continue.             │
// │                                          │
// │  [Resend link] (60s cooldown)            │
// │  [Use different email]                   │
// └──────────────────────────────────────────┘
```

---

### UserMenu (`src/components/auth/user-menu.tsx`)

```typescript
/**
 * USER MENU
 * =========
 * Dropdown menu for authenticated users.
 * Shows avatar and provides account actions.
 * 
 * Props:
 * - session: UserSession
 * 
 * Menu items vary by role:
 * - All users: My Saved Events, My Submissions, Settings, Sign Out
 * - Organizers: + My Organizer
 * - Admins: + Admin Dashboard
 */

interface UserMenuProps {
  session: UserSession;
}

// Visual structure (closed):
// ┌────────────────────────────────────────────────────┐
// │  [Avatar] ▼                                        │
// └────────────────────────────────────────────────────┘
//
// Visual structure (open):
// ┌────────────────────────────────────────────────────┐
// │  [Avatar] ▼                                        │
// │  ┌──────────────────────────────────────────────┐  │
// │  │  John Doe                                    │  │
// │  │  john@example.com                   ADMIN    │  │
// │  ├──────────────────────────────────────────────┤  │
// │  │  ❤️ My Saved Events                          │  │
// │  │  📝 My Submissions                           │  │
// │  │  📣 My Organizer          (if organizer)     │  │
// │  ├──────────────────────────────────────────────┤  │
// │  │  🔐 Admin Dashboard       (if admin)         │  │
// │  ├──────────────────────────────────────────────┤  │
// │  │  ⚙️ Settings                                 │  │
// │  │  🚪 Sign Out                                 │  │
// │  └──────────────────────────────────────────────┘  │
// └────────────────────────────────────────────────────┘
```

---

### HeartButton (`src/components/hearts/heart-button.tsx`)

```typescript
/**
 * HEART BUTTON
 * ============
 * Toggle button to save/unsave an event.
 * Uses optimistic updates for instant feedback.
 * 
 * Props:
 * - eventId: string
 * - initialHearted?: boolean
 * - size?: 'sm' | 'md' | 'lg'
 * - showCount?: boolean
 * - count?: number
 * 
 * Behavior:
 * - If not logged in: Opens login modal
 * - If logged in: Toggles heart with optimistic update
 * - On error: Reverts and shows toast
 */

interface HeartButtonProps {
  eventId: string;
  initialHearted?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  count?: number;
}

// Visual states:
// Unhearted: [♡] or [♡ 42]
// Hearted:   [❤️] or [❤️ 43] (filled, coral color)
// Loading:   [⏳] (during API call if needed)
```

---

### LoginModal (`src/components/auth/login-modal.tsx`)

```typescript
/**
 * LOGIN MODAL
 * ===========
 * Modal overlay containing LoginForm.
 * Used for inline authentication without page redirect.
 * 
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - redirectTo?: string
 * - title?: string
 * - message?: string - Why they need to log in
 * 
 * Usage:
 * - Heart button on event (not logged in)
 * - "Submit Event" button (not logged in)
 * - Any action requiring auth
 */

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
  title?: string;
  message?: string;
}

// Visual structure:
// ┌──────────────────────────────────────────────────────┐
// │                                              [X]     │
// │                                                      │
// │   🔐 Sign in to save events                         │
// │                                                      │
// │   Save your favorite events and access them          │
// │   from any device.                                   │
// │                                                      │
// │   ┌────────────────────────────────────────────┐    │
// │   │ (LoginForm component)                      │    │
// │   └────────────────────────────────────────────┘    │
// │                                                      │
// └──────────────────────────────────────────────────────┘
```

---

## API Routes

### Auth Callback (`src/app/auth/callback/route.ts`)

```typescript
/**
 * AUTH CALLBACK ROUTE
 * ===================
 * Handles magic link token from Supabase.
 * 
 * Flow:
 * 1. User clicks magic link in email
 * 2. Link contains ?token_hash=xxx&type=magiclink
 * 3. This route exchanges token for session
 * 4. Redirects to intended destination or home
 * 
 * Query params:
 * - token_hash: string (from Supabase)
 * - type: 'magiclink' | 'signup' | 'recovery'
 * - next: string (optional redirect path)
 * 
 * Error handling:
 * - Invalid token: Redirect to /auth/login?error=invalid_token
 * - Expired token: Redirect to /auth/login?error=expired_token
 */

// GET /auth/callback?token_hash=xxx&type=magiclink&next=/submit/new
```

---

### Hearts API (`src/app/api/hearts/route.ts`)

```typescript
/**
 * HEARTS API
 * ==========
 * Toggle heart (save/unsave) an event.
 * 
 * POST /api/hearts
 * - Body: { eventId: string }
 * - Response: { hearted: boolean, heartCount: number }
 * - Auth: Required
 * 
 * GET /api/hearts
 * - Query: ?eventIds=id1,id2,id3 (optional, check specific events)
 * - Response: { hearts: { [eventId]: boolean } } or { events: HeartedEvent[] }
 * - Auth: Required
 * 
 * DELETE /api/hearts
 * - Body: { eventId: string }
 * - Response: { success: true }
 * - Auth: Required
 */
```

---

### Profile API (`src/app/api/profile/route.ts`)

```typescript
/**
 * PROFILE API
 * ===========
 * Get and update user profile.
 * 
 * GET /api/profile
 * - Response: { profile: Profile }
 * - Auth: Required
 * 
 * PUT /api/profile
 * - Body: ProfileUpdateData
 * - Response: { profile: Profile }
 * - Auth: Required
 */
```

---

### Organizer Claim API (`src/app/api/organizer/claim/route.ts`)

```typescript
/**
 * ORGANIZER CLAIM API
 * ===================
 * Request to claim an organizer profile.
 * 
 * POST /api/organizer/claim
 * - Body: { organizerId: string, verificationMethod: 'email' | 'admin' }
 * - Response: { success: true, message: string }
 * - Auth: Required
 * 
 * Flow (email verification):
 * 1. Generate verification token
 * 2. Store token and expiry on organizer
 * 3. Send email to organizer's listed email
 * 4. Email contains link to /api/organizer/verify?token=xxx
 * 
 * Flow (admin verification):
 * 1. Create claim request in log
 * 2. Notify admin
 * 3. Admin approves/rejects in dashboard
 */
```

---

## Auth Flow Diagrams

### Magic Link Login Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MAGIC LINK LOGIN FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. USER WANTS TO SUBMIT EVENT                                               │
│     │                                                                        │
│     ▼                                                                        │
│  2. CLICKS "Submit an Event" BUTTON                                          │
│     │                                                                        │
│     ├─── Has session? ─── YES ──► Go to /submit/new                         │
│     │                                                                        │
│     └─── NO ──► Redirect to /auth/login?redirect=/submit/new                │
│                  │                                                           │
│                  ▼                                                           │
│  3. LOGIN PAGE SHOWS                                                         │
│     ┌──────────────────────────────────────────┐                            │
│     │  Sign in to Happenlist                    │                            │
│     │                                          │                            │
│     │  Email: [___________________]            │                            │
│     │                                          │                            │
│     │  [    Send Magic Link    ]               │                            │
│     └──────────────────────────────────────────┘                            │
│                  │                                                           │
│                  ▼                                                           │
│  4. USER ENTERS EMAIL, CLICKS SUBMIT                                         │
│     │                                                                        │
│     ▼                                                                        │
│  5. SUPABASE SENDS MAGIC LINK EMAIL                                          │
│     │                                                                        │
│     ├─── Success ──► Show "Check your email" message                        │
│     │                                                                        │
│     └─── Error ──► Show error, allow retry                                  │
│                                                                              │
│  6. USER OPENS EMAIL, CLICKS MAGIC LINK                                      │
│     │                                                                        │
│     ▼                                                                        │
│  7. BROWSER OPENS /auth/callback?token_hash=xxx&type=magiclink&next=...     │
│     │                                                                        │
│     ▼                                                                        │
│  8. CALLBACK ROUTE PROCESSES                                                 │
│     │                                                                        │
│     ├─── Token valid ─────────────────────────────────────────────┐         │
│     │    │                                                         │         │
│     │    ├── New user? ─── YES ──► Trigger creates profile        │         │
│     │    │                                                         │         │
│     │    └── Set session cookie                                    │         │
│     │         │                                                    │         │
│     │         ▼                                                    │         │
│     │    Redirect to `next` param (/submit/new)                   │         │
│     │                                                              │         │
│     └─── Token invalid/expired ──► Redirect to /auth/login?error=xxx       │
│                                                                              │
│  9. USER IS NOW AUTHENTICATED                                                │
│     │                                                                        │
│     └──► Header shows avatar, can access protected pages                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Session Management Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SESSION MANAGEMENT FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  APP LOADS (layout.tsx)                                                      │
│     │                                                                        │
│     ▼                                                                        │
│  AuthProvider initializes                                                    │
│     │                                                                        │
│     ├── Server: getSession() called in layout                               │
│     │    │                                                                   │
│     │    └── Returns initialSession or null                                 │
│     │                                                                        │
│     ▼                                                                        │
│  Client hydrates                                                             │
│     │                                                                        │
│     ├── createBrowserClient() creates Supabase client                       │
│     │                                                                        │
│     ├── onAuthStateChange() listener attached                               │
│     │    │                                                                   │
│     │    ├── SIGNED_IN ──► Fetch profile, set session                       │
│     │    │                                                                   │
│     │    ├── SIGNED_OUT ──► Clear session                                   │
│     │    │                                                                   │
│     │    └── TOKEN_REFRESHED ──► Update session                             │
│     │                                                                        │
│     └── isLoading = false                                                    │
│                                                                              │
│  DURING APP USAGE                                                            │
│     │                                                                        │
│     ├── Token auto-refreshes (Supabase handles)                             │
│     │                                                                        │
│     ├── Session accessible via useAuth() hook                               │
│     │                                                                        │
│     └── Server components use getSession() directly                         │
│                                                                              │
│  USER SIGNS OUT                                                              │
│     │                                                                        │
│     ├── Calls signOut() from context                                        │
│     │                                                                        │
│     ├── supabase.auth.signOut()                                             │
│     │                                                                        │
│     ├── onAuthStateChange fires SIGNED_OUT                                  │
│     │                                                                        │
│     ├── Context clears session                                              │
│     │                                                                        │
│     └── Redirect to home                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Header & Navigation States

### Header Component States

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HEADER STATES                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  GUEST (not logged in):                                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  [H] Happenlist    Events  Venues  Organizers    [🔍] [Submit] [Login]│   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Clicking "Submit":                                                          │
│    → Redirects to /auth/login?redirect=/submit/new                          │
│                                                                              │
│  ────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  ATTENDEE (logged in, not organizer):                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  [H] Happenlist    Events  Venues  Organizers    [🔍] [Submit] [👤▼] │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  [👤▼] Dropdown:                                                             │
│    ├─ John Doe                                                               │
│    ├─ john@example.com                                                       │
│    ├─ ─────────────────                                                      │
│    ├─ ❤️ My Saved Events                                                     │
│    ├─ 📝 My Submissions                                                      │
│    ├─ ─────────────────                                                      │
│    ├─ ⚙️ Settings                                                            │
│    └─ 🚪 Sign Out                                                            │
│                                                                              │
│  ────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  ORGANIZER (logged in, verified organizer):                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  [H] Happenlist    Events  Venues  Organizers    [🔍] [Submit] [👤▼] │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  [👤▼] Dropdown:                                                             │
│    ├─ John Doe                                                               │
│    ├─ john@example.com                                                       │
│    ├─ 📣 Verified Organizer                                                  │
│    ├─ ─────────────────                                                      │
│    ├─ ❤️ My Saved Events                                                     │
│    ├─ 📝 My Submissions                                                      │
│    ├─ 📣 My Organizer → /organizer/dashboard                                 │
│    ├─ ─────────────────                                                      │
│    ├─ ⚙️ Settings                                                            │
│    └─ 🚪 Sign Out                                                            │
│                                                                              │
│  ────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  ADMIN (super admin):                                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  [H] Happenlist    Events  Venues  Organizers    [🔍] [Submit] [👤▼] │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  [👤▼] Dropdown:                                                             │
│    ├─ Admin User                                                             │
│    ├─ admin@happenlist.com                                                   │
│    ├─ 🔑 Super Admin                                                         │
│    ├─ ─────────────────                                                      │
│    ├─ ❤️ My Saved Events                                                     │
│    ├─ 📝 My Submissions                                                      │
│    ├─ 📣 My Organizer (if also organizer)                                    │
│    ├─ ─────────────────                                                      │
│    ├─ 🔐 Admin Dashboard → /admin                                            │
│    ├─ ─────────────────                                                      │
│    ├─ ⚙️ Settings                                                            │
│    └─ 🚪 Sign Out                                                            │
│                                                                              │
│  ────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  MOBILE (any state):                                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  [H]                                               [🔍] [☰]          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  [☰] Opens drawer with:                                                      │
│    ├─ (User info if logged in)                                              │
│    ├─ ─────────────────                                                      │
│    ├─ Events                                                                 │
│    ├─ Venues                                                                 │
│    ├─ Organizers                                                             │
│    ├─ ─────────────────                                                      │
│    ├─ Submit an Event                                                        │
│    ├─ (User menu items if logged in)                                        │
│    └─ Login / Sign Out                                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Protected Routes & Middleware

### Middleware Configuration (`src/middleware.ts`)

```typescript
/**
 * MIDDLEWARE
 * ==========
 * Protects routes that require authentication or specific roles.
 * 
 * Protected routes:
 * - /my/*: Requires authentication
 * - /submit/*: Requires authentication
 * - /admin/*: Requires admin role
 * - /organizer/dashboard: Requires verified organizer
 * 
 * Flow:
 * 1. Check if route matches protected pattern
 * 2. Get session from Supabase
 * 3. Check role requirements
 * 4. Redirect to login or forbidden page if needed
 */

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Route configuration
const PROTECTED_ROUTES = {
  // Routes requiring any authentication
  authenticated: [
    '/my',
    '/submit',
    '/organizer/dashboard',
    '/organizer/claim',
  ],
  
  // Routes requiring admin role
  admin: [
    '/admin',
  ],
  
  // Routes requiring verified organizer
  organizer: [
    '/organizer/dashboard',
  ],
};

// Redirect destinations
const REDIRECTS = {
  unauthenticated: '/auth/login',
  unauthorized: '/', // Or could be a /403 page
};

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  
  const { data: { session } } = await supabase.auth.getSession();
  const pathname = request.nextUrl.pathname;
  
  // Check authenticated routes
  if (PROTECTED_ROUTES.authenticated.some(route => pathname.startsWith(route))) {
    if (!session) {
      const loginUrl = new URL(REDIRECTS.unauthenticated, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // Check admin routes
  if (PROTECTED_ROUTES.admin.some(route => pathname.startsWith(route))) {
    if (!session) {
      const loginUrl = new URL(REDIRECTS.unauthenticated, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Check admin status
    const isAdmin = checkIsAdmin(session.user.email);
    if (!isAdmin) {
      return NextResponse.redirect(new URL(REDIRECTS.unauthorized, request.url));
    }
  }
  
  return res;
}

export const config = {
  matcher: [
    '/my/:path*',
    '/submit/:path*',
    '/admin/:path*',
    '/organizer/dashboard/:path*',
    '/organizer/claim/:path*',
  ],
};
```

---

## Organizer Claiming System

### Claim Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ORGANIZER CLAIMING FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. USER VIEWS ORGANIZER PAGE (/organizer/jazz-ensemble)                     │
│     │                                                                        │
│     ├── Organizer has user_id? ─── YES ──► Show "Verified ✓" badge         │
│     │                                                                        │
│     └── NO (unclaimed) ──► Show "Claim this organizer" button               │
│                             │                                                │
│                             ▼                                                │
│  2. USER CLICKS "Claim this organizer"                                       │
│     │                                                                        │
│     ├── Not logged in? ──► Show login modal                                 │
│     │                                                                        │
│     └── Logged in ──► Go to /organizer/claim/jazz-ensemble                  │
│                       │                                                      │
│                       ▼                                                      │
│  3. CLAIM PAGE SHOWS                                                         │
│     ┌────────────────────────────────────────────────────────────────────┐  │
│     │  Claim "Jazz Ensemble Milwaukee"                                    │  │
│     │                                                                     │  │
│     │  To verify you manage this organizer, we'll send a verification    │  │
│     │  email to the address listed on this profile:                      │  │
│     │                                                                     │  │
│     │  📧 contact@jazzensemble.com                                        │  │
│     │                                                                     │  │
│     │  [  Request Verification  ]                                         │  │
│     │                                                                     │  │
│     │  ─────────────────────────────────────────────────────────────────  │  │
│     │  Don't have access to this email?                                   │  │
│     │  [Request manual verification] (admin approval)                     │  │
│     └────────────────────────────────────────────────────────────────────┘  │
│                       │                                                      │
│                       ├── Email verification selected                        │
│                       │    │                                                 │
│                       │    ▼                                                 │
│  4a. EMAIL VERIFICATION FLOW                                                 │
│     │                                                                        │
│     ├── Generate verification token                                         │
│     ├── Store on organizer: claim_verification_token, expires in 24h       │
│     ├── Log: claim_requested                                                │
│     ├── Send email to organizer's listed email                             │
│     │    Subject: "Verify your Happenlist organizer profile"               │
│     │    Body: Link to /api/organizer/verify?token=xxx                     │
│     │                                                                        │
│     └── Show "Check organizer email" message                                │
│                       │                                                      │
│                       │                                                      │
│     │                 ├── Manual verification selected                       │
│     │                 │    │                                                 │
│     │                 │    ▼                                                 │
│  4b. MANUAL VERIFICATION FLOW                                                │
│     │                                                                        │
│     ├── Create claim request record                                         │
│     ├── Log: claim_requested (manual)                                       │
│     ├── Notify admin (email or dashboard)                                   │
│     │                                                                        │
│     └── Show "Request submitted, awaiting admin approval"                   │
│                       │                                                      │
│                       ▼                                                      │
│  5. VERIFICATION COMPLETES                                                   │
│     │                                                                        │
│     ├── Set organizer.user_id = auth.uid()                                  │
│     ├── Set organizer.claimed_at = now()                                    │
│     ├── Set organizer.claim_verified = true                                 │
│     ├── Log: verified                                                       │
│     │                                                                        │
│     └── Redirect to /organizer/dashboard                                    │
│                                                                              │
│  6. ORGANIZER DASHBOARD ACCESS                                               │
│     │                                                                        │
│     ├── Can edit organizer profile                                          │
│     ├── Can view their events                                               │
│     ├── Events they submit auto-link to this organizer                      │
│     └── (Future: Analytics, auto-approve, etc.)                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Edge Cases

| Scenario | Handling |
|----------|----------|
| Organizer has no email listed | Only allow manual verification |
| User already claimed different organizer | Allow multiple (rare but possible) |
| Admin wants to revoke claim | Set user_id = null, log action |
| User tries to claim already-claimed org | Show "Already claimed" message |
| Verification token expired | Allow re-request |

---

## Hearts/Saved Events System

### Heart Button States

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        HEART BUTTON STATES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STATE 1: Not logged in                                                      │
│  ┌──────────┐                                                                │
│  │   [♡]    │  Click → Opens login modal                                    │
│  └──────────┘                                                                │
│                                                                              │
│  STATE 2: Logged in, not hearted                                             │
│  ┌──────────┐                                                                │
│  │   [♡]    │  Click → Optimistic: Show ❤️, call API                        │
│  └──────────┘                                                                │
│                                                                              │
│  STATE 3: Logged in, hearted                                                 │
│  ┌──────────┐                                                                │
│  │   [❤️]   │  Click → Optimistic: Show ♡, call API                         │
│  └──────────┘  (coral/red filled heart)                                      │
│                                                                              │
│  STATE 4: With count                                                         │
│  ┌──────────┐                                                                │
│  │  [❤️ 42] │  Count updates optimistically                                 │
│  └──────────┘                                                                │
│                                                                              │
│  STATE 5: Error (API failed)                                                 │
│  ┌──────────┐                                                                │
│  │   [♡ ⚠️] │  Reverts to previous state, shows toast                       │
│  └──────────┘                                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### useHeart Hook

```typescript
/**
 * USE HEART HOOK
 * ==============
 * Manages heart state with optimistic updates.
 * 
 * Returns:
 * - isHearted: boolean
 * - heartCount: number
 * - toggleHeart: () => Promise<void>
 * - isLoading: boolean
 * 
 * Features:
 * - Checks initial heart state on mount
 * - Optimistic updates for instant feedback
 * - Reverts on error
 * - Handles auth (opens modal if not logged in)
 */

function useHeart(eventId: string, initialHearted?: boolean, initialCount?: number) {
  const { session } = useAuth();
  const [isHearted, setIsHearted] = useState(initialHearted ?? false);
  const [heartCount, setHeartCount] = useState(initialCount ?? 0);
  const [isLoading, setIsLoading] = useState(false);
  
  const toggleHeart = async () => {
    if (!session) {
      // Open login modal
      openLoginModal({ message: 'Sign in to save events' });
      return;
    }
    
    // Optimistic update
    const wasHearted = isHearted;
    setIsHearted(!wasHearted);
    setHeartCount(prev => wasHearted ? prev - 1 : prev + 1);
    
    try {
      await fetch('/api/hearts', {
        method: 'POST',
        body: JSON.stringify({ eventId }),
      });
    } catch (error) {
      // Revert on error
      setIsHearted(wasHearted);
      setHeartCount(prev => wasHearted ? prev + 1 : prev - 1);
      toast.error('Failed to save event');
    }
  };
  
  return { isHearted, heartCount, toggleHeart, isLoading };
}
```

---

## Testing Checklist

### Phase 1: Critical Auth

- [ ] `/auth/login` page renders
- [ ] Can enter email and submit
- [ ] Magic link email is sent (check Supabase logs)
- [ ] `/auth/callback` successfully processes token
- [ ] New user gets profile created
- [ ] Session cookie is set
- [ ] Header shows avatar when logged in
- [ ] User menu dropdown works
- [ ] Sign out clears session
- [ ] Session persists on page refresh
- [ ] Redirect after login works (`?redirect=` param)

### Phase 2: Protected Routes

- [ ] `/my/submissions` redirects to login if not authenticated
- [ ] `/submit/new` redirects to login if not authenticated
- [ ] `/admin/*` redirects to login if not authenticated
- [ ] `/admin/*` returns 403/redirect if not admin
- [ ] Login modal opens for inline auth triggers
- [ ] Mobile menu opens and closes
- [ ] Mobile menu items work

### Phase 3: Hearts

- [ ] Heart button renders on event cards
- [ ] Guest clicking heart opens login modal
- [ ] Logged-in user can toggle heart
- [ ] Optimistic update shows immediately
- [ ] Heart persists after refresh
- [ ] Heart count updates
- [ ] `/my/hearts` shows hearted events
- [ ] Removing heart updates `/my/hearts`
- [ ] Error state reverts optimistic update

### Phase 4: Profiles

- [ ] Profile auto-created on first login
- [ ] Can view `/my/settings`
- [ ] Can update display name
- [ ] Can toggle email preferences
- [ ] Changes persist after refresh

### Phase 5: Organizer Claiming

- [ ] "Claim this organizer" shows on unclaimed pages
- [ ] Claim button requires login
- [ ] Claim request sends verification email
- [ ] Clicking verification link sets claim_verified
- [ ] `/organizer/dashboard` shows after verification
- [ ] Can edit organizer profile
- [ ] User menu shows "My Organizer" link

---

## Troubleshooting Guide

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "permission denied for table users" | RLS policy querying auth.users without auth | Add `auth.uid() IS NOT NULL` check before auth.users query |
| Magic link not received | Email not in Supabase allow list (if enabled) | Check Supabase Auth settings |
| Session not persisting | Cookie not being set | Check NEXT_PUBLIC_SITE_URL matches actual domain |
| Callback 500 error | Token already used or expired | Supabase tokens are single-use; user needs new link |
| Profile not created | Trigger not firing | Run migration, check trigger exists |
| Heart count negative | Race condition | Use database constraint or atomic update |

### Debug Logging

Add these log prefixes to `src/lib/utils/logger.ts`:

```typescript
const AUTH_PREFIXES = {
  login_started: '🔐 ▶️',
  login_success: '🔐 ✅',
  login_error: '🔐 ❌',
  logout: '🚪 👋',
  session_loaded: '🔐 📥',
  session_refreshed: '🔐 🔄',
  callback_received: '🔐 📨',
  callback_error: '🔐 ⚠️',
};

const HEART_PREFIXES = {
  heart_added: '❤️ ➕',
  heart_removed: '💔 ➖',
  heart_error: '❤️ ⚠️',
};

const CLAIM_PREFIXES = {
  claim_requested: '📣 📨',
  claim_verified: '📣 ✅',
  claim_rejected: '📣 ❌',
};
```

---

## Environment Variables

```env
# .env.local

# Supabase (should already exist)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Auth
ADMIN_EMAILS=admin@happenlist.com,your@email.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: For email sending (claim verification, notifications)
# RESEND_API_KEY=xxx
```

---

## NPM Packages

Already installed (verify):
- `@supabase/ssr` - Server-side auth
- `@supabase/supabase-js` - Supabase client

May need to install:
- `@radix-ui/react-dropdown-menu` - For user menu dropdown
- `@radix-ui/react-dialog` - For login modal
- `sonner` or `react-hot-toast` - For toast notifications

```bash
npm install @radix-ui/react-dropdown-menu @radix-ui/react-dialog sonner
```

---

## Quick Start Checklist

```bash
# 1. Run database migration
# Supabase Dashboard > SQL Editor > Paste 00010_user_profiles_and_roles.sql > Run

# 2. Set environment variables
# Add ADMIN_EMAILS and NEXT_PUBLIC_SITE_URL to .env.local

# 3. Enable Magic Link in Supabase
# Dashboard > Authentication > Providers > Email
# Enable "Confirm email" and "Magic Link"

# 4. Configure redirect URLs in Supabase
# Dashboard > Authentication > URL Configuration
# Add http://localhost:3000/auth/callback to Redirect URLs

# 5. Install packages
npm install @radix-ui/react-dropdown-menu @radix-ui/react-dialog sonner

# 6. Create files in order:
# Phase 1 files first, test, then Phase 2, etc.
```

---

**Ready for implementation! 🚀**

