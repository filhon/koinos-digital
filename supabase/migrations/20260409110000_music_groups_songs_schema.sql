-- ─── Grupos Musicais + Repertório ─────────────────────────────────────────────
-- Sessão 2.6 — CRUD Grupos Musicais + Repertório

-- Ativar extensão trgm para busca
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- TABLE: music_groups
-- ============================================================

CREATE TABLE music_groups (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id  UUID NOT NULL REFERENCES tenants(id)  ON DELETE CASCADE,
  name       TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 200),
  leader_id  UUID REFERENCES members(id) ON DELETE SET NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (church_id, name)
);

-- ============================================================
-- TABLE: music_group_members (pivot)
-- ============================================================

CREATE TABLE music_group_members (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  music_group_id UUID NOT NULL REFERENCES music_groups(id) ON DELETE CASCADE,
  member_id      UUID NOT NULL REFERENCES members(id)       ON DELETE CASCADE,
  church_id      UUID NOT NULL REFERENCES tenants(id)       ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (music_group_id, member_id)
);

-- ============================================================
-- TABLE: songs (repertório)
-- ============================================================

CREATE TABLE songs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  music_group_id  UUID NOT NULL REFERENCES music_groups(id) ON DELETE CASCADE,
  church_id       UUID NOT NULL REFERENCES tenants(id)       ON DELETE CASCADE,
  name            TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 300),
  artist          TEXT NOT NULL CHECK (char_length(artist) BETWEEN 1 AND 300),
  lyrics          TEXT,
  chord_url       TEXT,
  youtube_url     TEXT,
  central_message TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_music_groups_church
  ON music_groups(church_id)
  WHERE is_active = true;

CREATE INDEX idx_music_groups_leader
  ON music_groups(leader_id)
  WHERE is_active = true;

CREATE INDEX idx_music_group_members_group  ON music_group_members(music_group_id);
CREATE INDEX idx_music_group_members_member ON music_group_members(member_id);

CREATE INDEX idx_songs_music_group ON songs(music_group_id) WHERE is_active = true;
CREATE INDEX idx_songs_church      ON songs(church_id)      WHERE is_active = true;

-- Índice GIN para busca por nome/artista (reutiliza pg_trgm já instalado)
CREATE INDEX idx_songs_name_trgm   ON songs USING gin (name   extensions.gin_trgm_ops);
CREATE INDEX idx_songs_artist_trgm ON songs USING gin (artist extensions.gin_trgm_ops);

-- ============================================================
-- TRIGGER: updated_at automático (reutiliza set_updated_at da sessão 2.3)
-- ============================================================

CREATE TRIGGER music_groups_updated_at
  BEFORE UPDATE ON music_groups
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER songs_updated_at
  BEFORE UPDATE ON songs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE music_groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs               ENABLE ROW LEVEL SECURITY;

-- ── music_groups ──────────────────────────────────────────────

-- Todos os membros do tenant podem ler grupos ativos
CREATE POLICY "music_groups_select"
  ON music_groups FOR SELECT
  USING (church_id = get_my_church_id() AND is_active = true);

-- Apenas presbítero+ cria grupos musicais
CREATE POLICY "music_groups_insert"
  ON music_groups FOR INSERT
  WITH CHECK (
    church_id = get_my_church_id()
    AND (SELECT get_my_role()) IN ('admin', 'pastor', 'presbítero')
  );

-- Apenas presbítero+ atualiza grupos musicais
CREATE POLICY "music_groups_update"
  ON music_groups FOR UPDATE
  USING (
    church_id = get_my_church_id()
    AND (SELECT get_my_role()) IN ('admin', 'pastor', 'presbítero')
  )
  WITH CHECK (
    church_id = get_my_church_id()
    AND (SELECT get_my_role()) IN ('admin', 'pastor', 'presbítero')
  );

-- Apenas presbítero+ deleta grupos musicais
CREATE POLICY "music_groups_delete"
  ON music_groups FOR DELETE
  USING (
    church_id = get_my_church_id()
    AND (SELECT get_my_role()) IN ('admin', 'pastor', 'presbítero')
  );

-- ── music_group_members ────────────────────────────────────────

-- Todos os membros do tenant podem ler
CREATE POLICY "music_group_members_select"
  ON music_group_members FOR SELECT
  USING (church_id = get_my_church_id());

-- Liderança pode escrever (verificação granular de "líder do grupo" feita na Server Action)
CREATE POLICY "music_group_members_write"
  ON music_group_members FOR ALL
  USING (church_id = get_my_church_id() AND (SELECT is_leadership()))
  WITH CHECK (church_id = get_my_church_id() AND (SELECT is_leadership()));

-- ── songs ─────────────────────────────────────────────────────

-- Todos os membros do tenant podem ler músicas ativas
CREATE POLICY "songs_select"
  ON songs FOR SELECT
  USING (church_id = get_my_church_id() AND is_active = true);

-- Liderança pode escrever (verificação granular de "líder do grupo" feita na Server Action)
CREATE POLICY "songs_insert"
  ON songs FOR INSERT
  WITH CHECK (church_id = get_my_church_id() AND (SELECT is_leadership()));

CREATE POLICY "songs_update"
  ON songs FOR UPDATE
  USING (church_id = get_my_church_id() AND (SELECT is_leadership()))
  WITH CHECK (church_id = get_my_church_id() AND (SELECT is_leadership()));

CREATE POLICY "songs_delete"
  ON songs FOR DELETE
  USING (church_id = get_my_church_id() AND (SELECT is_leadership()));
