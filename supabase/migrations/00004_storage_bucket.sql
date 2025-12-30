-- ============================================================================
-- STORAGE BUCKET SETUP
-- ============================================================================
-- This migration creates the storage bucket for event images.
-- 
-- IMPORTANT: Run this in your Supabase Dashboard under Storage, not SQL Editor!
-- Storage buckets are created through the Supabase Dashboard or CLI.
--
-- This file documents the required setup for reference.
-- ============================================================================

-- ============================================================================
-- 1. CREATE THE STORAGE BUCKET
-- ============================================================================
-- Go to Supabase Dashboard > Storage > New Bucket
-- 
-- Settings:
--   Name: event-images
--   Public: Yes (so images can be displayed without auth)
--   File size limit: 5MB
--   Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
--
-- Or via Supabase CLI:
--   supabase storage create event-images --public

-- ============================================================================
-- 2. STORAGE POLICIES (RLS)
-- ============================================================================
-- These policies control who can read/write to the bucket.
-- Run these in the SQL Editor AFTER creating the bucket.

-- Allow public read access to all images
CREATE POLICY "Public read access for event images"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');

-- Allow authenticated/service role to upload images
-- (The API uses service role, so this allows uploads)
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
-- 3. ADD STORAGE URL FIELDS TO EVENTS TABLE
-- ============================================================================
-- Track which images are hosted vs external

-- Whether the image is hosted in our storage (vs external URL)
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_hosted BOOLEAN DEFAULT false;

-- The storage path (for deletion/management)
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_storage_path TEXT;

-- Same for thumbnail
ALTER TABLE events ADD COLUMN IF NOT EXISTS thumbnail_hosted BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS thumbnail_storage_path TEXT;

-- Same for flyer
ALTER TABLE events ADD COLUMN IF NOT EXISTS flyer_hosted BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS flyer_storage_path TEXT;

-- ============================================================================
-- 4. CREATE INDEX FOR FINDING EVENTS WITH EXTERNAL IMAGES
-- ============================================================================
-- Useful for batch re-hosting jobs

CREATE INDEX IF NOT EXISTS idx_events_external_images
ON events(created_at DESC)
WHERE image_url IS NOT NULL AND image_hosted = false;

-- ============================================================================
-- 5. CREATE VIEW FOR IMAGE STATUS
-- ============================================================================

CREATE OR REPLACE VIEW events_image_hosting_status AS
SELECT 
  id,
  title,
  slug,
  instance_date,
  source,
  -- Hero image
  image_url,
  image_hosted,
  image_storage_path,
  raw_image_url,
  -- Thumbnail
  thumbnail_url,
  thumbnail_hosted,
  thumbnail_storage_path,
  -- Flyer
  flyer_url,
  flyer_hosted,
  flyer_storage_path,
  -- Summary
  CASE 
    WHEN image_hosted THEN 'hosted'
    WHEN image_url IS NOT NULL THEN 'external'
    WHEN raw_image_url IS NOT NULL THEN 'invalid'
    ELSE 'none'
  END as image_status,
  created_at
FROM events
ORDER BY created_at DESC;

COMMENT ON VIEW events_image_hosting_status IS 'View showing image hosting status for all events';

-- ============================================================================
-- SETUP INSTRUCTIONS
-- ============================================================================
-- 
-- 1. Create the storage bucket in Supabase Dashboard:
--    - Go to Storage > New Bucket
--    - Name: event-images
--    - Check "Public bucket"
--    - Save
--
-- 2. Run the RLS policies above in SQL Editor
--
-- 3. Add SCRAPER_API_SECRET to your environment variables:
--    - In Vercel: Settings > Environment Variables
--    - Locally: Add to .env.local
--    - Example: SCRAPER_API_SECRET=your-secure-random-string
--
-- 4. Update your Chrome extension to use the image upload API:
--    POST /api/images/upload
--    Authorization: Bearer YOUR_SCRAPER_API_SECRET
--    Body: { eventId: "...", sourceUrl: "https://cdn.example.com/image.jpg" }
--
-- ============================================================================

