-- Unique guard against duplicate series instances at the same time.
--
-- Why: multiple code paths can insert into events with a series_id
-- (submission flow, make-recurring, attach-series, regenerate-dates,
-- and the extend-recurring-series cron). Without a database constraint,
-- a race or a logic bug could create duplicate instances at the same
-- moment in the same series.
--
-- Why start_datetime, not instance_date:
--   Same-day multi-show events are legitimate (Bluey's Big Play 10am
--   matinee + 1pm + 4pm under one series; theatre runs with multiple
--   shows per day). Those share instance_date but have distinct
--   start_datetimes. Using start_datetime catches true dupes (same
--   time, same series) without false-positive on multi-shows.
--
-- Cancelled rows are excluded so soft-cancel + re-add of the same
-- moment still works.
--
-- Coupling:
--   src/data/series/materialize-instances.ts pre-filters dates against
--   existing rows; this index is the backstop, not the primary guard.

CREATE UNIQUE INDEX IF NOT EXISTS events_series_start_datetime_uniq
  ON events (series_id, start_datetime)
  WHERE series_id IS NOT NULL
    AND start_datetime IS NOT NULL
    AND status <> 'cancelled';
