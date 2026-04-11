-- =============================================================================
-- MIGRATION: event_views — view tracking infrastructure for Phase 3 trending
-- =============================================================================
-- Filed under Phase 1, Session B3 of the Smart Filters Roadmap.
-- See: docs/filter-roadmap.md and docs/phase-reports/phase-1-progress.md
--
-- WHY THIS EXISTS
-- ---------------
-- Phase 3 ships a "trending" sort on /events that ranks by recent view
-- velocity. That sort needs historical data to be useful — a sort with no
-- accumulated views is just random noise. So Phase 1 ships the *infrastructure*
-- (this table + insertion path) and lets it bake for ~4 weeks before Phase 3
-- starts consuming it.
--
-- THIS TABLE IS WRITTEN TO BUT NOT YET READ FROM. The /admin/views dashboard
-- is the only consumer in Phase 1 and exists purely as a sanity check that
-- the insertion path is working.
--
-- WHAT THIS DOES
-- --------------
-- 1. Creates `event_views` table:
--      - id            bigserial pk
--      - event_id      uuid fk → events(id) on delete cascade
--      - viewed_at     timestamptz default now() (UTC)
--      - session_id    text not null (anon-tracked, see ViewTracker.tsx)
--      - user_id       uuid nullable (set when an authenticated user is
--                      viewing — Phase 3+ may use this for personalization)
--      - view_date     date — generated stored column, the Chicago-local
--                      calendar date of viewed_at. Used by the unique index
--                      so "1 view per session per event per day" honors the
--                      user's local day boundary, not UTC midnight.
--
-- 2. Unique index `event_views_event_session_day_uidx` on
--    (event_id, session_id, view_date) — enforces idempotent insertion.
--    A user refreshing 50 times on the same day inserts 1 row, not 50.
--
-- 3. Index `event_views_event_viewed_at_idx` on (event_id, viewed_at desc)
--    for the future trending query: "rows for event X in the last 7 days".
--
-- 4. Row Level Security:
--      - INSERT: granted to anon + authenticated (anyone visiting an event
--        page records a view). The unique index is the dedup safety net.
--      - SELECT: NOT granted to anon/authenticated. The /admin/views
--        dashboard goes through the service-role admin client (which
--        bypasses RLS) — this matches the rest of the project's admin
--        pattern (see src/lib/supabase/admin.ts and CLAUDE.md).
--      - UPDATE / DELETE: not granted. View rows are append-only.
--
-- 5. Postgres function `record_event_view(p_event_id, p_session_id,
--    p_user_id default null) → boolean`:
--      - Wraps the INSERT … ON CONFLICT DO NOTHING.
--      - Returns true if the insert took, false if a duplicate was skipped.
--      - SECURITY DEFINER so anon callers don't need direct INSERT grants.
--      - Function owner is `postgres`; search_path is locked to public to
--        prevent search-path injection per Supabase advisor recommendations.
--      - EXECUTE granted to anon + authenticated.
--
-- WHAT TO TOUCH IF YOU CHANGE THIS
-- --------------------------------
-- - src/data/events/record-view.ts            — server action wrapper
-- - src/components/events/view-tracker.tsx    — the only mounting point
-- - src/app/event/[slug]/page.tsx              — where ViewTracker is mounted
-- - src/app/admin/views/page.tsx               — sanity dashboard (admin client)
-- - src/lib/supabase/types.ts                  — regenerate after applying
--
-- BAKING TIMELINE
-- ---------------
-- Re-check row count at the start of Phase 3. Pre-flight target before
-- enabling the trending sort: >1000 rows distributed across >50 events.
-- =============================================================================

BEGIN;

-- 1. Table -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_views (
  id          bigserial PRIMARY KEY,
  event_id    uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  viewed_at   timestamptz NOT NULL DEFAULT now(),
  session_id  text NOT NULL,
  user_id     uuid NULL,
  view_date   date GENERATED ALWAYS AS (
    ((viewed_at AT TIME ZONE 'America/Chicago')::date)
  ) STORED
);

COMMENT ON TABLE public.event_views IS
  'Per-session-per-day event view records. Phase 1 (B3) writes; Phase 3 reads for trending sort. See supabase/migrations/20260411_1900_event_views.sql header.';

COMMENT ON COLUMN public.event_views.session_id IS
  'Anonymous client session id (cookie hl_sid). Format: sess_<16 hex chars>. Generated server-side on first event view in a session.';

COMMENT ON COLUMN public.event_views.view_date IS
  'Chicago-local calendar date of viewed_at. Generated stored. Used by the unique index so the per-day dedup honors the user''s local day boundary.';

-- 2. Indexes -----------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS event_views_event_session_day_uidx
  ON public.event_views (event_id, session_id, view_date);

CREATE INDEX IF NOT EXISTS event_views_event_viewed_at_idx
  ON public.event_views (event_id, viewed_at DESC);

-- 3. Row Level Security ------------------------------------------------------
ALTER TABLE public.event_views ENABLE ROW LEVEL SECURITY;

-- INSERT: anyone (anon + authenticated) — view tracking is public.
DROP POLICY IF EXISTS event_views_insert_public ON public.event_views;
CREATE POLICY event_views_insert_public
  ON public.event_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No SELECT / UPDATE / DELETE policies. Service-role bypasses RLS, so the
-- /admin/views dashboard reads via createAdminClient(); regular clients
-- cannot read view rows at all.

-- 4. Insertion function ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_event_view(
  p_event_id uuid,
  p_session_id text,
  p_user_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted_id bigint;
BEGIN
  -- Defensive: bail on obviously invalid input rather than insert garbage.
  IF p_event_id IS NULL OR p_session_id IS NULL OR length(p_session_id) = 0 THEN
    RETURN false;
  END IF;

  INSERT INTO public.event_views (event_id, session_id, user_id)
  VALUES (p_event_id, p_session_id, p_user_id)
  ON CONFLICT (event_id, session_id, view_date) DO NOTHING
  RETURNING id INTO v_inserted_id;

  RETURN v_inserted_id IS NOT NULL;
END;
$$;

COMMENT ON FUNCTION public.record_event_view(uuid, text, uuid) IS
  'Idempotent view recording. Returns true if a row was inserted, false if a duplicate (event_id, session_id, view_date) was silently skipped. SECURITY DEFINER so anon clients can call without direct table grants.';

-- Lock down ownership for SECURITY DEFINER hygiene.
ALTER FUNCTION public.record_event_view(uuid, text, uuid) OWNER TO postgres;

-- Grant EXECUTE to public clients.
REVOKE ALL ON FUNCTION public.record_event_view(uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_event_view(uuid, text, uuid) TO anon, authenticated;

COMMIT;

-- =============================================================================
-- POST-APPLY SANITY CHECK (run manually after applying)
-- -----------------------------------------------------------------------------
-- 1) Insert a test row:
--      SELECT public.record_event_view(
--        (SELECT id FROM events WHERE deleted_at IS NULL LIMIT 1),
--        'sess_test1234567890',
--        NULL
--      );  -- expect: true
--
-- 2) Run it again with the same args:
--      SELECT public.record_event_view(
--        (SELECT id FROM events WHERE deleted_at IS NULL LIMIT 1),
--        'sess_test1234567890',
--        NULL
--      );  -- expect: false (unique index suppressed it)
--
-- 3) Verify:
--      SELECT count(*) FROM event_views WHERE session_id = 'sess_test1234567890';
--      -- expect: 1
--
-- 4) Cleanup:
--      DELETE FROM event_views WHERE session_id = 'sess_test1234567890';
-- =============================================================================
