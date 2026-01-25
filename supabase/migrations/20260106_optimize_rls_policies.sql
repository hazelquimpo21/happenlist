-- ============================================================================
-- ⚡ OPTIMIZE RLS POLICIES FOR PERFORMANCE
-- ============================================================================
-- Created: 2026-01-06
-- Purpose: Fix RLS policies to use (select auth.uid()) instead of auth.uid()
--          This prevents re-evaluation for each row, improving query performance
--
-- Also removes duplicate indexes to reduce storage and improve write performance
-- ============================================================================

-- ============================================================================
-- ADMIN AUDIT LOG
-- ============================================================================

DROP POLICY IF EXISTS "Superadmins can create audit logs" ON public.admin_audit_log;
CREATE POLICY "Superadmins can create audit logs" ON public.admin_audit_log
  FOR INSERT
  WITH CHECK (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());

DROP POLICY IF EXISTS "Superadmins can view audit logs" ON public.admin_audit_log;
CREATE POLICY "Superadmins can view audit logs" ON public.admin_audit_log
  FOR SELECT
  USING (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());


-- ============================================================================
-- CATEGORIES
-- ============================================================================

DROP POLICY IF EXISTS "Superadmins can manage categories" ON public.categories;
CREATE POLICY "Superadmins can manage categories" ON public.categories
  FOR ALL
  USING (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin())
  WITH CHECK (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());


-- ============================================================================
-- EVENT DRAFTS
-- ============================================================================

DROP POLICY IF EXISTS "Users manage own drafts" ON public.event_drafts;
CREATE POLICY "Users manage own drafts" ON public.event_drafts
  FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);


-- ============================================================================
-- EVENTS
-- ============================================================================

DROP POLICY IF EXISTS "Superadmins can view all events" ON public.events;
CREATE POLICY "Superadmins can view all events" ON public.events
  FOR SELECT
  USING (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());

DROP POLICY IF EXISTS "Superadmins can insert events" ON public.events;
CREATE POLICY "Superadmins can insert events" ON public.events
  FOR INSERT
  WITH CHECK (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());

DROP POLICY IF EXISTS "Superadmins can update any event" ON public.events;
CREATE POLICY "Superadmins can update any event" ON public.events
  FOR UPDATE
  USING (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin())
  WITH CHECK (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());

DROP POLICY IF EXISTS "Superadmins can delete any event" ON public.events;
CREATE POLICY "Superadmins can delete any event" ON public.events
  FOR DELETE
  USING (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());


-- ============================================================================
-- HEARTS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own hearts" ON public.hearts;
CREATE POLICY "Users can view own hearts" ON public.hearts
  FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own hearts" ON public.hearts;
CREATE POLICY "Users can insert own hearts" ON public.hearts
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own hearts" ON public.hearts;
CREATE POLICY "Users can delete own hearts" ON public.hearts
  FOR DELETE
  USING ((select auth.uid()) = user_id);


-- ============================================================================
-- LOCATIONS
-- ============================================================================

DROP POLICY IF EXISTS "Superadmins can manage locations" ON public.locations;
CREATE POLICY "Superadmins can manage locations" ON public.locations
  FOR ALL
  USING (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin())
  WITH CHECK (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());


-- ============================================================================
-- ORGANIZER CLAIM LOG
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own claim logs" ON public.organizer_claim_log;
CREATE POLICY "Users can view their own claim logs" ON public.organizer_claim_log
  FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Superadmins can view all claim logs" ON public.organizer_claim_log;
CREATE POLICY "Superadmins can view all claim logs" ON public.organizer_claim_log
  FOR SELECT
  USING (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());

DROP POLICY IF EXISTS "Superadmins can manage claim logs" ON public.organizer_claim_log;
CREATE POLICY "Superadmins can manage claim logs" ON public.organizer_claim_log
  FOR ALL
  USING (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin())
  WITH CHECK (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());


-- ============================================================================
-- ORGANIZER USERS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own organizer links" ON public.organizer_users;
CREATE POLICY "Users can view own organizer links" ON public.organizer_users
  FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can request to claim organizer" ON public.organizer_users;
CREATE POLICY "Users can request to claim organizer" ON public.organizer_users
  FOR INSERT
  WITH CHECK (((select auth.uid()) = user_id) AND (status = 'pending'));

DROP POLICY IF EXISTS "Team members can view team" ON public.organizer_users;
CREATE POLICY "Team members can view team" ON public.organizer_users
  FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM organizer_users ou
    WHERE ou.organizer_id = organizer_users.organizer_id
      AND ou.user_id = (select auth.uid())
      AND ou.status = 'approved'
  ));


-- ============================================================================
-- ORGANIZERS
-- ============================================================================

DROP POLICY IF EXISTS "Organizers can update own profile" ON public.organizers;
CREATE POLICY "Organizers can update own profile" ON public.organizers
  FOR UPDATE
  USING (((select auth.uid()) IS NOT NULL) AND (user_id = (select auth.uid())) AND (claim_verified = true))
  WITH CHECK ((user_id = (select auth.uid())) AND (claim_verified = true));

DROP POLICY IF EXISTS "Superadmins can manage organizers" ON public.organizers;
CREATE POLICY "Superadmins can manage organizers" ON public.organizers
  FOR ALL
  USING (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin())
  WITH CHECK (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());


-- ============================================================================
-- PROFILES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);


-- ============================================================================
-- SERIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can create draft series" ON public.series;
CREATE POLICY "Users can create draft series" ON public.series
  FOR INSERT
  WITH CHECK (((select auth.uid()) IS NOT NULL) AND (status = ANY (ARRAY['draft', 'pending_review'])));

DROP POLICY IF EXISTS "Superadmins can manage series" ON public.series;
CREATE POLICY "Superadmins can manage series" ON public.series
  FOR ALL
  USING (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin())
  WITH CHECK (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());


-- ============================================================================
-- USER FOLLOWS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own follows" ON public.user_follows;
CREATE POLICY "Users can view own follows" ON public.user_follows
  FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage own follows" ON public.user_follows;
CREATE POLICY "Users can manage own follows" ON public.user_follows
  FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);


-- ============================================================================
-- REMOVE DUPLICATE INDEXES
-- ============================================================================

-- admin_audit_log: Keep idx_admin_audit_date, drop idx_audit_log_created
DROP INDEX IF EXISTS public.idx_audit_log_created;

-- event_drafts: Keep idx_event_drafts_*, drop idx_drafts_*
DROP INDEX IF EXISTS public.idx_drafts_expires;
DROP INDEX IF EXISTS public.idx_drafts_user;

-- events: Keep idx_events_*_id (more descriptive), drop shorter names
DROP INDEX IF EXISTS public.idx_events_category;
DROP INDEX IF EXISTS public.idx_events_location;
DROP INDEX IF EXISTS public.idx_events_organizer;
DROP INDEX IF EXISTS public.idx_events_published_future; -- Keep idx_events_published

-- hearts: Keep idx_hearts_*_id and idx_hearts_user_date (more specific)
DROP INDEX IF EXISTS public.idx_hearts_event;
DROP INDEX IF EXISTS public.idx_hearts_user;
DROP INDEX IF EXISTS public.idx_hearts_user_created;


-- ============================================================================
-- 📝 NOTES
-- ============================================================================
--
-- RLS Performance Optimization:
-- - All auth.uid() calls are now wrapped in (select auth.uid())
-- - This evaluates once per query instead of once per row
-- - Significant performance improvement for queries on large tables
--
-- Duplicate Indexes Removed:
-- - Kept more descriptive index names (with _id suffix)
-- - Kept more specific indexes (e.g., idx_hearts_user_date over idx_hearts_user_created)
-- - Reduced storage overhead and improved write performance
--
-- Multiple Permissive Policies:
-- - Some tables intentionally have multiple permissive policies for security
-- - This is a performance trade-off but necessary for proper access control
-- - Consider consolidating if performance becomes an issue
--
-- ============================================================================


