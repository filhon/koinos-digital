-- ─── Sessão 2.8: Notificações in-app ─────────────────────────────────────────
--
-- Cria a tabela notifications com RLS multi-tenant.
-- Liderança insere notificações para membros da mesma igreja.
-- Membros lêem/atualizam apenas as próprias.

CREATE TABLE IF NOT EXISTS notifications (
  id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id  uuid        NOT NULL REFERENCES members(id)  ON DELETE CASCADE,
  church_id  uuid        NOT NULL REFERENCES tenants(id)  ON DELETE CASCADE,
  type       text        NOT NULL,
  message    text        NOT NULL,
  read       boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Membros lêem apenas as próprias notificações
DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications
  FOR SELECT
  USING (member_id = (SELECT auth.uid()));

-- Qualquer usuário autenticado na mesma igreja pode inserir notificações
-- (a restrição de quem pode chamar addEventMinistry fica na Server Action)
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT
  WITH CHECK (church_id = get_my_church_id());

-- Membros atualizam (mark as read) apenas as próprias notificações
DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE
  USING (member_id = (SELECT auth.uid()));

-- Índices
CREATE INDEX IF NOT EXISTS idx_notifications_member_id ON notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_notifications_church_id  ON notifications(church_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread     ON notifications(member_id, read) WHERE read = false;
