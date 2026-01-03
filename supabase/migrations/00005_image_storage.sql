-- ============================================================================
-- IMAGE STORAGE MIGRATION
-- ============================================================================
-- This migration adds fields for tracking hosted images in Supabase Storage
-- and creates the storage bucket policies.
--
-- IMPORTANT: Create the storage bucket in Supabase Dashboard FIRST:
--   1. Go to Storage > New Bucket
--   2. Name: event-images
--   3. Check "Public bucket"
--   4. Save
--
-- Then run this migration to add the database fields and policies.
-- ============================================================================

-- ============================================================================
-- 1. ADD IMAGE HOSTING FIELDS TO EVENTS
-- ============================================================================

-- Whether the hero image is hosted in our Supabase Storage
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_hosted BOOLEAN DEFAULT false;

-- Storage path for the hero image (for management/deletion)
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_storage_path TEXT;

-- Whether the thumbnail is hosted in our storage
ALTER TABLE events ADD COLUMN IF NOT EXISTS thumbnail_hosted BOOLEAN DEFAULT false;

-- Storage path for thumbnail
ALTER TABLE events ADD COLUMN IF NOT EXISTS thumbnail_storage_path TEXT;

-- Whether the flyer is hosted in our storage
ALTER TABLE events ADD COLUMN IF NOT EXISTS flyer_hosted BOOLEAN DEFAULT false;

-- Storage path for flyer
ALTER TABLE events ADD COLUMN IF NOT EXISTS flyer_storage_path TEXT;

-- ============================================================================
-- 2. CREATE INDEX FOR FINDING EVENTS WITH EXTERNAL IMAGES
-- ============================================================================
-- Useful for batch re-hosting jobs

CREATE INDEX IF NOT EXISTS idx_events_external_images
ON events(created_at DESC)
WHERE image_url IS NOT NULL AND image_hosted = false;

-- ============================================================================
-- 3. STORAGE BUCKET POLICIES (RLS)
-- ============================================================================
-- These policies control access to the event-images bucket.
-- Run these AFTER creating the bucket in the Supabase Dashboard.

-- Allow public read access to all images
CREATE POLICY "Public read access for event images"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');

-- Allow service role to upload images
CREATE POLICY "Service role can upload event images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-images');

-- Allow service role to update images
CREATE POLICY "Service role can update event images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'event-images');

-- Allow service role to delete images
CREATE POLICY "Service role can delete event images"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-images');

-- ============================================================================
-- 4. CREATE VIEW FOR IMAGE HOSTING STATUS
-- ============================================================================

CREATE OR REPLACE VIEW events_image_hosting_status AS
SELECT 
  id,
  title,
  slug,
  instance_date,
  source,
  source_url,
  status,
  -- Hero image
  image_url,
  image_hosted,
  image_storage_path,
  raw_image_url,
  image_validated,
  -- Thumbnail
  thumbnail_url,
  thumbnail_hosted,
  thumbnail_storage_path,
  raw_thumbnail_url,
  -- Flyer
  flyer_url,
  flyer_hosted,
  flyer_storage_path,
  -- Summary
  CASE 
    WHEN image_hosted THEN 'hosted'
    WHEN image_url IS NOT NULL AND image_validated THEN 'external_valid'
    WHEN image_url IS NOT NULL THEN 'external_unvalidated'
    WHEN raw_image_url IS NOT NULL THEN 'invalid'
    ELSE 'none'
  END as image_status,
  created_at
FROM events
ORDER BY created_at DESC;

COMMENT ON VIEW events_image_hosting_status IS 'View showing image hosting status for all events';

-- ============================================================================
-- 5. CREATE FUNCTION TO RE-HOST AN IMAGE
-- ============================================================================
-- This function updates an event after an image has been re-hosted.
-- Called by the API after successfully uploading to storage.

CREATE OR REPLACE FUNCTION update_event_hosted_image(
  p_event_id UUID,
  p_image_type TEXT,           -- 'hero', 'thumbnail', or 'flyer'
  p_hosted_url TEXT,           -- The new Supabase Storage URL
  p_storage_path TEXT,         -- The storage path for management
  p_raw_url TEXT DEFAULT NULL  -- Original URL (for reference)
)
RETURNS VOID AS $$
BEGIN
  IF p_image_type = 'hero' THEN
    UPDATE events
    SET 
      image_url = p_hosted_url,
      image_hosted = true,
      image_storage_path = p_storage_path,
      raw_image_url = COALESCE(p_raw_url, raw_image_url),
      image_validated = true,
      image_validated_at = now()
    WHERE id = p_event_id;
    
  ELSIF p_image_type = 'thumbnail' THEN
    UPDATE events
    SET 
      thumbnail_url = p_hosted_url,
      thumbnail_hosted = true,
      thumbnail_storage_path = p_storage_path,
      raw_thumbnail_url = COALESCE(p_raw_url, raw_thumbnail_url)
    WHERE id = p_event_id;
    
  ELSIF p_image_type = 'flyer' THEN
    UPDATE events
    SET 
      flyer_url = p_hosted_url,
      flyer_hosted = true,
      flyer_storage_path = p_storage_path
    WHERE id = p_event_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_event_hosted_image IS 'Updates event with hosted image URL after upload to storage';

-- ============================================================================
-- DONE!
-- ============================================================================
--
-- New fields:
--   - image_hosted          : Whether hero image is in Supabase Storage
--   - image_storage_path    : Storage path for hero image
--   - thumbnail_hosted      : Whether thumbnail is in storage
--   - thumbnail_storage_path: Storage path for thumbnail
--   - flyer_hosted          : Whether flyer is in storage
--   - flyer_storage_path    : Storage path for flyer
--
-- Setup checklist:
--   1. Create 'event-images' bucket in Supabase Dashboard (public bucket)
--   2. Run this migration
--   3. Set SCRAPER_API_SECRET in environment variables
--   4. Chrome extension will automatically upload images after saving events
--
-- ============================================================================

