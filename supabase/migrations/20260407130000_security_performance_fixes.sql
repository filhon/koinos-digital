-- 20260407130000_security_performance_fixes.sql
-- Correções de segurança e performance identificadas pelos advisors do Supabase

-- ============================================================
-- 1. MOVER pg_trgm PARA SCHEMA extensions
-- ============================================================

DROP EXTENSION pg_trgm CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Recria o índice GIN (foi removido pelo CASCADE)
SET search_path = public, extensions;
CREATE INDEX idx_members_name_gin ON members USING GIN (name gin_trgm_ops);
RESET search_path;

-- ============================================================
-- 2. FIX search_path NAS FUNÇÕES (previne schema hijacking)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION family_link_bidirectional_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    reverse_rel relationship_type;
    target_gender gender_type;
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    IF NEW.relationship = 'cônjuge' THEN
        reverse_rel := 'cônjuge';
    ELSIF NEW.relationship IN ('pai', 'mãe') THEN
        SELECT gender INTO target_gender FROM members WHERE id = NEW.related_member_id;
        IF target_gender = 'M' THEN
            reverse_rel := 'filho';
        ELSE
            reverse_rel := 'filha';
        END IF;
    ELSIF NEW.relationship IN ('filho', 'filha') THEN
        SELECT gender INTO target_gender FROM members WHERE id = NEW.member_id;
        IF target_gender = 'M' THEN
            reverse_rel := 'pai';
        ELSE
            reverse_rel := 'mãe';
        END IF;
    ELSIF NEW.relationship IN ('irmão', 'irmã') THEN
        SELECT gender INTO target_gender FROM members WHERE id = NEW.related_member_id;
        IF target_gender = 'M' THEN
            reverse_rel := 'irmão';
        ELSE
            reverse_rel := 'irmã';
        END IF;
    END IF;

    IF reverse_rel IS NOT NULL THEN
        INSERT INTO family_links (church_id, member_id, related_member_id, relationship)
        VALUES (NEW.church_id, NEW.related_member_id, NEW.member_id, reverse_rel)
        ON CONFLICT (church_id, member_id, related_member_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION get_my_church_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULLIF(auth.jwt() ->> 'church_id', '')::UUID;
$$;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULLIF(auth.jwt() ->> 'role', '');
$$;

CREATE OR REPLACE FUNCTION is_leadership()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT get_my_role() IN ('pastor', 'presbítero', 'diácono', 'líder');
$$;

-- ============================================================
-- 3. MERGE DAS POLICIES UPDATE DE members
--    Elimina múltiplas permissive policies + fix auth.uid() por row
-- ============================================================

DROP POLICY IF EXISTS "members_update_leadership" ON members;
DROP POLICY IF EXISTS "members_update_self" ON members;
DROP POLICY IF EXISTS "members_update" ON members;

CREATE POLICY "members_update"
  ON members FOR UPDATE
  USING (
    church_id = (SELECT get_my_church_id())
    AND (
      is_leadership()
      OR id = (SELECT auth.uid())::UUID
    )
  )
  WITH CHECK (
    church_id = (SELECT get_my_church_id())
    AND (
      is_leadership()
      OR id = (SELECT auth.uid())::UUID
    )
  );

-- ============================================================
-- 4. ÍNDICES NAS FOREIGN KEYS SEM COBERTURA
-- ============================================================

-- audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_church_id ON audit_logs (church_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id   ON audit_logs (user_id);

-- consent_records
CREATE INDEX IF NOT EXISTS idx_consent_records_member_id ON consent_records (member_id);

-- family_links
CREATE INDEX IF NOT EXISTS idx_family_links_member_id         ON family_links (member_id);
CREATE INDEX IF NOT EXISTS idx_family_links_related_member_id ON family_links (related_member_id);

-- invite_links
CREATE INDEX IF NOT EXISTS idx_invite_links_church_id ON invite_links (church_id);
CREATE INDEX IF NOT EXISTS idx_invite_links_member_id ON invite_links (member_id);

-- members
CREATE INDEX IF NOT EXISTS idx_members_home_church_id ON members (home_church_id);
CREATE INDEX IF NOT EXISTS idx_members_invited_by     ON members (invited_by);

-- tenants
CREATE INDEX IF NOT EXISTS idx_tenants_parent_tenant_id ON tenants (parent_tenant_id);
