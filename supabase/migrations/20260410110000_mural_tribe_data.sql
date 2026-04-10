-- ─── Sessão 3.3: Adicionar dados de tribo ao get_mural_posts ─────────────────
-- Inclui team_name e team_color na resposta para exibir o badge de tribo.
-- DROP obrigatório: CREATE OR REPLACE não permite mudar o tipo de retorno.

DROP FUNCTION IF EXISTS get_mural_posts(uuid, int, int);

CREATE FUNCTION get_mural_posts(
  p_member_id uuid,
  p_limit     int DEFAULT 10,
  p_offset    int DEFAULT 0
)
RETURNS TABLE (
  id                uuid,
  church_id         uuid,
  author_id         uuid,
  content           text,
  pinned_until      timestamptz,
  created_at        timestamptz,
  author_name       text,
  author_avatar_url text,
  author_role       text,
  author_team_name  text,
  author_team_color text,
  comment_count     bigint,
  reaction_orar     bigint,
  reaction_gratidao bigint,
  user_orar         boolean,
  user_gratidao     boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH post_stats AS (
    SELECT
      p.id,
      p.church_id,
      p.author_id,
      p.content,
      p.pinned_until,
      p.created_at,
      m.name         AS author_name,
      m.avatar_url   AS author_avatar_url,
      m.role         AS author_role,
      t.name         AS author_team_name,
      t.color        AS author_team_color,
      COUNT(DISTINCT c.id) FILTER (WHERE c.is_active = true)  AS comment_count,
      COUNT(DISTINCT r.id) FILTER (WHERE r.type = 'orar')     AS reaction_orar,
      COUNT(DISTINCT r.id) FILTER (WHERE r.type = 'gratidão') AS reaction_gratidao
    FROM posts p
    LEFT JOIN members m ON m.id = p.author_id
    LEFT JOIN member_teams mt ON mt.member_id = m.id
    LEFT JOIN teams t ON t.id = mt.team_id
    LEFT JOIN comments c ON c.post_id = p.id
    LEFT JOIN reactions r ON r.post_id = p.id
    WHERE p.church_id = get_my_church_id()
      AND p.is_active = true
    GROUP BY p.id, m.id, t.id
  )
  SELECT
    ps.id,
    ps.church_id,
    ps.author_id,
    ps.content,
    ps.pinned_until,
    ps.created_at,
    ps.author_name,
    ps.author_avatar_url,
    ps.author_role,
    ps.author_team_name,
    ps.author_team_color,
    ps.comment_count,
    ps.reaction_orar,
    ps.reaction_gratidao,
    EXISTS(
      SELECT 1 FROM reactions r2
      WHERE r2.post_id = ps.id
        AND r2.member_id = p_member_id
        AND r2.type = 'orar'
    ) AS user_orar,
    EXISTS(
      SELECT 1 FROM reactions r2
      WHERE r2.post_id = ps.id
        AND r2.member_id = p_member_id
        AND r2.type = 'gratidão'
    ) AS user_gratidao
  FROM post_stats ps
  ORDER BY
    CASE WHEN ps.pinned_until > now() THEN 0 ELSE 1 END ASC,
    CASE WHEN ps.author_role IN ('admin','pastor','presbítero','diácono','tesoureiro','líder')
         THEN 0 ELSE 1 END ASC,
    (
      (ps.reaction_orar + ps.reaction_gratidao) * 0.3
      + ps.comment_count * 0.5
      - EXTRACT(EPOCH FROM (now() - ps.created_at)) / 3600.0 * 0.01
    ) DESC,
    ps.created_at DESC
  LIMIT p_limit
  OFFSET p_offset
$$;
