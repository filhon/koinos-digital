-- ─── Session 4.6: Multi-congregation RLS + invite_type ──────────────────────

-- 1. Add invite_type column to invite_links
ALTER TABLE invite_links
  ADD COLUMN IF NOT EXISTS invite_type text NOT NULL DEFAULT 'general';

ALTER TABLE invite_links
  DROP CONSTRAINT IF EXISTS invite_links_invite_type_check;

ALTER TABLE invite_links
  ADD CONSTRAINT invite_links_invite_type_check
  CHECK (invite_type IN ('general', 'personal', 'congregation_pastor'));

-- 2. Helper: checks if the current user's church is a matrix (no parent)
CREATE OR REPLACE FUNCTION is_matrix_church()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT parent_tenant_id IS NULL FROM tenants WHERE id = get_my_church_id()),
    true
  );
$$;

-- 3. RLS: matrix leadership can SELECT child tenants
DROP POLICY IF EXISTS "tenants_select_children" ON tenants;

CREATE POLICY "tenants_select_children"
ON tenants FOR SELECT
TO authenticated
USING (
  parent_tenant_id = get_my_church_id()
  AND is_leadership()
  AND is_matrix_church()
);

-- 4. RLS: matrix leadership can SELECT members from active child tenants
DROP POLICY IF EXISTS "members_matrix_leadership_select" ON members;

CREATE POLICY "members_matrix_leadership_select"
ON members FOR SELECT
TO authenticated
USING (
  is_leadership()
  AND is_matrix_church()
  AND church_id IN (
    SELECT id FROM tenants
    WHERE parent_tenant_id = (SELECT get_my_church_id())
    AND is_active = true
  )
);

-- 5. Index to speed up parent_tenant_id lookups
CREATE INDEX IF NOT EXISTS tenants_parent_tenant_id_idx
  ON tenants (parent_tenant_id)
  WHERE parent_tenant_id IS NOT NULL;
