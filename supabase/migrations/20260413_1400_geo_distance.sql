-- =============================================================================
-- GEO DISTANCE FILTERING — Phase 2 Session B4
-- =============================================================================
-- Enables spatial distance queries against event locations using the
-- cube + earthdistance extensions (Postgres built-in, no PostGIS needed).
--
-- Creates:
--   1. cube + earthdistance extensions
--   2. events_within_radius(lat, lng, miles, max_results) — returns event IDs
--      with computed distance_miles, ordered by distance ASC
--   3. GiST index on locations(ll_to_earth(latitude, longitude)) for fast
--      spatial lookups
--
-- earthdistance returns meters; we convert to miles (/ 1609.344).
-- Locations with NULL coords are silently excluded.
--
-- Cross-file coupling:
--   - src/data/events/get-events.ts — calls events_within_radius RPC
--   - src/lib/constants/milwaukee-neighborhoods.ts — provides anchor coords
-- =============================================================================

-- Step 1: Enable extensions (cube must come first — earthdistance depends on it)
CREATE EXTENSION IF NOT EXISTS cube SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;

-- Step 2: GiST index for fast spatial lookups on locations
-- Only indexes rows with non-null coords. The ll_to_earth function converts
-- (lat, lng) to a cube-based earth point for the earthdistance operator.
CREATE INDEX IF NOT EXISTS idx_locations_geo
  ON locations USING gist (ll_to_earth(latitude::float8, longitude::float8))
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Step 3: Function to find events within a radius of a point
-- Returns event IDs + computed distance in miles, ordered by distance.
-- Joins events → locations to get coords. Skips events with NULL coords.
--
-- SECURITY DEFINER so it runs with the owner's permissions regardless of
-- RLS context. search_path locked to public for safety.
CREATE OR REPLACE FUNCTION events_within_radius(
  p_lat float8,
  p_lng float8,
  p_radius_miles float8 DEFAULT 5.0,
  p_limit int DEFAULT 200
)
RETURNS TABLE (
  event_id uuid,
  distance_miles float8
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.id AS event_id,
    (earth_distance(
      ll_to_earth(p_lat, p_lng),
      ll_to_earth(l.latitude::float8, l.longitude::float8)
    ) / 1609.344) AS distance_miles
  FROM events e
  JOIN locations l ON e.location_id = l.id
  WHERE l.latitude IS NOT NULL
    AND l.longitude IS NOT NULL
    AND e.status = 'published'
    AND e.deleted_at IS NULL
    AND e.instance_date >= CURRENT_DATE
    AND earth_distance(
      ll_to_earth(p_lat, p_lng),
      ll_to_earth(l.latitude::float8, l.longitude::float8)
    ) <= (p_radius_miles * 1609.344)
  ORDER BY distance_miles ASC
  LIMIT p_limit;
$$;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION events_within_radius(float8, float8, float8, int)
  TO anon, authenticated;

COMMENT ON FUNCTION events_within_radius IS
  'Phase 2 B4: Returns event IDs within p_radius_miles of (p_lat, p_lng), ordered by distance. Uses earthdistance extension.';
