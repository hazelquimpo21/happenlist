-- ============================================================================
-- 🔒 FIX SECURITY DEFINER VIEWS
-- ============================================================================
-- Created: 2026-01-06
-- Purpose: Remove SECURITY DEFINER from views to ensure RLS policies are respected
--
-- Issue: Views created with SECURITY DEFINER run with creator's permissions,
--        which can bypass Row Level Security (RLS) policies.
--
-- Solution: Recreate views without SECURITY DEFINER. Since underlying tables
--           have RLS enabled, the views will still respect those policies.
-- ============================================================================

-- ============================================================================
-- events_pending_review VIEW
-- ============================================================================
-- Admin view for pending review queue
-- Note: RLS on events table will still apply since we're not using SECURITY DEFINER

DROP VIEW IF EXISTS public.events_pending_review;

CREATE VIEW public.events_pending_review AS
SELECT 
  e.id,
  e.title,
  e.slug,
  e.description,
  e.short_description,
  e.start_datetime,
  e.end_datetime,
  e.instance_date,
  e.on_sale_date,
  e.is_all_day,
  e.timezone,
  e.event_type,
  e.recurrence_parent_id,
  e.is_recurrence_template,
  e.recurrence_pattern,
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


-- ============================================================================
-- events_image_classification_status VIEW
-- ============================================================================
-- View for tracking image classification status across events

DROP VIEW IF EXISTS public.events_image_classification_status;

CREATE VIEW public.events_image_classification_status AS
SELECT 
  id,
  title,
  slug,
  instance_date,
  image_url,
  thumbnail_url,
  flyer_url,
  image_type,
  image_text_density,
  image_visual_score,
  flyer_detected,
  needs_thumbnail,
  thumbnail_source,
  image_ai_generated,
  CASE
    WHEN thumbnail_url IS NOT NULL AND image_type = 'thumbnail' THEN 'good'
    WHEN thumbnail_url IS NOT NULL THEN 'has_thumbnail'
    WHEN flyer_detected AND image_url IS NOT NULL THEN 'flyer_only'
    WHEN image_url IS NOT NULL THEN 'uncategorized'
    ELSE 'no_image'
  END AS image_status,
  created_at
FROM events
WHERE deleted_at IS NULL
ORDER BY created_at DESC;


-- ============================================================================
-- EXPLICITLY SET SECURITY INVOKER
-- ============================================================================
-- Views must be explicitly set to SECURITY INVOKER to respect RLS policies
-- This is required even after recreating the views

ALTER VIEW public.events_pending_review
SET (security_invoker = true);

ALTER VIEW public.events_image_classification_status
SET (security_invoker = true);


-- ============================================================================
-- 📝 NOTES
-- ============================================================================
--
-- These views now run with SECURITY INVOKER, meaning they use the
-- permissions of the querying user. RLS policies on the underlying tables
-- (events, categories, locations, organizers) will still be enforced.
--
-- For admin-only access, ensure your RLS policies on the events table check
-- for admin role via user_roles table or ADMIN_EMAILS env var.
--
-- ============================================================================

