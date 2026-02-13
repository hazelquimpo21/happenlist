-- ============================================================================
-- VENUE SOCIAL LINKS & DESCRIPTION
-- ============================================================================
-- Adds social_links JSONB column to locations table for storing
-- social media profile URLs (Instagram, TikTok, Facebook, Twitter, YouTube).
-- Follows the same pattern as organizers.social_links.
--
-- Also ensures description field is available for venue descriptions
-- (column already exists, this migration just documents it).
-- ============================================================================

-- Add social_links JSONB column
-- Stores: { "instagram": "https://...", "tiktok": "https://...", ... }
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN locations.social_links IS 'Social media profile URLs as JSON. Keys: instagram, tiktok, facebook, twitter, youtube';
