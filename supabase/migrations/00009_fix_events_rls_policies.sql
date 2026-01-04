-- ============================================================================
-- MIGRATION: 00009_fix_events_rls_policies.sql
-- ============================================================================
-- 🔧 Fix RLS policies that were causing permission errors
--
-- ISSUE: The policies in 00008 used `SELECT email FROM auth.users WHERE id = auth.uid()`
--        which requires access to auth.users table - anonymous users can't access this.
--
-- FIX: Use `auth.jwt() ->> 'email'` instead which extracts email from the JWT token
--      directly without querying any table.
-- ============================================================================

-- ============================================================================
-- 1. DROP AND RECREATE SUBMITTER POLICIES
-- ============================================================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Submitters view own events" ON events;
DROP POLICY IF EXISTS "Submitters update own drafts" ON events;
DROP POLICY IF EXISTS "Users can create draft events" ON events;

-- ============================================================================
-- 2. RECREATE WITH FIXED JWT-BASED ACCESS
-- ============================================================================

-- Submitters can view their own events (any status including draft, rejected)
-- Uses auth.jwt() ->> 'email' which doesn't require table access
CREATE POLICY "Submitters view own events" ON events
  FOR SELECT
  USING (
    submitted_by_email IS NOT NULL
    AND auth.uid() IS NOT NULL
    AND submitted_by_email = (auth.jwt() ->> 'email')
  );

-- Submitters can update their own drafts and events with changes_requested
CREATE POLICY "Submitters update own drafts" ON events
  FOR UPDATE
  USING (
    status IN ('draft', 'changes_requested')
    AND submitted_by_email IS NOT NULL
    AND auth.uid() IS NOT NULL
    AND submitted_by_email = (auth.jwt() ->> 'email')
  )
  WITH CHECK (
    status IN ('draft', 'changes_requested', 'pending_review')
  );

-- Users can insert new events as drafts only
CREATE POLICY "Users can create draft events" ON events
  FOR INSERT
  WITH CHECK (
    status = 'draft'
    AND submitted_by_email IS NOT NULL
    AND auth.uid() IS NOT NULL
    AND submitted_by_email = (auth.jwt() ->> 'email')
  );

-- ============================================================================
-- 3. ENSURE PUBLIC ACCESS POLICY EXISTS
-- ============================================================================
-- This ensures anonymous users can view published events

DROP POLICY IF EXISTS "Public can view published events" ON events;
CREATE POLICY "Public can view published events" ON events
  FOR SELECT
  USING (
    status = 'published'
    AND deleted_at IS NULL
  );

-- ============================================================================
-- 4. FIX EVENT_DRAFTS POLICY AS WELL
-- ============================================================================

DROP POLICY IF EXISTS "Users manage own drafts" ON event_drafts;
CREATE POLICY "Users manage own drafts" ON event_drafts
  FOR ALL
  USING (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
  );

-- ============================================================================
-- ✅ MIGRATION COMPLETE!
-- ============================================================================
-- Fixed policies to use auth.jwt() instead of querying auth.users table
-- Anonymous users can now view published events without permission errors
-- ============================================================================
