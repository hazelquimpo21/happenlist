-- ============================================================================
-- MIGRATION: Partial Indexes for Browse Performance + Redundancy Cleanup
-- ============================================================================
-- Session: B6 (Phase 2 — Lifecycle + Past Events)
-- Date: 2026-04-13
--
-- Two goals:
--   1. Add a partial index covering the hot-path browse query pattern
--   2. Drop redundant indexes identified during the B6 index audit
--
-- The main getEvents() query filters on:
--   status = 'published', deleted_at IS NULL, parent_event_id IS NULL
-- and sorts by instance_date ASC. The new composite partial index covers
-- all three predicates so Postgres can do a tight index scan.
--
-- Note: CURRENT_DATE can't appear in a partial index WHERE clause (not
-- immutable). The temporal filter (instance_date >= today - 7d) is applied
-- at query time against this ordered index — still fast because the btree
-- ordering on instance_date supports range scans efficiently.
--
-- Index audit (48 indexes on events table as of 2026-04-13):
-- ============================================================================


-- ============================================================================
-- 1. NEW: Hot-path browse index
-- ============================================================================
-- Covers: getEvents() main feed, category feeds, search, organizer/venue pages
-- Leading on instance_date for ORDER BY; trailing id for row lookup.

CREATE INDEX IF NOT EXISTS idx_events_browse_active
  ON events (instance_date ASC, id)
  WHERE status = 'published'
    AND deleted_at IS NULL
    AND parent_event_id IS NULL;

COMMENT ON INDEX idx_events_browse_active IS
  'B6: hot-path browse index — covers the main feed WHERE predicates with instance_date ordering. Temporal filter applied at query time.';


-- ============================================================================
-- 2. DROP redundant indexes
-- ============================================================================

-- 2a. idx_events_series_id — bare (series_id) index.
-- Redundant with idx_events_series which covers (series_id) WHERE series_id IS NOT NULL.
-- All queries look up specific series IDs (never search for NULL series_id).
-- The partial index is smaller and sufficient.
DROP INDEX IF EXISTS idx_events_series_id;

-- 2b. idx_events_status_date — (status, instance_date) WHERE status = 'published'.
-- The leading status column is always 'published' due to the partial predicate,
-- making it wasted space. idx_events_published already covers
-- (instance_date, category_id) WHERE status = 'published' — same predicate,
-- better column choice (instance_date leads for ORDER BY).
DROP INDEX IF EXISTS idx_events_status_date;

-- 2c. idx_events_age_range — (age_low, age_high) WHERE deleted_at IS NULL.
-- age_high has data on 1% of events (3/238 per 2026-04-11 audit). The compound
-- index on a near-empty column adds no value. idx_events_age_low covers
-- (age_low) WHERE age_low IS NOT NULL AND deleted_at IS NULL — sufficient.
DROP INDEX IF EXISTS idx_events_age_range;


-- ============================================================================
-- DONE — net result: +1 index, -3 redundant = 46 total indexes on events
-- ============================================================================
