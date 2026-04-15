-- ─── Sessão 4.3: Liturgia (esqueleto editável) ────────────────────────────────
-- Tabelas: liturgies, liturgy_items
-- ADR: search_path fixo, (SELECT auth.uid()), RLS church_id + responsável do evento

-- ─── Enum ─────────────────────────────────────────────────────────────────────

CREATE TYPE liturgy_item_type AS ENUM (
  'acolhimento',
  'louvor',
  'oracao',
  'leitura_biblica',
  'pregacao',
  'oferta',
  'avisos',
  'comunhao',
  'batismo',
  'texto_livre'
);

-- ─── liturgies ─────────────────────────────────────────────────────────────────

CREATE TABLE liturgies (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  church_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id)
);

CREATE INDEX liturgies_event_id_idx  ON liturgies(event_id);
CREATE INDEX liturgies_church_id_idx ON liturgies(church_id);

CREATE TRIGGER liturgies_updated_at
  BEFORE UPDATE ON liturgies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── liturgy_items ─────────────────────────────────────────────────────────────

CREATE TABLE liturgy_items (
  id           UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  liturgy_id   UUID              NOT NULL REFERENCES liturgies(id) ON DELETE CASCADE,
  church_id    UUID              NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type         liturgy_item_type NOT NULL DEFAULT 'texto_livre',
  title        TEXT              NOT NULL CHECK (char_length(title) <= 200),
  content      TEXT              CHECK (char_length(content) <= 2000),
  order_index  INTEGER           NOT NULL DEFAULT 0,
  is_active    BOOLEAN           NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX liturgy_items_liturgy_id_idx ON liturgy_items(liturgy_id);
CREATE INDEX liturgy_items_church_id_idx  ON liturgy_items(church_id);
CREATE INDEX liturgy_items_order_idx      ON liturgy_items(liturgy_id, order_index);

CREATE TRIGGER liturgy_items_updated_at
  BEFORE UPDATE ON liturgy_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE liturgies     ENABLE ROW LEVEL SECURITY;
ALTER TABLE liturgy_items ENABLE ROW LEVEL SECURITY;

-- liturgies: todos da church podem ler
CREATE POLICY "liturgies_select" ON liturgies
  FOR SELECT
  USING (church_id = get_my_church_id());

-- liturgies: write para liderança ou responsável do evento
CREATE POLICY "liturgies_write" ON liturgies
  FOR ALL
  USING (
    church_id = get_my_church_id()
    AND (
      is_leadership()
      OR EXISTS (
        SELECT 1 FROM events
        WHERE events.id = liturgies.event_id
          AND events.responsible_id = (SELECT auth.uid())
      )
    )
  )
  WITH CHECK (
    church_id = get_my_church_id()
    AND (
      is_leadership()
      OR EXISTS (
        SELECT 1 FROM events
        WHERE events.id = liturgies.event_id
          AND events.responsible_id = (SELECT auth.uid())
      )
    )
  );

-- liturgy_items: todos da church podem ler
CREATE POLICY "liturgy_items_select" ON liturgy_items
  FOR SELECT
  USING (church_id = get_my_church_id());

-- liturgy_items: write para liderança ou responsável do evento
CREATE POLICY "liturgy_items_write" ON liturgy_items
  FOR ALL
  USING (
    church_id = get_my_church_id()
    AND (
      is_leadership()
      OR EXISTS (
        SELECT 1 FROM liturgies l
        JOIN events e ON e.id = l.event_id
        WHERE l.id = liturgy_items.liturgy_id
          AND e.responsible_id = (SELECT auth.uid())
      )
    )
  )
  WITH CHECK (
    church_id = get_my_church_id()
    AND (
      is_leadership()
      OR EXISTS (
        SELECT 1 FROM liturgies l
        JOIN events e ON e.id = l.event_id
        WHERE l.id = liturgy_items.liturgy_id
          AND e.responsible_id = (SELECT auth.uid())
      )
    )
  );
