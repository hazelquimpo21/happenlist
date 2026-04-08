-- Migration 00010: Atmosphere / Vibe Profile + Enrichment Fields
-- Adds talent, tagline, atmosphere dimensions, vibe tags, subcultures, crowd profile

BEGIN;

-- =====================================================================
-- TALENT / PERFORMER
-- =====================================================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS talent_name text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS talent_bio text;

-- =====================================================================
-- TAGLINE (factual one-liner distinct from short_description)
-- =====================================================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS tagline text;

-- =====================================================================
-- ATMOSPHERE SCORED DIMENSIONS (1-5 scale)
-- =====================================================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS energy_level smallint;
ALTER TABLE events ADD COLUMN IF NOT EXISTS formality smallint;
ALTER TABLE events ADD COLUMN IF NOT EXISTS crowdedness smallint;
ALTER TABLE events ADD COLUMN IF NOT EXISTS social_pressure smallint;
ALTER TABLE events ADD COLUMN IF NOT EXISTS accessibility_score smallint;

-- CHECK constraints for 1-5 range
ALTER TABLE events ADD CONSTRAINT chk_energy_level CHECK (energy_level BETWEEN 1 AND 5);
ALTER TABLE events ADD CONSTRAINT chk_formality CHECK (formality BETWEEN 1 AND 5);
ALTER TABLE events ADD CONSTRAINT chk_crowdedness CHECK (crowdedness BETWEEN 1 AND 5);
ALTER TABLE events ADD CONSTRAINT chk_social_pressure CHECK (social_pressure BETWEEN 1 AND 5);
ALTER TABLE events ADD CONSTRAINT chk_accessibility_score CHECK (accessibility_score BETWEEN 1 AND 5);

-- =====================================================================
-- VIBE TAGS & SUBCULTURES (text arrays, GIN indexed)
-- =====================================================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS vibe_tags text[] DEFAULT '{}';
ALTER TABLE events ADD COLUMN IF NOT EXISTS subcultures text[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_events_vibe_tags ON events USING GIN (vibe_tags);
CREATE INDEX IF NOT EXISTS idx_events_subcultures ON events USING GIN (subcultures);

-- =====================================================================
-- CROWD PROFILE
-- =====================================================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS noise_level text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS expected_crowd text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS dress_vibe text;

ALTER TABLE events ADD CONSTRAINT chk_noise_level
  CHECK (noise_level IN ('quiet', 'conversational', 'loud', 'deafening'));

-- =====================================================================
-- INDEXES for filterable atmosphere fields
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_events_noise_level ON events (noise_level) WHERE noise_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_energy_level ON events (energy_level) WHERE energy_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_formality ON events (formality) WHERE formality IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_social_pressure ON events (social_pressure) WHERE social_pressure IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_accessibility_score ON events (accessibility_score) WHERE accessibility_score IS NOT NULL;

COMMIT;
