# Happenlist: Database Schema

## Overview

Happenlist uses Supabase (PostgreSQL) as its database. This document defines all tables, relationships, indexes, and Row Level Security (RLS) policies.

---

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  CATEGORIES │       │  LOCATIONS  │       │ ORGANIZERS  │
└──────┬──────┘       └──────┬──────┘       └──────┬──────┘
       │                     │                     │
       │ 1:many              │ 1:many              │ 1:many
       │                     │                     │
       └──────────┬──────────┴──────────┬──────────┘
                  │                     │
                  ▼                     │
           ┌─────────────┐              │
           │   EVENTS    │◄─────────────┘
           └──────┬──────┘
                  │
                  │ 1:many
                  │
    ┌─────────────┼─────────────┬─────────────────────┐
    │             │             │                     │
    ▼             ▼             ▼                     ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐
│   HEARTS    │ │   SERIES    │ │EVENT_DRAFTS │ │ADMIN_AUDIT_LOG  │
│  (Phase 4)  │ │  (Phase 2)  │ │  (Phase 3)  │ │   (Phase 3)     │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────────┘
```

---

## Tables

### categories

Stores event categories for filtering and organization.

```sql
CREATE TABLE categories (
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

-- Indexes
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_sort ON categories(sort_order);
CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = true;
```

**Sample Data:**
```sql
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
  ('Theater & Film', 'theater-film', 'Clapperboard', 10);
```

---

### locations

Stores venue information.

```sql
CREATE TABLE locations (
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

-- Indexes
CREATE INDEX idx_locations_slug ON locations(slug);
CREATE INDEX idx_locations_city ON locations(city);
CREATE INDEX idx_locations_type ON locations(venue_type);
CREATE INDEX idx_locations_active ON locations(is_active) WHERE is_active = true;
CREATE INDEX idx_locations_geo ON locations(latitude, longitude) WHERE latitude IS NOT NULL;
```

**Venue Types:**
| Value | Description |
|-------|-------------|
| `venue` | Standard indoor venue |
| `outdoor` | Outdoor location (park, beach, etc.) |
| `online` | Virtual/online event |
| `various` | Multiple locations |
| `tbd` | Location to be announced |

---

### organizers

Stores event organizer/presenter information.

```sql
CREATE TABLE organizers (
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
  -- Example: {"facebook": "url", "instagram": "url", "twitter": "url"}
  
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

-- Indexes
CREATE INDEX idx_organizers_slug ON organizers(slug);
CREATE INDEX idx_organizers_active ON organizers(is_active) WHERE is_active = true;
```

---

### events

The core events table.

```sql
CREATE TABLE events (
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
  -- Example: {"frequency": "weekly", "interval": 1, "days": [2, 4], "until": "2025-06-01"}
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
  flyer_url TEXT,                     -- Event flyer/poster (separate from hero)
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
CREATE INDEX idx_events_instance_date ON events(instance_date);
CREATE INDEX idx_events_status_date ON events(status, instance_date) 
  WHERE status = 'published';
CREATE INDEX idx_events_category ON events(category_id);
CREATE INDEX idx_events_location ON events(location_id);
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_slug ON events(slug);

-- Composite indexes for filtered queries
CREATE INDEX idx_events_published_future ON events(instance_date, category_id) 
  WHERE status = 'published' AND instance_date >= CURRENT_DATE;
CREATE INDEX idx_events_featured ON events(featured_order) 
  WHERE is_featured = true AND status = 'published';
CREATE INDEX idx_events_free ON events(instance_date) 
  WHERE is_free = true AND status = 'published';

-- Full-text search index
CREATE INDEX idx_events_search ON events 
  USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));
```

**Status Values:**
| Value | Description |
|-------|-------------|
| `draft` | Not yet published, user editing |
| `pending_review` | Submitted, awaiting admin approval (Phase 3) |
| `changes_requested` | Admin requested changes (Phase 3) |
| `published` | Live and visible |
| `rejected` | Not accepted (Phase 3) |
| `cancelled` | Event cancelled |
| `postponed` | Postponed (date TBD) |

**Price Type Values:**
| Value | Display Logic |
|-------|---------------|
| `free` | "Free" |
| `fixed` | "$25" (uses price_low) |
| `range` | "$15–$45" (uses price_low and price_high) |
| `varies` | "Prices vary" |
| `donation` | "Pay what you can" |

**Event Type Values:**
| Value | Description |
|-------|-------------|
| `single` | One-time event |
| `recurring` | Part of recurring series (auto-generated) |
| `series_instance` | Part of a workshop/class series |

---

### hearts (Phase 3)

Stores user saved events.

```sql
CREATE TABLE hearts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, event_id)
);

-- Indexes
CREATE INDEX idx_hearts_user ON hearts(user_id);
CREATE INDEX idx_hearts_event ON hearts(event_id);
CREATE INDEX idx_hearts_user_date ON hearts(user_id, created_at DESC);
```

---

### profiles (Phase 3)

Extended user profile data.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  email_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

### series (Phase 2)

Groups multi-session events together.

```sql
CREATE TABLE series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Relations
  organizer_id UUID REFERENCES organizers(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  
  -- Series Info
  total_sessions INTEGER,
  series_type TEXT DEFAULT 'class',   -- class, camp, workshop, recurring
  
  -- Pricing (for the whole series)
  price_type TEXT,
  price_low DECIMAL(10, 2),
  price_high DECIMAL(10, 2),
  price_details TEXT,
  registration_url TEXT,
  
  -- Media
  image_url TEXT,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_series_slug ON series(slug);
CREATE INDEX idx_series_organizer ON series(organizer_id);
```

---

### event_drafts (Phase 3)

Stores incomplete event submissions for users to resume.

```sql
CREATE TABLE event_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,

  -- Draft data (flexible JSON for partial event)
  draft_data JSONB NOT NULL DEFAULT '{}',

  -- Form progress
  current_step INTEGER DEFAULT 1,
  completed_steps INTEGER[] DEFAULT ARRAY[]::INTEGER[],

  -- Series draft (if creating new series)
  series_draft_data JSONB,

  -- Link to submitted event (when complete)
  submitted_event_id UUID REFERENCES events(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '30 days'
);

-- Indexes
CREATE INDEX idx_drafts_user ON event_drafts(user_id);
CREATE INDEX idx_drafts_expires ON event_drafts(expires_at) WHERE submitted_event_id IS NULL;
```

---

### admin_audit_log (Phase 3)

Tracks admin actions on events for accountability.

```sql
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Target
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  series_id UUID REFERENCES series(id) ON DELETE CASCADE,

  -- Actor
  admin_email TEXT NOT NULL,

  -- Action details
  action TEXT NOT NULL,           -- approve, reject, request_changes, edit, delete, restore
  previous_status TEXT,
  new_status TEXT,
  message TEXT,                   -- Reason/notes

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_audit_event ON admin_audit_log(event_id);
CREATE INDEX idx_audit_admin ON admin_audit_log(admin_email);
CREATE INDEX idx_audit_date ON admin_audit_log(created_at DESC);
```

**Action Types:**
| Action | Description |
|--------|-------------|
| `approve` | Event approved, status → published |
| `reject` | Event rejected with reason |
| `request_changes` | Changes requested with message |
| `edit` | Admin edited event content |
| `delete` | Event soft-deleted |
| `restore` | Deleted event restored |

---

### Events Table Phase 3 Columns

Additional columns added to events table for submission workflow:

```sql
-- Submission tracking
ALTER TABLE events ADD COLUMN submitted_by_email TEXT;
ALTER TABLE events ADD COLUMN submitted_by_name TEXT;
ALTER TABLE events ADD COLUMN submitted_at TIMESTAMPTZ;

-- Admin review
ALTER TABLE events ADD COLUMN reviewed_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN reviewed_by TEXT;
ALTER TABLE events ADD COLUMN rejection_reason TEXT;
ALTER TABLE events ADD COLUMN change_request_message TEXT;

-- Soft delete
ALTER TABLE events ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN deleted_by TEXT;
ALTER TABLE events ADD COLUMN delete_reason TEXT;

-- Edit tracking
ALTER TABLE events ADD COLUMN last_edited_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN last_edited_by TEXT;
ALTER TABLE events ADD COLUMN edit_count INTEGER DEFAULT 0;

-- Performance indexes for Phase 3
CREATE INDEX idx_events_submitted_by ON events(submitted_by_email, created_at DESC)
  WHERE submitted_by_email IS NOT NULL;
CREATE INDEX idx_events_pending_queue ON events(status, submitted_at DESC)
  WHERE status IN ('pending_review', 'changes_requested');
CREATE INDEX idx_events_not_deleted ON events(instance_date)
  WHERE deleted_at IS NULL;
```

---

## Row Level Security (RLS) Policies

### Public Read Access (Phase 1)

```sql
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
```

### User-Specific Policies (Phase 3)

```sql
-- Hearts: users can read/write their own
ALTER TABLE hearts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own hearts"
  ON hearts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hearts"
  ON hearts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hearts"
  ON hearts FOR DELETE
  USING (auth.uid() = user_id);

-- Profiles: users can read/update their own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### Event Drafts Policies (Phase 3)

```sql
-- Event drafts: users manage their own
ALTER TABLE event_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own drafts" ON event_drafts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Submitter Policies (Phase 3)

```sql
-- Submitters can view their own events (any status)
CREATE POLICY "Submitters view own events" ON events
  FOR SELECT
  USING (
    submitted_by_email IS NOT NULL
    AND submitted_by_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Submitters can update their drafts and changes_requested events
CREATE POLICY "Submitters update own drafts" ON events
  FOR UPDATE
  USING (
    status IN ('draft', 'changes_requested')
    AND submitted_by_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    status IN ('draft', 'changes_requested', 'pending_review')
  );

-- Users can create draft events
CREATE POLICY "Users can create draft events" ON events
  FOR INSERT
  WITH CHECK (
    status = 'draft'
    AND submitted_by_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );
```

---

## Database Functions

### Update heart_count trigger

```sql
CREATE OR REPLACE FUNCTION update_event_heart_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events SET heart_count = heart_count + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events SET heart_count = heart_count - 1 WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_heart_change
  AFTER INSERT OR DELETE ON hearts
  FOR EACH ROW EXECUTE FUNCTION update_event_heart_count();
```

### Update updated_at trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all relevant tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON organizers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Useful Views

### events_with_details

```sql
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
```

### v_my_submissions (Phase 3)

View for authenticated users to see their submissions.

```sql
CREATE OR REPLACE VIEW v_my_submissions AS
SELECT
  e.id,
  e.title,
  e.slug,
  e.status,
  e.instance_date,
  e.start_datetime,
  e.image_url,
  e.submitted_at,
  e.reviewed_at,
  e.rejection_reason,
  e.change_request_message,
  e.created_at,
  e.updated_at,
  c.name as category_name,
  c.slug as category_slug,
  l.name as location_name,
  l.city as location_city,
  s.title as series_title,
  s.slug as series_slug
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN series s ON e.series_id = s.id
WHERE e.submitted_by_email IS NOT NULL
  AND e.deleted_at IS NULL
ORDER BY e.created_at DESC;
```

### v_admin_submission_queue (Phase 3)

View for admin approval queue.

```sql
CREATE OR REPLACE VIEW v_admin_submission_queue AS
SELECT
  e.*,
  c.name as category_name,
  l.name as location_name,
  l.city as location_city,
  o.name as organizer_name,
  s.title as series_title,
  (
    SELECT COUNT(*) FROM events e2
    WHERE e2.submitted_by_email = e.submitted_by_email
    AND e2.status = 'published'
  ) as submitter_approved_count
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN organizers o ON e.organizer_id = o.id
LEFT JOIN series s ON e.series_id = s.id
WHERE e.status IN ('pending_review', 'changes_requested')
  AND e.deleted_at IS NULL
ORDER BY e.submitted_at ASC NULLS LAST;
```

---

## Database Functions (Phase 3)

### Cleanup Expired Drafts

```sql
CREATE OR REPLACE FUNCTION cleanup_expired_drafts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM event_drafts
  WHERE expires_at < now()
    AND submitted_event_id IS NULL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_drafts IS 'Removes expired drafts. Run daily via cron.';
```
