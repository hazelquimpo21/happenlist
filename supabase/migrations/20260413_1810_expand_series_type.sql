-- ============================================================================
-- MIGRATION: Expand series_type CHECK Constraint
-- ============================================================================
-- Session: B6 (Phase 2 — Lifecycle + Past Events)
-- Date: 2026-04-13
--
-- The original CHECK (from 20260210_schema_cleanup.sql) only allows:
--   class, camp, workshop, recurring, festival, season
--
-- The app code (src/lib/constants/series-limits.ts) already defines:
--   lifestyle, ongoing, exhibit
--
-- This migration adds those three PLUS 'annual' (per filter-roadmap.md
-- architectural decision #12: annual recurring events).
--
-- If you change this, also update:
--   - src/lib/constants/series-limits.ts (SERIES_LIMITS + SERIES_TYPE_OPTIONS)
--   - src/types/index.ts (getSeriesTypeInfo)
-- ============================================================================


-- Drop the old constraint
ALTER TABLE series DROP CONSTRAINT IF EXISTS series_series_type_check;

-- Add the expanded constraint with all 10 types
ALTER TABLE series ADD CONSTRAINT series_series_type_check
  CHECK (series_type IN (
    'class', 'camp', 'workshop', 'recurring',
    'festival', 'season',
    'lifestyle', 'ongoing', 'exhibit',
    'annual'
  ));
