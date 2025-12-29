-- ============================================================================
-- 🗄️ HAPPENLIST - Initial Database Schema
-- ============================================================================
-- This migration creates all tables needed for the Happenlist MVP.
-- Run this in your Supabase SQL Editor to set up the database.
--
-- Tables created:
--   - event_types     : Types of events (single, series, festival, etc.)
--   - categories      : Event categories (music, food, kids, etc.)
--   - tags            : Flexible tags for filtering (free, outdoor, 21+, etc.)
--   - venues          : Physical locations where events happen
--   - organizers      : People/organizations that host events
--   - events          : The main events table
--   - event_tags      : Junction table linking events to tags
-- ============================================================================

-- ============================================================================
-- 🔧 EXTENSIONS
-- ============================================================================

-- Enable UUID generation for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 📋 EVENT TYPES TABLE
-- ============================================================================
-- Defines the type of event (single event, series, festival, etc.)
-- This helps categorize how an event recurs or spans time.

CREATE TABLE event_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient sorting
CREATE INDEX idx_event_types_sort ON event_types(sort_order);

COMMENT ON TABLE event_types IS 'Types of events like single event, series, festival, camp';
COMMENT ON COLUMN event_types.slug IS 'URL-friendly identifier';

-- ============================================================================
-- 🏷️ CATEGORIES TABLE
-- ============================================================================
-- Main categories for organizing events (Music, Food & Drink, Kids, etc.)
-- Each event belongs to exactly one category.

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50),              -- Lucide icon name (e.g., 'music', 'utensils')
  color VARCHAR(20),             -- Hex color for badges (e.g., '#8B5CF6')
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_sort ON categories(sort_order);

COMMENT ON TABLE categories IS 'Event categories like Music, Food & Drink, Kids & Family';
COMMENT ON COLUMN categories.color IS 'Hex color code for category badge styling';

-- ============================================================================
-- 🔖 TAGS TABLE
-- ============================================================================
-- Flexible tags for filtering events (free, outdoor, family-friendly, etc.)
-- Events can have multiple tags.

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tags_slug ON tags(slug);

COMMENT ON TABLE tags IS 'Flexible tags for event filtering like free, outdoor, 21+';

-- ============================================================================
-- 📍 VENUES TABLE
-- ============================================================================
-- Physical locations where events take place.
-- Includes address info and optional coordinates for maps.

CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  address VARCHAR(500),
  city VARCHAR(100) DEFAULT 'Milwaukee',
  state VARCHAR(50) DEFAULT 'WI',
  zip VARCHAR(20),
  lat DECIMAL(10, 8),            -- Latitude for map display
  lng DECIMAL(11, 8),            -- Longitude for map display
  website VARCHAR(500),
  image_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_venues_slug ON venues(slug);
CREATE INDEX idx_venues_city ON venues(city);

COMMENT ON TABLE venues IS 'Physical locations where events are held';
COMMENT ON COLUMN venues.lat IS 'Latitude coordinate for map display';
COMMENT ON COLUMN venues.lng IS 'Longitude coordinate for map display';

-- ============================================================================
-- 👥 ORGANIZERS TABLE
-- ============================================================================
-- People or organizations that host events.
-- Includes social links and branding info.

CREATE TABLE organizers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  logo_url VARCHAR(500),
  website VARCHAR(500),
  instagram_handle VARCHAR(100),  -- Instagram username (without @)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizers_slug ON organizers(slug);

COMMENT ON TABLE organizers IS 'Event organizers - people or organizations hosting events';
COMMENT ON COLUMN organizers.instagram_handle IS 'Instagram username without the @ symbol';

-- ============================================================================
-- 📊 EVENT STATUS ENUM
-- ============================================================================
-- Possible states for an event:
--   - draft: Not yet visible to public
--   - published: Live and visible
--   - cancelled: Event was cancelled
--   - archived: Past event, hidden from main listings

CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'archived');

-- ============================================================================
-- 📅 EVENTS TABLE
-- ============================================================================
-- The main events table. This is the heart of Happenlist!
-- Each event has a title, dates, location, and other details.

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Core content
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) NOT NULL UNIQUE,
  description TEXT,

  -- Relationships (foreign keys)
  type_id UUID REFERENCES event_types(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  organizer_id UUID REFERENCES organizers(id) ON DELETE SET NULL,

  -- Date and time
  start_at TIMESTAMPTZ NOT NULL,  -- When the event starts
  end_at TIMESTAMPTZ,             -- When the event ends (optional)
  is_all_day BOOLEAN DEFAULT FALSE,

  -- Media
  image_url VARCHAR(500),         -- Thumbnail image
  flyer_url VARCHAR(500),         -- Full flyer/poster image

  -- External links
  source_url VARCHAR(500),        -- Where the event info came from
  ticket_url VARCHAR(500),        -- Where to buy tickets

  -- Pricing
  price_min DECIMAL(10, 2),       -- Minimum ticket price
  price_max DECIMAL(10, 2),       -- Maximum ticket price
  is_free BOOLEAN DEFAULT FALSE,

  -- Status
  status event_status DEFAULT 'draft',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes for common queries
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_at ON events(start_at);
CREATE INDEX idx_events_category ON events(category_id);
CREATE INDEX idx_events_venue ON events(venue_id);
CREATE INDEX idx_events_organizer ON events(organizer_id);

-- Composite index for the most common query: upcoming published events
CREATE INDEX idx_events_status_start ON events(status, start_at)
  WHERE status = 'published';

COMMENT ON TABLE events IS 'Main events table - the heart of Happenlist';
COMMENT ON COLUMN events.start_at IS 'Event start timestamp in UTC';
COMMENT ON COLUMN events.is_free IS 'TRUE if the event has no entry fee';
COMMENT ON COLUMN events.source_url IS 'Original source where event info was found';

-- ============================================================================
-- 🔗 EVENT_TAGS JUNCTION TABLE
-- ============================================================================
-- Links events to their tags (many-to-many relationship).
-- One event can have multiple tags, one tag can apply to multiple events.

CREATE TABLE event_tags (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, tag_id)
);

CREATE INDEX idx_event_tags_event ON event_tags(event_id);
CREATE INDEX idx_event_tags_tag ON event_tags(tag_id);

COMMENT ON TABLE event_tags IS 'Junction table linking events to tags (many-to-many)';

-- ============================================================================
-- ⏰ UPDATED_AT TRIGGER
-- ============================================================================
-- Automatically updates the updated_at column when a row is modified.
-- This helps track when records were last changed.

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_venues_updated_at
  BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_organizers_updated_at
  BEFORE UPDATE ON organizers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_event_types_updated_at
  BEFORE UPDATE ON event_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 🔒 ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- RLS controls who can read/write data. This is crucial for security!
--   - Public users can read published events and all categories/tags/venues
--   - Only authenticated admin users can create/update/delete

-- Enable RLS on all tables
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tags ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Event Types Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Public can read event_types"
  ON event_types FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage event_types"
  ON event_types FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- Categories Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Public can read categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage categories"
  ON categories FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- Tags Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Public can read tags"
  ON tags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage tags"
  ON tags FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- Venues Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Public can read venues"
  ON venues FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage venues"
  ON venues FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- Organizers Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Public can read organizers"
  ON organizers FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage organizers"
  ON organizers FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- Events Policies (More complex - public only sees published)
-- ----------------------------------------------------------------------------

-- Public can only see published events
CREATE POLICY "Public can read published events"
  ON events FOR SELECT
  USING (status = 'published');

-- Authenticated users can see ALL events (including drafts)
CREATE POLICY "Authenticated users can read all events"
  ON events FOR SELECT
  USING (auth.role() = 'authenticated');

-- Authenticated users can insert events
CREATE POLICY "Authenticated users can insert events"
  ON events FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can update events
CREATE POLICY "Authenticated users can update events"
  ON events FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can delete events
CREATE POLICY "Authenticated users can delete events"
  ON events FOR DELETE
  USING (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- Event Tags Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Public can read event_tags"
  ON event_tags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage event_tags"
  ON event_tags FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- 🌱 SEED DATA
-- ============================================================================
-- Initial data to populate the database with event types, categories, and tags.

-- ----------------------------------------------------------------------------
-- Event Types (how events recur/span time)
-- ----------------------------------------------------------------------------
INSERT INTO event_types (name, slug, description, sort_order) VALUES
  ('Single Event', 'single-event', 'A one-time event', 1),
  ('Series', 'series', 'A multi-session event like a class or workshop series', 2),
  ('Festival', 'festival', 'A multi-day event with multiple acts or activities', 3),
  ('Camp', 'camp', 'A day camp, kids camp, or immersive multi-day experience', 4),
  ('Workshop', 'workshop', 'A single hands-on learning session', 5),
  ('Recurring', 'recurring', 'An ongoing event like weekly trivia or monthly meetups', 6);

-- ----------------------------------------------------------------------------
-- Categories (main event groupings)
-- ----------------------------------------------------------------------------
INSERT INTO categories (name, slug, icon, color, sort_order) VALUES
  ('Music', 'music', 'music', '#8B5CF6', 1),
  ('Arts & Culture', 'arts-culture', 'palette', '#EC4899', 2),
  ('Food & Drink', 'food-drink', 'utensils', '#F59E0B', 3),
  ('Fitness & Wellness', 'fitness-wellness', 'heart', '#10B981', 4),
  ('Kids & Family', 'kids-family', 'baby', '#3B82F6', 5),
  ('Nightlife', 'nightlife', 'moon', '#6366F1', 6),
  ('Community', 'community', 'users', '#14B8A6', 7),
  ('Sports & Outdoors', 'sports-outdoors', 'bike', '#22C55E', 8),
  ('Comedy', 'comedy', 'laugh', '#EAB308', 9),
  ('Film & Screenings', 'film-screenings', 'film', '#EF4444', 10),
  ('Markets & Fairs', 'markets-fairs', 'shopping-bag', '#F97316', 11),
  ('Classes & Learning', 'classes-learning', 'book-open', '#0EA5E9', 12);

-- ----------------------------------------------------------------------------
-- Tags (flexible filtering options)
-- ----------------------------------------------------------------------------
INSERT INTO tags (name, slug) VALUES
  ('Free', 'free'),
  ('Outdoor', 'outdoor'),
  ('Indoor', 'indoor'),
  ('21+', '21-plus'),
  ('All Ages', 'all-ages'),
  ('Family Friendly', 'family-friendly'),
  ('Dog Friendly', 'dog-friendly'),
  ('Date Night', 'date-night'),
  ('First Timer Friendly', 'first-timer-friendly'),
  ('Local Artist', 'local-artist'),
  ('LGBTQ+', 'lgbtq-plus'),
  ('Accessible', 'accessible'),
  ('Registration Required', 'registration-required'),
  ('Drop-In', 'drop-in'),
  ('Food Included', 'food-included'),
  ('Drinks Included', 'drinks-included');

-- ============================================================================
-- ✅ MIGRATION COMPLETE
-- ============================================================================
-- Your Happenlist database is now set up! Next steps:
--
-- 1. Create an admin user in Supabase Auth
-- 2. Add your Supabase credentials to .env.local
-- 3. Start adding events through the admin interface
-- ============================================================================
