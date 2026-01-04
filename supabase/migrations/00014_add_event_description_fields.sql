-- ============================================================================
-- MIGRATION: 00014_add_event_description_fields.sql
-- ============================================================================
-- Adds new description fields for richer event content:
--   • happenlist_summary: Editorial summary written by Happenlist
--   • organizer_description: Verbatim description from the organizer
-- ============================================================================

-- Add happenlist_summary field
-- This is our editorial summary with highlights, written from a third-party perspective
ALTER TABLE events ADD COLUMN IF NOT EXISTS happenlist_summary TEXT;
COMMENT ON COLUMN events.happenlist_summary IS 'Editorial summary written by Happenlist with highlights and key details';

-- Add organizer_description field
-- This is the verbatim description provided by the event organizer
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_description TEXT;
COMMENT ON COLUMN events.organizer_description IS 'Verbatim description from the event organizer (if available)';

-- ============================================================================
-- DONE!
-- ============================================================================

