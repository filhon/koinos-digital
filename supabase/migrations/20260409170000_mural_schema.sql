-- ─── Sessão 3.1: Mural de interação ──────────────────────────────────────────
--
-- Cria tabelas posts, comments e reactions com RLS multi-tenant.
-- Todos os membros (incluindo visitante) podem ler e criar posts/comments.
-- Apenas autor ou pastor+ pode deletar (soft-delete via is_active).

-- ─── posts ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS posts (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id   uuid        NOT NULL REFERENCES tenants(id)  ON DELETE CASCADE,
  author_id   uuid        NOT NULL REFERENCES members(id)  ON DELETE CASCADE,
  content     text        NOT NULL,
  pinned_until timestamptz,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT posts_content_length CHECK (char_length(content) BETWEEN 1 AND 2000)
);

CREATE INDEX IF NOT EXISTS posts_church_id_created_at_idx
  ON posts (church_id, created_at DESC)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS posts_author_id_idx ON posts (author_id);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Membros lêem posts ativos da própria igreja
DROP POLICY IF EXISTS "posts_select" ON posts;
CREATE POLICY "posts_select" ON posts
  FOR SELECT
  USING (
    church_id = get_my_church_id()
    AND is_active = true
  );

-- Membros criam posts na própria igreja
DROP POLICY IF EXISTS "posts_insert" ON posts;
CREATE POLICY "posts_insert" ON posts
  FOR INSERT
  WITH CHECK (
    church_id = get_my_church_id()
    AND author_id = (SELECT auth.uid())
  );

-- Soft-delete: autor deleta o próprio ou pastor+ deleta qualquer um da igreja
DROP POLICY IF EXISTS "posts_update" ON posts;
CREATE POLICY "posts_update" ON posts
  FOR UPDATE
  USING (
    church_id = get_my_church_id()
    AND (
      author_id = (SELECT auth.uid())
      OR get_my_role() IN ('admin', 'pastor')
    )
  )
  WITH CHECK (church_id = get_my_church_id());

-- ─── comments ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS comments (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id     uuid        NOT NULL REFERENCES posts(id)    ON DELETE CASCADE,
  church_id   uuid        NOT NULL REFERENCES tenants(id)  ON DELETE CASCADE,
  author_id   uuid        NOT NULL REFERENCES members(id)  ON DELETE CASCADE,
  content     text        NOT NULL,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT comments_content_length CHECK (char_length(content) BETWEEN 1 AND 500)
);

CREATE INDEX IF NOT EXISTS comments_post_id_created_at_idx
  ON comments (post_id, created_at ASC)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS comments_author_id_idx ON comments (author_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Membros lêem comentários ativos de posts da própria igreja
DROP POLICY IF EXISTS "comments_select" ON comments;
CREATE POLICY "comments_select" ON comments
  FOR SELECT
  USING (
    church_id = get_my_church_id()
    AND is_active = true
  );

-- Membros criam comentários na própria igreja
DROP POLICY IF EXISTS "comments_insert" ON comments;
CREATE POLICY "comments_insert" ON comments
  FOR INSERT
  WITH CHECK (
    church_id = get_my_church_id()
    AND author_id = (SELECT auth.uid())
  );

-- Soft-delete: autor ou pastor+
DROP POLICY IF EXISTS "comments_update" ON comments;
CREATE POLICY "comments_update" ON comments
  FOR UPDATE
  USING (
    church_id = get_my_church_id()
    AND (
      author_id = (SELECT auth.uid())
      OR get_my_role() IN ('admin', 'pastor')
    )
  )
  WITH CHECK (church_id = get_my_church_id());

-- ─── reactions ────────────────────────────────────────────────────────────────
-- Tabela criada agora; UI implementada na sessão 3.2.

CREATE TABLE IF NOT EXISTS reactions (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id     uuid        NOT NULL REFERENCES posts(id)    ON DELETE CASCADE,
  church_id   uuid        NOT NULL REFERENCES tenants(id)  ON DELETE CASCADE,
  member_id   uuid        NOT NULL REFERENCES members(id)  ON DELETE CASCADE,
  type        text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT reactions_type_check CHECK (type IN ('orar', 'gratidão')),
  CONSTRAINT reactions_unique_per_member_post UNIQUE (post_id, member_id)
);

CREATE INDEX IF NOT EXISTS reactions_post_id_idx ON reactions (post_id);

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reactions_select" ON reactions;
CREATE POLICY "reactions_select" ON reactions
  FOR SELECT
  USING (church_id = get_my_church_id());

DROP POLICY IF EXISTS "reactions_insert" ON reactions;
CREATE POLICY "reactions_insert" ON reactions
  FOR INSERT
  WITH CHECK (
    church_id = get_my_church_id()
    AND member_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "reactions_delete" ON reactions;
CREATE POLICY "reactions_delete" ON reactions
  FOR DELETE
  USING (
    church_id = get_my_church_id()
    AND member_id = (SELECT auth.uid())
  );
