-- Migration: Drop legacy columns and add source CHECK constraint
-- Date: 2026-02-11
--
-- 1. Drop 4 dead columns on events that are not used by any application code.
--    These were replaced by the series system or never implemented.
-- 2. Add CHECK constraint on events.source to match all other enum columns.
-- 3. Add CHECK constraint on locations.source for consistency.
-- 4. Set default for events.source to 'manual' (was already the app-level default).

-- ============================================================================
-- 0. DROP DEPENDENT VIEWS (they reference the columns we're about to remove)
-- ============================================================================

DROP VIEW IF EXISTS events_with_details;
DROP VIEW IF EXISTS events_pending_review;

-- ============================================================================
-- 1. DROP LEGACY COLUMNS
-- ============================================================================

-- event_type: Never implemented. Series.series_type serves this purpose.
ALTER TABLE events DROP COLUMN IF EXISTS event_type;

-- recurrence_parent_id: Replaced by the series system (series_type = 'recurring').
ALTER TABLE events DROP COLUMN IF EXISTS recurrence_parent_id;

-- is_recurrence_template: Replaced by the series system.
ALTER TABLE events DROP COLUMN IF EXISTS is_recurrence_template;

-- on_sale_date: Never implemented in the UI.
ALTER TABLE events DROP COLUMN IF EXISTS on_sale_date;

-- recurrence_pattern: JSON field superseded by series.recurrence_rule.
ALTER TABLE events DROP COLUMN IF EXISTS recurrence_pattern;

-- ============================================================================
-- 2. ADD CHECK CONSTRAINT ON events.source
-- ============================================================================

-- First, normalize any existing values that don't match the allowed set.
-- 'user_submission' is the canonical value for form submissions.
UPDATE events
SET source = 'manual'
WHERE source IS NULL OR source NOT IN ('manual', 'scraper', 'user_submission', 'api', 'import');

-- Set a non-null default so the constraint can be applied.
ALTER TABLE events ALTER COLUMN source SET DEFAULT 'manual';
ALTER TABLE events ALTER COLUMN source SET NOT NULL;

-- Add the CHECK constraint, matching the EventSource type in types.ts.
ALTER TABLE events ADD CONSTRAINT events_source_check
  CHECK (source IN ('manual', 'scraper', 'user_submission', 'api', 'import'));

-- ============================================================================
-- 3. ADD CHECK CONSTRAINT ON locations.source
-- ============================================================================

-- Normalize existing values.
UPDATE locations
SET source = 'manual'
WHERE source IS NULL OR source NOT IN ('manual', 'scraper', 'csv_import', 'user_submitted', 'api');

ALTER TABLE locations ALTER COLUMN source SET DEFAULT 'manual';
ALTER TABLE locations ALTER COLUMN source SET NOT NULL;

ALTER TABLE locations ADD CONSTRAINT locations_source_check
  CHECK (source IN ('manual', 'scraper', 'csv_import', 'user_submitted', 'api'));

-- ============================================================================
-- 4. RECREATE AFFECTED VIEWS (dropped in step 0)
-- ============================================================================

-- events_with_details: the main view for event queries
CREATE VIEW events_with_details
WITH (security_invoker = true)
AS
SELECT
  e.*,
  c.name AS category_name,
  c.slug AS category_slug,
  c.icon AS category_icon,
  l.name AS location_name,
  l.slug AS location_slug,
  l.city AS location_city,
  l.address_line AS location_address,
  l.venue_type AS location_venue_type,
  l.latitude AS location_latitude,
  l.longitude AS location_longitude,
  o.name AS organizer_name,
  o.slug AS organizer_slug,
  o.logo_url AS organizer_logo_url,
  s.title AS series_title,
  s.slug AS series_slug,
  s.series_type AS series_type
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN organizers o ON e.organizer_id = o.id
LEFT JOIN series s ON e.series_id = s.id
WHERE e.deleted_at IS NULL;

COMMENT ON VIEW events_with_details IS 'Events joined with category, location, organizer, and series. Excludes soft-deleted events.';

-- events_pending_review: admin review queue with full event details
-- (Rebuilt without dropped columns: event_type, recurrence_parent_id,
--  is_recurrence_template, on_sale_date, recurrence_pattern)
CREATE VIEW events_pending_review AS
SELECT
  e.id,
  e.title,
  e.slug,
  e.description,
  e.short_description,
  e.start_datetime,
  e.end_datetime,
  e.instance_date,
  e.is_all_day,
  e.timezone,
  e.series_id,
  e.location_id,
  e.organizer_id,
  e.category_id,
  e.price_type,
  e.price_low,
  e.price_high,
  e.price_details,
  e.is_free,
  e.ticket_url,
  e.image_url,
  e.flyer_url,
  e.thumbnail_url,
  e.meta_title,
  e.meta_description,
  e.heart_count,
  e.view_count,
  e.status,
  e.is_featured,
  e.featured_order,
  e.created_at,
  e.updated_at,
  e.published_at,
  e.source,
  e.source_url,
  e.source_id,
  e.scraped_at,
  e.scraped_data,
  e.reviewed_at,
  e.reviewed_by,
  e.review_notes,
  e.rejection_reason,
  e.raw_image_url,
  e.raw_thumbnail_url,
  e.image_validated,
  e.image_validated_at,
  e.image_validation_notes,
  e.image_hosted,
  e.image_storage_path,
  e.thumbnail_hosted,
  e.thumbnail_storage_path,
  e.flyer_hosted,
  e.flyer_storage_path,
  e.series_sequence,
  e.is_series_instance,
  e.submitted_by_email,
  e.submitted_by_name,
  e.submitted_at,
  e.change_request_message,
  e.deleted_at,
  e.deleted_by,
  e.delete_reason,
  e.last_edited_at,
  e.last_edited_by,
  e.edit_count,
  e.image_ai_generated,
  e.image_generation_cost,
  e.image_generation_prompt,
  e.image_generation_model,
  e.happenlist_summary,
  e.organizer_description,
  e.image_type,
  e.image_text_density,
  e.image_visual_score,
  e.image_classifications,
  e.thumbnail_source,
  e.flyer_detected,
  e.flyer_text_content,
  e.needs_thumbnail,
  c.name AS category_name,
  c.slug AS category_slug,
  c.icon AS category_icon,
  l.name AS location_name,
  l.slug AS location_slug,
  l.city AS location_city,
  l.address_line AS location_address,
  o.name AS organizer_name,
  o.slug AS organizer_slug,
  o.logo_url AS organizer_logo
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN organizers o ON e.organizer_id = o.id
WHERE e.status = 'pending_review' AND e.deleted_at IS NULL
ORDER BY e.submitted_at DESC NULLS LAST, e.created_at DESC;

ALTER VIEW events_pending_review SET (security_invoker = true);

COMMENT ON VIEW events_pending_review IS 'Events awaiting admin review, joined with category, location, and organizer. Excludes soft-deleted.';
