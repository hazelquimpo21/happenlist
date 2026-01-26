-- =============================================================================
-- MIGRATION: Add Age/Audience Fields to Events Table
-- =============================================================================
--
-- This migration adds structured age restriction fields to support:
-- - Numeric age ranges (age_low, age_high) for filtering
-- - Human-readable age text (age_restriction) for display
-- - Family-friendly flag for quick filtering
--
-- EXAMPLES OF HOW FIELDS ARE USED:
-- ┌─────────────────────┬─────────┬──────────┬─────────────────────────────────┐
-- │ Scenario            │ age_low │ age_high │ age_restriction                 │
-- ├─────────────────────┼─────────┼──────────┼─────────────────────────────────┤
-- │ All ages            │ NULL    │ NULL     │ 'All ages'                      │
-- │ 21+ bar show        │ 21      │ NULL     │ '21+'                           │
-- │ 18+ concert         │ 18      │ NULL     │ '18+'                           │
-- │ Kids camp (5-12)    │ 5       │ 12       │ 'Ages 5-12'                     │
-- │ Grades 4-5 program  │ 9       │ 11       │ 'Grades 4-5'                    │
-- │ Seniors 55+         │ 55      │ NULL     │ '55+'                           │
-- │ Unknown/not stated  │ NULL    │ NULL     │ NULL                            │
-- └─────────────────────┴─────────┴──────────┴─────────────────────────────────┘
--
-- US GRADE TO AGE MAPPING (used by AI analyzer):
-- Grade K  → Age 5-6
-- Grade 1  → Age 6-7
-- Grade 2  → Age 7-8
-- Grade 3  → Age 8-9
-- Grade 4  → Age 9-10
-- Grade 5  → Age 10-11
-- Grade 6  → Age 11-12
-- Grade 7  → Age 12-13
-- Grade 8  → Age 13-14
-- Grade 9  → Age 14-15  (Freshman)
-- Grade 10 → Age 15-16  (Sophomore)
-- Grade 11 → Age 16-17  (Junior)
-- Grade 12 → Age 17-18  (Senior)
--
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ADD COLUMNS TO EVENTS TABLE
-- -----------------------------------------------------------------------------

-- age_low: Minimum age for the event (NULL = no minimum / all ages)
-- Examples: 21 for bar shows, 5 for kids camps, NULL for all ages
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS age_low integer;

COMMENT ON COLUMN public.events.age_low IS
'Minimum age for the event. NULL means no minimum age restriction (all ages welcome).
For grade-based events, this is the typical age for the lowest grade (e.g., Grade 4 = age 9).';

-- age_high: Maximum age for the event (NULL = no maximum)
-- Examples: 12 for kids programs, NULL for 21+ shows
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS age_high integer;

COMMENT ON COLUMN public.events.age_high IS
'Maximum age for the event. NULL means no maximum (open-ended).
Used for age-capped programs like "Ages 5-12" or "Grades K-5".';

-- age_restriction: Human-readable age requirement text
-- Preserved exactly as found on the source (for display and SEO)
-- Examples: "21+", "All ages", "Grades 4-5", "Ages 5-12", "Seniors 55+"
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS age_restriction text;

COMMENT ON COLUMN public.events.age_restriction IS
'Human-readable age restriction text as displayed to users.
Preserved from source when possible. Examples: "21+", "All ages", "Grades 4-5", "Ages 5-12".
NULL means age info was not found or not specified.';

-- is_family_friendly: Quick flag for family-oriented filtering
-- TRUE = appropriate for children, FALSE = not appropriate, NULL = unknown
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS is_family_friendly boolean DEFAULT NULL;

COMMENT ON COLUMN public.events.is_family_friendly IS
'Whether this event is appropriate for families with children.
TRUE = family-friendly, FALSE = adult-oriented, NULL = unknown/not specified.
Note: An event can be family-friendly AND have age restrictions (e.g., a brewery daytime event).';

-- -----------------------------------------------------------------------------
-- ADD INDEXES FOR COMMON QUERIES
-- -----------------------------------------------------------------------------

-- Index for filtering by minimum age (e.g., "show me 21+ events")
CREATE INDEX IF NOT EXISTS idx_events_age_low
ON public.events (age_low)
WHERE age_low IS NOT NULL AND deleted_at IS NULL;

-- Index for filtering by family-friendly status
CREATE INDEX IF NOT EXISTS idx_events_family_friendly
ON public.events (is_family_friendly)
WHERE is_family_friendly = true AND deleted_at IS NULL;

-- Composite index for age range queries (e.g., "events suitable for a 10-year-old")
-- This helps queries like: WHERE (age_low IS NULL OR age_low <= 10) AND (age_high IS NULL OR age_high >= 10)
CREATE INDEX IF NOT EXISTS idx_events_age_range
ON public.events (age_low, age_high)
WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- UPDATE VIEWS THAT INCLUDE EVENT FIELDS
-- -----------------------------------------------------------------------------

-- Note: If you have views that SELECT * FROM events, they will automatically
-- include the new columns. If you have views with explicit column lists,
-- you may need to update them to include the new age fields.

-- Example query to find all views that reference the events table:
-- SELECT table_name, view_definition
-- FROM information_schema.views
-- WHERE view_definition LIKE '%events%';

-- -----------------------------------------------------------------------------
-- VERIFICATION QUERIES (run after migration to verify)
-- -----------------------------------------------------------------------------

-- Verify columns were added:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'events'
-- AND column_name IN ('age_low', 'age_high', 'age_restriction', 'is_family_friendly');

-- Verify indexes were created:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'events'
-- AND indexname LIKE '%age%';

-- -----------------------------------------------------------------------------
-- ROLLBACK (if needed)
-- -----------------------------------------------------------------------------
-- DROP INDEX IF EXISTS idx_events_age_low;
-- DROP INDEX IF EXISTS idx_events_family_friendly;
-- DROP INDEX IF EXISTS idx_events_age_range;
-- ALTER TABLE public.events DROP COLUMN IF EXISTS age_low;
-- ALTER TABLE public.events DROP COLUMN IF EXISTS age_high;
-- ALTER TABLE public.events DROP COLUMN IF EXISTS age_restriction;
-- ALTER TABLE public.events DROP COLUMN IF EXISTS is_family_friendly;
