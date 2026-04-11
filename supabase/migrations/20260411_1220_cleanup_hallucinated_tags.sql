-- =============================================================================
-- MIGRATION: Cleanup hallucinated vibe_tags / subcultures
-- =============================================================================
-- Filed under Phase 1, Session A2 of the Smart Filters Roadmap.
-- See: docs/filter-roadmap.md
--
-- WHY THIS EXISTS
-- ---------------
-- The atmosphere analyzer in happenlist_scraper has had `enum: VIBE_TAGS` /
-- `enum: SUBCULTURES` constraints in its OpenAI function-calling schema since
-- the beginning, but GPT-4o-mini does NOT strictly enforce enum constraints.
-- As a result the production database contains ~50 distinct hallucinated
-- vibe tags ("casual", "inclusive", "lively", "community", "engaging", ...)
-- and ~106 distinct hallucinated subcultures, on top of the 18 / 23 valid
-- values defined in the controlled vocabulary.
--
-- Audit results from 2026-04-11 (288 published events / 238 not-deleted):
--   vibe_tags:    9 distinct valid (~94 occurrences)
--                 ~50 distinct hallucinated (~400+ occurrences)
--                 Top hallucinations: casual=133, inclusive=91, lively=68
--   subcultures: 17 distinct valid (134 occurrences)
--                106 distinct hallucinated (209 occurrences)
--   Affected events: 152 / 238 (64%)
--
-- Session A1 (just shipped) added post-extraction validation in the scraper
-- so new scrapes can never insert hallucinated tags. This migration scrubs
-- the historical data so the soon-to-ship Happenlist filter UI doesn't
-- expose junk taxonomy values to users.
--
-- WHAT THIS DOES
-- --------------
-- 1. Creates `tag_cleanup_log` — a side table capturing every dropped value
--    with the event_id, field, and timestamp. Lets us spot-check what was
--    removed before committing the destructive part, and gives us a clean
--    "what would the old data have looked like" record for the atmosphere
--    backfill that follows.
-- 2. Defines the canonical vocabulary inline (matches
--    happenlist_scraper/backend/lib/vocabularies.js — must stay in sync;
--    drift is caught during phase review).
-- 3. For every event, computes the array intersection of its existing
--    vibe_tags / subcultures with the canonical vocabulary, and writes the
--    cleaned array back to the row. Records dropped values into
--    tag_cleanup_log in the same statement.
-- 4. Runs in a single transaction so a partial failure leaves the data
--    untouched.
--
-- WHAT THIS DOES NOT DO
-- ---------------------
-- - Does NOT touch noise_level (audit confirmed all 152 values are valid).
-- - Does NOT touch good_for[] (audit shows it's clean).
-- - Does NOT delete or modify the side table on rollback — the log is the
--   audit trail and is meant to outlive the cleanup pass.
-- - Does NOT re-extract any tags. The atmosphere backfill script
--   (happenlist_scraper/backend/scripts/reanalyze-atmosphere.js) handles
--   re-population for events whose atmosphere was never fully populated.
--
-- ROLLBACK
-- --------
-- Atomic rollback of the data scrub is automatic via the transaction. If
-- the migration is rolled back AFTER it commits, you can reconstruct each
-- affected event's old vibe_tags / subcultures by aggregating
-- tag_cleanup_log:
--
--   SELECT event_id, field, array_agg(dropped_value)
--   FROM tag_cleanup_log
--   WHERE migration = '20260411_1220_cleanup_hallucinated_tags'
--   GROUP BY event_id, field;
--
-- IF YOU CHANGE THIS FILE
-- -----------------------
-- - Keep the canonical vocab arrays byte-identical with
--   happenlist_scraper/backend/lib/vocabularies.js (VIBE_TAGS, SUBCULTURES).
-- - Update the Happenlist mirror at src/lib/constants/vocabularies.ts in
--   the same commit.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. SIDE TABLE: tag_cleanup_log
-- -----------------------------------------------------------------------------
-- One row per dropped tag occurrence. We keep this around indefinitely as an
-- audit trail and for any future re-extraction needs.
CREATE TABLE IF NOT EXISTS tag_cleanup_log (
  id           bigserial PRIMARY KEY,
  event_id     uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  field        text NOT NULL,             -- 'vibe_tags' or 'subcultures'
  dropped_value text NOT NULL,            -- the hallucinated value we removed
  migration    text NOT NULL,             -- this migration's name, for filtering
  cleaned_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tag_cleanup_log_event ON tag_cleanup_log(event_id);
CREATE INDEX IF NOT EXISTS idx_tag_cleanup_log_field ON tag_cleanup_log(field);
CREATE INDEX IF NOT EXISTS idx_tag_cleanup_log_value ON tag_cleanup_log(dropped_value);

COMMENT ON TABLE tag_cleanup_log IS
  'Audit trail of tag values removed from events.vibe_tags / events.subcultures '
  'during cleanup migrations. Each row = one (event_id, field, dropped_value) tuple. '
  'Primarily used for spot-checking cleanup migrations and as a recovery hatch.';

-- -----------------------------------------------------------------------------
-- 2. CANONICAL VOCABULARIES
-- -----------------------------------------------------------------------------
-- Mirrors happenlist_scraper/backend/lib/vocabularies.js. If you change one,
-- change both. Phase reviews verify byte-identical match.
CREATE TEMP TABLE _valid_vibe_tags(tag text PRIMARY KEY);
INSERT INTO _valid_vibe_tags(tag) VALUES
  ('cozy'), ('rowdy'), ('artsy'), ('underground'), ('bougie'), ('family-chaos'),
  ('chill'), ('hype'), ('intimate'), ('festival-energy'), ('nerdy'), ('spiritual'),
  ('competitive'), ('romantic'), ('diy'), ('corporate'), ('nostalgic'), ('experimental');

CREATE TEMP TABLE _valid_subcultures(tag text PRIMARY KEY);
INSERT INTO _valid_subcultures(tag) VALUES
  ('indie-music'), ('hip-hop'), ('edm'), ('punk-diy'), ('jazz'), ('country'),
  ('craft-beer'), ('wine'), ('foodie'), ('fitness'), ('yoga-wellness'), ('tech'),
  ('startup'), ('queer'), ('latinx'), ('art-scene'), ('theater-kids'), ('outdoorsy'),
  ('gaming'), ('sneakerhead'), ('vintage'), ('academia'), ('maker');

-- -----------------------------------------------------------------------------
-- 3. LOG WHAT WE'RE ABOUT TO DROP
-- -----------------------------------------------------------------------------
-- Scan every event with non-empty arrays, unnest, find the values that are
-- NOT in the vocabulary, and write one row per dropped occurrence to the log.
--
-- We do this BEFORE the UPDATE so the log reflects the pre-cleanup state.
INSERT INTO tag_cleanup_log (event_id, field, dropped_value, migration)
SELECT
  e.id,
  'vibe_tags',
  v.tag,
  '20260411_1220_cleanup_hallucinated_tags'
FROM events e
CROSS JOIN LATERAL unnest(e.vibe_tags) AS v(tag)
WHERE e.vibe_tags IS NOT NULL
  AND array_length(e.vibe_tags, 1) > 0
  AND v.tag NOT IN (SELECT tag FROM _valid_vibe_tags);

INSERT INTO tag_cleanup_log (event_id, field, dropped_value, migration)
SELECT
  e.id,
  'subcultures',
  s.tag,
  '20260411_1220_cleanup_hallucinated_tags'
FROM events e
CROSS JOIN LATERAL unnest(e.subcultures) AS s(tag)
WHERE e.subcultures IS NOT NULL
  AND array_length(e.subcultures, 1) > 0
  AND s.tag NOT IN (SELECT tag FROM _valid_subcultures);

-- -----------------------------------------------------------------------------
-- 4. SCRUB THE EVENTS TABLE
-- -----------------------------------------------------------------------------
-- For each event, replace the array with the subset of values that are in
-- the canonical vocabulary. Uses a correlated subquery with unnest +
-- array_agg + a WHERE filter so the rewrite is deterministic and preserves
-- the original ordering of values that survive.
--
-- COALESCE(..., '{}') guarantees we never write NULL into the column —
-- the schema default is '{}' and the filter UI assumes never-null arrays.
UPDATE events
SET vibe_tags = COALESCE(
  (SELECT array_agg(t ORDER BY ord)
   FROM unnest(vibe_tags) WITH ORDINALITY AS u(t, ord)
   WHERE t IN (SELECT tag FROM _valid_vibe_tags)),
  '{}'::text[]
)
WHERE vibe_tags IS NOT NULL
  AND array_length(vibe_tags, 1) > 0
  -- Only touch rows that actually have something to drop. Avoids needless
  -- row-version churn for already-clean events.
  AND EXISTS (
    SELECT 1
    FROM unnest(vibe_tags) AS t
    WHERE t NOT IN (SELECT tag FROM _valid_vibe_tags)
  );

UPDATE events
SET subcultures = COALESCE(
  (SELECT array_agg(t ORDER BY ord)
   FROM unnest(subcultures) WITH ORDINALITY AS u(t, ord)
   WHERE t IN (SELECT tag FROM _valid_subcultures)),
  '{}'::text[]
)
WHERE subcultures IS NOT NULL
  AND array_length(subcultures, 1) > 0
  AND EXISTS (
    SELECT 1
    FROM unnest(subcultures) AS t
    WHERE t NOT IN (SELECT tag FROM _valid_subcultures)
  );

-- -----------------------------------------------------------------------------
-- 5. SUMMARY (visible in migration output)
-- -----------------------------------------------------------------------------
-- These two SELECTs surface the count of log rows added so the operator
-- running the migration sees the impact at a glance.
DO $$
DECLARE
  vibe_dropped int;
  sub_dropped int;
  events_touched int;
BEGIN
  SELECT COUNT(*) INTO vibe_dropped
  FROM tag_cleanup_log
  WHERE migration = '20260411_1220_cleanup_hallucinated_tags'
    AND field = 'vibe_tags';

  SELECT COUNT(*) INTO sub_dropped
  FROM tag_cleanup_log
  WHERE migration = '20260411_1220_cleanup_hallucinated_tags'
    AND field = 'subcultures';

  SELECT COUNT(DISTINCT event_id) INTO events_touched
  FROM tag_cleanup_log
  WHERE migration = '20260411_1220_cleanup_hallucinated_tags';

  RAISE NOTICE '[migration:cleanup-hallucinated-tags] Dropped % vibe_tag occurrences and % subculture occurrences across % events',
    vibe_dropped, sub_dropped, events_touched;
END $$;

DROP TABLE _valid_vibe_tags;
DROP TABLE _valid_subcultures;

COMMIT;
