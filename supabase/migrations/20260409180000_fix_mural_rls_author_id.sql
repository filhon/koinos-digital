-- Fix: posts e comments INSERT/UPDATE tinham author_id = auth.uid() nas policies,
-- mas members.id é gen_random_uuid() ≠ auth.uid().
-- A verificação de ownership (autor pode deletar o próprio, pastor deleta qualquer um)
-- é feita na Server Action via getMemberId(email + church_id).
-- RLS mantém apenas o isolamento multi-tenant (church_id).

-- posts
DROP POLICY IF EXISTS "posts_insert" ON posts;
CREATE POLICY "posts_insert" ON posts
  FOR INSERT
  WITH CHECK (church_id = get_my_church_id());

DROP POLICY IF EXISTS "posts_update" ON posts;
CREATE POLICY "posts_update" ON posts
  FOR UPDATE
  USING (church_id = get_my_church_id())
  WITH CHECK (church_id = get_my_church_id());

-- comments
DROP POLICY IF EXISTS "comments_insert" ON comments;
CREATE POLICY "comments_insert" ON comments
  FOR INSERT
  WITH CHECK (church_id = get_my_church_id());

DROP POLICY IF EXISTS "comments_update" ON comments;
CREATE POLICY "comments_update" ON comments
  FOR UPDATE
  USING (church_id = get_my_church_id())
  WITH CHECK (church_id = get_my_church_id());
