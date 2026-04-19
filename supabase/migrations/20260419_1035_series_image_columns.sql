-- =============================================================================
-- SERIES IMAGE COLUMNS
-- =============================================================================
-- Add the image metadata columns that series-image.js (scraper) expects to
-- write on promoteToSeries(). Without these, every UPDATE errored silently
-- and no series ever got an image, so series cards fell back to the gradient.
--
-- Mirrors the corresponding columns on events. See
-- happenlist_scraper/backend/services/series-image.js:131 (promoteToSeries).
-- =============================================================================

ALTER TABLE series
  ADD COLUMN IF NOT EXISTS image_visual_score integer,
  ADD COLUMN IF NOT EXISTS raw_image_url       text,
  ADD COLUMN IF NOT EXISTS flyer_url           text,
  ADD COLUMN IF NOT EXISTS flyer_storage_path  text,
  ADD COLUMN IF NOT EXISTS flyer_hosted        boolean DEFAULT false;
