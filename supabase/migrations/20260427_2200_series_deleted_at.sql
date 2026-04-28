-- Add deleted_at to series for parity with events.
--
-- Why: until now, the only "destructive" admin action on series was
-- status='cancelled', which is the wrong semantics for "this should
-- never have existed." Cancelled = communicated to users that an event
-- won't happen. Deleted = soft-erased, treated as if it was never
-- created. Events already have both axes via status and deleted_at;
-- this aligns series with that model.
--
-- Public + admin queries should filter deleted_at IS NULL alongside
-- their existing status filters. See src/data/series/* and the
-- series search / cron / running-low surfaces.
--
-- Coupling:
--   src/data/superadmin/delete-series.ts dispatches on mode='cancel'|'delete'
--   to choose which axis to flip.

ALTER TABLE series ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

COMMENT ON COLUMN series.deleted_at IS
  'Soft-delete timestamp. NULL = live. Non-NULL = hidden from public + admin queries. Distinct from status=cancelled (which keeps the row visible with a "cancelled" treatment).';

-- Partial index supports the common "live series" filter without
-- bloating with deleted rows.
CREATE INDEX IF NOT EXISTS idx_series_live
  ON series (id)
  WHERE deleted_at IS NULL;
