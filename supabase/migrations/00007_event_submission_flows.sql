-- ============================================================================
-- MIGRATION: 00007_event_submission_flows.sql
-- ============================================================================
-- Adds support for:
--   - Public event submission with magic link auth
--   - Draft saving for multi-step forms
--   - Submitter tracking
--   - Changes requested workflow
--   - Soft delete with restore capability
--   - Edit tracking and audit
--
-- Run in Supabase SQL Editor after existing migrations.
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

COMMENT ON COLUMN events.submitted_by_email IS 'Email of user who submitted this event (null for scraped/admin)';
COMMENT ON COLUMN events.change_request_message IS 'Message from admin when status=changes_requested';
COMMENT ON COLUMN events.deleted_at IS 'Soft delete timestamp - null means not deleted';

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
-- Draft data is flexible JSONB - doesn't require all event fields.

CREATE TABLE IF NOT EXISTS event_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ========== Owner ==========
  -- Links to Supabase auth.users
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,

  -- ========== Draft Data ==========
  -- Flexible JSON for partial event data
  -- Can contain any subset of event fields
  draft_data JSONB NOT NULL DEFAULT '{}',

  -- ========== Form Progress ==========
  -- Track which step user is on and which are complete
  current_step INTEGER DEFAULT 1,
  completed_steps INTEGER[] DEFAULT ARRAY[]::INTEGER[],

  -- ========== Series Draft ==========
  -- If creating a new series along with the event
  series_draft_data JSONB,

  -- ========== Submitted Event Link ==========
  -- Once submitted, links to the created event
  submitted_event_id UUID REFERENCES events(id) ON DELETE SET NULL,

  -- ========== Timestamps ==========
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Drafts expire after 30 days if not submitted
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '30 days'
);

-- Indexes for draft queries
CREATE INDEX IF NOT EXISTS idx_drafts_user ON event_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_user_email ON event_drafts(user_email);
CREATE INDEX IF NOT EXISTS idx_drafts_expires ON event_drafts(expires_at)
  WHERE submitted_event_id IS NULL;

-- RLS: Users can only access their own drafts
ALTER TABLE event_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own drafts" ON event_drafts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON event_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE event_drafts IS 'Stores incomplete event submissions for users to resume';

-- ============================================================================
-- 4. UPDATE EVENTS RLS POLICIES
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
    -- Can only set to draft, changes_requested, or pending_review
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
-- 5. UPDATE SERIES RLS FOR USER CREATION
-- ============================================================================

-- Users can create series (as drafts, pending review)
DROP POLICY IF EXISTS "Users can create draft series" ON series;
CREATE POLICY "Users can create draft series" ON series
  FOR INSERT
  WITH CHECK (
    status IN ('draft', 'pending_review')
  );

-- ============================================================================
-- 6. HELPER VIEWS
-- ============================================================================

-- View: My Submissions
-- Shows authenticated user's submitted events with status and feedback
CREATE OR REPLACE VIEW v_my_submissions AS
SELECT
  e.id,
  e.title,
  e.slug,
  e.status,
  e.instance_date,
  e.start_datetime,
  e.image_url,
  e.submitted_at,
  e.submitted_by_email,
  e.submitted_by_name,
  e.reviewed_at,
  e.reviewed_by,
  e.review_notes,
  e.rejection_reason,
  e.change_request_message,
  e.created_at,
  e.updated_at,
  e.deleted_at,
  c.name as category_name,
  c.slug as category_slug,
  l.name as location_name,
  l.city as location_city,
  s.id as series_id,
  s.title as series_title,
  s.slug as series_slug
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN series s ON e.series_id = s.id
WHERE e.submitted_by_email IS NOT NULL
  AND e.deleted_at IS NULL
ORDER BY e.created_at DESC;

COMMENT ON VIEW v_my_submissions IS 'User-facing view of their submitted events';

-- View: Admin Submission Queue
-- Shows pending events with submitter history for trust indicators
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
  e.is_free,
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
  -- How many events has this submitter had approved before?
  -- Higher count = more trust
  (
    SELECT COUNT(*) FROM events e2
    WHERE e2.submitted_by_email = e.submitted_by_email
    AND e2.status = 'published'
    AND e2.deleted_at IS NULL
  ) as submitter_approved_count,
  -- How many total submissions from this person?
  (
    SELECT COUNT(*) FROM events e3
    WHERE e3.submitted_by_email = e.submitted_by_email
    AND e3.deleted_at IS NULL
  ) as submitter_total_count
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

COMMENT ON VIEW v_admin_submission_queue IS 'Admin view of events awaiting review with trust indicators';

-- ============================================================================
-- 7. CLEANUP FUNCTION FOR EXPIRED DRAFTS
-- ============================================================================
-- Run via cron job (Supabase pg_cron or external) daily

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

COMMENT ON FUNCTION cleanup_expired_drafts IS 'Removes expired drafts older than 30 days. Run daily via cron.';

-- ============================================================================
-- 8. DOCUMENT AUDIT LOG ACTION TYPES
-- ============================================================================

COMMENT ON TABLE admin_audit_log IS '
AUDIT LOG ACTION TYPES (for reference):

SUBMISSION FLOW:
  - event_draft_created   : User started a new draft
  - event_draft_updated   : User updated draft
  - event_submitted       : User submitted event for review
  - event_resubmitted     : User resubmitted after changes_requested

ADMIN REVIEW:
  - event_approved        : Admin approved -> published
  - event_rejected        : Admin rejected (with reason)
  - event_changes_req     : Admin requested changes (with message)

EDITING:
  - event_edited          : Event fields were modified
  - series_event_added    : Event linked to a series
  - series_event_removed  : Event unlinked from series

DELETION:
  - event_soft_deleted    : Event marked as deleted
  - event_restored        : Deleted event was restored
  - event_hard_deleted    : Event permanently removed (rare)

SERIES:
  - series_created        : New series created
  - series_edited         : Series modified
  - series_events_generated : Recurring events auto-generated
';

-- ============================================================================
-- 9. ADD SERIES PERFORMANCE INDEX
-- ============================================================================

-- Fast series search by title (for linking existing series)
CREATE INDEX IF NOT EXISTS idx_series_title_search
  ON series USING gin(to_tsvector('english', coalesce(title, '')));

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================
--
-- What this migration added:
--
-- TABLES:
--   - event_drafts: Stores incomplete submissions
--
-- COLUMNS ON events:
--   - submitted_by_email, submitted_by_name, submitted_at
--   - change_request_message
--   - deleted_at, deleted_by, delete_reason
--   - last_edited_at, last_edited_by, edit_count
--
-- VIEWS:
--   - v_my_submissions: User's submitted events
--   - v_admin_submission_queue: Pending events for admin
--
-- FUNCTIONS:
--   - cleanup_expired_drafts(): Remove old drafts
--
-- RLS POLICIES:
--   - Users can view/update their own submissions
--   - Users can create draft events
--
-- NEXT STEPS:
--   1. Enable Magic Link in Supabase Dashboard
--   2. Set ADMIN_EMAILS env var
--   3. Build the submission form UI
--
-- ============================================================================
