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
-- STEP 0: DROP DEPENDENT VIEWS
-- ============================================================================
-- These views reference columns we're modifying (registration_required, is_free).
-- We'll recreate them at the end of the migration.

DROP VIEW IF EXISTS events_with_details;
DROP VIEW IF EXISTS series_with_details;
DROP VIEW IF EXISTS series_upcoming;
-- admin_event_stats doesn't reference modified columns, but drop for safety
DROP VIEW IF EXISTS admin_event_stats;


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
    'venue', 'outdoor', 'online', 'various', 'tbd',
    'entertainment', 'arts', 'sports', 'restaurant', 'community', 'education'
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
-- 6. RECREATE VIEWS
-- ============================================================================
-- Views were dropped in Step 0 because they depended on columns we modified.
-- Now recreate them with the updated column sets.

-- 6a. events_with_details
CREATE OR REPLACE VIEW events_with_details AS
SELECT
  e.*,
  c.name AS category_name,
  c.slug AS category_slug,
  c.icon AS category_icon,
  l.name AS location_name,
  l.slug AS location_slug,
  l.city AS location_city,
  l.address_line AS location_address,
  l.latitude AS location_lat,
  l.longitude AS location_lng,
  o.name AS organizer_name,
  o.slug AS organizer_slug,
  o.logo_url AS organizer_logo
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN organizers o ON e.organizer_id = o.id
WHERE e.status = 'published';

-- 6b. series_with_details
CREATE OR REPLACE VIEW series_with_details AS
SELECT
  s.*,
  c.name AS category_name,
  c.slug AS category_slug,
  c.icon AS category_icon,
  l.name AS location_name,
  l.slug AS location_slug,
  l.city AS location_city,
  o.name AS organizer_name,
  o.slug AS organizer_slug,
  o.logo_url AS organizer_logo,
  COUNT(ev.id) FILTER (
    WHERE ev.instance_date >= CURRENT_DATE AND ev.status = 'published'
  ) AS upcoming_event_count,
  MIN(ev.instance_date) FILTER (
    WHERE ev.instance_date >= CURRENT_DATE AND ev.status = 'published'
  ) AS next_event_date
FROM series s
LEFT JOIN categories c ON s.category_id = c.id
LEFT JOIN locations l ON s.location_id = l.id
LEFT JOIN organizers o ON s.organizer_id = o.id
LEFT JOIN events ev ON ev.series_id = s.id
GROUP BY s.id, c.name, c.slug, c.icon, l.name, l.slug, l.city,
         o.name, o.slug, o.logo_url;

-- 6c. series_upcoming (published series with future end dates)
CREATE OR REPLACE VIEW series_upcoming AS
SELECT s.*
FROM series s
WHERE s.status = 'published'
  AND (s.end_date IS NULL OR s.end_date >= CURRENT_DATE);

-- 6d. admin_event_stats (aggregated event counts for admin dashboard)
CREATE OR REPLACE VIEW admin_event_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'pending_review') AS pending_review_count,
  COUNT(*) FILTER (WHERE status = 'published') AS published_count,
  COUNT(*) FILTER (WHERE status = 'draft') AS draft_count,
  COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_count,
  COUNT(*) FILTER (WHERE source = 'scraper') AS scraped_count,
  COUNT(*) FILTER (WHERE source = 'scraper' AND status = 'pending_review') AS scraped_pending_count,
  COUNT(*) FILTER (WHERE source = 'scraper' AND created_at >= NOW() - INTERVAL '24 hours') AS scraped_last_24h,
  COUNT(*) FILTER (WHERE reviewed_at >= NOW() - INTERVAL '24 hours') AS reviewed_last_24h,
  COUNT(*) AS total_count
FROM events
WHERE deleted_at IS NULL;


-- ============================================================================
-- DONE
-- ============================================================================
-- After running this migration, the following code changes are also needed:
--   1. Remove is_free from all INSERT/UPDATE payloads (it's auto-generated)
--   2. Replace locations.category with locations.google_category in queries
--   3. Remove registration_required from series types and code
--   4. Update TypeScript types in src/lib/supabase/types.ts
--
-- NOTE: The code changes above have already been made in this same commit.
-- Run this migration BEFORE deploying the updated code.
-- ============================================================================
