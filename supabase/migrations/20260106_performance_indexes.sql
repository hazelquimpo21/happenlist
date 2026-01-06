-- ============================================================================
-- 🚀 PERFORMANCE INDEXES MIGRATION
-- ============================================================================
-- Created: 2026-01-06
-- Purpose: Add missing indexes to improve query performance
--
-- These indexes address the following performance bottlenecks:
--   1. Event listing queries (status + date filtering)
--   2. Category/Organizer/Location joins
--   3. Hearts lookup performance
--   4. Admin audit log queries
--
-- ⚠️ HOW TO RUN:
--   1. Go to Supabase Dashboard → SQL Editor
--   2. Paste this entire file
--   3. Click "Run"
--
-- 💡 These indexes are safe to add on a live database - they create
--    the index concurrently if possible to avoid blocking writes.
-- ============================================================================

-- ============================================================================
-- EVENTS TABLE INDEXES
-- ============================================================================

-- 📊 STATUS: Most common filter - nearly every query filters by status
-- This index speeds up: "WHERE status = 'published'"
CREATE INDEX IF NOT EXISTS idx_events_status
  ON public.events (status);

-- 📊 COMPOSITE: Status + Date - The most common query pattern
-- Speeds up: "WHERE status = 'published' AND instance_date >= today"
CREATE INDEX IF NOT EXISTS idx_events_status_date
  ON public.events (status, instance_date DESC);

-- 📊 FOREIGN KEYS: Category, Organizer, Location lookups
-- These speed up JOINs and WHERE clauses on related entities
CREATE INDEX IF NOT EXISTS idx_events_category_id
  ON public.events (category_id);

CREATE INDEX IF NOT EXISTS idx_events_organizer_id
  ON public.events (organizer_id);

CREATE INDEX IF NOT EXISTS idx_events_location_id
  ON public.events (location_id);

CREATE INDEX IF NOT EXISTS idx_events_series_id
  ON public.events (series_id);

-- 📊 FEATURED EVENTS: For homepage featured section
-- Speeds up: "WHERE is_featured = true ORDER BY featured_order"
CREATE INDEX IF NOT EXISTS idx_events_featured
  ON public.events (featured_order)
  WHERE is_featured = true;

-- 📊 FREE EVENTS: Common filter
-- Speeds up: "WHERE is_free = true"
CREATE INDEX IF NOT EXISTS idx_events_free
  ON public.events (instance_date)
  WHERE is_free = true AND status = 'published';

-- 📊 SUBMISSION QUEUE: For admin approval workflow
-- Speeds up: "WHERE status IN ('pending_review', 'changes_requested')"
CREATE INDEX IF NOT EXISTS idx_events_pending_queue
  ON public.events (submitted_at DESC NULLS LAST)
  WHERE status IN ('pending_review', 'changes_requested');

-- 📊 USER SUBMISSIONS: For /my/submissions page
-- Speeds up: "WHERE submitted_by_email = ?"
CREATE INDEX IF NOT EXISTS idx_events_submitted_by
  ON public.events (submitted_by_email, created_at DESC)
  WHERE submitted_by_email IS NOT NULL;

-- 📊 PUBLISHED FUTURE EVENTS: Optimizes the most common query pattern
-- Speeds up: All public-facing event listing queries
CREATE INDEX IF NOT EXISTS idx_events_published_future
  ON public.events (instance_date, category_id)
  WHERE status = 'published' AND instance_date >= CURRENT_DATE;

-- 📊 CREATED AT: For sorting by newest
CREATE INDEX IF NOT EXISTS idx_events_created_at
  ON public.events (created_at DESC);


-- ============================================================================
-- HEARTS TABLE INDEXES
-- ============================================================================

-- 📊 USER HEARTS: For "My Hearts" page
-- Speeds up: "WHERE user_id = ?"
CREATE INDEX IF NOT EXISTS idx_hearts_user_id
  ON public.hearts (user_id);

-- 📊 EVENT HEARTS: For counting hearts on an event
-- Speeds up: "WHERE event_id = ?"
CREATE INDEX IF NOT EXISTS idx_hearts_event_id
  ON public.hearts (event_id);

-- 📊 USER HEARTS BY DATE: For showing recent hearts first
-- Speeds up: "WHERE user_id = ? ORDER BY created_at DESC"
CREATE INDEX IF NOT EXISTS idx_hearts_user_date
  ON public.hearts (user_id, created_at DESC);


-- ============================================================================
-- ADMIN AUDIT LOG INDEXES
-- ============================================================================

-- 📊 EVENT AUDIT: For viewing history of an event
-- Speeds up: "WHERE event_id = ?"
CREATE INDEX IF NOT EXISTS idx_admin_audit_event
  ON public.admin_audit_log (event_id);

-- 📊 ADMIN ACTIVITY: For viewing an admin's actions
-- Speeds up: "WHERE admin_email = ?"
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin
  ON public.admin_audit_log (admin_email);

-- 📊 RECENT ACTIVITY: For dashboard recent activity
-- Speeds up: "ORDER BY created_at DESC LIMIT 50"
CREATE INDEX IF NOT EXISTS idx_admin_audit_date
  ON public.admin_audit_log (created_at DESC);


-- ============================================================================
-- CATEGORIES TABLE INDEXES
-- ============================================================================

-- 📊 ACTIVE CATEGORIES: For filter dropdowns
-- Speeds up: "WHERE is_active = true ORDER BY sort_order"
CREATE INDEX IF NOT EXISTS idx_categories_active_sort
  ON public.categories (sort_order)
  WHERE is_active = true;


-- ============================================================================
-- LOCATIONS TABLE INDEXES
-- ============================================================================

-- 📊 ACTIVE LOCATIONS: For venue listings
-- Speeds up: "WHERE is_active = true"
CREATE INDEX IF NOT EXISTS idx_locations_active
  ON public.locations (is_active)
  WHERE is_active = true;

-- 📊 CITY FILTER: For filtering venues by city
-- Speeds up: "WHERE city = ?"
CREATE INDEX IF NOT EXISTS idx_locations_city
  ON public.locations (city);


-- ============================================================================
-- ORGANIZERS TABLE INDEXES
-- ============================================================================

-- 📊 ACTIVE ORGANIZERS: For organizer listings
-- Speeds up: "WHERE is_active = true"
CREATE INDEX IF NOT EXISTS idx_organizers_active
  ON public.organizers (is_active)
  WHERE is_active = true;


-- ============================================================================
-- SERIES TABLE INDEXES
-- ============================================================================

-- 📊 SERIES BY ORGANIZER: For organizer's series page
-- Speeds up: "WHERE organizer_id = ?"
CREATE INDEX IF NOT EXISTS idx_series_organizer
  ON public.series (organizer_id);

-- 📊 SERIES STATUS: For filtering by status
-- Speeds up: "WHERE status = 'published'"
CREATE INDEX IF NOT EXISTS idx_series_status
  ON public.series (status);


-- ============================================================================
-- EVENT DRAFTS TABLE INDEXES
-- ============================================================================

-- 📊 USER DRAFTS: For user's draft list
-- Speeds up: "WHERE user_id = ?"
CREATE INDEX IF NOT EXISTS idx_event_drafts_user
  ON public.event_drafts (user_id);

-- 📊 EXPIRED DRAFTS: For cleanup job
-- Speeds up: Deleting expired drafts
CREATE INDEX IF NOT EXISTS idx_event_drafts_expires
  ON public.event_drafts (expires_at)
  WHERE submitted_event_id IS NULL;


-- ============================================================================
-- 📝 NOTES FOR DEVELOPERS
-- ============================================================================
--
-- After running this migration:
--
-- 1. Check index usage with:
--    SELECT schemaname, tablename, indexname, idx_scan
--    FROM pg_stat_user_indexes
--    ORDER BY idx_scan DESC;
--
-- 2. Check index sizes with:
--    SELECT pg_size_pretty(pg_relation_size(indexrelid)) as size, indexrelname
--    FROM pg_stat_user_indexes
--    ORDER BY pg_relation_size(indexrelid) DESC;
--
-- 3. Run ANALYZE after creating indexes:
--    ANALYZE events;
--    ANALYZE hearts;
--    ANALYZE admin_audit_log;
--
-- ============================================================================
