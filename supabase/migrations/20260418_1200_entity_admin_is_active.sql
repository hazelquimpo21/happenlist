-- Entity Admin CRUD — Stage 1
-- Adds is_active to performers so soft-delete works consistently
-- with organizers, locations, membership_organizations.
-- See: docs/phase-reports/entity-admin-decisions.md

ALTER TABLE public.performers
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_performers_is_active
  ON public.performers (is_active)
  WHERE is_active = false;

COMMENT ON COLUMN public.performers.is_active IS
  'Soft-delete flag. false = hidden from admin list and public surfaces.';
