-- ============================================================================
-- MIGRATION: 00011_user_auth_complete.sql
-- ============================================================================
--
-- 🎯 PURPOSE:
--   Complete user auth system with follows, organizer claims, and email queue.
--   This extends the 00010 migration with additional tables and features.
--
-- 📋 WHAT THIS MIGRATION ADDS:
--   1. user_follows table - Follow organizers, venues, categories
--   2. organizer_users table - Link users to organizers (claims with approval)
--   3. email_queue table - Queue for outgoing emails
--   4. Additional indexes and triggers
--   5. Helper views for common queries
--
-- 🔧 HOW TO RUN:
--   1. Go to Supabase Dashboard → SQL Editor
--   2. Paste this entire file
--   3. Click "Run"
--
-- ⚠️ PREREQUISITES:
--   - Run 00010_user_profiles_and_hearts.sql first!
--
-- ============================================================================


-- ============================================================================
-- 1. USER_FOLLOWS TABLE
-- ============================================================================
-- Users can follow organizers, venues, or categories.
-- Each follow record tracks exactly ONE entity type.

CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 👤 Who is following
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 🎯 What they're following (ONE of these must be set)
  organizer_id UUID REFERENCES organizers(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,

  -- 🔔 Notification preference for this follow
  notify_new_events BOOLEAN DEFAULT true,

  -- ⏰ When followed
  created_at TIMESTAMPTZ DEFAULT now(),

  -- ✅ Constraint: Must follow exactly ONE entity type
  CONSTRAINT follow_one_entity CHECK (
    (CASE WHEN organizer_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN venue_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN category_id IS NOT NULL THEN 1 ELSE 0 END) = 1
  ),

  -- 🚫 No duplicate follows per entity type
  UNIQUE(user_id, organizer_id),
  UNIQUE(user_id, venue_id),
  UNIQUE(user_id, category_id)
);

-- 📇 Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_follows_user ON user_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_organizer ON user_follows(organizer_id) WHERE organizer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_follows_venue ON user_follows(venue_id) WHERE venue_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_follows_category ON user_follows(category_id) WHERE category_id IS NOT NULL;

-- 🔒 Row Level Security
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own follows" ON user_follows;
CREATE POLICY "Users can view own follows" ON user_follows
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own follows" ON user_follows;
CREATE POLICY "Users can manage own follows" ON user_follows
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE user_follows IS '👀 Users following organizers/venues/categories for notifications';


-- ============================================================================
-- 2. ORGANIZER_USERS TABLE (Claim System)
-- ============================================================================
-- Links users to organizers they claim to manage.
-- All claims require ADMIN APPROVAL before granting access.

CREATE TABLE IF NOT EXISTS organizer_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 🏢 The organizer being claimed
  organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,

  -- 👤 The user claiming it
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,

  -- 👑 Role within the organizer
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),

  -- 📋 Claim status (pending → approved/rejected)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- 📝 Claim request details
  claim_message TEXT,  -- "I'm the owner because..."
  requested_at TIMESTAMPTZ DEFAULT now(),

  -- ⚖️ Admin decision
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,  -- Admin email
  rejection_reason TEXT,
  admin_notes TEXT,

  -- ⏰ Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- 🚫 One claim per user per organizer
  UNIQUE(organizer_id, user_id)
);

-- 📇 Indexes
CREATE INDEX IF NOT EXISTS idx_org_users_user ON organizer_users(user_id);
CREATE INDEX IF NOT EXISTS idx_org_users_organizer ON organizer_users(organizer_id);
CREATE INDEX IF NOT EXISTS idx_org_users_status ON organizer_users(status);
CREATE INDEX IF NOT EXISTS idx_org_users_pending ON organizer_users(requested_at) WHERE status = 'pending';

-- 🔒 Row Level Security
ALTER TABLE organizer_users ENABLE ROW LEVEL SECURITY;

-- Users can view their own claims
DROP POLICY IF EXISTS "Users can view own organizer links" ON organizer_users;
CREATE POLICY "Users can view own organizer links" ON organizer_users
  FOR SELECT USING (auth.uid() = user_id);

-- Users can request to claim (only pending status allowed)
DROP POLICY IF EXISTS "Users can request to claim organizer" ON organizer_users;
CREATE POLICY "Users can request to claim organizer" ON organizer_users
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
  );

-- Approved team members can view their teammates
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

-- Auto-update updated_at
DROP TRIGGER IF EXISTS set_updated_at ON organizer_users;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON organizer_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE organizer_users IS '🏢 User-organizer links - claims require ADMIN APPROVAL';


-- ============================================================================
-- 3. UPDATE ORGANIZERS TABLE
-- ============================================================================
-- Add fields to track organizer claiming status and follower count.

-- 📊 Is this organizer claimed by someone?
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT false;
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS primary_user_id UUID REFERENCES auth.users(id);

-- 👥 Follower count (denormalized for performance)
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;

-- Trigger to update follower count
CREATE OR REPLACE FUNCTION update_organizer_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.organizer_id IS NOT NULL THEN
    UPDATE organizers
    SET follower_count = COALESCE(follower_count, 0) + 1
    WHERE id = NEW.organizer_id;
  ELSIF TG_OP = 'DELETE' AND OLD.organizer_id IS NOT NULL THEN
    UPDATE organizers
    SET follower_count = GREATEST(COALESCE(follower_count, 0) - 1, 0)
    WHERE id = OLD.organizer_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_follow_organizer_change ON user_follows;
CREATE TRIGGER on_follow_organizer_change
  AFTER INSERT OR DELETE ON user_follows
  FOR EACH ROW EXECUTE FUNCTION update_organizer_follower_count();

COMMENT ON FUNCTION update_organizer_follower_count IS '👥 Keeps organizers.follower_count in sync';


-- ============================================================================
-- 4. EMAIL QUEUE TABLE
-- ============================================================================
-- Queue for outgoing emails - processed by a cron job or API route.

CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 📬 Recipient
  to_email TEXT NOT NULL,
  to_name TEXT,

  -- 📧 Email content
  template TEXT NOT NULL,  -- 'magic_link', 'event_approved', 'claim_approved', etc.
  subject TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',  -- Template variables

  -- 📋 Processing status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error TEXT,

  -- ⏰ Timestamp
  created_at TIMESTAMPTZ DEFAULT now(),

  -- 🚫 Max retry attempts
  CONSTRAINT max_attempts CHECK (attempts <= 5)
);

-- 📇 Indexes for processing
CREATE INDEX IF NOT EXISTS idx_email_queue_pending ON email_queue(created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status, created_at);

COMMENT ON TABLE email_queue IS '📧 Queue for outgoing emails - processed by cron/worker';


-- ============================================================================
-- 5. EXTENDED PROFILES TABLE
-- ============================================================================
-- Add additional preference fields to profiles.

-- 🔔 More notification preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_on_approval BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_on_rejection BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_on_new_events BOOLEAN DEFAULT true;

-- 📍 Location preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_city TEXT DEFAULT 'Milwaukee';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_state TEXT DEFAULT 'WI';

-- 📊 Stats (denormalized for performance)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS events_submitted_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS events_approved_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hearts_given_count INTEGER DEFAULT 0;

-- Update hearts_given_count when hearts change
CREATE OR REPLACE FUNCTION update_profile_hearts_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles
    SET hearts_given_count = COALESCE(hearts_given_count, 0) + 1
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles
    SET hearts_given_count = GREATEST(COALESCE(hearts_given_count, 0) - 1, 0)
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_heart_profile_update ON hearts;
CREATE TRIGGER on_heart_profile_update
  AFTER INSERT OR DELETE ON hearts
  FOR EACH ROW EXECUTE FUNCTION update_profile_hearts_count();

COMMENT ON FUNCTION update_profile_hearts_count IS '❤️ Keeps profiles.hearts_given_count in sync';


-- ============================================================================
-- 6. HELPER VIEWS
-- ============================================================================

-- 📋 User's complete profile with computed stats
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

COMMENT ON VIEW v_user_profile IS '👤 Complete user profile with computed stats';


-- 📋 User's organizers (approved claims only)
CREATE OR REPLACE VIEW v_my_organizers AS
SELECT
  o.id,
  o.name,
  o.slug,
  o.logo_url,
  o.description,
  o.follower_count,
  ou.user_id,
  ou.role,
  ou.status,
  ou.created_at as joined_at,
  (SELECT COUNT(*) FROM events WHERE organizer_id = o.id AND status = 'published' AND deleted_at IS NULL) as event_count,
  (SELECT COUNT(*) FROM events WHERE organizer_id = o.id AND status = 'pending_review' AND deleted_at IS NULL) as pending_count
FROM organizer_users ou
JOIN organizers o ON o.id = ou.organizer_id
WHERE ou.status = 'approved'
  AND o.is_active = true;

COMMENT ON VIEW v_my_organizers IS '🏢 User''s approved organizer memberships';


-- 📋 Pending organizer claims for admin review
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

COMMENT ON VIEW v_pending_organizer_claims IS '📋 Pending claims for admin review queue';


-- 📋 User's follows with entity details
CREATE OR REPLACE VIEW v_user_follows AS
SELECT
  f.id as follow_id,
  f.user_id,
  f.notify_new_events,
  f.created_at as followed_at,

  -- Determine follow type
  CASE
    WHEN f.organizer_id IS NOT NULL THEN 'organizer'
    WHEN f.venue_id IS NOT NULL THEN 'venue'
    WHEN f.category_id IS NOT NULL THEN 'category'
  END as follow_type,

  -- Organizer details
  f.organizer_id,
  org.name as organizer_name,
  org.slug as organizer_slug,
  org.logo_url as organizer_logo,

  -- Venue details
  f.venue_id,
  loc.name as venue_name,
  loc.slug as venue_slug,
  loc.city as venue_city,

  -- Category details
  f.category_id,
  cat.name as category_name,
  cat.slug as category_slug

FROM user_follows f
LEFT JOIN organizers org ON org.id = f.organizer_id
LEFT JOIN locations loc ON loc.id = f.venue_id
LEFT JOIN categories cat ON cat.id = f.category_id
ORDER BY f.created_at DESC;

COMMENT ON VIEW v_user_follows IS '👀 User''s follows with full entity details';


-- ============================================================================
-- 7. UTILITY FUNCTIONS
-- ============================================================================

-- 🔍 Check if user has hearted an event
CREATE OR REPLACE FUNCTION user_has_hearted(p_user_id UUID, p_event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM hearts
    WHERE user_id = p_user_id AND event_id = p_event_id
  );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION user_has_hearted IS '❤️ Check if user has hearted a specific event';


-- 🔍 Check if user follows an entity
CREATE OR REPLACE FUNCTION user_follows_entity(
  p_user_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_follows
    WHERE user_id = p_user_id
    AND (
      (p_entity_type = 'organizer' AND organizer_id = p_entity_id) OR
      (p_entity_type = 'venue' AND venue_id = p_entity_id) OR
      (p_entity_type = 'category' AND category_id = p_entity_id)
    )
  );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION user_follows_entity IS '👀 Check if user follows a specific entity';


-- 🔍 Get user's role for an organizer
CREATE OR REPLACE FUNCTION get_user_organizer_role(p_user_id UUID, p_organizer_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM organizer_users
  WHERE user_id = p_user_id
    AND organizer_id = p_organizer_id
    AND status = 'approved';
  RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_organizer_role IS '👑 Get user''s role for an organizer (owner/member/null)';


-- ============================================================================
-- 🎉 DONE!
-- ============================================================================
--
-- This migration has created:
--   ✅ user_follows table with RLS
--   ✅ organizer_users table with RLS (claim system)
--   ✅ email_queue table
--   ✅ Extended profiles with more preferences
--   ✅ Follower count trigger for organizers
--   ✅ Helper views for common queries
--   ✅ Utility functions for checks
--
-- Next steps:
--   1. Run this migration in Supabase SQL Editor
--   2. Test that tables were created: SELECT * FROM user_follows LIMIT 1;
--   3. Start implementing the frontend components!
--
-- ============================================================================
