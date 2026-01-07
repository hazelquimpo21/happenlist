-- ============================================================================
-- MIGRATION: Add Event Links Fields
-- ============================================================================
-- Created: 2026-01-06
-- Purpose: Add external link fields to events table for website, social media,
--          and registration links.
--
-- Fields Added:
--   • website_url      - Event's own website or landing page
--   • instagram_url    - Instagram profile or event page
--   • facebook_url     - Facebook event or page link
--   • registration_url - Registration form (separate from ticket purchase)
--
-- Note: ticket_url already exists in the events table
-- ============================================================================

-- 🔗 Add event website URL
-- Use case: Event has its own landing page separate from ticket link
ALTER TABLE events
ADD COLUMN IF NOT EXISTS website_url TEXT;

COMMENT ON COLUMN events.website_url IS 'URL to the event''s own website or landing page (separate from ticket link)';

-- 📸 Add Instagram URL
-- Use case: Link to event's Instagram or organizer's Instagram post about event
ALTER TABLE events
ADD COLUMN IF NOT EXISTS instagram_url TEXT;

COMMENT ON COLUMN events.instagram_url IS 'URL to Instagram profile or event-specific post';

-- 📘 Add Facebook URL  
-- Use case: Link to Facebook event page or organizer's Facebook
ALTER TABLE events
ADD COLUMN IF NOT EXISTS facebook_url TEXT;

COMMENT ON COLUMN events.facebook_url IS 'URL to Facebook event page or related post';

-- 📝 Add Registration URL
-- Use case: Free events that require RSVP, workshops needing sign-up
-- Note: Different from ticket_url - registration is typically free/RSVP
ALTER TABLE events
ADD COLUMN IF NOT EXISTS registration_url TEXT;

COMMENT ON COLUMN events.registration_url IS 'URL for event registration/RSVP (separate from paid tickets)';

-- ============================================================================
-- 📊 Add index for events with external links (for admin queries)
-- This helps quickly find events that have/don't have links populated
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_events_has_links ON events (
  (
    CASE WHEN website_url IS NOT NULL 
      OR instagram_url IS NOT NULL 
      OR facebook_url IS NOT NULL 
      OR registration_url IS NOT NULL 
      OR ticket_url IS NOT NULL 
    THEN true ELSE false END
  )
);

-- ============================================================================
-- ✅ VERIFICATION QUERY (run after migration to confirm)
-- ============================================================================
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'events'
--   AND column_name IN ('website_url', 'instagram_url', 'facebook_url', 'registration_url')
-- ORDER BY column_name;

-- ============================================================================
-- 🔄 UPDATE VIEWS (if you have views that need these columns)
-- ============================================================================
-- If you have any views like events_with_details that need updating,
-- you'll need to recreate them with the new columns.
-- Example:
-- 
-- CREATE OR REPLACE VIEW events_with_details AS
-- SELECT 
--   e.*,
--   c.name as category_name,
--   ... etc
-- FROM events e
-- LEFT JOIN categories c ON e.category_id = c.id
-- ... etc;

