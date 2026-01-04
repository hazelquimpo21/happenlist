-- ============================================================================
-- MIGRATION: 00010_user_profiles_and_hearts.sql
-- ============================================================================
--
-- 🎯 PURPOSE:
--   Adds user profiles and hearts (saved events) tables for auth features.
--
-- 📋 WHAT THIS MIGRATION CREATES:
--   1. profiles table - User preferences and display info
--   2. Auto-create profile trigger - Creates profile on signup
--   3. hearts table - User saved/favorited events
--   4. Heart count trigger - Keeps events.heart_count in sync
--   5. v_user_hearts view - Hearts with event details
--   6. Organizer claiming columns - For future organizer verification
--   7. organizer_claim_log table - Audit trail for claims
--
-- 🔧 HOW TO RUN:
--   1. Go to Supabase Dashboard
--   2. Click "SQL Editor"
--   3. Paste this entire file
--   4. Click "Run"
--
-- ✅ VERIFY SUCCESS:
--   After running, you should see these tables:
--   - profiles
--   - hearts
--   - organizer_claim_log
--
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

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Auto-update updated_at timestamp
DROP TRIGGER IF EXISTS set_updated_at ON profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE profiles IS '👤 User profiles with preferences. Auto-created on signup.';


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
  )
  -- If profile already exists (shouldn't happen), do nothing
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

COMMENT ON FUNCTION handle_new_user IS '🔐 Creates a profile when a new user signs up';


-- ============================================================================
-- 3. HEARTS TABLE (Saved Events)
-- ============================================================================
-- Allows users to save/favorite events.
-- Each user can save each event only once (unique constraint).

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

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_hearts_user ON hearts(user_id);
CREATE INDEX IF NOT EXISTS idx_hearts_event ON hearts(event_id);
CREATE INDEX IF NOT EXISTS idx_hearts_user_created ON hearts(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE hearts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own hearts
DROP POLICY IF EXISTS "Users can view own hearts" ON hearts;
CREATE POLICY "Users can view own hearts" ON hearts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can add hearts
DROP POLICY IF EXISTS "Users can insert own hearts" ON hearts;
CREATE POLICY "Users can insert own hearts" ON hearts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can remove their hearts
DROP POLICY IF EXISTS "Users can delete own hearts" ON hearts;
CREATE POLICY "Users can delete own hearts" ON hearts
  FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE hearts IS '❤️ User saved/favorited events';


-- ============================================================================
-- 4. UPDATE EVENT HEART COUNT TRIGGER
-- ============================================================================
-- Keeps events.heart_count in sync when hearts are added/removed.
-- This denormalization allows fast heart counts without JOINs.

-- First, ensure events table has heart_count column
ALTER TABLE events ADD COLUMN IF NOT EXISTS heart_count INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION update_event_heart_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events SET heart_count = COALESCE(heart_count, 0) + 1 WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events SET heart_count = GREATEST(COALESCE(heart_count, 0) - 1, 0) WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_heart_count ON hearts;
CREATE TRIGGER update_heart_count
  AFTER INSERT OR DELETE ON hearts
  FOR EACH ROW EXECUTE FUNCTION update_event_heart_count();

COMMENT ON FUNCTION update_event_heart_count IS '❤️ Keeps events.heart_count in sync with hearts table';


-- ============================================================================
-- 5. HELPER VIEW: User Hearts with Event Details
-- ============================================================================
-- A convenient view for displaying user's saved events with all details.

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

COMMENT ON VIEW v_user_hearts IS '❤️ User hearts with full event details for display';


-- ============================================================================
-- 6. EXTEND ORGANIZERS TABLE FOR CLAIMING
-- ============================================================================
-- Allow users to "claim" an organizer profile and manage their events.
-- This is for future organizer verification functionality.

ALTER TABLE organizers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS claim_verified BOOLEAN DEFAULT false;
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS claim_verification_token TEXT;
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS claim_verification_expires TIMESTAMPTZ;

-- Index for finding user's organizer profiles
CREATE INDEX IF NOT EXISTS idx_organizers_user_id
  ON organizers(user_id)
  WHERE user_id IS NOT NULL;

-- Policy: Verified organizers can update their own profiles
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

COMMENT ON COLUMN organizers.user_id IS '🔗 Links to auth.users when an organizer is claimed';
COMMENT ON COLUMN organizers.claim_verified IS '✅ True after verification (email or admin approval)';


-- ============================================================================
-- 7. ORGANIZER CLAIM LOG
-- ============================================================================
-- Audit log for organizer claim attempts and verifications.
-- Admins can review claim history here.

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

-- Enable RLS (only admins can view via service key)
ALTER TABLE organizer_claim_log ENABLE ROW LEVEL SECURITY;

-- No public read policy; admin access via service key

COMMENT ON TABLE organizer_claim_log IS '📋 Audit trail for organizer claim/verification actions';


-- ============================================================================
-- 🎉 DONE!
-- ============================================================================
--
-- This migration has created:
--   ✅ profiles table with RLS policies
--   ✅ Auto-create profile trigger
--   ✅ hearts table with RLS policies
--   ✅ Heart count sync trigger
--   ✅ v_user_hearts view
--   ✅ Organizer claiming columns
--   ✅ organizer_claim_log table
--
-- Next steps:
--   1. Configure Supabase Auth for magic link emails
--   2. Set ADMIN_EMAILS in your .env.local
--   3. Test the login flow!
--
-- ============================================================================
