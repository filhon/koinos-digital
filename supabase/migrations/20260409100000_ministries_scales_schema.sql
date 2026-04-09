-- ─── Ministérios + Escalas ────────────────────────────────────────────────────
-- Sessão 2.5 — CRUD Ministérios + Escalas

-- ============================================================
-- TABLE: ministries
-- ============================================================

CREATE TABLE ministries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id    UUID NOT NULL REFERENCES tenants(id)  ON DELETE CASCADE,
  name         TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 200),
  counselor_id UUID REFERENCES members(id) ON DELETE SET NULL,
  leader_id    UUID REFERENCES members(id) ON DELETE SET NULL,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (church_id, name)
);

-- ============================================================
-- TABLE: ministry_members (pivot)
-- ============================================================

CREATE TABLE ministry_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id UUID NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  member_id   UUID NOT NULL REFERENCES members(id)    ON DELETE CASCADE,
  church_id   UUID NOT NULL REFERENCES tenants(id)    ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ministry_id, member_id)
);

-- ============================================================
-- TABLE: scales (membros escalados por evento+ministério)
-- ============================================================

CREATE TABLE scales (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_ministry_id UUID NOT NULL REFERENCES event_ministries(id) ON DELETE CASCADE,
  member_id         UUID NOT NULL REFERENCES members(id)           ON DELETE CASCADE,
  church_id         UUID NOT NULL REFERENCES tenants(id)           ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_ministry_id, member_id)
);

-- ============================================================
-- FK: event_ministries.ministry_id → ministries.id
-- (coluna criada como placeholder na sessão 2.3)
-- ============================================================

ALTER TABLE event_ministries
  ADD CONSTRAINT event_ministries_ministry_id_fkey
  FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE CASCADE;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_ministries_church
  ON ministries(church_id)
  WHERE is_active = true;

CREATE INDEX idx_ministries_leader
  ON ministries(leader_id)
  WHERE is_active = true;

CREATE INDEX idx_ministry_members_ministry ON ministry_members(ministry_id);
CREATE INDEX idx_ministry_members_member   ON ministry_members(member_id);
CREATE INDEX idx_scales_event_ministry     ON scales(event_ministry_id);
CREATE INDEX idx_scales_member_church      ON scales(member_id, church_id);

-- ============================================================
-- TRIGGER: updated_at automático (reutiliza set_updated_at da sessão 2.3)
-- ============================================================

CREATE TRIGGER ministries_updated_at
  BEFORE UPDATE ON ministries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE ministries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE scales           ENABLE ROW LEVEL SECURITY;

-- ── ministries ───────────────────────────────────────────────

-- Todos os membros do tenant podem ler ministérios ativos
CREATE POLICY "ministries_select"
  ON ministries FOR SELECT
  USING (church_id = get_my_church_id() AND is_active = true);

-- Apenas presbítero+ cria ministérios
CREATE POLICY "ministries_insert"
  ON ministries FOR INSERT
  WITH CHECK (
    church_id = get_my_church_id()
    AND (SELECT get_my_role()) IN ('admin', 'pastor', 'presbítero')
  );

-- Apenas presbítero+ atualiza ministérios
CREATE POLICY "ministries_update"
  ON ministries FOR UPDATE
  USING (
    church_id = get_my_church_id()
    AND (SELECT get_my_role()) IN ('admin', 'pastor', 'presbítero')
  )
  WITH CHECK (
    church_id = get_my_church_id()
    AND (SELECT get_my_role()) IN ('admin', 'pastor', 'presbítero')
  );

-- Apenas presbítero+ deleta ministérios
CREATE POLICY "ministries_delete"
  ON ministries FOR DELETE
  USING (
    church_id = get_my_church_id()
    AND (SELECT get_my_role()) IN ('admin', 'pastor', 'presbítero')
  );

-- ── ministry_members ─────────────────────────────────────────

-- Todos os membros do tenant podem ler
CREATE POLICY "ministry_members_select"
  ON ministry_members FOR SELECT
  USING (church_id = get_my_church_id());

-- Liderança pode escrever (verificação granular de "líder do ministério" feita na Server Action)
CREATE POLICY "ministry_members_write"
  ON ministry_members FOR ALL
  USING (church_id = get_my_church_id() AND (SELECT is_leadership()))
  WITH CHECK (church_id = get_my_church_id() AND (SELECT is_leadership()));

-- ── scales ───────────────────────────────────────────────────

-- Todos os membros do tenant podem ler (componentes veem a própria escala)
CREATE POLICY "scales_select"
  ON scales FOR SELECT
  USING (church_id = get_my_church_id());

-- Liderança pode escrever (verificação granular de "líder do ministério" feita na Server Action)
CREATE POLICY "scales_write"
  ON scales FOR ALL
  USING (church_id = get_my_church_id() AND (SELECT is_leadership()))
  WITH CHECK (church_id = get_my_church_id() AND (SELECT is_leadership()));
