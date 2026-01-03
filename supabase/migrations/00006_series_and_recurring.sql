-- ============================================================================
-- PHASE 2: SERIES & RECURRING EVENTS SCHEMA
-- ============================================================================
-- This migration adds support for:
--   1. Event Series (multi-session events like camps, classes, workshops)
--   2. True Recurring Events (weekly, monthly patterns)
--   3. Series-to-Event relationships
--
-- Run this in Supabase SQL Editor after Phase 1 migrations.
-- ============================================================================

-- ============================================================================
-- 1. CREATE SERIES TABLE
-- ============================================================================
-- A series groups multiple related events together (e.g., "Summer Art Camp",
-- "Weekly Jazz Jam", "Yoga Teacher Training - 8 Week Program")

CREATE TABLE IF NOT EXISTS series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ========== Basic Info ==========
  title TEXT NOT NULL,                      -- "Summer Art Camp 2025"
  slug TEXT UNIQUE NOT NULL,                -- "summer-art-camp-2025"
  description TEXT,                         -- Rich description of the series
  short_description TEXT,                   -- For cards (max ~160 chars)

  -- ========== Series Type ==========
  -- Determines how the series behaves and is displayed
  series_type TEXT NOT NULL DEFAULT 'class',
  -- Options:
  --   'class'     : Multi-session class (Pottery 101 - 6 weeks)
  --   'camp'      : Day camp or intensive (Summer Art Camp - 5 days)
  --   'workshop'  : Workshop series (Bread Baking - 3 sessions)
  --   'recurring' : True recurring event (Weekly Jazz Jam - every Tuesday)
  --   'festival'  : Multi-day festival (Summerfest - 3 days)
  --   'season'    : Performance season (Symphony 2025 Season)

  -- ========== Session Info ==========
  total_sessions INTEGER,                   -- NULL for open-ended recurring
  sessions_remaining INTEGER,               -- Computed/updated as events pass

  -- ========== Date Range ==========
  start_date DATE,                          -- When series begins
  end_date DATE,                            -- When series ends (NULL if ongoing)

  -- ========== Recurrence Pattern ==========
  -- For recurring events, this defines the pattern
  recurrence_rule JSONB,
  -- Example RRULE-style pattern:
  -- {
  --   "frequency": "weekly",     -- weekly, biweekly, monthly
  --   "interval": 1,             -- every 1 week
  --   "days_of_week": [2],       -- Tuesday (0=Sun, 1=Mon, 2=Tue...)
  --   "time": "19:00",           -- 7:00 PM
  --   "duration_minutes": 120,   -- 2 hours
  --   "end_type": "date",        -- date, count, or never
  --   "end_date": "2025-12-31",  -- if end_type is "date"
  --   "end_count": 10            -- if end_type is "count"
  -- }

  -- ========== Relationships ==========
  organizer_id UUID REFERENCES organizers(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  -- Note: location_id is NULL if events can be at different locations

  -- ========== Pricing ==========
  -- Series-level pricing (for full series registration)
  price_type TEXT DEFAULT 'per_session',
  -- Options: 'free', 'fixed', 'range', 'varies', 'per_session'
  price_low DECIMAL(10, 2),                 -- Starting price
  price_high DECIMAL(10, 2),                -- Max price (for range)
  price_details TEXT,                       -- "Early bird $150, Regular $180"
  is_free BOOLEAN DEFAULT false,

  -- ========== Registration ==========
  registration_url TEXT,                    -- Link to sign up for full series
  registration_required BOOLEAN DEFAULT false,
  capacity INTEGER,                         -- Max attendees (NULL = unlimited)
  waitlist_enabled BOOLEAN DEFAULT false,

  -- ========== Media ==========
  image_url TEXT,                           -- Hero image for series
  image_hosted BOOLEAN DEFAULT false,
  image_storage_path TEXT,
  thumbnail_url TEXT,

  -- ========== SEO ==========
  meta_title TEXT,
  meta_description TEXT,

  -- ========== Status ==========
  status TEXT DEFAULT 'draft',              -- draft, published, cancelled, completed
  is_featured BOOLEAN DEFAULT false,
  featured_order INTEGER,

  -- ========== Stats ==========
  heart_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  enrollment_count INTEGER DEFAULT 0,

  -- ========== Source Tracking ==========
  source TEXT DEFAULT 'manual',
  source_url TEXT,

  -- ========== Timestamps ==========
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- Add helpful comments
COMMENT ON TABLE series IS 'Groups related events together (classes, camps, recurring events)';
COMMENT ON COLUMN series.series_type IS 'Type of series: class, camp, workshop, recurring, festival, season';
COMMENT ON COLUMN series.recurrence_rule IS 'RRULE-style JSON pattern for recurring events';
COMMENT ON COLUMN series.price_type IS 'Pricing model: free, fixed, range, varies, per_session';

-- ============================================================================
-- 2. CREATE SERIES INDEXES
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_series_slug ON series(slug);
CREATE INDEX IF NOT EXISTS idx_series_type ON series(series_type);
CREATE INDEX IF NOT EXISTS idx_series_status ON series(status);

-- Relationship indexes
CREATE INDEX IF NOT EXISTS idx_series_organizer ON series(organizer_id);
CREATE INDEX IF NOT EXISTS idx_series_category ON series(category_id);
CREATE INDEX IF NOT EXISTS idx_series_location ON series(location_id);

-- Date range queries
CREATE INDEX IF NOT EXISTS idx_series_dates ON series(start_date, end_date);

-- Featured series
CREATE INDEX IF NOT EXISTS idx_series_featured ON series(featured_order)
  WHERE is_featured = true AND status = 'published';

-- Active series lookup
CREATE INDEX IF NOT EXISTS idx_series_active ON series(status, end_date)
  WHERE status = 'published' AND (end_date IS NULL OR end_date >= CURRENT_DATE);

-- ============================================================================
-- 3. ADD SERIES FOREIGN KEY TO EVENTS TABLE
-- ============================================================================
-- Link events to their parent series

-- Ensure the column exists (may have been added in Phase 1 schema)
ALTER TABLE events ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES series(id) ON DELETE SET NULL;

-- Add sequence number for ordering events within a series
ALTER TABLE events ADD COLUMN IF NOT EXISTS series_sequence INTEGER;

-- Add flag for whether this is a standalone event or part of a series
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_series_instance BOOLEAN DEFAULT false;

-- Index for finding events by series
CREATE INDEX IF NOT EXISTS idx_events_series ON events(series_id) WHERE series_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_series_sequence ON events(series_id, series_sequence) WHERE series_id IS NOT NULL;

COMMENT ON COLUMN events.series_id IS 'Parent series this event belongs to (NULL if standalone)';
COMMENT ON COLUMN events.series_sequence IS 'Order within the series (1, 2, 3...)';
COMMENT ON COLUMN events.is_series_instance IS 'True if this event is part of a series';

-- ============================================================================
-- 4. CREATE SERIES RLS POLICIES
-- ============================================================================

ALTER TABLE series ENABLE ROW LEVEL SECURITY;

-- Public can read published series
CREATE POLICY "Published series are publicly readable"
  ON series FOR SELECT
  USING (status = 'published');

-- Service role has full access (for admin operations)
-- (Handled via service role key)

-- ============================================================================
-- 5. CREATE SERIES UPDATE TRIGGER
-- ============================================================================

-- Apply the existing updated_at trigger to series
CREATE TRIGGER set_updated_at BEFORE UPDATE ON series
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 6. CREATE SERIES VIEWS
-- ============================================================================

-- View: Series with full details (for display)
CREATE OR REPLACE VIEW series_with_details AS
SELECT
  s.*,
  c.name as category_name,
  c.slug as category_slug,
  c.icon as category_icon,
  l.name as location_name,
  l.slug as location_slug,
  l.city as location_city,
  o.name as organizer_name,
  o.slug as organizer_slug,
  o.logo_url as organizer_logo,
  -- Count of upcoming events in this series
  (SELECT COUNT(*) FROM events e
   WHERE e.series_id = s.id
   AND e.status = 'published'
   AND e.instance_date >= CURRENT_DATE) as upcoming_event_count,
  -- Next event date
  (SELECT MIN(e.instance_date) FROM events e
   WHERE e.series_id = s.id
   AND e.status = 'published'
   AND e.instance_date >= CURRENT_DATE) as next_event_date
FROM series s
LEFT JOIN categories c ON s.category_id = c.id
LEFT JOIN locations l ON s.location_id = l.id
LEFT JOIN organizers o ON s.organizer_id = o.id
WHERE s.status = 'published';

COMMENT ON VIEW series_with_details IS 'Series with joined relationships and computed fields';

-- View: Upcoming series (has future events or ongoing)
CREATE OR REPLACE VIEW series_upcoming AS
SELECT s.*
FROM series s
WHERE s.status = 'published'
  AND (
    s.end_date IS NULL
    OR s.end_date >= CURRENT_DATE
    OR EXISTS (
      SELECT 1 FROM events e
      WHERE e.series_id = s.id
      AND e.status = 'published'
      AND e.instance_date >= CURRENT_DATE
    )
  )
ORDER BY s.start_date ASC NULLS LAST;

COMMENT ON VIEW series_upcoming IS 'Active and upcoming series';

-- ============================================================================
-- 7. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function: Get events for a series
CREATE OR REPLACE FUNCTION get_series_events(
  p_series_id UUID,
  p_include_past BOOLEAN DEFAULT false,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  event_id UUID,
  title TEXT,
  slug TEXT,
  instance_date DATE,
  start_datetime TIMESTAMPTZ,
  end_datetime TIMESTAMPTZ,
  series_sequence INTEGER,
  status TEXT,
  location_name TEXT,
  location_slug TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.title,
    e.slug,
    e.instance_date,
    e.start_datetime,
    e.end_datetime,
    e.series_sequence,
    e.status,
    l.name,
    l.slug
  FROM events e
  LEFT JOIN locations l ON e.location_id = l.id
  WHERE e.series_id = p_series_id
    AND e.status = 'published'
    AND (p_include_past OR e.instance_date >= CURRENT_DATE)
  ORDER BY e.series_sequence ASC NULLS LAST, e.instance_date ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_series_events IS 'Returns events belonging to a series';

-- Function: Update series stats after event changes
CREATE OR REPLACE FUNCTION update_series_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.series_id IS NOT NULL THEN
    UPDATE series
    SET
      sessions_remaining = (
        SELECT COUNT(*) FROM events
        WHERE series_id = NEW.series_id
        AND status = 'published'
        AND instance_date >= CURRENT_DATE
      ),
      updated_at = now()
    WHERE id = NEW.series_id;
  END IF;

  -- Also update old series if event was moved
  IF OLD.series_id IS NOT NULL AND OLD.series_id != NEW.series_id THEN
    UPDATE series
    SET
      sessions_remaining = (
        SELECT COUNT(*) FROM events
        WHERE series_id = OLD.series_id
        AND status = 'published'
        AND instance_date >= CURRENT_DATE
      ),
      updated_at = now()
    WHERE id = OLD.series_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update series stats when events change
CREATE TRIGGER update_series_on_event_change
  AFTER INSERT OR UPDATE OR DELETE ON events
  FOR EACH ROW
  WHEN (NEW.series_id IS NOT NULL OR OLD.series_id IS NOT NULL)
  EXECUTE FUNCTION update_series_stats();

-- ============================================================================
-- 8. CREATE SAMPLE SERIES TYPES REFERENCE
-- ============================================================================
-- This is just for documentation; no table needed

COMMENT ON TABLE series IS '
SERIES TYPES REFERENCE:

class - Multi-session educational class
  Example: "Pottery 101 - 6 Week Course"
  - Fixed number of sessions
  - Sequential content (Week 1, Week 2...)
  - Usually requires registration for full series

camp - Day camp or intensive program
  Example: "Summer Art Camp - June 10-14"
  - Multiple consecutive days
  - Drop-in or full-week registration
  - Often for kids/youth

workshop - Workshop series
  Example: "Bread Baking Masterclass - 3 Sessions"
  - Focused skill-building
  - Can be standalone or sequential
  - Usually adult-focused

recurring - True recurring event
  Example: "Weekly Jazz Jam - Every Tuesday"
  - Repeats on a pattern (weekly, monthly)
  - No fixed end date
  - Drop-in friendly
  - Events auto-generated from pattern

festival - Multi-day festival
  Example: "Summerfest 2025 - July 4-7"
  - Multiple days, often different schedules each day
  - May have sub-events (stages, venues)
  - One-time annual occurrence

season - Performance season
  Example: "Milwaukee Symphony 2025 Season"
  - Collection of related performances
  - Different dates/programs
  - Subscription or individual tickets
';

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================
--
-- New table: series
-- New columns on events: series_id, series_sequence, is_series_instance
-- New views: series_with_details, series_upcoming
-- New functions: get_series_events, update_series_stats
--
-- Next steps:
-- 1. Create series in Supabase Studio or via admin UI
-- 2. Link events to series using series_id
-- 3. Use series_with_details view for display
--
-- ============================================================================
