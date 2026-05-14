-- Fix: feedbacks_update_author usava member_id = auth.uid(),
-- mas members.id é gen_random_uuid() ≠ auth.uid().
-- A verificação de ownership é feita na Server Action via getMemberId(email + church_id).
-- RLS mantém apenas o isolamento multi-tenant (church_id).

DROP POLICY IF EXISTS feedbacks_update_author ON feedbacks;

CREATE POLICY feedbacks_update_author
  ON feedbacks FOR UPDATE
  USING (church_id = (SELECT get_my_church_id()))
  WITH CHECK (church_id = (SELECT get_my_church_id()));
