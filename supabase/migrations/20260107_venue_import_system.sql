-- ============================================================================
-- VENUE IMPORT SYSTEM MIGRATION
-- ============================================================================
-- Adds fields to support bulk venue imports from Google Maps data.
-- Run this in Supabase Dashboard > SQL Editor
--
-- New fields:
--   • google_place_id   - Unique Google identifier for deduplication
--   • external_image_url - External image URL (Google Photos, etc.)
--   • rating            - Google rating (1-5 stars)
--   • review_count      - Number of Google reviews
--   • working_hours     - Business hours (JSONB)
--   • category          - Google category (more specific than venue_type)
--   • source            - Where this venue came from
--   • import_batch_id   - Links venues from same import
--
-- Usage:
--   1. Copy this entire file
--   2. Go to Supabase Dashboard > SQL Editor
--   3. Paste and run
-- ============================================================================

-- ============================================================================
-- STEP 1: ADD NEW COLUMNS TO LOCATIONS TABLE
-- ============================================================================

-- Google Place ID for deduplication
-- This is the unique identifier from Google Maps
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS google_place_id TEXT UNIQUE;

-- External image URL (Google Photos, etc.)
-- We store this separately from image_url (which is for Supabase-hosted images)
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS external_image_url TEXT;

-- Rating from Google (1.0 to 5.0)
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS rating DECIMAL(2, 1);

-- Number of reviews on Google
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Business hours as JSON
-- Format: {"Monday": "9AM-5PM", "Tuesday": "9AM-5PM", ...}
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS working_hours JSONB;

-- Google category (more specific than venue_type)
-- e.g., "Dog park", "Italian restaurant", "Music venue"
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS category TEXT;

-- Source of this venue record
-- Values: 'csv_import', 'user_submitted', 'manual', 'scraper'
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Import batch ID to group venues from same import
-- Useful for rolling back a bad import
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS import_batch_id TEXT;

-- ============================================================================
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for Google Place ID lookups (deduplication)
CREATE INDEX IF NOT EXISTS idx_locations_google_place_id
ON locations(google_place_id)
WHERE google_place_id IS NOT NULL;

-- Index for rating-based sorting (show best venues first)
CREATE INDEX IF NOT EXISTS idx_locations_rating
ON locations(rating DESC NULLS LAST)
WHERE is_active = true;

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_locations_category
ON locations(category)
WHERE category IS NOT NULL;

-- Index for source filtering (find all imported venues)
CREATE INDEX IF NOT EXISTS idx_locations_source
ON locations(source);

-- Full-text search index for venue names
-- This powers the fuzzy search in Step 4
CREATE INDEX IF NOT EXISTS idx_locations_name_search
ON locations USING gin(to_tsvector('english', name));

-- Trigram index for "fuzzy" name matching (requires pg_trgm extension)
-- This helps with typo-tolerant search like "pabts" → "Pabst Theater"
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_locations_name_trgm
ON locations USING gin(name gin_trgm_ops);

-- ============================================================================
-- STEP 3: CREATE VENUE SEARCH FUNCTION
-- ============================================================================
-- This function powers the smart venue search with fuzzy matching

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
  category TEXT,
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
    l.category,
    l.rating,
    l.review_count,
    l.latitude,
    l.longitude,
    -- Calculate similarity score (0-1, higher is better)
    GREATEST(
      similarity(l.name, search_query),
      similarity(COALESCE(l.address_line, ''), search_query)
    ) AS similarity_score
  FROM locations l
  WHERE
    l.is_active = true
    AND (
      -- Exact or fuzzy name match
      l.name ILIKE '%' || search_query || '%'
      OR similarity(l.name, search_query) > 0.2
      -- Full-text search
      OR to_tsvector('english', l.name) @@ plainto_tsquery('english', search_query)
      -- Address match
      OR l.address_line ILIKE '%' || search_query || '%'
    )
  ORDER BY
    -- Prioritize exact matches, then similarity, then rating
    CASE WHEN l.name ILIKE search_query THEN 0 ELSE 1 END,
    GREATEST(similarity(l.name, search_query), similarity(COALESCE(l.address_line, ''), search_query)) DESC,
    l.rating DESC NULLS LAST,
    l.review_count DESC NULLS LAST
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- STEP 4: GRANT PERMISSIONS
-- ============================================================================

-- Allow authenticated users to use the search function
GRANT EXECUTE ON FUNCTION search_venues TO authenticated;
GRANT EXECUTE ON FUNCTION search_venues TO anon;

-- ============================================================================
-- STEP 5: ADD HELPFUL COMMENTS
-- ============================================================================

COMMENT ON COLUMN locations.google_place_id IS 'Google Maps Place ID for deduplication';
COMMENT ON COLUMN locations.external_image_url IS 'External image URL (Google Photos) - not hosted on Supabase';
COMMENT ON COLUMN locations.rating IS 'Google Maps rating (1.0 to 5.0)';
COMMENT ON COLUMN locations.review_count IS 'Number of Google Maps reviews';
COMMENT ON COLUMN locations.working_hours IS 'Business hours as JSON {"Monday": "9AM-5PM", ...}';
COMMENT ON COLUMN locations.category IS 'Google category (e.g., "Music venue", "Restaurant")';
COMMENT ON COLUMN locations.source IS 'Origin of record: csv_import, user_submitted, manual, scraper';
COMMENT ON COLUMN locations.import_batch_id IS 'Groups venues from same import for rollback';

COMMENT ON FUNCTION search_venues IS 'Fuzzy venue search with similarity scoring';

-- ============================================================================
-- DONE!
-- ============================================================================
-- New columns added:
--   ✅ google_place_id (for deduplication)
--   ✅ external_image_url (Google Photos URLs)
--   ✅ rating (1-5 stars)
--   ✅ review_count
--   ✅ working_hours (JSON)
--   ✅ category (Google category)
--   ✅ source (where venue came from)
--   ✅ import_batch_id (for grouping imports)
--
-- Indexes created:
--   ✅ google_place_id lookup
--   ✅ rating sorting
--   ✅ category filtering
--   ✅ source filtering
--   ✅ full-text name search
--   ✅ fuzzy name search (trigram)
--
-- Functions created:
--   ✅ search_venues() - fuzzy search with similarity scoring
-- ============================================================================
