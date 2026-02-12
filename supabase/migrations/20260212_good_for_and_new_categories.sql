-- ============================================================================
-- MIGRATION: Add "Good For" audience tags + 5 new categories
-- ============================================================================
-- Date: 2026-02-12
-- Description:
--   1. Adds good_for TEXT[] column to events for audience/vibe tagging
--   2. Inserts 5 new categories: Markets & Shopping, Talks & Lectures,
--      Outdoors & Nature, Charity & Fundraising, Holiday & Seasonal
--
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. ADD good_for COLUMN TO EVENTS
-- ============================================================================

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS good_for TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.events.good_for IS
'Audience/vibe tags for the event. Multiple values per event.
Valid slugs: date_night, families_young_kids, families_older_kids, pet_friendly,
foodies, girls_night, guys_night, solo_friendly, outdoorsy, creatives,
music_lovers, active_seniors, college_crowd, first_timers.
Set by admins during review. See SCHEMA.md for full descriptions.';

-- GIN index for efficient @> (array contains) queries
CREATE INDEX IF NOT EXISTS idx_events_good_for
ON public.events USING GIN (good_for)
WHERE deleted_at IS NULL;

-- ============================================================================
-- 2. INSERT NEW CATEGORIES
-- ============================================================================
-- These are additive — they won't conflict with existing rows.
-- Using ON CONFLICT to make this migration idempotent.

INSERT INTO public.categories (name, slug, icon, color, sort_order, is_active)
VALUES
  ('Markets & Shopping', 'markets-shopping', 'ShoppingBag', 'bg-amber-100', 11, true),
  ('Talks & Lectures', 'talks-lectures', 'Mic', 'bg-indigo-100', 12, true),
  ('Outdoors & Nature', 'outdoors-nature', 'TreePine', 'bg-emerald-100', 13, true),
  ('Charity & Fundraising', 'charity-fundraising', 'HandHeart', 'bg-rose-100', 14, true),
  ('Holiday & Seasonal', 'holiday-seasonal', 'Snowflake', 'bg-sky-100', 15, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES (run after migration to verify)
-- ============================================================================

-- Verify good_for column was added:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'events' AND column_name = 'good_for';

-- Verify new categories:
-- SELECT name, slug, icon, sort_order FROM categories ORDER BY sort_order;

-- Verify GIN index:
-- SELECT indexname FROM pg_indexes WHERE tablename = 'events' AND indexname = 'idx_events_good_for';

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- DELETE FROM categories WHERE slug IN ('markets-shopping', 'talks-lectures', 'outdoors-nature', 'charity-fundraising', 'holiday-seasonal');
-- DROP INDEX IF EXISTS idx_events_good_for;
-- ALTER TABLE public.events DROP COLUMN IF EXISTS good_for;
