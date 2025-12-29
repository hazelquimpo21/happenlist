-- ============================================================================
-- HAPPENLIST DATABASE SCHEMA
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor to set up the database.
-- This creates all tables, indexes, functions, and RLS policies for Phase 1.
-- ============================================================================

-- ============================================================================
-- 1. CATEGORIES TABLE
-- ============================================================================
-- Stores event categories for filtering and organization.

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,                          -- Lucide icon name
  color TEXT,                         -- Optional accent color
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active) WHERE is_active = true;

COMMENT ON TABLE categories IS 'Event categories for filtering and organization';

-- ============================================================================
-- 2. LOCATIONS (VENUES) TABLE
-- ============================================================================
-- Stores venue information.

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,

  -- Address
  address_line TEXT,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',

  -- Coordinates
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),

  -- Classification
  venue_type TEXT DEFAULT 'venue',    -- venue, outdoor, online, various, tbd

  -- Contact & Links
  website_url TEXT,
  phone TEXT,

  -- Media
  image_url TEXT,

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for locations
CREATE INDEX IF NOT EXISTS idx_locations_slug ON locations(slug);
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(venue_type);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_locations_geo ON locations(latitude, longitude) WHERE latitude IS NOT NULL;

COMMENT ON TABLE locations IS 'Venues/locations where events take place';

-- ============================================================================
-- 3. ORGANIZERS TABLE
-- ============================================================================
-- Stores event organizer/presenter information.

CREATE TABLE IF NOT EXISTS organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,

  -- Media
  logo_url TEXT,

  -- Contact
  website_url TEXT,
  email TEXT,
  phone TEXT,

  -- Social Links (JSON object)
  social_links JSONB DEFAULT '{}',

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,  -- For Phase 4

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for organizers
CREATE INDEX IF NOT EXISTS idx_organizers_slug ON organizers(slug);
CREATE INDEX IF NOT EXISTS idx_organizers_active ON organizers(is_active) WHERE is_active = true;

COMMENT ON TABLE organizers IS 'Event organizers and presenters';

-- ============================================================================
-- 4. EVENTS TABLE
-- ============================================================================
-- The core events table.

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  short_description TEXT,             -- For cards, max ~160 chars

  -- Timing
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ,
  instance_date DATE NOT NULL,        -- Denormalized for fast date queries
  on_sale_date DATE,                  -- When tickets go on sale
  is_all_day BOOLEAN DEFAULT false,
  timezone TEXT DEFAULT 'America/Chicago',

  -- Recurrence (Phase 2)
  event_type TEXT DEFAULT 'single',   -- single, recurring, series_instance
  recurrence_parent_id UUID REFERENCES events(id) ON DELETE SET NULL,
  is_recurrence_template BOOLEAN DEFAULT false,
  recurrence_pattern JSONB,
  series_id UUID,                     -- FK to series table (Phase 2)

  -- Relations
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  organizer_id UUID REFERENCES organizers(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

  -- Pricing
  price_type TEXT DEFAULT 'fixed',    -- free, fixed, range, varies, donation
  price_low DECIMAL(10, 2),
  price_high DECIMAL(10, 2),
  price_details TEXT,                 -- "Early bird $15, Door $25"
  is_free BOOLEAN DEFAULT false,
  ticket_url TEXT,

  -- Media
  image_url TEXT,                     -- Main hero image
  flyer_url TEXT,                     -- Event flyer/poster
  thumbnail_url TEXT,                 -- Small card thumbnail

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Stats (denormalized for performance)
  heart_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'draft',        -- draft, published, cancelled, postponed
  is_featured BOOLEAN DEFAULT false,
  featured_order INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(slug, instance_date)
);

-- Primary indexes for common queries
CREATE INDEX IF NOT EXISTS idx_events_instance_date ON events(instance_date);
CREATE INDEX IF NOT EXISTS idx_events_status_date ON events(status, instance_date)
  WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_location ON events(location_id);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);

-- Composite indexes for filtered queries
CREATE INDEX IF NOT EXISTS idx_events_published_future ON events(instance_date, category_id)
  WHERE status = 'published' AND instance_date >= CURRENT_DATE;
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(featured_order)
  WHERE is_featured = true AND status = 'published';
CREATE INDEX IF NOT EXISTS idx_events_free ON events(instance_date)
  WHERE is_free = true AND status = 'published';

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_events_search ON events
  USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

COMMENT ON TABLE events IS 'Core events table - the heart of Happenlist';

-- ============================================================================
-- 5. VIEWS
-- ============================================================================
-- Useful views for common queries.

CREATE OR REPLACE VIEW events_with_details AS
SELECT
  e.*,
  c.name as category_name,
  c.slug as category_slug,
  c.icon as category_icon,
  l.name as location_name,
  l.slug as location_slug,
  l.city as location_city,
  l.address_line as location_address,
  l.latitude as location_lat,
  l.longitude as location_lng,
  o.name as organizer_name,
  o.slug as organizer_slug,
  o.logo_url as organizer_logo
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN organizers o ON e.organizer_id = o.id
WHERE e.status = 'published';

COMMENT ON VIEW events_with_details IS 'Events with joined category, location, and organizer details';

-- ============================================================================
-- 6. FUNCTIONS & TRIGGERS
-- ============================================================================
-- Helper functions and triggers.

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON organizers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Public read access for Phase 1.

-- Categories: public read
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT
  USING (is_active = true);

-- Locations: public read
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Locations are publicly readable"
  ON locations FOR SELECT
  USING (is_active = true);

-- Organizers: public read
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizers are publicly readable"
  ON organizers FOR SELECT
  USING (is_active = true);

-- Events: public read for published
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published events are publicly readable"
  ON events FOR SELECT
  USING (status = 'published');

-- ============================================================================
-- 8. SEED DATA - CATEGORIES
-- ============================================================================
-- Initial category data.

INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('Music', 'music', 'Music', 1),
  ('Arts & Culture', 'arts-culture', 'Palette', 2),
  ('Family', 'family', 'Users', 3),
  ('Food & Drink', 'food-drink', 'UtensilsCrossed', 4),
  ('Sports & Fitness', 'sports-fitness', 'Dumbbell', 5),
  ('Nightlife', 'nightlife', 'Moon', 6),
  ('Community', 'community', 'Heart', 7),
  ('Classes & Workshops', 'classes-workshops', 'GraduationCap', 8),
  ('Festivals', 'festivals', 'PartyPopper', 9),
  ('Theater & Film', 'theater-film', 'Clapperboard', 10)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- DONE! Your database is ready.
-- ============================================================================
