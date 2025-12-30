-- ============================================================================
-- IMAGE URL TRACKING MIGRATION
-- ============================================================================
-- This migration adds fields to track raw scraped image URLs separately from
-- validated image URLs. This helps with debugging and allows the app to
-- gracefully handle invalid image URLs from scraped sources.
-- ============================================================================

-- ============================================================================
-- 1. ADD RAW IMAGE URL FIELDS TO EVENTS
-- ============================================================================
-- These store the original scraped URLs before validation

-- Raw image URL as scraped (may be a page URL, not an actual image)
ALTER TABLE events ADD COLUMN IF NOT EXISTS raw_image_url TEXT;

-- Raw thumbnail URL as scraped
ALTER TABLE events ADD COLUMN IF NOT EXISTS raw_thumbnail_url TEXT;

-- Whether the image URL has been validated as an actual image
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_validated BOOLEAN DEFAULT false;

-- When the image was last validated
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_validated_at TIMESTAMPTZ;

-- Notes about image validation issues (for debugging)
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_validation_notes TEXT;

-- ============================================================================
-- 2. MIGRATE EXISTING DATA
-- ============================================================================
-- Copy existing image URLs to raw fields for scraped events

UPDATE events
SET 
  raw_image_url = image_url,
  raw_thumbnail_url = thumbnail_url
WHERE source != 'manual' 
  AND raw_image_url IS NULL;

-- ============================================================================
-- 3. CREATE VIEW FOR EVENTS WITH IMAGE STATUS
-- ============================================================================

CREATE OR REPLACE VIEW events_image_status AS
SELECT 
  id,
  title,
  slug,
  instance_date,
  image_url,
  raw_image_url,
  thumbnail_url,
  raw_thumbnail_url,
  image_validated,
  image_validated_at,
  image_validation_notes,
  source,
  source_url,
  status,
  CASE 
    WHEN image_url IS NULL AND raw_image_url IS NOT NULL THEN 'invalid_url'
    WHEN image_url IS NOT NULL AND image_validated THEN 'validated'
    WHEN image_url IS NOT NULL THEN 'unvalidated'
    ELSE 'no_image'
  END as image_status
FROM events
ORDER BY created_at DESC;

COMMENT ON VIEW events_image_status IS 'Events with image validation status for admin review';

-- ============================================================================
-- 4. CREATE FUNCTION TO VALIDATE IMAGE URLS
-- ============================================================================
-- This function can be called to mark an image as validated or invalid

CREATE OR REPLACE FUNCTION validate_event_image(
  p_event_id UUID,
  p_is_valid BOOLEAN,
  p_validated_image_url TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE events
  SET 
    image_validated = p_is_valid,
    image_validated_at = now(),
    image_validation_notes = p_notes,
    -- If valid URL provided, update the image_url
    image_url = COALESCE(p_validated_image_url, image_url),
    -- If invalid, clear the image_url but keep raw for reference
    image_url = CASE WHEN p_is_valid THEN COALESCE(p_validated_image_url, image_url) ELSE NULL END
  WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_event_image IS 'Marks an event image as validated or invalid';

-- ============================================================================
-- 5. ADD INDEX FOR FINDING EVENTS WITH UNVALIDATED IMAGES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_events_unvalidated_images 
  ON events(created_at DESC)
  WHERE raw_image_url IS NOT NULL 
    AND image_validated = false;

-- ============================================================================
-- DONE!
-- ============================================================================
--
-- New fields:
--   - raw_image_url        : Original scraped image URL (may be invalid)
--   - raw_thumbnail_url    : Original scraped thumbnail URL (may be invalid)
--   - image_validated      : Whether the image URL has been verified
--   - image_validated_at   : When validation occurred
--   - image_validation_notes: Debug notes about validation issues
--
-- The application should:
--   1. Store raw URLs in raw_image_url when scraping
--   2. Only set image_url if the URL is a valid image URL
--   3. Use the isValidImageUrl() utility to check before display
--
-- ============================================================================

