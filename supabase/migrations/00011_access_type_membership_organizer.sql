-- Migration 00011: Access Type, Membership, Organizer fields
-- Adds access_type, attendance_mode (for events), membership, organizer_name/is_venue

BEGIN;

-- =====================================================================
-- ACCESS & ATTENDANCE
-- =====================================================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS access_type text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS attendance_mode text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS membership_required boolean DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS membership_details text;

ALTER TABLE events ADD CONSTRAINT chk_access_type
  CHECK (access_type IN ('open', 'ticketed', 'rsvp', 'pay_at_door', 'registration', 'membership', 'invite_only'));

ALTER TABLE events ADD CONSTRAINT chk_attendance_mode
  CHECK (attendance_mode IN ('drop_in', 'registered', 'hybrid'));

-- =====================================================================
-- ORGANIZER NAME & IS_VENUE flag
-- =====================================================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_name text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_is_venue boolean DEFAULT false;

-- =====================================================================
-- INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_events_access_type ON events (access_type) WHERE access_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_attendance_mode ON events (attendance_mode) WHERE attendance_mode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_membership_required ON events (membership_required) WHERE membership_required = true;

COMMIT;
