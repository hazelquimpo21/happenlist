-- ============================================================================
-- 🔒 FIX FUNCTION SECURITY - SET SEARCH_PATH
-- ============================================================================
-- Created: 2026-01-06
-- Purpose: Set search_path on functions to prevent search_path injection attacks
--
-- Functions without search_path set are vulnerable to search_path injection
-- where malicious users could create objects in schemas that get searched first.
--
-- For SECURITY DEFINER functions, we MUST set search_path to prevent privilege escalation.
-- For SECURITY INVOKER functions, it's still recommended for defense in depth.
-- ============================================================================

-- ============================================================================
-- get_series_events (overload with 3 parameters)
-- ============================================================================
-- SECURITY INVOKER function - set search_path for defense in depth

CREATE OR REPLACE FUNCTION public.get_series_events(
  p_series_id uuid, 
  p_include_past boolean DEFAULT false, 
  p_limit integer DEFAULT 50
)
RETURNS TABLE(
  event_id uuid, 
  title text, 
  slug text, 
  instance_date date, 
  start_datetime timestamp with time zone, 
  end_datetime timestamp with time zone, 
  series_sequence integer, 
  status text, 
  location_name text, 
  location_slug text
)
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $function$
BEGIN
  RETURN QUERY
  SELECT e.id, e.title, e.slug, e.instance_date, e.start_datetime, e.end_datetime,
         e.series_sequence, e.status, l.name, l.slug
  FROM events e LEFT JOIN locations l ON e.location_id = l.id
  WHERE e.series_id = p_series_id AND e.status = 'published'
    AND (p_include_past OR e.instance_date >= CURRENT_DATE)
  ORDER BY e.series_sequence ASC NULLS LAST, e.instance_date ASC
  LIMIT p_limit;
END;
$function$;


-- ============================================================================
-- log_admin_action (overload with parameters)
-- ============================================================================
-- SECURITY DEFINER function - MUST set search_path to prevent privilege escalation

CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action text, 
  p_entity_type text, 
  p_entity_id uuid, 
  p_admin_id text DEFAULT NULL::text, 
  p_admin_email text DEFAULT NULL::text, 
  p_changes jsonb DEFAULT NULL::jsonb, 
  p_notes text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_audit_log (
    action,
    entity_type,
    entity_id,
    admin_id,
    admin_email,
    changes,
    notes
  ) VALUES (
    p_action,
    p_entity_type,
    p_entity_id,
    p_admin_id,
    p_admin_email,
    p_changes,
    p_notes
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$function$;


-- ============================================================================
-- validate_event_image (overload with 4 parameters)
-- ============================================================================
-- SECURITY DEFINER function - MUST set search_path to prevent privilege escalation

CREATE OR REPLACE FUNCTION public.validate_event_image(
  p_event_id uuid, 
  p_is_valid boolean, 
  p_validated_image_url text DEFAULT NULL::text, 
  p_notes text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  UPDATE events
  SET 
    image_validated = p_is_valid,
    image_validated_at = now(),
    image_validation_notes = p_notes,
    -- If valid URL provided, update the image_url
    image_url = CASE 
      WHEN p_is_valid THEN COALESCE(p_validated_image_url, image_url) 
      ELSE NULL 
    END
  WHERE id = p_event_id;
END;
$function$;


-- ============================================================================
-- FIX SERVICE ROLE POLICY
-- ============================================================================
-- The "Service role can manage audit logs" policy uses `true` which bypasses RLS.
-- However, the service role already bypasses RLS by default in Supabase.
-- This policy is redundant and can be removed, OR we can make it more explicit.
--
-- Option 1: Remove it (service role bypasses RLS anyway)
-- Option 2: Make it explicit by checking for service role
--
-- We'll remove it since it's redundant and the linter flags it as a security issue.

DROP POLICY IF EXISTS "Service role can manage audit logs" ON public.admin_audit_log;

-- Note: Service role already bypasses RLS by default in Supabase.
-- If you need explicit service role access, use:
-- CREATE POLICY "Service role can manage audit logs" ON public.admin_audit_log
--   FOR ALL
--   TO service_role
--   USING (true)
--   WITH CHECK (true);
--
-- However, this is still redundant since service_role bypasses RLS by default.


-- ============================================================================
-- 📝 NOTES
-- ============================================================================
--
-- Function Security:
-- - All functions now have search_path explicitly set
-- - SECURITY DEFINER functions MUST have search_path set to prevent privilege escalation
-- - SECURITY INVOKER functions should also have it set for defense in depth
-- - Using 'public, pg_temp' allows access to public schema and temp objects
--
-- Service Role Policy:
-- - Removed redundant policy since service_role bypasses RLS by default
-- - If you need explicit service role access, recreate with TO service_role clause
--
-- Auth Leaked Password Protection:
-- - This is an Auth setting, not a database migration
-- - Enable it in: Supabase Dashboard → Authentication → Settings → Password
-- - Or via API: Update auth config to enable password leak detection
--
-- ============================================================================


