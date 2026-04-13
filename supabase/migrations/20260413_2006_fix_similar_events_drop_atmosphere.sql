-- Remove p_formality and p_crowdedness params from get_similar_events
-- These atmosphere columns were dropped from the events table.
-- The app code never passed these params, so this aligns the DB function signature.

DROP FUNCTION IF EXISTS public.get_similar_events(uuid, uuid, text[], text[], smallint, smallint, smallint, text, integer);

CREATE OR REPLACE FUNCTION public.get_similar_events(
  p_event_id uuid,
  p_category_id uuid,
  p_vibe_tags text[],
  p_subcultures text[],
  p_energy smallint,
  p_access_type text,
  p_limit integer DEFAULT 6
)
RETURNS TABLE(
  id uuid, title text, slug text, start_datetime timestamptz, instance_date date,
  image_url text, thumbnail_url text, price_type text, price_low numeric, price_high numeric,
  is_free boolean, heart_count integer, short_description text, tagline text, talent_name text,
  access_type text, noise_level text, vibe_tags text[], organizer_name text, organizer_is_venue boolean,
  age_restriction text, is_family_friendly boolean, category jsonb, location jsonb, similarity_score integer
)
LANGUAGE sql STABLE
AS $function$
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
      COALESCE((SELECT COUNT(*)::INT FROM unnest(e.vibe_tags) t WHERE t = ANY(p_vibe_tags)), 0) * 3 +
      COALESCE((SELECT COUNT(*)::INT FROM unnest(e.subcultures) t WHERE t = ANY(p_subcultures)), 0) * 2 +
      GREATEST(0, 5 - ABS(COALESCE(e.energy_level, 3) - p_energy)) +
      CASE WHEN e.category_id = p_category_id THEN 3 ELSE 0 END +
      CASE WHEN e.access_type = p_access_type THEN 1 ELSE 0 END
    )::INT AS similarity_score
  FROM events e
  LEFT JOIN categories c ON c.id = e.category_id
  LEFT JOIN locations l ON l.id = e.location_id
  WHERE e.id != p_event_id
    AND e.status = 'published'
    AND e.deleted_at IS NULL
    AND e.instance_date >= CURRENT_DATE
    AND e.parent_event_id IS NULL
  ORDER BY similarity_score DESC, e.instance_date ASC
  LIMIT p_limit;
$function$;
