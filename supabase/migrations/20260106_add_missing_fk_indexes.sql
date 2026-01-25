-- ============================================================================
-- 🔗 ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================
-- Created: 2026-01-06
-- Purpose: Add indexes on foreign keys to improve join and constraint performance
--
-- Foreign keys without indexes can cause:
--   1. Slow DELETE operations on parent tables (must check all child rows)
--   2. Slow UPDATE operations on parent keys
--   3. Suboptimal query plans for JOINs
--
-- ⚠️ HOW TO RUN:
--   1. Go to Supabase Dashboard → SQL Editor
--   2. Paste this entire file
--   3. Click "Run"
-- ============================================================================

-- ============================================================================
-- EVENT DRAFTS
-- ============================================================================

-- Foreign key: event_drafts.submitted_event_id → events.id
-- Speeds up: DELETE/UPDATE on events table, JOINs between drafts and events
CREATE INDEX IF NOT EXISTS idx_event_drafts_submitted_event_id
  ON public.event_drafts (submitted_event_id)
  WHERE submitted_event_id IS NOT NULL;


-- ============================================================================
-- EVENTS
-- ============================================================================

-- Foreign key: events.recurrence_parent_id → events.id
-- Speeds up: DELETE/UPDATE on parent events, queries finding child events
CREATE INDEX IF NOT EXISTS idx_events_recurrence_parent_id
  ON public.events (recurrence_parent_id)
  WHERE recurrence_parent_id IS NOT NULL;


-- ============================================================================
-- 📝 NOTES
-- ============================================================================
--
-- These indexes are partial (WHERE ... IS NOT NULL) because:
--   - Most rows likely have NULL values for these foreign keys
--   - Partial indexes are smaller and faster to maintain
--   - They still cover all non-NULL foreign key values
--
-- Performance Impact:
--   - Faster DELETE operations on parent tables
--   - Faster UPDATE operations on parent keys
--   - Better query plans for JOINs involving these relationships
--
-- ============================================================================


