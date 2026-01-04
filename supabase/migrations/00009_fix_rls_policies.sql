-- ============================================================================
-- MIGRATION: 00009_fix_rls_policies.sql
-- ============================================================================
-- 🔧 FIXES RLS POLICY BUG CAUSING "permission denied for table users"
--
-- PROBLEM:
--   The RLS policies created in migrations 00007 and 00008 try to access 
--   the auth.users table to compare emails. When an anonymous user (using 
--   the anon key) tries to view events, ALL RLS policies are evaluated.
--   The "Submitters view own events" policy tries to query auth.users, but
--   the anon key doesn't have permission to access auth.users, causing:
--     ERROR: permission denied for table users (code: 42501)
--
-- SOLUTION:
--   Check if there's an authenticated user (auth.uid() IS NOT NULL) BEFORE
--   trying to access auth.users. This way anonymous users skip the submitter
--   check entirely and fall through to the "Published events are publicly
--   readable" policy.
--
-- Run in Supabase SQL Editor after previous migrations.
-- Safe to run multiple times.
-- ============================================================================

-- ============================================================================
-- 1. FIX EVENTS RLS POLICIES
-- ============================================================================

-- Drop the problematic policies first
DROP POLICY IF EXISTS "Submitters view own events" ON events;
DROP POLICY IF EXISTS "Submitters update own drafts" ON events;
DROP POLICY IF EXISTS "Users can create draft events" ON events;

-- Recreate "Submitters view own events" with proper auth check
-- KEY FIX: Check auth.uid() IS NOT NULL before accessing auth.users
CREATE POLICY "Submitters view own events" ON events
  FOR SELECT
  USING (
    -- Only check submitter email if user is actually authenticated
    -- This prevents anonymous users from triggering the auth.users query
    auth.uid() IS NOT NULL
    AND submitted_by_email IS NOT NULL
    AND submitted_by_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Recreate "Submitters update own drafts" with proper auth check
CREATE POLICY "Submitters update own drafts" ON events
  FOR UPDATE
  USING (
    -- Only allow if authenticated and owns the submission
    auth.uid() IS NOT NULL
    AND status IN ('draft', 'changes_requested')
    AND submitted_by_email IS NOT NULL
    AND submitted_by_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    -- Can only transition to these statuses
    status IN ('draft', 'changes_requested', 'pending_review')
  );

-- Recreate "Users can create draft events" with proper auth check
CREATE POLICY "Users can create draft events" ON events
  FOR INSERT
  WITH CHECK (
    -- Only authenticated users can create drafts
    auth.uid() IS NOT NULL
    AND status = 'draft'
    AND submitted_by_email IS NOT NULL
    AND submitted_by_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- 2. VERIFY PUBLISHED EVENTS POLICY EXISTS
-- ============================================================================
-- This policy should already exist from earlier migrations, but ensure it's there
-- as the fallback for anonymous users

-- Drop and recreate to ensure it exists and is correct
DROP POLICY IF EXISTS "Published events are publicly readable" ON events;
CREATE POLICY "Published events are publicly readable"
  ON events FOR SELECT
  USING (status = 'published');

-- ============================================================================
-- 3. FIX SERIES RLS POLICY (if exists)
-- ============================================================================

-- The series policy from 00007 also needs fixing
DROP POLICY IF EXISTS "Users can create draft series" ON series;
CREATE POLICY "Users can create draft series" ON series
  FOR INSERT
  WITH CHECK (
    -- Only authenticated users can create series
    auth.uid() IS NOT NULL
    AND status IN ('draft', 'pending_review')
  );

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================
--
-- WHAT WAS FIXED:
--   - "Submitters view own events" now checks auth.uid() IS NOT NULL first
--   - "Submitters update own drafts" now checks auth.uid() IS NOT NULL first
--   - "Users can create draft events" now checks auth.uid() IS NOT NULL first
--   - "Users can create draft series" now checks auth.uid() IS NOT NULL first
--
-- HOW RLS POLICIES WORK:
--   PostgreSQL RLS uses OR logic between policies. For SELECT on events:
--   - "Published events are publicly readable" → returns published events
--   - "Submitters view own events" → returns user's own submitted events
--   
--   Before the fix, "Submitters view own events" would fail for anon users
--   because it tried to query auth.users. Now it short-circuits and returns
--   false for anon users, letting them see only published events.
--
-- ============================================================================

