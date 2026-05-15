-- ============================================================
-- #12 — Privacidade de dados de membros
-- ============================================================

-- Substituir policy ampla por duas restritas
DROP POLICY IF EXISTS "members_select" ON members;

-- Liderança + tesoureiro: acesso completo a todos os membros da igreja
CREATE POLICY "members_select_leadership"
  ON members FOR SELECT
  USING (
    church_id = get_my_church_id()
    AND (is_leadership() OR get_my_role() IN ('tesoureiro', 'admin'))
  );

-- Membro comum: vê apenas seu próprio registro completo
CREATE POLICY "members_select_own"
  ON members FOR SELECT
  USING (id = auth.uid()::UUID);

-- View pública com dados restritos para listagens
-- security_invoker = false faz a view rodar como owner (postgres),
-- ignorando RLS da tabela subjacente. O filtro por church_id é
-- garantido via get_my_church_id() que lê o JWT da sessão.
CREATE OR REPLACE VIEW public_members
WITH (security_barrier = true, security_invoker = false) AS
SELECT
  id,
  church_id,
  home_church_id,
  name,
  role,
  avatar_url,
  is_active
FROM members
WHERE church_id = get_my_church_id();

GRANT SELECT ON public_members TO authenticated;

-- Função auxiliar para contagem (usada no dashboard)
CREATE OR REPLACE FUNCTION count_active_church_members()
RETURNS BIGINT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT count(*)
  FROM members
  WHERE church_id = get_my_church_id() AND is_active = true;
$$;

GRANT EXECUTE ON FUNCTION count_active_church_members() TO authenticated;

-- ============================================================
-- #13 — Coordenadas de geolocalização no evento + anti-replay
-- ============================================================

-- Adicionar coordenadas ao evento para validação server-side
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS geo_lat NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS geo_lng NUMERIC(10, 7);

COMMENT ON COLUMN events.geo_lat IS 'Latitude do local do evento para validação de check-in';
COMMENT ON COLUMN events.geo_lng IS 'Longitude do local do evento para validação de check-in';

-- ============================================================
-- #17 — Retenção de audit logs (min 90 dias)
-- ============================================================

-- Função de limpeza: remove logs com mais de 90 dias
-- Agendar via pg_cron ou chamar periodicamente
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < now() - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Índice para acelerar a limpeza
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);
