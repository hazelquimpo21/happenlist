-- Migration 00012: Similar Events scoring function
-- Used by the detail page "Events Like This" section

BEGIN;

CREATE OR REPLACE FUNCTION get_similar_events(
  p_event_id UUID,
  p_category_id UUID,
  p_vibe_tags TEXT[],
  p_subcultures TEXT[],
  p_energy SMALLINT,
  p_formality SMALLINT,
  p_crowdedness SMALLINT,
  p_access_type TEXT,
  p_limit INT DEFAULT 6
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  start_datetime TIMESTAMPTZ,
  instance_date DATE,
  image_url TEXT,
  thumbnail_url TEXT,
  price_type TEXT,
  price_low NUMERIC,
  price_high NUMERIC,
  is_free BOOLEAN,
  heart_count INT,
  short_description TEXT,
  tagline TEXT,
  talent_name TEXT,
  access_type TEXT,
  noise_level TEXT,
  vibe_tags TEXT[],
  organizer_name TEXT,
  organizer_is_venue BOOLEAN,
  age_restriction TEXT,
  is_family_friendly BOOLEAN,
  category JSONB,
  location JSONB,
  similarity_score INT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    e.id, e.title, e.slug, e.start_datetime, e.instance_date,
    e.image_url, e.thumbnail_url, e.price_type, e.price_low, e.price_high,
    e.is_free, e.heart_count,
    e.short_description, e.tagline, e.talent_name,
    e.access_type, e.noise_level, e.vibe_tags,
    e.organizer_name, e.organizer_is_venue,
    e.age_restriction, e.is_family_friendly,
    CASE WHEN c.id IS NOT NULL
      THEN jsonb_build_object('name', c.name, 'slug', c.slug)
      ELSE NULL
    END AS category,
    CASE WHEN l.id IS NOT NULL
      THEN jsonb_build_object('name', l.name, 'slug', l.slug)
      ELSE NULL
    END AS location,
    (
      -- Vibe tag overlap (most important, weight 3)
      COALESCE((SELECT COUNT(*)::INT FROM unnest(e.vibe_tags) t WHERE t = ANY(p_vibe_tags)), 0) * 3 +
      -- Subculture overlap (weight 2)
      COALESCE((SELECT COUNT(*)::INT FROM unnest(e.subcultures) t WHERE t = ANY(p_subcultures)), 0) * 2 +
      -- Energy proximity
      GREATEST(0, 5 - ABS(COALESCE(e.energy_level, 3) - p_energy)) +
      -- Formality proximity
      GREATEST(0, 5 - ABS(COALESCE(e.formality, 3) - p_formality)) +
      -- Crowdedness proximity
      GREATEST(0, 5 - ABS(COALESCE(e.crowdedness, 3) - p_crowdedness)) +
      -- Same category bonus
      CASE WHEN e.category_id = p_category_id THEN 3 ELSE 0 END +
      -- Same access type bonus
      CASE WHEN e.access_type = p_access_type THEN 1 ELSE 0 END
    )::INT AS similarity_score
  FROM events e
  LEFT JOIN categories c ON c.id = e.category_id
  LEFT JOIN locations l ON l.id = e.location_id
  WHERE e.id != p_event_id
    AND e.status = 'published'
    AND e.deleted_at IS NULL
    AND e.instance_date >= CURRENT_DATE
  ORDER BY similarity_score DESC, e.instance_date ASC
  LIMIT p_limit;
$$;

COMMIT;
