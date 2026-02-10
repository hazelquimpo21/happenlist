-- ============================================================================
-- MIGRATION: Schema Cleanup & Hardening
-- ============================================================================
-- Date: 2026-02-10
-- Description: Five targeted improvements to the database schema:
--
--   1. DROP registration_required from series (superseded by attendance_mode)
--   2. RENAME locations.category → google_category (avoid naming collision)
--   3. ADD CHECK constraints on all enum TEXT columns
--   4. CONVERT is_free to a generated column (auto-derived from price_type)
--   5. UPDATE search_venues function for the column rename
--
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================================


-- ============================================================================
-- 1. DROP registration_required FROM SERIES
-- ============================================================================
-- The attendance_mode column ('registered' | 'drop_in' | 'hybrid') fully
-- supersedes the old boolean. Keeping both causes confusion.

ALTER TABLE series DROP COLUMN IF EXISTS registration_required;


-- ============================================================================
-- 2. RENAME locations.category → google_category
-- ============================================================================
-- The "category" column on locations holds a Google Maps category string
-- (e.g., "Music venue", "Restaurant"). This collides with the categories
-- table name and confuses CSV exports. Renaming to google_category.

ALTER TABLE locations RENAME COLUMN category TO google_category;

-- Update the index (drop old, create new)
DROP INDEX IF EXISTS idx_locations_category;
CREATE INDEX IF NOT EXISTS idx_locations_google_category
  ON locations(google_category)
  WHERE google_category IS NOT NULL;

COMMENT ON COLUMN locations.google_category IS 'Google Maps category (e.g., "Music venue", "Restaurant"). NOT related to the categories table.';


-- ============================================================================
-- 3. ADD CHECK CONSTRAINTS ON ENUM COLUMNS
-- ============================================================================
-- These prevent invalid values from being inserted via direct SQL or bugs.
-- Only added where constraints don't already exist.

-- events.status
ALTER TABLE events ADD CONSTRAINT events_status_check
  CHECK (status IN (
    'draft', 'pending_review', 'changes_requested',
    'published', 'rejected', 'cancelled', 'postponed'
  ));

-- events.price_type
ALTER TABLE events ADD CONSTRAINT events_price_type_check
  CHECK (price_type IN (
    'free', 'fixed', 'range', 'varies', 'donation', 'per_session'
  ));

-- series.series_type
ALTER TABLE series ADD CONSTRAINT series_series_type_check
  CHECK (series_type IN (
    'class', 'camp', 'workshop', 'recurring', 'festival', 'season'
  ));

-- series.status
ALTER TABLE series ADD CONSTRAINT series_status_check
  CHECK (status IN (
    'draft', 'pending_review', 'changes_requested',
    'published', 'rejected', 'cancelled', 'postponed'
  ));

-- series.price_type
ALTER TABLE series ADD CONSTRAINT series_price_type_check
  CHECK (price_type IN (
    'free', 'fixed', 'range', 'varies', 'donation', 'per_session'
  ));

-- locations.venue_type
ALTER TABLE locations ADD CONSTRAINT locations_venue_type_check
  CHECK (venue_type IN (
    'venue', 'outdoor', 'online', 'various', 'tbd'
  ));


-- ============================================================================
-- 4. CONVERT is_free TO GENERATED COLUMN
-- ============================================================================
-- is_free should always equal (price_type = 'free'). Making it a generated
-- column guarantees they can never drift out of sync.
--
-- PostgreSQL doesn't allow ALTER COLUMN to add GENERATED, so we drop and
-- re-add. Data is not lost — it's recomputed from price_type.

-- 4a. Events table
DROP INDEX IF EXISTS idx_events_free;

ALTER TABLE events DROP COLUMN IF EXISTS is_free;
ALTER TABLE events ADD COLUMN is_free BOOLEAN
  GENERATED ALWAYS AS (price_type = 'free') STORED;

COMMENT ON COLUMN events.is_free IS 'Auto-computed: true when price_type = ''free''. Generated column — do not set manually.';

-- Recreate the index
CREATE INDEX IF NOT EXISTS idx_events_free
  ON events (instance_date, status)
  WHERE is_free = true;

-- 4b. Series table
ALTER TABLE series DROP COLUMN IF EXISTS is_free;
ALTER TABLE series ADD COLUMN is_free BOOLEAN
  GENERATED ALWAYS AS (price_type = 'free') STORED;

COMMENT ON COLUMN series.is_free IS 'Auto-computed: true when price_type = ''free''. Generated column — do not set manually.';


-- ============================================================================
-- 5. UPDATE search_venues FUNCTION
-- ============================================================================
-- The function references locations.category which was renamed.

CREATE OR REPLACE FUNCTION search_venues(
  search_query TEXT,
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address_line TEXT,
  city TEXT,
  state TEXT,
  venue_type TEXT,
  google_category TEXT,
  rating DECIMAL(2, 1),
  review_count INTEGER,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.name,
    l.address_line,
    l.city,
    l.state,
    l.venue_type,
    l.google_category,
    l.rating,
    l.review_count,
    l.latitude,
    l.longitude,
    GREATEST(
      similarity(l.name, search_query),
      similarity(COALESCE(l.address_line, ''), search_query)
    ) AS similarity_score
  FROM locations l
  WHERE
    l.is_active = true
    AND (
      l.name ILIKE '%' || search_query || '%'
      OR similarity(l.name, search_query) > 0.2
      OR to_tsvector('english', l.name) @@ plainto_tsquery('english', search_query)
      OR l.address_line ILIKE '%' || search_query || '%'
    )
  ORDER BY
    CASE WHEN l.name ILIKE search_query THEN 0 ELSE 1 END,
    GREATEST(similarity(l.name, search_query), similarity(COALESCE(l.address_line, ''), search_query)) DESC,
    l.rating DESC NULLS LAST,
    l.review_count DESC NULLS LAST
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION search_venues TO authenticated;
GRANT EXECUTE ON FUNCTION search_venues TO anon;


-- ============================================================================
-- DONE
-- ============================================================================
-- After running this migration, the following code changes are also needed:
--   1. Remove is_free from all INSERT/UPDATE payloads (it's auto-generated)
--   2. Replace locations.category with locations.google_category in queries
--   3. Remove registration_required from series types and code
--   4. Update TypeScript types in src/lib/supabase/types.ts
-- ============================================================================
