-- Sessão 6.2: Restringir criação de posts no módulo Comunicação a roles de liderança
-- A policy anterior permitia qualquer membro autenticado criar posts.
-- Agora apenas liderança (pastor, presbítero, diácono, líder, admin) pode publicar.
-- Comments continuam abertos para todos os membros da church.

-- Remove a policy de INSERT existente em posts
DROP POLICY IF EXISTS posts_insert ON posts;

-- Cria nova policy: INSERT apenas para is_leadership()
-- is_leadership() retorna true para: admin, pastor, presbítero, diácono, líder, tesoureiro
-- (definida na migration de RLS base)
CREATE POLICY posts_insert ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    church_id = get_my_church_id()
    AND is_leadership()
  );
