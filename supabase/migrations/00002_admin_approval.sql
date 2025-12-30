-- ============================================================================
-- ADMIN APPROVAL SCHEMA MIGRATION
-- ============================================================================
-- This migration adds fields and infrastructure for the admin event approval
-- workflow, specifically for events that are scraped from external sources.
-- ============================================================================

-- ============================================================================
-- 1. ADD SOURCE TRACKING FIELDS TO EVENTS
-- ============================================================================
-- These fields track where events came from (manual entry vs scraper)

-- Source of the event (manual, scraper name, API, etc.)
ALTER TABLE events ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Original URL where the event was scraped from
ALTER TABLE events ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Unique identifier from the source to prevent duplicate scraping
ALTER TABLE events ADD COLUMN IF NOT EXISTS source_id TEXT;

-- When the event was scraped (NULL for manually entered events)
ALTER TABLE events ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMPTZ;

-- Raw scraped data for debugging/reference (JSON)
ALTER TABLE events ADD COLUMN IF NOT EXISTS scraped_data JSONB;

-- ============================================================================
-- 2. ADD ADMIN REVIEW FIELDS TO EVENTS
-- ============================================================================
-- These fields track the admin review process

-- When the event was reviewed by an admin
ALTER TABLE events ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Who reviewed the event (admin user ID or email)
ALTER TABLE events ADD COLUMN IF NOT EXISTS reviewed_by TEXT;

-- Admin notes about the review decision
ALTER TABLE events ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- Reason for rejection (if rejected)
ALTER TABLE events ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- ============================================================================
-- 3. CREATE ADMIN AUDIT LOG TABLE
-- ============================================================================
-- Tracks all admin actions for troubleshooting and accountability

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Action details
  action TEXT NOT NULL,                 -- 'event_approved', 'event_rejected', 'event_edited', etc.
  entity_type TEXT NOT NULL,            -- 'event', 'venue', 'organizer'
  entity_id UUID NOT NULL,              -- ID of the affected entity

  -- Who performed the action
  admin_id TEXT,                        -- User ID or email of admin
  admin_email TEXT,                     -- Email for display

  -- Change details
  changes JSONB,                        -- What changed (before/after)
  notes TEXT,                           -- Admin notes about the action

  -- Context
  ip_address TEXT,                      -- For security auditing
  user_agent TEXT,                      -- Browser/client info

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON admin_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON admin_audit_log(created_at DESC);

COMMENT ON TABLE admin_audit_log IS 'Audit log for all admin actions - used for troubleshooting and accountability';

-- ============================================================================
-- 4. CREATE INDEXES FOR ADMIN QUERIES
-- ============================================================================
-- Optimize queries for the admin approval workflow

-- Index for finding events pending review
CREATE INDEX IF NOT EXISTS idx_events_pending_review ON events(scraped_at DESC)
  WHERE status = 'pending_review';

-- Index for finding events by source
CREATE INDEX IF NOT EXISTS idx_events_source ON events(source);

-- Index for finding scraped events
CREATE INDEX IF NOT EXISTS idx_events_scraped ON events(scraped_at DESC)
  WHERE source != 'manual';

-- Index for finding events by source_id (deduplication)
CREATE INDEX IF NOT EXISTS idx_events_source_id ON events(source, source_id)
  WHERE source_id IS NOT NULL;

-- ============================================================================
-- 5. UPDATE RLS POLICIES FOR ADMIN ACCESS
-- ============================================================================
-- Allow admin access to all events including pending_review

-- Drop the existing policy first
DROP POLICY IF EXISTS "Published events are publicly readable" ON events;

-- Recreate policy for public (only published events)
CREATE POLICY "Published events are publicly readable"
  ON events FOR SELECT
  USING (status = 'published');

-- Admin policy - service role can access all events
-- (This is handled by using service role key in admin routes)

-- Disable RLS for admin_audit_log (only accessed via service role)
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert audit logs
CREATE POLICY "Service role can manage audit logs"
  ON admin_audit_log
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 6. CREATE ADMIN STATS VIEW
-- ============================================================================
-- View for admin dashboard statistics

CREATE OR REPLACE VIEW admin_event_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'pending_review') as pending_review_count,
  COUNT(*) FILTER (WHERE status = 'published') as published_count,
  COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
  COUNT(*) FILTER (WHERE source != 'manual') as scraped_count,
  COUNT(*) FILTER (WHERE source != 'manual' AND status = 'pending_review') as scraped_pending_count,
  COUNT(*) FILTER (WHERE scraped_at > now() - interval '24 hours') as scraped_last_24h,
  COUNT(*) FILTER (WHERE reviewed_at > now() - interval '24 hours') as reviewed_last_24h,
  COUNT(*) as total_count
FROM events;

COMMENT ON VIEW admin_event_stats IS 'Statistics for admin dashboard';

-- ============================================================================
-- 7. CREATE PENDING EVENTS VIEW
-- ============================================================================
-- View for events pending admin review with all details

CREATE OR REPLACE VIEW events_pending_review AS
SELECT
  e.*,
  c.name as category_name,
  c.slug as category_slug,
  c.icon as category_icon,
  l.name as location_name,
  l.slug as location_slug,
  l.city as location_city,
  l.address_line as location_address,
  o.name as organizer_name,
  o.slug as organizer_slug,
  o.logo_url as organizer_logo
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN organizers o ON e.organizer_id = o.id
WHERE e.status = 'pending_review'
ORDER BY e.scraped_at DESC NULLS LAST, e.created_at DESC;

COMMENT ON VIEW events_pending_review IS 'Events awaiting admin approval with full details';

-- ============================================================================
-- 8. CREATE FUNCTION TO LOG ADMIN ACTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION log_admin_action(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_admin_id TEXT DEFAULT NULL,
  p_admin_email TEXT DEFAULT NULL,
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
    admin_id,
    admin_email,
    changes,
    notes
  ) VALUES (
    p_action,
    p_entity_type,
    p_entity_id,
    p_admin_id,
    p_admin_email,
    p_changes,
    p_notes
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_admin_action IS 'Logs an admin action to the audit log';

-- ============================================================================
-- DONE! Admin approval schema is ready.
-- ============================================================================
--
-- New event statuses:
--   - 'draft'          : Event created but not ready
--   - 'pending_review' : Scraped event awaiting admin approval
--   - 'published'      : Live and visible to public
--   - 'rejected'       : Rejected by admin (not shown to public)
--   - 'cancelled'      : Event was cancelled
--   - 'postponed'      : Event postponed (date TBD)
--
-- ============================================================================
