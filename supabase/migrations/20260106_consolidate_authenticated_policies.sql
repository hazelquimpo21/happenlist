-- ============================================================================
-- ⚡ CONSOLIDATE AUTHENTICATED ROLE POLICIES
-- ============================================================================
-- Created: 2026-01-06
-- Purpose: Consolidate overlapping policies for authenticated role
--
-- Problem: Public read policies include authenticated, and superadmin policies
--          also target authenticated, causing multiple policies to be evaluated.
--
-- Solution: 
--   1. Make public read policies only for anon
--   2. Create consolidated policies for authenticated that combine:
--      - Public read access (for all authenticated users)
--      - Superadmin access (for superadmins)
-- ============================================================================

-- ============================================================================
-- CATEGORIES
-- ============================================================================

-- Public read: anon only
DROP POLICY IF EXISTS "Categories are publicly readable" ON public.categories;
CREATE POLICY "Categories are publicly readable" ON public.categories
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Authenticated: public read OR superadmin
DROP POLICY IF EXISTS "Superadmins can manage categories" ON public.categories;
CREATE POLICY "Authenticated users can read categories" ON public.categories
  FOR SELECT
  TO authenticated
  USING ((is_active = true) OR (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin()));

CREATE POLICY "Superadmins can insert categories" ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());

CREATE POLICY "Superadmins can update categories" ON public.categories
  FOR UPDATE
  TO authenticated
  USING (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin())
  WITH CHECK (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());

CREATE POLICY "Superadmins can delete categories" ON public.categories
  FOR DELETE
  TO authenticated
  USING (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());


-- ============================================================================
-- EVENTS
-- ============================================================================

-- Public read: anon only
DROP POLICY IF EXISTS "Published events are publicly readable" ON public.events;
CREATE POLICY "Published events are publicly readable" ON public.events
  FOR SELECT
  TO anon
  USING (status = 'published');

-- Authenticated: public read OR superadmin
DROP POLICY IF EXISTS "Superadmins can view all events" ON public.events;
CREATE POLICY "Authenticated users can read events" ON public.events
  FOR SELECT
  TO authenticated
  USING ((status = 'published') OR (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin()));

DROP POLICY IF EXISTS "Superadmins can insert events" ON public.events;
CREATE POLICY "Superadmins can insert events" ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());

DROP POLICY IF EXISTS "Superadmins can update any event" ON public.events;
CREATE POLICY "Superadmins can update any event" ON public.events
  FOR UPDATE
  TO authenticated
  USING (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin())
  WITH CHECK (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());

DROP POLICY IF EXISTS "Superadmins can delete any event" ON public.events;
CREATE POLICY "Superadmins can delete any event" ON public.events
  FOR DELETE
  TO authenticated
  USING (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());


-- ============================================================================
-- LOCATIONS
-- ============================================================================

-- Public read: anon only
DROP POLICY IF EXISTS "Locations are publicly readable" ON public.locations;
CREATE POLICY "Locations are publicly readable" ON public.locations
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Authenticated: public read OR superadmin
DROP POLICY IF EXISTS "Superadmins can manage locations" ON public.locations;
CREATE POLICY "Authenticated users can read locations" ON public.locations
  FOR SELECT
  TO authenticated
  USING ((is_active = true) OR (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin()));

CREATE POLICY "Superadmins can insert locations" ON public.locations
  FOR INSERT
  TO authenticated
  WITH CHECK (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());

CREATE POLICY "Superadmins can update locations" ON public.locations
  FOR UPDATE
  TO authenticated
  USING (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin())
  WITH CHECK (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());

CREATE POLICY "Superadmins can delete locations" ON public.locations
  FOR DELETE
  TO authenticated
  USING (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());


-- ============================================================================
-- ORGANIZERS
-- ============================================================================

-- Public read: anon only
DROP POLICY IF EXISTS "Organizers are publicly readable" ON public.organizers;
CREATE POLICY "Organizers are publicly readable" ON public.organizers
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Authenticated: public read OR superadmin
DROP POLICY IF EXISTS "Superadmins can manage organizers" ON public.organizers;
CREATE POLICY "Authenticated users can read organizers" ON public.organizers
  FOR SELECT
  TO authenticated
  USING ((is_active = true) OR (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin()));

DROP POLICY IF EXISTS "Organizers can update own profile" ON public.organizers;
CREATE POLICY "Organizers can update profiles" ON public.organizers
  FOR UPDATE
  TO authenticated
  USING (
    (((select auth.uid()) IS NOT NULL) AND (user_id = (select auth.uid())) AND (claim_verified = true))
    OR (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin())
  )
  WITH CHECK (
    ((user_id = (select auth.uid())) AND (claim_verified = true))
    OR (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin())
  );

CREATE POLICY "Superadmins can insert organizers" ON public.organizers
  FOR INSERT
  TO authenticated
  WITH CHECK (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());

CREATE POLICY "Superadmins can delete organizers" ON public.organizers
  FOR DELETE
  TO authenticated
  USING (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());


-- ============================================================================
-- SERIES
-- ============================================================================

-- Public read: anon only
DROP POLICY IF EXISTS "Published series are publicly readable" ON public.series;
CREATE POLICY "Published series are publicly readable" ON public.series
  FOR SELECT
  TO anon
  USING (status = 'published');

-- Authenticated: public read OR superadmin
DROP POLICY IF EXISTS "Superadmins can manage series" ON public.series;
CREATE POLICY "Authenticated users can read series" ON public.series
  FOR SELECT
  TO authenticated
  USING ((status = 'published') OR (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin()));

DROP POLICY IF EXISTS "Users can create draft series" ON public.series;
CREATE POLICY "Users can create series" ON public.series
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (((select auth.uid()) IS NOT NULL) AND (status = ANY (ARRAY['draft', 'pending_review'])))
    OR (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin())
  );

CREATE POLICY "Superadmins can update series" ON public.series
  FOR UPDATE
  TO authenticated
  USING (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin())
  WITH CHECK (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());

CREATE POLICY "Superadmins can delete series" ON public.series
  FOR DELETE
  TO authenticated
  USING (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());


-- ============================================================================
-- ORGANIZER CLAIM LOG
-- ============================================================================

-- Consolidate the three SELECT policies into one
DROP POLICY IF EXISTS "Users can view their own claim logs" ON public.organizer_claim_log;
DROP POLICY IF EXISTS "Superadmins can view all claim logs" ON public.organizer_claim_log;
DROP POLICY IF EXISTS "Superadmins can manage claim logs" ON public.organizer_claim_log;

CREATE POLICY "Users can view their own claim logs" ON public.organizer_claim_log
  FOR SELECT
  TO authenticated
  USING (
    ((select auth.uid()) = user_id) 
    OR (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin())
  );

CREATE POLICY "Superadmins can insert claim logs" ON public.organizer_claim_log
  FOR INSERT
  TO authenticated
  WITH CHECK (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());

CREATE POLICY "Superadmins can update claim logs" ON public.organizer_claim_log
  FOR UPDATE
  TO authenticated
  USING (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin())
  WITH CHECK (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());

CREATE POLICY "Superadmins can delete claim logs" ON public.organizer_claim_log
  FOR DELETE
  TO authenticated
  USING (((select auth.uid()) IS NOT NULL) AND is_current_user_superadmin());


-- ============================================================================
-- ORGANIZER USERS
-- ============================================================================

-- Consolidate the two SELECT policies into one
DROP POLICY IF EXISTS "Users can view own organizer links" ON public.organizer_users;
DROP POLICY IF EXISTS "Team members can view team" ON public.organizer_users;

CREATE POLICY "Users can view organizer links" ON public.organizer_users
  FOR SELECT
  TO authenticated
  USING (
    ((select auth.uid()) = user_id)
    OR EXISTS (
      SELECT 1
      FROM organizer_users ou
      WHERE ou.organizer_id = organizer_users.organizer_id
        AND ou.user_id = (select auth.uid())
        AND ou.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Users can request to claim organizer" ON public.organizer_users;
CREATE POLICY "Users can request to claim organizer" ON public.organizer_users
  FOR INSERT
  TO authenticated
  WITH CHECK (((select auth.uid()) = user_id) AND (status = 'pending'));


-- ============================================================================
-- USER FOLLOWS
-- ============================================================================

-- Consolidate the two policies (manage includes view)
DROP POLICY IF EXISTS "Users can view own follows" ON public.user_follows;
-- Keep "Users can manage own follows" as it covers SELECT, INSERT, UPDATE, DELETE


-- ============================================================================
-- 📝 NOTES
-- ============================================================================
--
-- Performance Optimization:
-- - Public read policies now only apply to anon (no overlap)
-- - Authenticated users have consolidated policies that combine:
--   - Public read access (for all authenticated users)
--   - Superadmin access (for superadmins)
-- - Multiple SELECT policies consolidated into single policies using OR logic
--
-- Security:
-- - Same access control as before
-- - Authenticated users can still read public data
-- - Superadmins can still access everything
-- - Better performance due to fewer policy evaluations
--
-- ============================================================================

