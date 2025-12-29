# Database Schema

## Overview

All tables use UUID primary keys and include `created_at`/`updated_at` timestamps. Row Level Security (RLS) is enabled on all tables.

---

## Schema Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   categories    │     │     venues      │     │   organizers    │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ name            │     │ name            │     │ name            │
│ slug            │     │ slug            │     │ slug            │
│ icon            │     │ address         │     │ description     │
│ color           │     │ city            │     │ logo_url        │
│ sort_order      │     │ state           │     │ website         │
└────────┬────────┘     │ zip             │     │ instagram       │
         │              │ lat/lng         │     └────────┬────────┘
         │              │ website         │              │
         │              │ image_url       │              │
         │              └────────┬────────┘              │
         │                       │                       │
         │              ┌────────┴───────────────────────┤
         │              │                                │
         ▼              ▼                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                            events                                │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)                                                          │
│ title, slug, description                                         │
│ type_id (FK) ─────────────────────────────────────► event_types │
│ category_id (FK)                                                 │
│ venue_id (FK)                                                    │
│ organizer_id (FK)                                                │
│ start_at, end_at, is_all_day                                    │
│ image_url, flyer_url, source_url                                │
│ ticket_url, price_min, price_max, is_free                       │
│ status                                                           │
└─────────────────────────────────────────────────────────────────┘
         │
         │ (junction)
         ▼
┌─────────────────┐     ┌─────────────────┐
│   event_tags    │────▶│      tags       │
├─────────────────┤     ├─────────────────┤
│ event_id (FK)   │     │ id (PK)         │
│ tag_id (FK)     │     │ name            │
└─────────────────┘     │ slug            │
                        └─────────────────┘
```

---

## SQL Migrations

### Enable Required Extensions

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

### Event Types Table

```sql
CREATE TABLE event_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for sorting
CREATE INDEX idx_event_types_sort ON event_types(sort_order);

-- RLS
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read event_types"
  ON event_types FOR SELECT
  USING (true);

CREATE POLICY "Admin manage event_types"
  ON event_types FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
```

---

### Categories Table

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50),
  color VARCHAR(20),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_sort ON categories(sort_order);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Admin manage categories"
  ON categories FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
```

---

### Tags Table

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tags_slug ON tags(slug);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read tags"
  ON tags FOR SELECT
  USING (true);

CREATE POLICY "Admin manage tags"
  ON tags FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
```

---

### Venues Table

```sql
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  address VARCHAR(500),
  city VARCHAR(100) DEFAULT 'Milwaukee',
  state VARCHAR(50) DEFAULT 'WI',
  zip VARCHAR(20),
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  website VARCHAR(500),
  image_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_venues_slug ON venues(slug);
CREATE INDEX idx_venues_city ON venues(city);

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read venues"
  ON venues FOR SELECT
  USING (true);

CREATE POLICY "Admin manage venues"
  ON venues FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
```

---

### Organizers Table

```sql
CREATE TABLE organizers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  logo_url VARCHAR(500),
  website VARCHAR(500),
  instagram_handle VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizers_slug ON organizers(slug);

ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read organizers"
  ON organizers FOR SELECT
  USING (true);

CREATE POLICY "Admin manage organizers"
  ON organizers FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
```

---

### Events Table

```sql
CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'archived');

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Core fields
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) NOT NULL UNIQUE,
  description TEXT,
  
  -- Relationships
  type_id UUID REFERENCES event_types(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  organizer_id UUID REFERENCES organizers(id) ON DELETE SET NULL,
  
  -- Date/Time
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  is_all_day BOOLEAN DEFAULT FALSE,
  
  -- Media
  image_url VARCHAR(500),
  flyer_url VARCHAR(500),
  
  -- Links
  source_url VARCHAR(500),
  ticket_url VARCHAR(500),
  
  -- Pricing
  price_min DECIMAL(10, 2),
  price_max DECIMAL(10, 2),
  is_free BOOLEAN DEFAULT FALSE,
  
  -- Status
  status event_status DEFAULT 'draft',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_at ON events(start_at);
CREATE INDEX idx_events_category ON events(category_id);
CREATE INDEX idx_events_venue ON events(venue_id);
CREATE INDEX idx_events_organizer ON events(organizer_id);

-- Composite index for common queries
CREATE INDEX idx_events_status_start ON events(status, start_at)
  WHERE status = 'published';

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Public can only see published events
CREATE POLICY "Public read published events"
  ON events FOR SELECT
  USING (status = 'published');

-- Admin can see and manage all events
CREATE POLICY "Admin read all events"
  ON events FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin manage events"
  ON events FOR INSERT
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin update events"
  ON events FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin delete events"
  ON events FOR DELETE
  USING (auth.role() = 'authenticated');
```

---

### Event Tags Junction Table

```sql
CREATE TABLE event_tags (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, tag_id)
);

CREATE INDEX idx_event_tags_event ON event_tags(event_id);
CREATE INDEX idx_event_tags_tag ON event_tags(tag_id);

ALTER TABLE event_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read event_tags"
  ON event_tags FOR SELECT
  USING (true);

CREATE POLICY "Admin manage event_tags"
  ON event_tags FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
```

---

### Updated At Trigger

```sql
-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
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
```

---

## Seed Data

### Event Types

```sql
INSERT INTO event_types (name, slug, description, sort_order) VALUES
  ('Single Event', 'single-event', 'A one-time event', 1),
  ('Series', 'series', 'A multi-session event like a class or workshop series', 2),
  ('Festival', 'festival', 'A multi-day event with multiple acts or activities', 3),
  ('Camp', 'camp', 'A day camp, kids camp, or immersive multi-day experience', 4),
  ('Workshop', 'workshop', 'A single hands-on learning session', 5),
  ('Recurring', 'recurring', 'An ongoing event like weekly trivia or monthly meetups', 6);
```

### Categories

```sql
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
```

### Tags

```sql
INSERT INTO tags (name, slug) VALUES
  ('free', 'free'),
  ('outdoor', 'outdoor'),
  ('indoor', 'indoor'),
  ('21+', '21-plus'),
  ('all-ages', 'all-ages'),
  ('family-friendly', 'family-friendly'),
  ('dog-friendly', 'dog-friendly'),
  ('date-night', 'date-night'),
  ('first-timer-friendly', 'first-timer-friendly'),
  ('local-artist', 'local-artist'),
  ('lgbtq+', 'lgbtq-plus'),
  ('accessible', 'accessible'),
  ('registration-required', 'registration-required'),
  ('drop-in', 'drop-in'),
  ('food-included', 'food-included'),
  ('drinks-included', 'drinks-included');
```

---

## Phase 2 Additions (Reference Only)

```sql
-- Series table (implement in Phase 2)
CREATE TABLE series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) NOT NULL UNIQUE,
  description TEXT,
  type_id UUID REFERENCES event_types(id),
  category_id UUID REFERENCES categories(id),
  venue_id UUID REFERENCES venues(id),
  organizer_id UUID REFERENCES organizers(id),
  image_url VARCHAR(500),
  flyer_url VARCHAR(500),
  source_url VARCHAR(500),
  recurrence_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add series_id to events
ALTER TABLE events ADD COLUMN series_id UUID REFERENCES series(id) ON DELETE SET NULL;

-- Series tags junction
CREATE TABLE series_tags (
  series_id UUID REFERENCES series(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (series_id, tag_id)
);
```

---

## Phase 3 Additions (Reference Only)

```sql
-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(100),
  avatar_url VARCHAR(500),
  zip_code VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookmarks
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  series_id UUID REFERENCES series(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id),
  CONSTRAINT bookmark_target CHECK (
    (event_id IS NOT NULL AND series_id IS NULL) OR
    (event_id IS NULL AND series_id IS NOT NULL)
  )
);
```

---

## Phase 4 Additions (Reference Only)

```sql
-- Businesses
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  logo_url VARCHAR(500),
  website VARCHAR(500),
  owner_id UUID REFERENCES profiles(id),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add business relationships
ALTER TABLE venues ADD COLUMN business_id UUID REFERENCES businesses(id);
ALTER TABLE organizers ADD COLUMN business_id UUID REFERENCES businesses(id);
ALTER TABLE organizers ADD COLUMN user_id UUID REFERENCES profiles(id);
ALTER TABLE events ADD COLUMN submitted_by UUID REFERENCES profiles(id);
ALTER TABLE events ADD COLUMN business_id UUID REFERENCES businesses(id);
```

---

## Useful Queries

### Get upcoming published events with relations

```sql
SELECT 
  e.*,
  c.name as category_name,
  c.slug as category_slug,
  c.color as category_color,
  v.name as venue_name,
  v.address as venue_address,
  o.name as organizer_name,
  ARRAY_AGG(t.name) as tags
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN venues v ON e.venue_id = v.id
LEFT JOIN organizers o ON e.organizer_id = o.id
LEFT JOIN event_tags et ON e.id = et.event_id
LEFT JOIN tags t ON et.tag_id = t.id
WHERE e.status = 'published'
  AND e.start_at >= NOW()
GROUP BY e.id, c.id, v.id, o.id
ORDER BY e.start_at ASC;
```

### Get events by category

```sql
SELECT e.* FROM events e
JOIN categories c ON e.category_id = c.id
WHERE c.slug = 'music'
  AND e.status = 'published'
  AND e.start_at >= NOW()
ORDER BY e.start_at ASC;
```

### Get events by tag

```sql
SELECT DISTINCT e.* FROM events e
JOIN event_tags et ON e.id = et.event_id
JOIN tags t ON et.tag_id = t.id
WHERE t.slug = 'free'
  AND e.status = 'published'
  AND e.start_at >= NOW()
ORDER BY e.start_at ASC;
```
