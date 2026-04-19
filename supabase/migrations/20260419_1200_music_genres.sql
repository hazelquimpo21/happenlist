-- =============================================================================
-- Migration: Music Genres
-- =============================================================================
-- Mirror of happenlist_scraper/database/migrations/00024_music_genres.sql.
-- Adds events.music_genres TEXT[] for broad musical-style tagging on events
-- where music IS the content. Already applied on remote DB — this file exists
-- so `supabase db reset` in either repo produces the same schema.
--
-- Vocab source of truth: happenlist_scraper/backend/lib/vocabularies.js
-- Mirror: happenlist/src/lib/constants/vocabularies.ts (MUSIC_GENRES)
--
-- Sub-genres (deep house vs tech house) live on the performer record, not here.
-- =============================================================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS music_genres TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN events.music_genres IS
  'Broad musical-style tags for events where music IS the content (concerts, DJ sets, music-driven nightlife). Empty array for non-music events. See MUSIC_GENRES vocab in backend/lib/vocabularies.js. Sub-genres belong on the performer record.';

CREATE INDEX IF NOT EXISTS idx_events_music_genres
  ON events USING GIN (music_genres);
