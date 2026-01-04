-- ============================================================================
-- MIGRATION: 00012_superadmin_event_management.sql
-- ============================================================================
--
-- 🦸 PURPOSE:
--   Enable superadmin functionality for managing ALL events in the system.
--   Superadmins can view, edit, and delete any event regardless of ownership.
--
-- 📋 WHAT THIS MIGRATION ADDS:
--   1. user_roles table - Stores user roles (superadmin, admin, organizer, user)
--   2. Helper function - is_superadmin_by_email() for RLS policies
--   3. Extended RLS policies - Superadmin access to all events
--   4. Performance indexes - For superadmin queries
--   5. Audit log enhancements - Track superadmin actions
--
-- 🔧 HOW TO RUN:
--   1. Go to Supabase Dashboard → SQL Editor
--   2. Paste this entire file
--   3. Click "Run"
--
-- ⚠️ PREREQUISITES:
--   - Run all previous migrations (00001 through 00011)
--   - Set SUPERADMIN_EMAILS environment variable in your app
--
-- 💡 ARCHITECTURE NOTES:
--   - Superadmin emails are stored in the database for RLS policy checks
--   - App layer ALSO checks via env var for defense-in-depth
--   - This dual approach ensures security even if one layer fails
--
-- ============================================================================


-- ============================================================================
-- 1. USER ROLES TABLE
-- ============================================================================
-- Stores role assignments for users. Provides flexibility for future role-based
-- access control beyond just superadmin.

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 👤 The user
  user_email TEXT NOT NULL,

  -- 👑 Their role
  -- superadmin: Can do anything - edit/delete any event, manage system
  -- admin: Can approve/reject events, moderate content
  -- organizer: Can manage events for their organization
  -- user: Regular user (default, not stored - absence means user)
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'organizer')),

  -- 📝 Optional notes about why they have this role
  notes TEXT,

  -- 👤 Who granted this role
  granted_by TEXT,

  -- ⏰ Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- 🔑 Each email can only have one entry per role
  UNIQUE(user_email, role)
);

-- 📇 Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(user_email);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- 🔒 RLS - Only superadmins can manage roles (this will be enforced at app layer initially)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- For now, no RLS policies - this table is only accessed server-side with service role
-- This is intentional for security: role management should only happen through admin APIs

COMMENT ON TABLE user_roles IS '👑 Stores user role assignments (superadmin, admin, organizer)';
COMMENT ON COLUMN user_roles.role IS 'Role type: superadmin (full access), admin (moderation), organizer (own events)';


-- ============================================================================
-- 2. HELPER FUNCTION: Check if email is superadmin
-- ============================================================================
-- This function is used by RLS policies to check superadmin status.
-- It queries the user_roles table for a superadmin role entry.

CREATE OR REPLACE FUNCTION is_superadmin_by_email(check_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the email has a superadmin role in the user_roles table
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_email = LOWER(check_email)
    AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION is_superadmin_by_email IS '🦸 Check if an email has superadmin role. Used by RLS policies.';


-- ============================================================================
-- 3. HELPER FUNCTION: Check if current user is superadmin
-- ============================================================================
-- Checks the JWT token email against the user_roles table.
-- Used directly in RLS policies for authenticated users.

CREATE OR REPLACE FUNCTION is_current_user_superadmin()
RETURNS BOOLEAN AS $$
DECLARE
  current_email TEXT;
BEGIN
  -- Get email from JWT token
  current_email := auth.jwt() ->> 'email';

  IF current_email IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check superadmin status
  RETURN is_superadmin_by_email(current_email);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION is_current_user_superadmin IS '🦸 Check if the currently authenticated user is a superadmin.';


-- ============================================================================
-- 4. HELPER FUNCTION: Check if email is admin (regular or super)
-- ============================================================================
-- Returns true if the email has admin OR superadmin role.

CREATE OR REPLACE FUNCTION is_admin_by_email(check_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_email = LOWER(check_email)
    AND role IN ('superadmin', 'admin')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION is_admin_by_email IS '👨‍💼 Check if an email has admin or superadmin role.';


-- ============================================================================
-- 5. EXTENDED RLS POLICIES FOR EVENTS
-- ============================================================================
-- Add superadmin access to events table.
-- Superadmins can SELECT, UPDATE, and DELETE any event.

-- 📖 Superadmins can view ALL events (including drafts, deleted, etc.)
DROP POLICY IF EXISTS "Superadmins can view all events" ON events;
CREATE POLICY "Superadmins can view all events" ON events
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND is_current_user_superadmin()
  );

-- ✏️ Superadmins can update ANY event
DROP POLICY IF EXISTS "Superadmins can update any event" ON events;
CREATE POLICY "Superadmins can update any event" ON events
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND is_current_user_superadmin()
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND is_current_user_superadmin()
  );

-- 🗑️ Superadmins can delete ANY event (though we prefer soft delete)
DROP POLICY IF EXISTS "Superadmins can delete any event" ON events;
CREATE POLICY "Superadmins can delete any event" ON events
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND is_current_user_superadmin()
  );

-- ➕ Superadmins can insert events (for data imports, etc.)
DROP POLICY IF EXISTS "Superadmins can insert events" ON events;
CREATE POLICY "Superadmins can insert events" ON events
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND is_current_user_superadmin()
  );


-- ============================================================================
-- 6. SUPERADMIN ACCESS TO RELATED TABLES
-- ============================================================================
-- Superadmins need access to locations, organizers, categories for editing events.

-- 📍 Locations - Superadmins can manage all
DROP POLICY IF EXISTS "Superadmins can manage locations" ON locations;
CREATE POLICY "Superadmins can manage locations" ON locations
  FOR ALL
  USING (
    auth.uid() IS NOT NULL
    AND is_current_user_superadmin()
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND is_current_user_superadmin()
  );

-- 🏢 Organizers - Superadmins can manage all
DROP POLICY IF EXISTS "Superadmins can manage organizers" ON organizers;
CREATE POLICY "Superadmins can manage organizers" ON organizers
  FOR ALL
  USING (
    auth.uid() IS NOT NULL
    AND is_current_user_superadmin()
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND is_current_user_superadmin()
  );

-- 📂 Categories - Superadmins can manage all
DROP POLICY IF EXISTS "Superadmins can manage categories" ON categories;
CREATE POLICY "Superadmins can manage categories" ON categories
  FOR ALL
  USING (
    auth.uid() IS NOT NULL
    AND is_current_user_superadmin()
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND is_current_user_superadmin()
  );

-- 📋 Series - Superadmins can manage all
DROP POLICY IF EXISTS "Superadmins can manage series" ON series;
CREATE POLICY "Superadmins can manage series" ON series
  FOR ALL
  USING (
    auth.uid() IS NOT NULL
    AND is_current_user_superadmin()
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND is_current_user_superadmin()
  );


-- ============================================================================
-- 7. SUPERADMIN AUDIT LOG ACCESS
-- ============================================================================
-- Superadmins can view and create audit log entries.

DROP POLICY IF EXISTS "Superadmins can view audit logs" ON admin_audit_log;
CREATE POLICY "Superadmins can view audit logs" ON admin_audit_log
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND is_current_user_superadmin()
  );

DROP POLICY IF EXISTS "Superadmins can create audit logs" ON admin_audit_log;
CREATE POLICY "Superadmins can create audit logs" ON admin_audit_log
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND is_current_user_superadmin()
  );


-- ============================================================================
-- 8. PERFORMANCE INDEXES FOR SUPERADMIN QUERIES
-- ============================================================================
-- Optimize common superadmin queries.

-- All events ordered by date (for management page)
CREATE INDEX IF NOT EXISTS idx_events_superadmin_list
  ON events(created_at DESC, status);

-- Find deleted events for restoration
CREATE INDEX IF NOT EXISTS idx_events_deleted
  ON events(deleted_at DESC)
  WHERE deleted_at IS NOT NULL;

-- Find events by submitter for user lookup
CREATE INDEX IF NOT EXISTS idx_events_submitter_lookup
  ON events(submitted_by_email, status, instance_date);

-- User roles lookup optimization
CREATE INDEX IF NOT EXISTS idx_user_roles_superadmin
  ON user_roles(user_email)
  WHERE role = 'superadmin';


-- ============================================================================
-- 9. VIEW: All Events for Superadmin
-- ============================================================================
-- Comprehensive view of all events with full details for superadmin management.

CREATE OR REPLACE VIEW v_superadmin_events AS
SELECT
  e.id,
  e.title,
  e.slug,
  e.status,
  e.source,
  e.instance_date,
  e.start_datetime,
  e.end_datetime,
  e.is_all_day,
  e.description,
  e.short_description,
  e.image_url,
  e.thumbnail_url,
  e.price_type,
  e.price_low,
  e.price_high,
  e.is_free,
  e.ticket_url,
  -- Submission info
  e.submitted_by_email,
  e.submitted_by_name,
  e.submitted_at,
  -- Review info
  e.reviewed_at,
  e.reviewed_by,
  e.review_notes,
  e.rejection_reason,
  e.change_request_message,
  -- Delete info
  e.deleted_at,
  e.deleted_by,
  e.delete_reason,
  -- Edit tracking
  e.last_edited_at,
  e.last_edited_by,
  e.edit_count,
  -- Timestamps
  e.created_at,
  e.updated_at,
  e.published_at,
  -- Stats
  e.heart_count,
  e.view_count,
  -- Related entities
  c.id as category_id,
  c.name as category_name,
  c.slug as category_slug,
  c.icon as category_icon,
  l.id as location_id,
  l.name as location_name,
  l.slug as location_slug,
  l.city as location_city,
  l.address_line as location_address,
  l.venue_type as location_type,
  o.id as organizer_id,
  o.name as organizer_name,
  o.slug as organizer_slug,
  o.logo_url as organizer_logo,
  s.id as series_id,
  s.title as series_title,
  s.slug as series_slug,
  s.series_type,
  -- Submitter trust score
  COALESCE((
    SELECT COUNT(*) FROM events e2
    WHERE e2.submitted_by_email = e.submitted_by_email
    AND e2.status = 'published'
    AND e2.deleted_at IS NULL
  ), 0) as submitter_approved_count,
  -- Flag for soft deleted
  (e.deleted_at IS NOT NULL) as is_deleted
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN organizers o ON e.organizer_id = o.id
LEFT JOIN series s ON e.series_id = s.id
ORDER BY e.created_at DESC;

COMMENT ON VIEW v_superadmin_events IS '🦸 Complete event view for superadmin management - includes ALL events';


-- ============================================================================
-- 10. FUNCTION: Log Superadmin Action
-- ============================================================================
-- Helper function to log superadmin actions consistently.

CREATE OR REPLACE FUNCTION log_superadmin_action(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_admin_email TEXT,
  p_changes JSONB DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_audit_log (
    action,
    entity_type,
    entity_id,
    admin_email,
    changes,
    notes
  ) VALUES (
    p_action,
    p_entity_type,
    p_entity_id,
    p_admin_email,
    COALESCE(p_changes, '{}'::jsonb),
    p_notes
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_superadmin_action IS '📝 Log a superadmin action to the audit trail.';


-- ============================================================================
-- 🎉 MIGRATION COMPLETE!
-- ============================================================================
--
-- ✅ WHAT WAS CREATED:
--   - user_roles table for storing role assignments
--   - is_superadmin_by_email() function for checking superadmin status
--   - is_current_user_superadmin() function for RLS policies
--   - is_admin_by_email() function for checking admin/superadmin
--   - Extended RLS policies for superadmin access to all tables
--   - Performance indexes for superadmin queries
--   - v_superadmin_events view for event management
--   - log_superadmin_action() helper function
--
-- 📋 NEXT STEPS:
--   1. Run this migration in Supabase SQL Editor
--   2. Add superadmin emails to user_roles table:
--      INSERT INTO user_roles (user_email, role, notes, granted_by)
--      VALUES ('your-email@example.com', 'superadmin', 'Initial setup', 'migration');
--   3. Set SUPERADMIN_EMAILS environment variable in your app
--   4. Test superadmin access to events
--
-- 🔐 SECURITY NOTES:
--   - App layer also checks superadmin status (defense-in-depth)
--   - All superadmin actions are logged to admin_audit_log
--   - user_roles table is only accessible via service role
--
-- ============================================================================
