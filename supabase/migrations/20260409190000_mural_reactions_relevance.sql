-- ─── Sessão 3.2: Reações por tipo + algoritmo de relevância ──────────────────
--
-- 1. Corrige RLS de reactions (members.id ≠ auth.uid() — ownership na SA)
-- 2. Substitui UNIQUE(post_id, member_id) por UNIQUE(post_id, member_id, type)
--    permitindo um membro reagir com 'orar' E 'gratidão' no mesmo post
-- 3. Índice para posts fixados
-- 4. Função RPC get_mural_posts com ordenação por relevância

-- ─── 1. Fix RLS reactions ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "reactions_insert" ON reactions;
CREATE POLICY "reactions_insert" ON reactions
  FOR INSERT
  WITH CHECK (church_id = get_my_church_id());

DROP POLICY IF EXISTS "reactions_delete" ON reactions;
CREATE POLICY "reactions_delete" ON reactions
  FOR DELETE
  USING (church_id = get_my_church_id());

-- ─── 2. Unique constraint por tipo ───────────────────────────────────────────

ALTER TABLE reactions
  DROP CONSTRAINT IF EXISTS reactions_unique_per_member_post;

ALTER TABLE reactions
  ADD CONSTRAINT reactions_unique_per_member_post_type
  UNIQUE (post_id, member_id, type);

-- ─── 3. Índice para posts fixados ────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS posts_pinned_active_idx
  ON posts (church_id, pinned_until DESC NULLS LAST)
  WHERE is_active = true AND pinned_until IS NOT NULL;

-- ─── 4. RPC: get_mural_posts ──────────────────────────────────────────────────
-- Retorna posts com contagens e flags de reação do usuário atual,
-- ordenados pelo algoritmo de relevância:
--   1º fixados (pinned_until > now())
--   2º posts de liderança
--   3º score = (reactions * 0.3) + (comments * 0.5) - (age_hours * 0.01)
--   4º created_at DESC

CREATE OR REPLACE FUNCTION get_mural_posts(
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
      COUNT(DISTINCT c.id) FILTER (WHERE c.is_active = true)  AS comment_count,
      COUNT(DISTINCT r.id) FILTER (WHERE r.type = 'orar')     AS reaction_orar,
      COUNT(DISTINCT r.id) FILTER (WHERE r.type = 'gratidão') AS reaction_gratidao
    FROM posts p
    LEFT JOIN members m ON m.id = p.author_id
    LEFT JOIN comments c ON c.post_id = p.id
    LEFT JOIN reactions r ON r.post_id = p.id
    WHERE p.church_id = get_my_church_id()
      AND p.is_active = true
    GROUP BY p.id, m.id
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
