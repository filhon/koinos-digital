-- ─────────────────────────────────────────────────────────────────────────────
-- Sessão 9.1 — Feed Social no Início
-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Adicionar colunas is_public e post_source em posts
-- 2. Atualizar RLS INSERT: qualquer membro autenticado da church pode criar posts
--    (a restrição de liderança no módulo Comunicação é aplicada na Server Action)
-- 3. Atualizar RLS SELECT: incluir posts públicos de outras igrejas (infra futura)
-- 4. Criar RPC get_feed_posts com cursor-based pagination e ordenação configurável
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Novas colunas em posts ────────────────────────────────────────────────

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS is_public   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS post_source text    NOT NULL DEFAULT 'comunicacao'
    CONSTRAINT posts_post_source_check
    CHECK (post_source IN ('comunicacao', 'feed'));

-- Índice para feed cross-church futuro
CREATE INDEX IF NOT EXISTS posts_is_public_created_idx
  ON public.posts (created_at DESC)
  WHERE is_active = true AND is_public = true;

-- ─── 2. RLS INSERT: qualquer membro autenticado da mesma church ───────────────
-- A restrição "apenas liderança pode postar no Comunicação" é feita na SA.
-- A RLS libera para todos; a lógica de negócio fica no server.

DROP POLICY IF EXISTS posts_insert ON public.posts;

CREATE POLICY posts_insert ON public.posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    church_id = get_my_church_id()
  );

-- ─── 3. RLS SELECT: mesma church + posts públicos ────────────────────────────

DROP POLICY IF EXISTS posts_select ON public.posts;

CREATE POLICY posts_select ON public.posts
  FOR SELECT
  USING (
    is_active = true
    AND (
      church_id = get_my_church_id()
      OR is_public = true
    )
  );

-- ─── 4. RPC get_feed_posts ────────────────────────────────────────────────────
-- Retorna posts do feed com paginação cursor-based ('recent') ou offset ('relevance').
-- p_sort_by = 'recent'    → cursor por (created_at DESC, id DESC)
-- p_sort_by = 'relevance' → mesmo algoritmo de relevância do Comunicação, offset-based

CREATE OR REPLACE FUNCTION public.get_feed_posts(
  p_church_id         uuid,
  p_member_id         uuid,
  p_sort_by           text        DEFAULT 'relevance',
  p_cursor_created_at timestamptz DEFAULT NULL,
  p_cursor_id         uuid        DEFAULT NULL,
  p_offset            int         DEFAULT 0,
  p_limit             int         DEFAULT 10
)
RETURNS TABLE (
  id                    uuid,
  church_id             uuid,
  author_id             uuid,
  content               text,
  pinned_until          timestamptz,
  created_at            timestamptz,
  is_public             boolean,
  post_source           text,
  author_name           text,
  author_avatar_url     text,
  author_role           text,
  author_team_name      text,
  author_team_color     text,
  author_streak         integer,
  author_tags           text[],
  author_level          integer,
  author_level_name     text,
  author_equipped_frame jsonb,
  author_equipped_title text,
  author_has_boost      boolean,
  comment_count         bigint,
  reaction_orar         bigint,
  reaction_gratidao     bigint,
  user_orar             boolean,
  user_gratidao         boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_sort_by = 'recent' THEN
    RETURN QUERY
    WITH post_stats AS (
      SELECT
        p.id,
        p.church_id,
        p.author_id,
        p.content,
        p.pinned_until,
        p.created_at,
        p.is_public,
        p.post_source,
        m.name                            AS author_name,
        m.avatar_url                      AS author_avatar_url,
        m.role                            AS author_role,
        t.name                            AS author_team_name,
        t.color                           AS author_team_color,
        COALESCE(ds.current_streak, 0)    AS author_streak,
        COALESCE(m.tags, '{}')            AS author_tags,
        COALESCE(m.current_level, 1)      AS author_level,
        COALESCE(lv.name, 'Semente')      AS author_level_name,
        si_frame.metadata                 AS author_equipped_frame,
        si_title.name                     AS author_equipped_title,
        CASE
          WHEN m.active_boost IS NOT NULL
            AND (m.active_boost->>'expires_at')::timestamptz > now()
          THEN true ELSE false
        END                               AS author_has_boost,
        COUNT(DISTINCT c.id) FILTER (WHERE c.is_active = true)  AS comment_count,
        COUNT(DISTINCT r.id) FILTER (WHERE r.type = 'orar')     AS reaction_orar,
        COUNT(DISTINCT r.id) FILTER (WHERE r.type = 'gratidão') AS reaction_gratidao
      FROM public.posts p
      LEFT JOIN public.members m               ON m.id = p.author_id
      LEFT JOIN public.member_teams mt         ON mt.member_id = m.id
      LEFT JOIN public.teams t                 ON t.id = mt.team_id
      LEFT JOIN public.devotion_streaks ds     ON ds.member_id = m.id
      LEFT JOIN public.levels lv               ON lv.level = m.current_level
      LEFT JOIN public.member_equipped_items mei_frame
                                               ON mei_frame.member_id = m.id
                                              AND mei_frame.category = 'avatar_frame'
      LEFT JOIN public.shop_items si_frame     ON si_frame.id = mei_frame.item_id
      LEFT JOIN public.member_equipped_items mei_title
                                               ON mei_title.member_id = m.id
                                              AND mei_title.category = 'title'
      LEFT JOIN public.shop_items si_title     ON si_title.id = mei_title.item_id
      LEFT JOIN public.comments c              ON c.post_id = p.id
      LEFT JOIN public.reactions r             ON r.post_id = p.id
      WHERE p.church_id = p_church_id
        AND p.is_active = true
        AND (
          p_cursor_created_at IS NULL
          OR p.created_at < p_cursor_created_at
          OR (p.created_at = p_cursor_created_at AND p.id < p_cursor_id)
        )
      GROUP BY
        p.id, m.id, t.id, ds.current_streak, lv.name,
        si_frame.metadata, si_title.name, m.active_boost
    )
    SELECT
      ps.id, ps.church_id, ps.author_id, ps.content, ps.pinned_until, ps.created_at,
      ps.is_public, ps.post_source,
      ps.author_name, ps.author_avatar_url, ps.author_role,
      ps.author_team_name, ps.author_team_color, ps.author_streak, ps.author_tags,
      ps.author_level, ps.author_level_name,
      ps.author_equipped_frame, ps.author_equipped_title, ps.author_has_boost,
      ps.comment_count, ps.reaction_orar, ps.reaction_gratidao,
      EXISTS(SELECT 1 FROM public.reactions r2
             WHERE r2.post_id = ps.id AND r2.member_id = p_member_id AND r2.type = 'orar'),
      EXISTS(SELECT 1 FROM public.reactions r2
             WHERE r2.post_id = ps.id AND r2.member_id = p_member_id AND r2.type = 'gratidão')
    FROM post_stats ps
    ORDER BY ps.created_at DESC, ps.id DESC
    LIMIT p_limit;

  ELSE
    -- relevance sort (offset-based, mesmo algoritmo do Comunicação)
    RETURN QUERY
    WITH post_stats AS (
      SELECT
        p.id,
        p.church_id,
        p.author_id,
        p.content,
        p.pinned_until,
        p.created_at,
        p.is_public,
        p.post_source,
        m.name                            AS author_name,
        m.avatar_url                      AS author_avatar_url,
        m.role                            AS author_role,
        t.name                            AS author_team_name,
        t.color                           AS author_team_color,
        COALESCE(ds.current_streak, 0)    AS author_streak,
        COALESCE(m.tags, '{}')            AS author_tags,
        COALESCE(m.current_level, 1)      AS author_level,
        COALESCE(lv.name, 'Semente')      AS author_level_name,
        si_frame.metadata                 AS author_equipped_frame,
        si_title.name                     AS author_equipped_title,
        CASE
          WHEN m.active_boost IS NOT NULL
            AND (m.active_boost->>'expires_at')::timestamptz > now()
          THEN true ELSE false
        END                               AS author_has_boost,
        COUNT(DISTINCT c.id) FILTER (WHERE c.is_active = true)  AS comment_count,
        COUNT(DISTINCT r.id) FILTER (WHERE r.type = 'orar')     AS reaction_orar,
        COUNT(DISTINCT r.id) FILTER (WHERE r.type = 'gratidão') AS reaction_gratidao
      FROM public.posts p
      LEFT JOIN public.members m               ON m.id = p.author_id
      LEFT JOIN public.member_teams mt         ON mt.member_id = m.id
      LEFT JOIN public.teams t                 ON t.id = mt.team_id
      LEFT JOIN public.devotion_streaks ds     ON ds.member_id = m.id
      LEFT JOIN public.levels lv               ON lv.level = m.current_level
      LEFT JOIN public.member_equipped_items mei_frame
                                               ON mei_frame.member_id = m.id
                                              AND mei_frame.category = 'avatar_frame'
      LEFT JOIN public.shop_items si_frame     ON si_frame.id = mei_frame.item_id
      LEFT JOIN public.member_equipped_items mei_title
                                               ON mei_title.member_id = m.id
                                              AND mei_title.category = 'title'
      LEFT JOIN public.shop_items si_title     ON si_title.id = mei_title.item_id
      LEFT JOIN public.comments c              ON c.post_id = p.id
      LEFT JOIN public.reactions r             ON r.post_id = p.id
      WHERE p.church_id = p_church_id
        AND p.is_active = true
      GROUP BY
        p.id, m.id, t.id, ds.current_streak, lv.name,
        si_frame.metadata, si_title.name, m.active_boost
    )
    SELECT
      ps.id, ps.church_id, ps.author_id, ps.content, ps.pinned_until, ps.created_at,
      ps.is_public, ps.post_source,
      ps.author_name, ps.author_avatar_url, ps.author_role,
      ps.author_team_name, ps.author_team_color, ps.author_streak, ps.author_tags,
      ps.author_level, ps.author_level_name,
      ps.author_equipped_frame, ps.author_equipped_title, ps.author_has_boost,
      ps.comment_count, ps.reaction_orar, ps.reaction_gratidao,
      EXISTS(SELECT 1 FROM public.reactions r2
             WHERE r2.post_id = ps.id AND r2.member_id = p_member_id AND r2.type = 'orar'),
      EXISTS(SELECT 1 FROM public.reactions r2
             WHERE r2.post_id = ps.id AND r2.member_id = p_member_id AND r2.type = 'gratidão')
    FROM post_stats ps
    ORDER BY
      CASE WHEN ps.pinned_until > now() THEN 0 ELSE 1 END,
      ps.reaction_orar * 3 + ps.reaction_gratidao * 2 + ps.comment_count DESC,
      ps.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
  END IF;
END;
$$;
