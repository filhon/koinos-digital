-- ─── Events module: events + pivot tables ─────────────────────────────────────
-- Sessão 2.3 — CRUD Eventos

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE event_modality AS ENUM ('presencial', 'online');

-- ============================================================
-- TABLE: events
-- ============================================================

CREATE TABLE events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 200),
  responsible_id  UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  date            DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME,
  modality        event_modality NOT NULL,
  location        TEXT CHECK (char_length(location) <= 300),
  meeting_link    TEXT CHECK (char_length(meeting_link) <= 500),
  description     TEXT CHECK (char_length(description) <= 2000),
  is_recurring    BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule JSONB,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Garantir que presencial tem location e online tem meeting_link
  CONSTRAINT events_presencial_requires_location
    CHECK (modality <> 'presencial' OR (location IS NOT NULL AND location <> '')),
  CONSTRAINT events_online_requires_link
    CHECK (modality <> 'online' OR (meeting_link IS NOT NULL AND meeting_link <> ''))
);

-- ============================================================
-- TABLE: event_ministries (pivot)
-- ============================================================

CREATE TABLE event_ministries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ministry_id UUID NOT NULL,  -- FK para ministries (criada na sessão 2.4)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, ministry_id)
);

-- ============================================================
-- TABLE: event_music_groups (pivot)
-- ============================================================

CREATE TABLE event_music_groups (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  music_group_id UUID NOT NULL,  -- FK para music_groups (criada na sessão futura)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, music_group_id)
);

-- ============================================================
-- TABLE: event_resources (pivot)
-- ============================================================

CREATE TABLE event_resources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL,  -- FK para resources (criada na sessão futura)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, resource_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Eventos futuros por church_id (query principal da listagem)
CREATE INDEX idx_events_church_date
  ON events(church_id, date)
  WHERE is_active = true;

-- Lookup por responsável
CREATE INDEX idx_events_responsible
  ON events(responsible_id);

-- Pivots: FK do evento (CASCADE delete é eficiente com índice)
CREATE INDEX idx_event_ministries_event   ON event_ministries(event_id);
CREATE INDEX idx_event_music_groups_event ON event_music_groups(event_id);
CREATE INDEX idx_event_resources_event    ON event_resources(event_id);

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_music_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_resources  ENABLE ROW LEVEL SECURITY;

-- events: qualquer membro do tenant pode ler eventos ativos
CREATE POLICY "events_select"
  ON events FOR SELECT
  USING (church_id = get_my_church_id() AND is_active = true);

-- events: apenas liderança pode inserir
CREATE POLICY "events_insert"
  ON events FOR INSERT
  WITH CHECK (church_id = get_my_church_id() AND is_leadership());

-- events: apenas liderança pode atualizar
CREATE POLICY "events_update"
  ON events FOR UPDATE
  USING (church_id = get_my_church_id() AND is_leadership())
  WITH CHECK (church_id = get_my_church_id() AND is_leadership());

-- events: apenas liderança pode deletar (soft-delete via is_active)
CREATE POLICY "events_delete"
  ON events FOR DELETE
  USING (church_id = get_my_church_id() AND is_leadership());

-- Pivots: leitura por qualquer membro do tenant (via join com events)
CREATE POLICY "event_ministries_select"
  ON event_ministries FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events
      WHERE church_id = get_my_church_id()
    )
  );

CREATE POLICY "event_ministries_write"
  ON event_ministries FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events
      WHERE church_id = get_my_church_id() AND is_leadership()
    )
  );

CREATE POLICY "event_music_groups_select"
  ON event_music_groups FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events
      WHERE church_id = get_my_church_id()
    )
  );

CREATE POLICY "event_music_groups_write"
  ON event_music_groups FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events
      WHERE church_id = get_my_church_id() AND is_leadership()
    )
  );

CREATE POLICY "event_resources_select"
  ON event_resources FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events
      WHERE church_id = get_my_church_id()
    )
  );

CREATE POLICY "event_resources_write"
  ON event_resources FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events
      WHERE church_id = get_my_church_id() AND is_leadership()
    )
  );
