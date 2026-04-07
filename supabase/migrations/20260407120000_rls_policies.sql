-- 20260407120000_rls_policies.sql
-- RLS policies para isolamento multi-tenant + helpers SQL

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Retorna o church_id do JWT claim
CREATE OR REPLACE FUNCTION get_my_church_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT NULLIF(auth.jwt() ->> 'church_id', '')::UUID;
$$;

-- Retorna o role do JWT claim
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT NULLIF(auth.jwt() ->> 'role', '');
$$;

-- Retorna true se o role do usuário for liderança
CREATE OR REPLACE FUNCTION is_leadership()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT get_my_role() IN ('pastor', 'presbítero', 'diácono', 'líder');
$$;

-- ============================================================
-- ENABLE RLS EM TODAS AS TABELAS CORE
-- ============================================================

ALTER TABLE tenants         ENABLE ROW LEVEL SECURITY;
ALTER TABLE members         ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_links    ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_links    ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs      ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TENANTS
-- Um tenant só vê a si mesmo (não usa church_id, usa id direto)
-- ============================================================

CREATE POLICY "tenants_select"
  ON tenants FOR SELECT
  USING (id = get_my_church_id());

CREATE POLICY "tenants_update"
  ON tenants FOR UPDATE
  USING (id = get_my_church_id())
  WITH CHECK (id = get_my_church_id());

-- INSERT/DELETE em tenants gerenciado pelo backend (service role)
-- Não expor via RLS client

-- ============================================================
-- MEMBERS
-- ============================================================

CREATE POLICY "members_select"
  ON members FOR SELECT
  USING (church_id = get_my_church_id());

CREATE POLICY "members_insert"
  ON members FOR INSERT
  WITH CHECK (church_id = get_my_church_id());

CREATE POLICY "members_update_leadership"
  ON members FOR UPDATE
  USING (church_id = get_my_church_id())
  WITH CHECK (church_id = get_my_church_id());

-- Membro pode editar apenas seu próprio perfil (campos restritos)
-- Esta policy é complementar: não restringe quais colunas (Postgres não suporta
-- column-level RLS diretamente), mas a restrição de colunas é aplicada
-- na Server Action. Aqui garantimos apenas que o membro edite seu próprio registro.
CREATE POLICY "members_update_self"
  ON members FOR UPDATE
  USING (
    church_id = get_my_church_id()
    AND id = (auth.uid())::UUID
  )
  WITH CHECK (
    church_id = get_my_church_id()
    AND id = (auth.uid())::UUID
  );

CREATE POLICY "members_delete"
  ON members FOR DELETE
  USING (church_id = get_my_church_id());

-- ============================================================
-- FAMILY_LINKS
-- ============================================================

CREATE POLICY "family_links_select"
  ON family_links FOR SELECT
  USING (church_id = get_my_church_id());

CREATE POLICY "family_links_insert"
  ON family_links FOR INSERT
  WITH CHECK (church_id = get_my_church_id());

CREATE POLICY "family_links_update"
  ON family_links FOR UPDATE
  USING (church_id = get_my_church_id())
  WITH CHECK (church_id = get_my_church_id());

CREATE POLICY "family_links_delete"
  ON family_links FOR DELETE
  USING (church_id = get_my_church_id());

-- ============================================================
-- INVITE_LINKS
-- ============================================================

CREATE POLICY "invite_links_select"
  ON invite_links FOR SELECT
  USING (church_id = get_my_church_id());

CREATE POLICY "invite_links_insert"
  ON invite_links FOR INSERT
  WITH CHECK (church_id = get_my_church_id());

CREATE POLICY "invite_links_update"
  ON invite_links FOR UPDATE
  USING (church_id = get_my_church_id())
  WITH CHECK (church_id = get_my_church_id());

CREATE POLICY "invite_links_delete"
  ON invite_links FOR DELETE
  USING (church_id = get_my_church_id());

-- ============================================================
-- CONSENT_RECORDS
-- Ligado ao member_id — filtra via JOIN implícito
-- ============================================================

CREATE POLICY "consent_records_select"
  ON consent_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = consent_records.member_id
        AND m.church_id = get_my_church_id()
    )
  );

CREATE POLICY "consent_records_insert"
  ON consent_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = consent_records.member_id
        AND m.church_id = get_my_church_id()
    )
  );

-- consent_records são imutáveis (sem UPDATE/DELETE via client)

-- ============================================================
-- AUDIT_LOGS
-- Apenas leitura para o tenant; escrita via service role
-- ============================================================

CREATE POLICY "audit_logs_select"
  ON audit_logs FOR SELECT
  USING (church_id = get_my_church_id());

-- INSERT apenas via service role (backend)
-- Sem UPDATE/DELETE via client
