-- ============================================================================
-- MIGRATION: Series Enhancements for Camps, Classes & Multi-Session Offerings
-- ============================================================================
-- Date: 2026-02-09
-- Description: Adds structured fields to the series table for:
--   - Extended care / before & after care (camps)
--   - Attendance mode (registered, drop-in, hybrid)
--   - Per-session and materials pricing
--   - Age restrictions
--   - Skill levels (classes)
--   - Day-of-week patterns (camps)
--   - Term/semester grouping
--   - Future: parent series for multi-week camp programs
--
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================================

-- ============================================================================
-- SCHEDULE / TIME EXTENSIONS
-- ============================================================================
-- Camps typically have core hours (9am-3pm) with optional before/after care.
-- These fields enable filtering ("show me camps with after care") and
-- structured display without relying solely on description text.

ALTER TABLE series ADD COLUMN IF NOT EXISTS core_start_time TIME;
COMMENT ON COLUMN series.core_start_time IS 'Main program start time (e.g., 09:00). For camps: when the core day begins.';

ALTER TABLE series ADD COLUMN IF NOT EXISTS core_end_time TIME;
COMMENT ON COLUMN series.core_end_time IS 'Main program end time (e.g., 15:00). For camps: when the core day ends.';

ALTER TABLE series ADD COLUMN IF NOT EXISTS extended_start_time TIME;
COMMENT ON COLUMN series.extended_start_time IS 'Before-care / early drop-off start time (e.g., 07:30). NULL if not offered.';

ALTER TABLE series ADD COLUMN IF NOT EXISTS extended_end_time TIME;
COMMENT ON COLUMN series.extended_end_time IS 'After-care / late pickup end time (e.g., 17:30). NULL if not offered.';

ALTER TABLE series ADD COLUMN IF NOT EXISTS extended_care_details TEXT;
COMMENT ON COLUMN series.extended_care_details IS 'Human-readable care options & pricing (e.g., "Before care 7:30-9am ($25/wk). After care 3-5:30pm ($50/wk).")';

-- ============================================================================
-- PRICING ENHANCEMENTS
-- ============================================================================
-- The existing price_low/price_high covers the main series price.
-- These new fields handle per-session pricing and separate fees.

ALTER TABLE series ADD COLUMN IF NOT EXISTS per_session_price DECIMAL(10,2);
COMMENT ON COLUMN series.per_session_price IS 'Drop-in / single-session price. NULL means no drop-in option available.';

ALTER TABLE series ADD COLUMN IF NOT EXISTS materials_fee DECIMAL(10,2);
COMMENT ON COLUMN series.materials_fee IS 'Separate materials/supply fee. NULL means no additional fee.';

ALTER TABLE series ADD COLUMN IF NOT EXISTS pricing_notes TEXT;
COMMENT ON COLUMN series.pricing_notes IS 'Human-readable pricing notes: early bird rates, sibling discounts, multi-session packs, etc.';

-- ============================================================================
-- ATTENDANCE MODEL
-- ============================================================================
-- Determines how participants attend: must register for full series,
-- can drop in to individual sessions, or both.

ALTER TABLE series ADD COLUMN IF NOT EXISTS attendance_mode TEXT DEFAULT 'registered';
COMMENT ON COLUMN series.attendance_mode IS 'How participants attend: registered (must sign up), drop_in (show up anytime), hybrid (register or drop in).';

-- Validate attendance_mode values
ALTER TABLE series ADD CONSTRAINT series_attendance_mode_check
  CHECK (attendance_mode IS NULL OR attendance_mode IN ('registered', 'drop_in', 'hybrid'));

-- ============================================================================
-- AGE RESTRICTIONS
-- ============================================================================
-- Camps and classes typically have age requirements.
-- These enable filtering by age group on browse pages.

ALTER TABLE series ADD COLUMN IF NOT EXISTS age_low INTEGER;
COMMENT ON COLUMN series.age_low IS 'Minimum age for participants. NULL means no minimum.';

ALTER TABLE series ADD COLUMN IF NOT EXISTS age_high INTEGER;
COMMENT ON COLUMN series.age_high IS 'Maximum age for participants. NULL means no maximum.';

ALTER TABLE series ADD COLUMN IF NOT EXISTS age_details TEXT;
COMMENT ON COLUMN series.age_details IS 'Human-readable age notes (e.g., "Must be potty-trained", "Parent must accompany under 5").';

-- Validate age range makes sense
ALTER TABLE series ADD CONSTRAINT series_age_range_check
  CHECK (age_low IS NULL OR age_high IS NULL OR age_low <= age_high);

-- ============================================================================
-- SKILL LEVEL
-- ============================================================================
-- Primarily for classes and workshops. Not relevant for camps or recurring events.

ALTER TABLE series ADD COLUMN IF NOT EXISTS skill_level TEXT;
COMMENT ON COLUMN series.skill_level IS 'Skill level: beginner, intermediate, advanced, all_levels. NULL if not applicable.';

ALTER TABLE series ADD CONSTRAINT series_skill_level_check
  CHECK (skill_level IS NULL OR skill_level IN ('beginner', 'intermediate', 'advanced', 'all_levels'));

-- ============================================================================
-- DAY PATTERN
-- ============================================================================
-- For camps: which days of the week the program runs.
-- Stored as integer array: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
-- Example: {1,2,3,4,5} = Monday through Friday

ALTER TABLE series ADD COLUMN IF NOT EXISTS days_of_week INTEGER[];
COMMENT ON COLUMN series.days_of_week IS 'Which days of the week (0=Sun..6=Sat). For camps: {1,2,3,4,5} = Mon-Fri.';

-- ============================================================================
-- TERM / SEMESTER GROUPING
-- ============================================================================
-- Allows grouping series by term for classes that run in semesters.

ALTER TABLE series ADD COLUMN IF NOT EXISTS term_name TEXT;
COMMENT ON COLUMN series.term_name IS 'Semester/term label for grouping (e.g., "Fall 2026", "Summer Session A").';

-- ============================================================================
-- PARENT SERIES (future: multi-week camp programs)
-- ============================================================================
-- An org offers "Summer Art Camp" for 6 separate weeks. Each week is its
-- own series. parent_series_id groups them under one program.
-- NOTE: This is a forward-looking column. UI support comes later.

ALTER TABLE series ADD COLUMN IF NOT EXISTS parent_series_id UUID REFERENCES series(id);
COMMENT ON COLUMN series.parent_series_id IS 'Groups related series (e.g., multiple camp weeks under one program). FK to series.id.';

-- ============================================================================
-- INDEXES
-- ============================================================================
-- Support common filter queries without slowing down writes.

-- Filter by attendance mode (e.g., "show me drop-in classes")
CREATE INDEX IF NOT EXISTS idx_series_attendance_mode
  ON series (attendance_mode)
  WHERE status = 'published';

-- Filter by skill level
CREATE INDEX IF NOT EXISTS idx_series_skill_level
  ON series (skill_level)
  WHERE status = 'published' AND skill_level IS NOT NULL;

-- Filter by age range (find series suitable for a given age)
CREATE INDEX IF NOT EXISTS idx_series_age_range
  ON series (age_low, age_high)
  WHERE status = 'published' AND (age_low IS NOT NULL OR age_high IS NOT NULL);

-- Filter by extended care availability (camps with after care)
CREATE INDEX IF NOT EXISTS idx_series_extended_care
  ON series (extended_end_time)
  WHERE status = 'published' AND extended_end_time IS NOT NULL;

-- Group by parent series (multi-week camp programs)
CREATE INDEX IF NOT EXISTS idx_series_parent
  ON series (parent_series_id)
  WHERE parent_series_id IS NOT NULL;

-- Group by term
CREATE INDEX IF NOT EXISTS idx_series_term
  ON series (term_name)
  WHERE status = 'published' AND term_name IS NOT NULL;

-- ============================================================================
-- DONE
-- ============================================================================
-- After running this migration, update the TypeScript types in:
--   src/lib/supabase/types.ts (series Row/Insert/Update)
--   src/types/series.ts (SeriesCard, SeriesWithDetails)
-- These have already been updated in the same commit as this migration.
