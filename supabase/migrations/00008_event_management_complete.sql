-- ============================================================================
-- MIGRATION: 00008_event_management_complete.sql
-- ============================================================================
-- 🎫 Complete Event Management System
--
-- This migration ensures all required columns and structures exist for:
--   ✅ Public event submission with magic link auth
--   ✅ Draft saving for multi-step forms
--   ✅ Submitter tracking
--   ✅ Changes requested workflow
--   ✅ Soft delete with restore capability
--   ✅ Edit tracking and audit
--
-- Run in Supabase SQL Editor after existing migrations.
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS checks)
-- ============================================================================

-- ============================================================================
-- 1. EXTEND EVENTS TABLE - SUBMISSION TRACKING
-- ============================================================================

-- Who submitted this event (null for scraped/admin-created)
ALTER TABLE events ADD COLUMN IF NOT EXISTS submitted_by_email TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS submitted_by_name TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- Changes requested flow - admin can request changes with a message
ALTER TABLE events ADD COLUMN IF NOT EXISTS change_request_message TEXT;

-- Soft delete - events are never truly deleted, just marked
ALTER TABLE events ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS delete_reason TEXT;

-- Edit tracking - know who edited and when
ALTER TABLE events ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS last_edited_by TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0;

-- Review tracking (may already exist from earlier migrations)
ALTER TABLE events ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS review_notes TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Source tracking for scraped vs user-submitted
ALTER TABLE events ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Add helpful comments
COMMENT ON COLUMN events.submitted_by_email IS 'Email of user who submitted (null for scraped/admin)';
COMMENT ON COLUMN events.change_request_message IS 'Message from admin when status=changes_requested';
COMMENT ON COLUMN events.deleted_at IS 'Soft delete timestamp - null means not deleted';
COMMENT ON COLUMN events.source IS 'Where this event came from: manual, user_submission, scraper';

-- ============================================================================
-- 2. CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Find user's submissions quickly
CREATE INDEX IF NOT EXISTS idx_events_submitted_by
  ON events(submitted_by_email, created_at DESC)
  WHERE submitted_by_email IS NOT NULL;

-- Admin queue ordering - pending events first
CREATE INDEX IF NOT EXISTS idx_events_pending_queue
  ON events(status, submitted_at DESC)
  WHERE status IN ('pending_review', 'changes_requested');

-- Filter out soft-deleted events
CREATE INDEX IF NOT EXISTS idx_events_not_deleted
  ON events(instance_date)
  WHERE deleted_at IS NULL;

-- Series events for display (ordered by date)
CREATE INDEX IF NOT EXISTS idx_events_series_display
  ON events(series_id, instance_date ASC)
  WHERE series_id IS NOT NULL AND status = 'published';

-- ============================================================================
-- 3. CREATE EVENT DRAFTS TABLE
-- ============================================================================
-- Stores incomplete event submissions so users can save and resume later.

CREATE TABLE IF NOT EXISTS event_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ========== Owner ==========
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,

  -- ========== Draft Data ==========
  -- Flexible JSON for partial event data
  draft_data JSONB NOT NULL DEFAULT '{}',

  -- ========== Form Progress ==========
  current_step INTEGER DEFAULT 1,
  completed_steps INTEGER[] DEFAULT ARRAY[]::INTEGER[],

  -- ========== Series Draft ==========
  series_draft_data JSONB,

  -- ========== Submitted Event Link ==========
  submitted_event_id UUID REFERENCES events(id) ON DELETE SET NULL,

  -- ========== Timestamps ==========
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '30 days'
);

-- Indexes for draft queries
CREATE INDEX IF NOT EXISTS idx_drafts_user ON event_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_user_email ON event_drafts(user_email);
CREATE INDEX IF NOT EXISTS idx_drafts_expires ON event_drafts(expires_at)
  WHERE submitted_event_id IS NULL;

COMMENT ON TABLE event_drafts IS '📝 Stores incomplete event submissions for users to resume';

-- ============================================================================
-- 4. CREATE ADMIN AUDIT LOG TABLE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Action info
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,

  -- Who performed the action
  admin_email TEXT,
  user_email TEXT,

  -- What changed
  changes JSONB,
  notes TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON admin_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON admin_audit_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON admin_audit_log(admin_email, created_at DESC);

COMMENT ON TABLE admin_audit_log IS '📋 Tracks all admin and user actions for auditing';

-- ============================================================================
-- 5. RLS POLICIES FOR EVENT DRAFTS
-- ============================================================================

ALTER TABLE event_drafts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe recreation)
DROP POLICY IF EXISTS "Users manage own drafts" ON event_drafts;

-- Users can only access their own drafts
CREATE POLICY "Users manage own drafts" ON event_drafts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 6. UPDATE EVENTS RLS POLICIES
-- ============================================================================

-- Submitters can view their own events (any status including draft, rejected)
DROP POLICY IF EXISTS "Submitters view own events" ON events;
CREATE POLICY "Submitters view own events" ON events
  FOR SELECT
  USING (
    submitted_by_email IS NOT NULL
    AND submitted_by_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Submitters can update their own drafts and events with changes_requested
DROP POLICY IF EXISTS "Submitters update own drafts" ON events;
CREATE POLICY "Submitters update own drafts" ON events
  FOR UPDATE
  USING (
    status IN ('draft', 'changes_requested')
    AND submitted_by_email IS NOT NULL
    AND submitted_by_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    status IN ('draft', 'changes_requested', 'pending_review')
  );

-- Users can insert new events as drafts only
DROP POLICY IF EXISTS "Users can create draft events" ON events;
CREATE POLICY "Users can create draft events" ON events
  FOR INSERT
  WITH CHECK (
    status = 'draft'
    AND submitted_by_email IS NOT NULL
    AND submitted_by_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

-- Auto-update updated_at for event_drafts
DROP TRIGGER IF EXISTS set_updated_at ON event_drafts;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON event_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 8. HELPER VIEWS
-- ============================================================================

-- View: My Submissions (for authenticated user)
CREATE OR REPLACE VIEW v_my_submissions AS
SELECT
  e.id,
  e.title,
  e.slug,
  e.status,
  e.instance_date,
  e.start_datetime,
  e.end_datetime,
  e.image_url,
  e.description,
  e.short_description,
  e.submitted_at,
  e.submitted_by_email,
  e.submitted_by_name,
  e.reviewed_at,
  e.reviewed_by,
  e.review_notes,
  e.rejection_reason,
  e.change_request_message,
  e.source,
  e.created_at,
  e.updated_at,
  e.deleted_at,
  e.price_type,
  e.price_low,
  e.price_high,
  e.is_free,
  c.id as category_id,
  c.name as category_name,
  c.slug as category_slug,
  l.id as location_id,
  l.name as location_name,
  l.city as location_city,
  l.address_line as location_address,
  s.id as series_id,
  s.title as series_title,
  s.slug as series_slug,
  s.series_type
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN series s ON e.series_id = s.id
WHERE e.submitted_by_email IS NOT NULL
  AND e.deleted_at IS NULL
ORDER BY e.created_at DESC;

COMMENT ON VIEW v_my_submissions IS '📋 User-facing view of their submitted events';

-- View: Admin Submission Queue
CREATE OR REPLACE VIEW v_admin_submission_queue AS
SELECT
  e.id,
  e.title,
  e.slug,
  e.status,
  e.instance_date,
  e.start_datetime,
  e.end_datetime,
  e.image_url,
  e.description,
  e.short_description,
  e.submitted_at,
  e.submitted_by_email,
  e.submitted_by_name,
  e.source,
  e.source_url,
  e.created_at,
  e.price_type,
  e.price_low,
  e.price_high,
  e.is_free,
  e.ticket_url,
  e.change_request_message,
  c.id as category_id,
  c.name as category_name,
  c.slug as category_slug,
  l.id as location_id,
  l.name as location_name,
  l.city as location_city,
  l.address_line as location_address,
  o.id as organizer_id,
  o.name as organizer_name,
  s.id as series_id,
  s.title as series_title,
  s.series_type as series_type,
  -- Trust indicator: how many events has this submitter had approved?
  COALESCE((
    SELECT COUNT(*) FROM events e2
    WHERE e2.submitted_by_email = e.submitted_by_email
    AND e2.status = 'published'
    AND e2.deleted_at IS NULL
  ), 0) as submitter_approved_count,
  -- Total submissions from this person
  COALESCE((
    SELECT COUNT(*) FROM events e3
    WHERE e3.submitted_by_email = e.submitted_by_email
    AND e3.deleted_at IS NULL
  ), 0) as submitter_total_count
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN organizers o ON e.organizer_id = o.id
LEFT JOIN series s ON e.series_id = s.id
WHERE e.status IN ('pending_review', 'changes_requested')
  AND e.deleted_at IS NULL
ORDER BY
  -- Prioritize changes_requested (user has already made edits)
  CASE e.status
    WHEN 'changes_requested' THEN 0
    WHEN 'pending_review' THEN 1
  END,
  -- Then by submission date (oldest first = FIFO)
  e.submitted_at ASC NULLS LAST,
  e.created_at ASC;

COMMENT ON VIEW v_admin_submission_queue IS '👨‍💼 Admin view of events awaiting review with trust indicators';

-- ============================================================================
-- 9. CLEANUP FUNCTION FOR EXPIRED DRAFTS
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_drafts()
RETURNS TABLE(deleted_count INTEGER, deleted_ids UUID[]) AS $$
DECLARE
  v_deleted_count INTEGER;
  v_deleted_ids UUID[];
BEGIN
  -- Get IDs of drafts to delete (for logging)
  SELECT array_agg(id) INTO v_deleted_ids
  FROM event_drafts
  WHERE expires_at < now()
    AND submitted_event_id IS NULL;

  -- Delete expired, unsubmitted drafts
  DELETE FROM event_drafts
  WHERE expires_at < now()
    AND submitted_event_id IS NULL;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN QUERY SELECT v_deleted_count, COALESCE(v_deleted_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_drafts IS '🗑️ Removes expired drafts older than 30 days. Run daily via cron.';

-- ============================================================================
-- 10. SERIES PERFORMANCE INDEX
-- ============================================================================

-- Fast series search by title (for linking existing series)
CREATE INDEX IF NOT EXISTS idx_series_title_search
  ON series USING gin(to_tsvector('english', coalesce(title, '')));

-- ============================================================================
-- ✅ MIGRATION COMPLETE!
-- ============================================================================
--
-- What this migration added/ensured:
--
-- 📦 TABLES:
--   • event_drafts: Stores incomplete submissions
--   • admin_audit_log: Tracks all actions
--
-- 📝 COLUMNS ON events:
--   • submitted_by_email, submitted_by_name, submitted_at
--   • change_request_message
--   • deleted_at, deleted_by, delete_reason
--   • last_edited_at, last_edited_by, edit_count
--   • reviewed_at, reviewed_by, review_notes, rejection_reason
--   • source
--
-- 👁️ VIEWS:
--   • v_my_submissions: User's submitted events
--   • v_admin_submission_queue: Pending events for admin
--
-- 🔧 FUNCTIONS:
--   • cleanup_expired_drafts(): Remove old drafts
--
-- 🔒 RLS POLICIES:
--   • Users can view/update their own submissions
--   • Users can create draft events
--
-- ============================================================================
