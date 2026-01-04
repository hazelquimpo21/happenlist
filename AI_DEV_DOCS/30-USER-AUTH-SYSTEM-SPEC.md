# 👤 USER & AUTH SYSTEM - COMPLETE IMPLEMENTATION SPEC

> **Purpose**: Complete specification for implementing user types, auth, hearts, organizer claiming, and admin workflows
> **For**: Claude Code implementation
> **Created**: 2026-01-04
> **Status**: 📋 READY TO IMPLEMENT

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [User Types](#user-types)
3. [Database Schema](#database-schema)
4. [User Stories](#user-stories)
5. [Routes & Pages](#routes--pages)
6. [Components](#components)
7. [API Endpoints](#api-endpoints)
8. [Types](#types)
9. [Implementation Order](#implementation-order)
10. [File Structure](#file-structure)
11. [Email Preparation](#email-preparation)
12. [Logging Standards](#logging-standards)
13. [Testing Checklist](#testing-checklist)

---

## OVERVIEW

### What We're Building

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER SYSTEM OVERVIEW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  GUEST (not logged in)                                                        │
│  ├── Browse events, venues, organizers                                        │
│  ├── See heart counts (public)                                                │
│  ├── Search                                                                   │
│  └── Prompted to login for: heart, submit, follow                             │
│                                                                               │
│  ATTENDEE (logged in, default)                                                │
│  ├── Everything guest can do PLUS:                                            │
│  ├── ❤️ Heart/save events                                                     │
│  ├── 👀 Follow organizers/venues                                              │
│  ├── 📝 Submit events (requires admin approval)                               │
│  ├── 📋 Track their submissions                                               │
│  ├── ⚙️ Manage preferences                                                   │
│  └── 🏢 Claim an organizer profile (requires admin approval)                  │
│                                                                               │
│  ORGANIZER (attendee who claimed an organizer, admin-approved)                │
│  ├── Everything attendee can do PLUS:                                         │
│  ├── 📊 See their organizer's events dashboard                                │
│  ├── ✏️ Edit their organizer's events                                         │
│  ├── 📝 Submit events for their organizer (still requires approval)           │
│  └── 👥 Invite team members to their organizer                                │
│                                                                               │
│  SUPER ADMIN (email in ADMIN_EMAILS env var)                                  │
│  ├── Everything above PLUS:                                                   │
│  ├── ✅ Approve/reject events                                                 │
│  ├── ✅ Approve/reject organizer claims                                       │
│  ├── 👤 Manage users                                                          │
│  └── 🔧 System settings                                                       │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Organizer events | Still require approval | Quality control |
| Organizer claims | Require admin approval | Prevent spam/fraud |
| Hearts | Public counts | Social proof |
| Team roles | Simple (owner/member) | Keep it simple |
| Auth method | Magic link only | Passwordless, secure |

---

## USER TYPES

### Type Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│   ⚪ GUEST                                                                    │
│   └── No auth.users record                                                    │
│                                                                               │
│   🟢 ATTENDEE                                                                 │
│   └── auth.users + profiles record                                           │
│   └── Default for all logged-in users                                         │
│                                                                               │
│   🟡 ORGANIZER                                                                │
│   └── Attendee + organizer_users record (approved)                            │
│   └── Can manage linked organizer's events                                    │
│   └── ONE user can be linked to MULTIPLE organizers                           │
│                                                                               │
│   🔴 SUPER ADMIN                                                              │
│   └── Email in ADMIN_EMAILS env var                                           │
│   └── Full access to everything                                               │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Detection Logic

```typescript
// How to detect user type:

// Guest: No session
const isGuest = !session;

// Attendee: Has session (all logged in users)
const isAttendee = !!session;

// Organizer: Has approved organizer_users record
const isOrganizer = organizerUsers.some(ou => ou.status === 'approved');

// Super Admin: Email in ADMIN_EMAILS env var
const isSuperAdmin = ADMIN_EMAILS.includes(session.email);
```

---

## DATABASE SCHEMA

### SQL Migration: `00010_user_auth_system.sql`

```sql
-- ============================================================================
-- MIGRATION: 00010_user_auth_system.sql
-- ============================================================================
-- 👤 Complete user auth system with profiles, hearts, follows, organizer claims
--
-- Run in Supabase SQL Editor after all previous migrations.
-- Safe to run multiple times (uses IF NOT EXISTS).
-- ============================================================================

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
-- Extended user data, auto-created on signup

CREATE TABLE IF NOT EXISTS profiles (
  -- Primary key is auth.users id
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Display info
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,

  -- Preferences
  email_notifications BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT false,
  notify_on_approval BOOLEAN DEFAULT true,
  notify_on_rejection BOOLEAN DEFAULT true,
  notify_on_new_events BOOLEAN DEFAULT true,

  -- Location preference
  preferred_city TEXT DEFAULT 'Milwaukee',
  preferred_state TEXT DEFAULT 'WI',

  -- Stats (denormalized)
  events_submitted_count INTEGER DEFAULT 0,
  events_approved_count INTEGER DEFAULT 0,
  hearts_given_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(preferred_city);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Public can view display_name and avatar (for showing who hearted)
DROP POLICY IF EXISTS "Public can view basic profile" ON profiles;
CREATE POLICY "Public can view basic profile" ON profiles
  FOR SELECT USING (true);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

COMMENT ON TABLE profiles IS '👤 Extended user profile data - auto-created on signup';

-- ============================================================================
-- 2. HEARTS TABLE
-- ============================================================================
-- Users can heart/save events. Counts are PUBLIC.

CREATE TABLE IF NOT EXISTS hearts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who hearted
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What was hearted
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT now(),

  -- One heart per user per event
  UNIQUE(user_id, event_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hearts_user ON hearts(user_id);
CREATE INDEX IF NOT EXISTS idx_hearts_event ON hearts(event_id);
CREATE INDEX IF NOT EXISTS idx_hearts_created ON hearts(created_at DESC);

-- RLS - hearts are PUBLIC readable, users can manage their own
ALTER TABLE hearts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hearts are public" ON hearts;
CREATE POLICY "Hearts are public" ON hearts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own hearts" ON hearts;
CREATE POLICY "Users can insert own hearts" ON hearts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own hearts" ON hearts;
CREATE POLICY "Users can delete own hearts" ON hearts
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger to update counts
CREATE OR REPLACE FUNCTION update_heart_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events SET heart_count = COALESCE(heart_count, 0) + 1 WHERE id = NEW.event_id;
    UPDATE profiles SET hearts_given_count = COALESCE(hearts_given_count, 0) + 1 WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events SET heart_count = GREATEST(COALESCE(heart_count, 0) - 1, 0) WHERE id = OLD.event_id;
    UPDATE profiles SET hearts_given_count = GREATEST(COALESCE(hearts_given_count, 0) - 1, 0) WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_heart_change ON hearts;
CREATE TRIGGER on_heart_change
  AFTER INSERT OR DELETE ON hearts
  FOR EACH ROW EXECUTE FUNCTION update_heart_counts();

COMMENT ON TABLE hearts IS '❤️ User hearted/saved events - counts are PUBLIC';

-- ============================================================================
-- 3. USER_FOLLOWS TABLE
-- ============================================================================
-- Users can follow organizers, venues, categories

CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who is following
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What they're following (one of these must be set)
  organizer_id UUID REFERENCES organizers(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,

  -- Notification preference for this follow
  notify_new_events BOOLEAN DEFAULT true,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Must follow exactly one thing
  CONSTRAINT follow_one_entity CHECK (
    (organizer_id IS NOT NULL)::int +
    (venue_id IS NOT NULL)::int +
    (category_id IS NOT NULL)::int = 1
  ),

  -- No duplicate follows
  UNIQUE(user_id, organizer_id),
  UNIQUE(user_id, venue_id),
  UNIQUE(user_id, category_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_follows_user ON user_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_organizer ON user_follows(organizer_id) WHERE organizer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_follows_venue ON user_follows(venue_id) WHERE venue_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_follows_category ON user_follows(category_id) WHERE category_id IS NOT NULL;

-- RLS
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own follows" ON user_follows;
CREATE POLICY "Users can view own follows" ON user_follows
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own follows" ON user_follows;
CREATE POLICY "Users can manage own follows" ON user_follows
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE user_follows IS '👀 Users following organizers/venues/categories';

-- ============================================================================
-- 4. ORGANIZER_USERS TABLE
-- ============================================================================
-- Links users to organizers they manage. Requires ADMIN APPROVAL.

CREATE TABLE IF NOT EXISTS organizer_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The organizer being claimed/managed
  organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,

  -- The user claiming/managing
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,

  -- Role within organizer
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),

  -- Claim status (requires admin approval)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Claim request details
  claim_message TEXT,  -- "I'm the owner because..."
  requested_at TIMESTAMPTZ DEFAULT now(),

  -- Admin decision
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  rejection_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- One claim per user per organizer
  UNIQUE(organizer_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_users_user ON organizer_users(user_id);
CREATE INDEX IF NOT EXISTS idx_org_users_organizer ON organizer_users(organizer_id);
CREATE INDEX IF NOT EXISTS idx_org_users_status ON organizer_users(status);
CREATE INDEX IF NOT EXISTS idx_org_users_pending ON organizer_users(requested_at) WHERE status = 'pending';

-- RLS
ALTER TABLE organizer_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own organizer links" ON organizer_users;
CREATE POLICY "Users can view own organizer links" ON organizer_users
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can request to join organizer" ON organizer_users;
CREATE POLICY "Users can request to join organizer" ON organizer_users
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
  );

-- Approved members can see their team
DROP POLICY IF EXISTS "Team members can view team" ON organizer_users;
CREATE POLICY "Team members can view team" ON organizer_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organizer_users ou
      WHERE ou.organizer_id = organizer_users.organizer_id
      AND ou.user_id = auth.uid()
      AND ou.status = 'approved'
    )
  );

COMMENT ON TABLE organizer_users IS '🔗 User-organizer links - claims require ADMIN APPROVAL';

-- ============================================================================
-- 5. UPDATE ORGANIZERS TABLE
-- ============================================================================

-- Track if organizer has been claimed
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT false;
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS primary_user_id UUID REFERENCES auth.users(id);

-- Follower count (denormalized)
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;

-- Update follower count trigger
CREATE OR REPLACE FUNCTION update_organizer_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.organizer_id IS NOT NULL THEN
    UPDATE organizers SET follower_count = COALESCE(follower_count, 0) + 1 WHERE id = NEW.organizer_id;
  ELSIF TG_OP = 'DELETE' AND OLD.organizer_id IS NOT NULL THEN
    UPDATE organizers SET follower_count = GREATEST(COALESCE(follower_count, 0) - 1, 0) WHERE id = OLD.organizer_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_follow_organizer_change ON user_follows;
CREATE TRIGGER on_follow_organizer_change
  AFTER INSERT OR DELETE ON user_follows
  FOR EACH ROW EXECUTE FUNCTION update_organizer_follower_count();

-- ============================================================================
-- 6. UPDATE EVENTS TABLE FOR SUBMISSION COUNTS
-- ============================================================================

-- Update profile submission counts trigger
CREATE OR REPLACE FUNCTION update_profile_submission_counts()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user_id from email
  SELECT id INTO v_user_id FROM auth.users WHERE email = COALESCE(NEW.submitted_by_email, OLD.submitted_by_email);

  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF TG_OP = 'INSERT' AND NEW.submitted_by_email IS NOT NULL THEN
    UPDATE profiles SET events_submitted_count = COALESCE(events_submitted_count, 0) + 1 WHERE id = v_user_id;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Track approved count
    IF OLD.status != 'published' AND NEW.status = 'published' THEN
      UPDATE profiles SET events_approved_count = COALESCE(events_approved_count, 0) + 1 WHERE id = v_user_id;
    ELSIF OLD.status = 'published' AND NEW.status != 'published' THEN
      UPDATE profiles SET events_approved_count = GREATEST(COALESCE(events_approved_count, 0) - 1, 0) WHERE id = v_user_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_event_submission_change ON events;
CREATE TRIGGER on_event_submission_change
  AFTER INSERT OR UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_profile_submission_counts();

-- ============================================================================
-- 7. HELPER VIEWS
-- ============================================================================

-- User's complete profile with stats
CREATE OR REPLACE VIEW v_user_profile AS
SELECT
  p.*,
  u.email,
  u.created_at as user_created_at,
  (SELECT COUNT(*) FROM organizer_users WHERE user_id = p.id AND status = 'approved') as organizer_count,
  (SELECT COUNT(*) FROM hearts WHERE user_id = p.id) as hearts_count,
  (SELECT COUNT(*) FROM user_follows WHERE user_id = p.id) as following_count
FROM profiles p
JOIN auth.users u ON u.id = p.id;

-- User's organizers (approved only)
CREATE OR REPLACE VIEW v_my_organizers AS
SELECT
  o.id,
  o.name,
  o.slug,
  o.logo_url,
  o.description,
  o.follower_count,
  ou.role,
  ou.status,
  ou.created_at as joined_at,
  (SELECT COUNT(*) FROM events WHERE organizer_id = o.id AND status = 'published' AND deleted_at IS NULL) as event_count,
  (SELECT COUNT(*) FROM events WHERE organizer_id = o.id AND status = 'pending_review' AND deleted_at IS NULL) as pending_count
FROM organizer_users ou
JOIN organizers o ON o.id = ou.organizer_id
WHERE ou.status = 'approved'
  AND o.is_active = true;

-- Admin: Pending organizer claims
CREATE OR REPLACE VIEW v_pending_organizer_claims AS
SELECT
  ou.*,
  o.name as organizer_name,
  o.slug as organizer_slug,
  o.logo_url as organizer_logo,
  p.display_name as user_display_name,
  (SELECT COUNT(*) FROM events WHERE submitted_by_email = ou.user_email AND status = 'published') as user_approved_events
FROM organizer_users ou
JOIN organizers o ON o.id = ou.organizer_id
LEFT JOIN profiles p ON p.id = ou.user_id
WHERE ou.status = 'pending'
ORDER BY ou.requested_at ASC;

-- User's hearted events
CREATE OR REPLACE VIEW v_my_hearts AS
SELECT
  h.id as heart_id,
  h.created_at as hearted_at,
  e.id,
  e.title,
  e.slug,
  e.instance_date,
  e.start_datetime,
  e.end_datetime,
  e.image_url,
  e.short_description,
  e.is_free,
  e.price_type,
  e.price_low,
  e.price_high,
  e.heart_count,
  c.name as category_name,
  c.slug as category_slug,
  l.name as location_name,
  l.city as location_city,
  o.name as organizer_name,
  o.slug as organizer_slug
FROM hearts h
JOIN events e ON e.id = h.event_id
LEFT JOIN categories c ON c.id = e.category_id
LEFT JOIN locations l ON l.id = e.location_id
LEFT JOIN organizers o ON o.id = e.organizer_id
WHERE e.status = 'published'
  AND e.deleted_at IS NULL
ORDER BY h.created_at DESC;

-- ============================================================================
-- 8. EMAIL NOTIFICATION QUEUE (for future email implementation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Recipient
  to_email TEXT NOT NULL,
  to_name TEXT,

  -- Email content
  template TEXT NOT NULL,  -- 'event_approved', 'event_rejected', 'claim_approved', etc.
  subject TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',  -- Template variables

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Index for processing
  CONSTRAINT max_attempts CHECK (attempts <= 5)
);

CREATE INDEX IF NOT EXISTS idx_email_queue_pending ON email_queue(created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status, created_at);

COMMENT ON TABLE email_queue IS '📧 Queue for outgoing emails - processed by cron/worker';

-- ============================================================================
-- DONE!
-- ============================================================================
```

---

## USER STORIES

### 🔐 Authentication Stories

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ AUTH-1: Guest clicks "Login"                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIVEN: I am not logged in                                                    │
│ WHEN: I click "Login" button in header                                       │
│ THEN: Login modal appears with email input                                   │
│                                                                               │
│ WHEN: I enter my email and click "Send Magic Link"                           │
│ THEN: I see "Check your email!" message                                      │
│ AND: I receive email with magic link                                         │
│                                                                               │
│ WHEN: I click the magic link in email                                        │
│ THEN: I am redirected to the site, logged in                                 │
│ AND: My profile is auto-created if new user                                  │
│ AND: Header shows my avatar/name instead of "Login"                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ AUTH-2: User logs out                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIVEN: I am logged in                                                        │
│ WHEN: I click my avatar → "Sign Out"                                         │
│ THEN: I am logged out                                                        │
│ AND: Header shows "Login" button again                                       │
│ AND: I am redirected to home page                                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ AUTH-3: Guest tries protected action                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIVEN: I am not logged in                                                    │
│ WHEN: I click heart button on event card                                     │
│ THEN: Login modal appears                                                    │
│                                                                               │
│ WHEN: I complete login                                                       │
│ THEN: I am returned to same page                                             │
│ AND: The heart action is completed                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### ❤️ Hearts Stories

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEART-1: User hearts an event                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIVEN: I am logged in                                                        │
│ WHEN: I click the heart button on an event card                              │
│ THEN: Heart fills in (red)                                                   │
│ AND: Heart count increases by 1                                              │
│ AND: Event is saved to "My Hearts"                                           │
│                                                                               │
│ WHEN: I click heart again                                                    │
│ THEN: Heart unfills (outline)                                                │
│ AND: Heart count decreases by 1                                              │
│ AND: Event removed from "My Hearts"                                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ HEART-2: User views their hearted events                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIVEN: I am logged in                                                        │
│ WHEN: I go to /my/hearts                                                     │
│ THEN: I see grid of all events I've hearted                                  │
│ AND: Events are sorted by when I hearted them (newest first)                 │
│ AND: Past events are shown but marked as "Past"                              │
│                                                                               │
│ WHEN: There are no hearted events                                            │
│ THEN: I see empty state with "Start saving events!" message                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ HEART-3: Guest sees heart counts (PUBLIC)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIVEN: I am NOT logged in                                                    │
│ WHEN: I view an event card                                                   │
│ THEN: I can see the heart count number                                       │
│ AND: Heart button shows as outline (not filled)                              │
│ AND: Clicking heart prompts login                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 👀 Follow Stories

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ FOLLOW-1: User follows an organizer                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIVEN: I am logged in                                                        │
│ WHEN: I am on an organizer page                                              │
│ AND: I click "Follow" button                                                 │
│ THEN: Button changes to "Following ✓"                                        │
│ AND: Organizer added to my following list                                    │
│                                                                               │
│ WHEN: I click "Following" again                                              │
│ THEN: Confirmation: "Unfollow?"                                              │
│ AND: If confirmed, button returns to "Follow"                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ FOLLOW-2: User views who they're following                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIVEN: I am logged in                                                        │
│ WHEN: I go to /my/following                                                  │
│ THEN: I see tabs: "Organizers" | "Venues" | "Categories"                     │
│ AND: Each tab shows list of followed items                                   │
│ AND: I can unfollow from this page                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 🏢 Organizer Claim Stories

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CLAIM-1: User claims an organizer                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIVEN: I am logged in                                                        │
│ AND: I am on an organizer page that is NOT claimed                           │
│ WHEN: I click "Claim This Organizer"                                         │
│ THEN: Modal appears asking:                                                  │
│       "Tell us why you're the right person to manage this organizer"         │
│                                                                               │
│ WHEN: I submit the claim                                                     │
│ THEN: I see "Claim submitted! An admin will review."                         │
│ AND: organizer_users record created with status='pending'                    │
│ AND: Admin can see in /admin/organizers/claims queue                         │
│                                                                               │
│ WHEN: Admin approves my claim                                                │
│ THEN: I receive email notification (future)                                  │
│ AND: I can see organizer in /my/organizers                                   │
│ AND: I can access /dashboard for that organizer                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ CLAIM-2: User's claim is rejected                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIVEN: I submitted a claim                                                   │
│ WHEN: Admin rejects my claim with reason                                     │
│ THEN: I receive email notification (future)                                  │
│ AND: Status shows "Rejected" in /my/organizers                               │
│ AND: I can see the rejection reason                                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ CLAIM-3: Organizer invites team member                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIVEN: I am an approved organizer (owner)                                    │
│ WHEN: I go to /dashboard/team                                                │
│ AND: I click "Invite Team Member"                                            │
│ THEN: Modal appears asking for email                                         │
│                                                                               │
│ WHEN: I submit the invite                                                    │
│ THEN: organizer_users record created with status='pending'                   │
│ AND: Email sent to invitee (future)                                          │
│                                                                               │
│ WHEN: Invitee clicks link and logs in                                        │
│ THEN: They are auto-approved as member                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 📊 Organizer Dashboard Stories

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ DASH-1: Organizer views dashboard                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIVEN: I am an approved organizer                                            │
│ WHEN: I go to /dashboard                                                     │
│ THEN: I see dashboard with:                                                  │
│       - My organizer(s) dropdown (if multiple)                               │
│       - Stats: Total events, Pending approval, Published, Views              │
│       - Recent events list                                                   │
│       - Quick actions: Add Event, View All Events                            │
│                                                                               │
│ IF: I manage multiple organizers                                             │
│ THEN: Dropdown lets me switch between them                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ DASH-2: Organizer submits event                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIVEN: I am an approved organizer                                            │
│ WHEN: I click "Add Event" from dashboard                                     │
│ THEN: I am taken to /submit/new                                              │
│ AND: My organizer is pre-selected in the form                                │
│                                                                               │
│ WHEN: I submit the event                                                     │
│ THEN: Event is created with status='pending_review'                          │
│ NOTE: Even organizers need admin approval for events                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ DASH-3: Organizer edits their event                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIVEN: I am an approved organizer                                            │
│ AND: Event belongs to my organizer                                           │
│ AND: Event is published or pending                                           │
│ WHEN: I click "Edit" on the event                                            │
│ THEN: I can edit the event details                                           │
│                                                                               │
│ IF: Event is published                                                       │
│ THEN: Edits are saved immediately                                            │
│                                                                               │
│ IF: Event is pending_review                                                  │
│ THEN: Edits update the pending submission                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 👤 Profile & Settings Stories

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PROFILE-1: User updates profile                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIVEN: I am logged in                                                        │
│ WHEN: I go to /my/settings                                                   │
│ THEN: I see form with:                                                       │
│       - Display name                                                         │
│       - Bio                                                                  │
│       - Preferred city/state                                                 │
│       - Email notification preferences                                       │
│                                                                               │
│ WHEN: I update and save                                                      │
│ THEN: Changes are saved                                                      │
│ AND: Success toast shown                                                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ PROFILE-2: User updates notification preferences                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIVEN: I am on /my/settings                                                  │
│ WHEN: I toggle notification settings:                                        │
│       □ Email me when my event is approved                                   │
│       □ Email me when my event is rejected                                   │
│       □ Weekly digest of new events                                          │
│       □ New events from organizers I follow                                  │
│ THEN: Preferences are saved                                                  │
│ AND: Future emails respect these settings                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 🔧 Admin Stories

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ADMIN-1: Admin approves organizer claim                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIVEN: I am a super admin                                                    │
│ WHEN: I go to /admin/organizers/claims                                       │
│ THEN: I see list of pending claims with:                                     │
│       - User info (name, email, # approved events)                           │
│       - Organizer info (name, existing events)                               │
│       - Claim message                                                        │
│       - Approve / Reject buttons                                             │
│                                                                               │
│ WHEN: I click "Approve"                                                      │
│ THEN: organizer_users.status = 'approved'                                    │
│ AND: organizers.is_claimed = true                                            │
│ AND: Email queued to user (future)                                           │
│                                                                               │
│ WHEN: I click "Reject"                                                       │
│ THEN: Modal asks for rejection reason                                        │
│ AND: organizer_users.status = 'rejected'                                     │
│ AND: Email queued to user (future)                                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ ADMIN-2: Admin views user                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIVEN: I am a super admin                                                    │
│ WHEN: I go to /admin/users                                                   │
│ THEN: I see list of users with:                                              │
│       - Email, display name, joined date                                     │
│       - Events submitted / approved counts                                   │
│       - Organizers they manage                                               │
│                                                                               │
│ WHEN: I click on a user                                                      │
│ THEN: I see full user detail page                                            │
│ AND: I can see all their submissions                                         │
│ AND: I can see their organizer claims                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ROUTES & PAGES

### Route Map

| Route | Auth | Role | Description |
|-------|------|------|-------------|
| `/` | Public | - | Home page |
| `/events` | Public | - | Events listing |
| `/event/[slug]` | Public | - | Event detail |
| `/venues` | Public | - | Venues listing |
| `/venue/[slug]` | Public | - | Venue detail |
| `/organizers` | Public | - | Organizers listing |
| `/organizer/[slug]` | Public | - | Organizer detail |
| `/series` | Public | - | Series listing |
| `/series/[slug]` | Public | - | Series detail |
| `/search` | Public | - | Search results |
| `/auth/login` | Public | - | Login page (also modal) |
| `/auth/callback` | Public | - | Magic link callback |
| `/my/hearts` | Auth | Attendee | Saved events |
| `/my/following` | Auth | Attendee | Following list |
| `/my/submissions` | Auth | Attendee | My submitted events |
| `/my/settings` | Auth | Attendee | Profile settings |
| `/my/organizers` | Auth | Attendee | My organizer claims |
| `/submit/new` | Auth | Attendee | Submit event form |
| `/submit/edit/[id]` | Auth | Attendee | Edit draft |
| `/submit/success` | Auth | Attendee | Submission confirmed |
| `/dashboard` | Auth | Organizer | Organizer dashboard |
| `/dashboard/events` | Auth | Organizer | Organizer's events |
| `/dashboard/events/new` | Auth | Organizer | Quick add event |
| `/dashboard/events/[id]` | Auth | Organizer | Edit event |
| `/dashboard/team` | Auth | Organizer | Team management |
| `/dashboard/settings` | Auth | Organizer | Organizer settings |
| `/admin` | Auth | Admin | Admin dashboard |
| `/admin/events` | Auth | Admin | All events |
| `/admin/events/pending` | Auth | Admin | Approval queue |
| `/admin/events/[id]` | Auth | Admin | Review event |
| `/admin/organizers` | Auth | Admin | Manage organizers |
| `/admin/organizers/claims` | Auth | Admin | Claims queue |
| `/admin/users` | Auth | Admin | User management |
| `/admin/users/[id]` | Auth | Admin | User detail |
| `/admin/activity` | Auth | Admin | Audit log |

---

## COMPONENTS

### New Components to Create

```
src/components/
├── auth/
│   ├── index.ts
│   ├── auth-provider.tsx          # Session context provider
│   ├── login-modal.tsx            # Magic link modal
│   ├── login-form.tsx             # Email input form
│   ├── check-email-message.tsx    # "Check your email" view
│   ├── user-menu.tsx              # Header user dropdown
│   ├── auth-guard.tsx             # Protect routes
│   └── require-role.tsx           # Role-based protection
│
├── hearts/
│   ├── index.ts
│   ├── heart-button.tsx           # Heart toggle button
│   └── heart-count.tsx            # Heart count display
│
├── follows/
│   ├── index.ts
│   ├── follow-button.tsx          # Follow/unfollow button
│   └── following-tabs.tsx         # Tabs for following page
│
├── profile/
│   ├── index.ts
│   ├── profile-form.tsx           # Edit profile form
│   ├── notification-prefs.tsx     # Notification toggles
│   └── avatar-upload.tsx          # Avatar upload (future)
│
├── organizer-claim/
│   ├── index.ts
│   ├── claim-button.tsx           # "Claim This Organizer"
│   ├── claim-modal.tsx            # Claim form modal
│   ├── claim-status.tsx           # Pending/approved/rejected
│   └── my-organizers-list.tsx     # List of user's organizers
│
├── dashboard/
│   ├── index.ts
│   ├── dashboard-layout.tsx       # Dashboard shell
│   ├── dashboard-nav.tsx          # Side navigation
│   ├── dashboard-stats.tsx        # Stats cards
│   ├── organizer-switcher.tsx     # Switch between organizers
│   ├── recent-events.tsx          # Recent events list
│   └── team-list.tsx              # Team members
│
└── admin/
    ├── users/
    │   ├── index.ts
    │   ├── users-table.tsx        # Users list table
    │   └── user-detail.tsx        # User detail view
    │
    └── claims/
        ├── index.ts
        ├── claims-queue.tsx       # Pending claims list
        └── claim-review.tsx       # Review single claim
```

### Component Specifications

#### `auth/auth-provider.tsx`

```typescript
/**
 * AuthProvider - Session context for the app
 *
 * Provides:
 * - session: UserSession | null
 * - isLoading: boolean
 * - isLoggedIn: boolean
 * - isAdmin: boolean
 * - login: () => void (opens modal)
 * - logout: () => Promise<void>
 * - refresh: () => Promise<void>
 *
 * Usage:
 * ```tsx
 * // In layout.tsx
 * <AuthProvider>
 *   {children}
 * </AuthProvider>
 *
 * // In components
 * const { session, isLoggedIn, login } = useAuth();
 * ```
 */
```

#### `auth/login-modal.tsx`

```typescript
/**
 * LoginModal - Magic link login modal
 *
 * States:
 * 1. Email input (default)
 * 2. Sending... (loading)
 * 3. Check your email! (success)
 * 4. Error (retry)
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - redirectTo?: string
 *
 * Features:
 * - Auto-focus email input
 * - Validate email format
 * - Show loading state
 * - Success message with email
 * - Error with retry
 */
```

#### `hearts/heart-button.tsx`

```typescript
/**
 * HeartButton - Toggle heart on event
 *
 * Props:
 * - eventId: string
 * - initialHearted?: boolean
 * - initialCount?: number
 * - showCount?: boolean (default: true)
 * - size?: 'sm' | 'md' | 'lg'
 *
 * Behavior:
 * - If not logged in: opens login modal
 * - Optimistic update (instant UI feedback)
 * - Rollback on error
 * - Animated heart fill
 *
 * Example:
 * ```tsx
 * <HeartButton eventId={event.id} initialCount={event.heart_count} />
 * ```
 */
```

#### `follows/follow-button.tsx`

```typescript
/**
 * FollowButton - Follow/unfollow organizer/venue/category
 *
 * Props:
 * - type: 'organizer' | 'venue' | 'category'
 * - entityId: string
 * - initialFollowing?: boolean
 *
 * Behavior:
 * - If not logged in: opens login modal
 * - Toggle: "Follow" ↔ "Following ✓"
 * - Confirmation on unfollow
 */
```

#### `organizer-claim/claim-modal.tsx`

```typescript
/**
 * ClaimModal - Claim an organizer profile
 *
 * Props:
 * - organizerId: string
 * - organizerName: string
 * - isOpen: boolean
 * - onClose: () => void
 *
 * Form fields:
 * - Textarea: "Why are you the right person to manage this?"
 * - Submit button
 *
 * Behavior:
 * - Creates organizer_users record with status='pending'
 * - Shows success message
 * - Logs to audit
 */
```

---

## API ENDPOINTS

### Auth Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Send magic link | Public |
| GET | `/api/auth/callback` | Handle callback | Public |
| POST | `/api/auth/logout` | Sign out | Auth |

### User Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/user/profile` | Get my profile | Auth |
| PATCH | `/api/user/profile` | Update profile | Auth |
| GET | `/api/user/hearts` | Get my hearts | Auth |
| POST | `/api/user/hearts` | Heart an event | Auth |
| DELETE | `/api/user/hearts/[eventId]` | Unheart | Auth |
| GET | `/api/user/follows` | Get my follows | Auth |
| POST | `/api/user/follows` | Follow | Auth |
| DELETE | `/api/user/follows/[id]` | Unfollow | Auth |
| GET | `/api/user/organizers` | Get my organizers | Auth |

### Organizer Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/organizer/claim` | Claim organizer | Auth |
| GET | `/api/organizer/[id]/events` | Get organizer events | Organizer |
| POST | `/api/organizer/[id]/team/invite` | Invite member | Organizer (owner) |
| DELETE | `/api/organizer/[id]/team/[userId]` | Remove member | Organizer (owner) |

### Admin Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/users` | List users | Admin |
| GET | `/api/admin/users/[id]` | Get user | Admin |
| GET | `/api/admin/claims` | Pending claims | Admin |
| POST | `/api/admin/claims/[id]/approve` | Approve claim | Admin |
| POST | `/api/admin/claims/[id]/reject` | Reject claim | Admin |

---

## TYPES

### New Types to Create

```typescript
// src/types/user.ts

/**
 * User profile from profiles table
 */
export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  email_notifications: boolean;
  weekly_digest: boolean;
  notify_on_approval: boolean;
  notify_on_rejection: boolean;
  notify_on_new_events: boolean;
  preferred_city: string;
  preferred_state: string;
  events_submitted_count: number;
  events_approved_count: number;
  hearts_given_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Extended profile with computed fields
 */
export interface UserProfileWithStats extends UserProfile {
  email: string;
  user_created_at: string;
  organizer_count: number;
  hearts_count: number;
  following_count: number;
}

/**
 * User session from auth
 */
export interface UserSession {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  createdAt: string;
}

/**
 * Heart record
 */
export interface Heart {
  id: string;
  user_id: string;
  event_id: string;
  created_at: string;
}

/**
 * Hearted event for display
 */
export interface HeartedEvent {
  heart_id: string;
  hearted_at: string;
  id: string;
  title: string;
  slug: string;
  instance_date: string;
  start_datetime: string;
  end_datetime: string | null;
  image_url: string | null;
  short_description: string | null;
  is_free: boolean;
  price_type: string | null;
  price_low: number | null;
  price_high: number | null;
  heart_count: number;
  category_name: string | null;
  category_slug: string | null;
  location_name: string | null;
  location_city: string | null;
  organizer_name: string | null;
  organizer_slug: string | null;
}

/**
 * Follow record
 */
export interface UserFollow {
  id: string;
  user_id: string;
  organizer_id: string | null;
  venue_id: string | null;
  category_id: string | null;
  notify_new_events: boolean;
  created_at: string;
}

/**
 * Follow with entity details
 */
export interface FollowWithDetails extends UserFollow {
  organizer_name?: string;
  organizer_slug?: string;
  organizer_logo?: string;
  venue_name?: string;
  venue_slug?: string;
  venue_city?: string;
  category_name?: string;
  category_slug?: string;
}
```

```typescript
// src/types/organizer-user.ts

/**
 * Organizer-user link status
 */
export type OrganizerUserStatus = 'pending' | 'approved' | 'rejected';

/**
 * Organizer-user link role
 */
export type OrganizerUserRole = 'owner' | 'member';

/**
 * Organizer-user link record
 */
export interface OrganizerUser {
  id: string;
  organizer_id: string;
  user_id: string;
  user_email: string;
  role: OrganizerUserRole;
  status: OrganizerUserStatus;
  claim_message: string | null;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * My organizer (from v_my_organizers view)
 */
export interface MyOrganizer {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  follower_count: number;
  role: OrganizerUserRole;
  status: OrganizerUserStatus;
  joined_at: string;
  event_count: number;
  pending_count: number;
}

/**
 * Pending claim for admin queue
 */
export interface PendingClaim {
  id: string;
  organizer_id: string;
  user_id: string;
  user_email: string;
  role: string;
  status: string;
  claim_message: string | null;
  requested_at: string;
  organizer_name: string;
  organizer_slug: string;
  organizer_logo: string | null;
  user_display_name: string | null;
  user_approved_events: number;
}

/**
 * Claim request params
 */
export interface ClaimOrganizerParams {
  organizer_id: string;
  claim_message: string;
}

/**
 * Approve claim params
 */
export interface ApproveClaimParams {
  claim_id: string;
  admin_email: string;
  notes?: string;
}

/**
 * Reject claim params
 */
export interface RejectClaimParams {
  claim_id: string;
  admin_email: string;
  reason: string;
  notes?: string;
}
```

---

## IMPLEMENTATION ORDER

### Phase 1: Database & Core Auth ✅ FIRST

```
1.1 Run SQL migration (00010_user_auth_system.sql)
    - profiles table
    - hearts table
    - user_follows table
    - organizer_users table
    - email_queue table
    - All triggers and views

1.2 Create types
    - src/types/user.ts
    - src/types/organizer-user.ts

1.3 Create auth helpers
    - src/lib/auth/get-profile.ts
    - src/lib/auth/check-organizer.ts

1.4 Test in Supabase Studio
    - Create test user
    - Test triggers work
    - Test views return data
```

### Phase 2: Auth Components

```
2.1 AuthProvider context
    - Wraps app in layout.tsx
    - Fetches session on mount
    - Provides login/logout functions

2.2 LoginModal component
    - Email input
    - Loading state
    - Success message

2.3 UserMenu component
    - Avatar/name display
    - Dropdown with links
    - Sign out button

2.4 Update header
    - Show Login button or UserMenu
    - Integrate AuthProvider
```

### Phase 3: Hearts Feature

```
3.1 Heart data layer
    - src/data/user/toggle-heart.ts
    - src/data/user/get-user-hearts.ts
    - src/data/user/check-if-hearted.ts

3.2 HeartButton component
    - Optimistic updates
    - Login prompt if guest

3.3 Update EventCard
    - Add HeartButton
    - Show heart count

3.4 My Hearts page
    - /my/hearts route
    - Grid of hearted events
```

### Phase 4: Follows Feature

```
4.1 Follow data layer
    - src/data/user/toggle-follow.ts
    - src/data/user/get-user-follows.ts

4.2 FollowButton component
    - Follow/unfollow toggle
    - Login prompt if guest

4.3 Update organizer page
    - Add FollowButton
    - Show follower count

4.4 My Following page
    - /my/following route
    - Tabs for organizers/venues
```

### Phase 5: Organizer Claims

```
5.1 Claim data layer
    - src/data/organizer/claim-organizer.ts
    - src/data/organizer/get-my-organizers.ts

5.2 ClaimButton and ClaimModal
    - Show on unclaimed organizer pages
    - Submit claim form

5.3 My Organizers page
    - /my/organizers route
    - Show claim status

5.4 Admin Claims Queue
    - /admin/organizers/claims
    - Approve/reject actions
```

### Phase 6: Organizer Dashboard

```
6.1 Dashboard layout
    - Side nav, organizer switcher

6.2 Dashboard home
    - Stats, recent events

6.3 Dashboard events
    - List organizer's events
    - Edit functionality

6.4 Team management
    - List members
    - Invite (future)
```

### Phase 7: Profile & Settings

```
7.1 Profile form
    - Edit display name, bio
    - Location preferences

7.2 Notification preferences
    - Toggle checkboxes
    - Save to profiles table

7.3 My Settings page
    - /my/settings route
```

### Phase 8: Admin Enhancements

```
8.1 Users management
    - /admin/users list
    - /admin/users/[id] detail

8.2 Enhanced organizers
    - Show claimed status
    - Link to claims queue
```

---

## FILE STRUCTURE

### Complete New File List

```
src/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx                 # NEW
│   │   └── callback/route.ts              # NEW
│   │
│   ├── my/
│   │   ├── layout.tsx                     # NEW - Auth guard
│   │   ├── page.tsx                       # NEW - Redirect to hearts
│   │   ├── hearts/page.tsx                # NEW
│   │   ├── following/page.tsx             # NEW
│   │   ├── organizers/page.tsx            # NEW
│   │   ├── settings/page.tsx              # NEW
│   │   └── submissions/page.tsx           # EXISTS - update
│   │
│   ├── dashboard/
│   │   ├── layout.tsx                     # NEW - Organizer guard
│   │   ├── page.tsx                       # NEW
│   │   ├── events/
│   │   │   ├── page.tsx                   # NEW
│   │   │   └── [id]/page.tsx              # NEW
│   │   └── team/page.tsx                  # NEW
│   │
│   ├── admin/
│   │   ├── organizers/
│   │   │   ├── page.tsx                   # NEW
│   │   │   └── claims/page.tsx            # NEW
│   │   └── users/
│   │       ├── page.tsx                   # NEW
│   │       └── [id]/page.tsx              # NEW
│   │
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts             # NEW
│       │   └── logout/route.ts            # NEW
│       │
│       ├── user/
│       │   ├── profile/route.ts           # NEW
│       │   ├── hearts/route.ts            # NEW
│       │   ├── hearts/[eventId]/route.ts  # NEW
│       │   ├── follows/route.ts           # NEW
│       │   └── follows/[id]/route.ts      # NEW
│       │
│       ├── organizer/
│       │   ├── claim/route.ts             # NEW
│       │   └── [id]/
│       │       └── events/route.ts        # NEW
│       │
│       └── admin/
│           ├── users/route.ts             # NEW
│           ├── users/[id]/route.ts        # NEW
│           └── claims/
│               ├── route.ts               # NEW
│               └── [id]/
│                   ├── approve/route.ts   # NEW
│                   └── reject/route.ts    # NEW
│
├── components/
│   ├── auth/
│   │   ├── index.ts                       # NEW
│   │   ├── auth-provider.tsx              # NEW
│   │   ├── login-modal.tsx                # NEW
│   │   ├── login-form.tsx                 # NEW
│   │   ├── check-email-message.tsx        # NEW
│   │   ├── user-menu.tsx                  # NEW
│   │   └── require-auth.tsx               # NEW
│   │
│   ├── hearts/
│   │   ├── index.ts                       # NEW
│   │   ├── heart-button.tsx               # NEW
│   │   └── hearts-grid.tsx                # NEW
│   │
│   ├── follows/
│   │   ├── index.ts                       # NEW
│   │   ├── follow-button.tsx              # NEW
│   │   └── following-list.tsx             # NEW
│   │
│   ├── profile/
│   │   ├── index.ts                       # NEW
│   │   └── profile-form.tsx               # NEW
│   │
│   ├── organizer-claim/
│   │   ├── index.ts                       # NEW
│   │   ├── claim-button.tsx               # NEW
│   │   ├── claim-modal.tsx                # NEW
│   │   └── my-organizers-list.tsx         # NEW
│   │
│   ├── dashboard/
│   │   ├── index.ts                       # NEW
│   │   ├── dashboard-layout.tsx           # NEW
│   │   ├── dashboard-nav.tsx              # NEW
│   │   ├── dashboard-stats.tsx            # NEW
│   │   └── organizer-switcher.tsx         # NEW
│   │
│   └── admin/
│       ├── claims/
│       │   ├── index.ts                   # NEW
│       │   └── claims-queue.tsx           # NEW
│       │
│       └── users/
│           ├── index.ts                   # NEW
│           └── users-table.tsx            # NEW
│
├── data/
│   ├── user/
│   │   ├── index.ts                       # NEW
│   │   ├── get-profile.ts                 # NEW
│   │   ├── update-profile.ts              # NEW
│   │   ├── get-hearts.ts                  # NEW
│   │   ├── toggle-heart.ts                # NEW
│   │   ├── get-follows.ts                 # NEW
│   │   └── toggle-follow.ts               # NEW
│   │
│   ├── organizer-user/
│   │   ├── index.ts                       # NEW
│   │   ├── claim-organizer.ts             # NEW
│   │   ├── get-my-organizers.ts           # NEW
│   │   ├── get-organizer-events.ts        # NEW
│   │   └── approve-claim.ts               # NEW
│   │
│   └── admin/
│       ├── get-pending-claims.ts          # NEW
│       └── get-users.ts                   # NEW
│
├── lib/
│   ├── auth/
│   │   ├── get-profile.ts                 # NEW
│   │   ├── check-organizer.ts             # NEW
│   │   └── require-organizer.ts           # NEW
│   │
│   └── hooks/
│       ├── use-auth.ts                    # NEW
│       ├── use-heart.ts                   # NEW
│       └── use-follow.ts                  # NEW
│
└── types/
    ├── user.ts                            # NEW
    └── organizer-user.ts                  # NEW
```

---

## EMAIL PREPARATION

### Email Templates Needed

| Template | Trigger | Subject |
|----------|---------|---------|
| `magic_link` | User login | "Sign in to Happenlist" |
| `event_approved` | Admin approves event | "Your event is live!" |
| `event_rejected` | Admin rejects event | "About your event submission" |
| `event_changes` | Admin requests changes | "Changes needed for your event" |
| `claim_approved` | Admin approves claim | "You can now manage [Organizer]" |
| `claim_rejected` | Admin rejects claim | "About your organizer claim" |
| `weekly_digest` | Cron (weekly) | "This week on Happenlist" |
| `new_events` | Followed org posts event | "New from [Organizer]" |

### Email Queue Table

Already in migration. To send emails:

```typescript
// Queue an email
await supabase.from('email_queue').insert({
  to_email: 'user@example.com',
  to_name: 'User Name',
  template: 'event_approved',
  subject: 'Your event is live!',
  data: {
    event_title: 'Jazz Night',
    event_url: 'https://happenlist.com/event/jazz-night-2025-01-15'
  }
});

// Process emails (future cron job or API route)
// Uses Resend or similar service
```

### Environment Variables for Email

```env
# Add to .env.local when ready
RESEND_API_KEY=re_xxxx
EMAIL_FROM=noreply@happenlist.com
EMAIL_FROM_NAME=Happenlist
```

---

## LOGGING STANDARDS

### Log Prefixes

```typescript
// Add to logger.ts

export const USER_LOG_PREFIXES = {
  // Auth
  login_started: '🔐 📧',
  login_sent: '✅ 📧',
  login_callback: '🔐 ↩️',
  login_success: '✅ 🔐',
  login_error: '❌ 🔐',
  logout: '🚪 👤',

  // Hearts
  heart_added: '❤️ ➕',
  heart_removed: '❤️ ➖',
  hearts_fetched: '❤️ 📋',

  // Follows
  follow_added: '👀 ➕',
  follow_removed: '👀 ➖',
  follows_fetched: '👀 📋',

  // Claims
  claim_submitted: '🏢 📤',
  claim_approved: '✅ 🏢',
  claim_rejected: '❌ 🏢',

  // Profile
  profile_updated: '👤 ✏️',
};
```

### Example Log Output

```
🔐 📧 [Auth] Magic link requested for user@example.com
✅ 📧 [Auth] Magic link sent (142ms)

🔐 ↩️ [Auth] Processing callback...
✅ 🔐 [Auth] User logged in: user@example.com

❤️ ➕ [User] Heart added (event:abc123, user:def456, 89ms)
❤️ ➖ [User] Heart removed (event:abc123, user:def456, 76ms)

🏢 📤 [Organizer] Claim submitted (organizer:ghi789, user:def456)
✅ 🏢 [AdminClaims] Claim approved (claim:xyz, admin:admin@example.com)
```

---

## TESTING CHECKLIST

### Auth Tests

- [ ] Magic link sends email
- [ ] Callback creates session
- [ ] Profile auto-created for new user
- [ ] Logout clears session
- [ ] Protected routes redirect to login
- [ ] Login modal opens for protected actions

### Hearts Tests

- [ ] Heart button shows outline for guest
- [ ] Guest clicking heart opens login
- [ ] Logged in user can heart
- [ ] Heart count updates immediately
- [ ] Heart persists after refresh
- [ ] Unheart works
- [ ] My Hearts page shows hearted events
- [ ] Heart count is PUBLIC (visible to guests)

### Follows Tests

- [ ] Follow button works for organizers
- [ ] Follow button works for venues
- [ ] Unfollow shows confirmation
- [ ] My Following page shows follows
- [ ] Follower count updates on organizer page

### Organizer Claims Tests

- [ ] "Claim" button shows on unclaimed organizers
- [ ] Claim modal submits correctly
- [ ] Claim shows in /my/organizers as pending
- [ ] Claim shows in /admin/organizers/claims
- [ ] Admin can approve claim
- [ ] Admin can reject with reason
- [ ] Approved user sees organizer in dropdown
- [ ] Approved user can access /dashboard

### Dashboard Tests

- [ ] Dashboard requires organizer role
- [ ] Stats show correct numbers
- [ ] Events list shows organizer's events
- [ ] Can edit published events
- [ ] Organizer switcher works (multiple orgs)

### Profile Tests

- [ ] Can update display name
- [ ] Can update notification preferences
- [ ] Changes persist after refresh

---

## COMMANDS TO RUN

```bash
# 1. Run the SQL migration first
# Go to Supabase Dashboard > SQL Editor
# Paste 00010_user_auth_system.sql
# Click Run

# 2. Regenerate types
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts

# 3. Install any new dependencies (none needed for this phase)

# 4. Start dev server
npm run dev
```

---

## NOTES FOR IMPLEMENTER

1. **Start with database** - Run migration first, test in Supabase Studio
2. **Build auth context first** - Everything depends on knowing if user is logged in
3. **Hearts before follows** - Hearts are simpler, good warmup
4. **Test RLS policies** - Hearts should be PUBLIC readable
5. **Organizer check** - Use `organizer_users` table, NOT the old `ADMIN_EMAILS` check
6. **Keep files < 400 lines** - Split as needed
7. **Log everything** - Use emoji prefixes
8. **Optimistic updates** - Hearts and follows should feel instant

---

**Ready to implement!** 🚀
