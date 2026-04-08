-- Fix: RLS helper functions were reading claims from JWT root level,
-- but Supabase stores app_metadata under auth.jwt() -> 'app_metadata'

CREATE OR REPLACE FUNCTION get_my_church_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT NULLIF(auth.jwt() -> 'app_metadata' ->> 'church_id', '')::UUID;
$$;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT NULLIF(auth.jwt() -> 'app_metadata' ->> 'role', '');
$$;
