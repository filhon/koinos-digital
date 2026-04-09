-- ─── Resources module ────────────────────────────────────────────────────────
-- Sessão 2.7 — CRUD Recursos

-- ============================================================
-- ENUM
-- ============================================================

CREATE TYPE resource_status AS ENUM ('disponível', 'indisponível');

-- ============================================================
-- TABLE: resources
-- ============================================================

CREATE TABLE resources (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name           TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 200),
  responsible_id UUID REFERENCES members(id) ON DELETE SET NULL,
  status         resource_status NOT NULL DEFAULT 'disponível',
  value          NUMERIC(10, 2),
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- FK: event_resources → resources (era deferred na sessão 2.3)
-- ============================================================

ALTER TABLE event_resources
  ADD CONSTRAINT event_resources_resource_id_fkey
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE;

-- ============================================================
-- TRIGGER: updated_at em resources
-- ============================================================

-- Função set_updated_at() já existe (criada na sessão 2.3)
CREATE TRIGGER resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TRIGGER: liberar recurso quando evento é soft-deleted
-- ============================================================

CREATE OR REPLACE FUNCTION release_resources_on_event_deactivate()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Quando evento passa de ativo para inativo, remove todas as alocações
  IF OLD.is_active = true AND NEW.is_active = false THEN
    DELETE FROM event_resources WHERE event_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER events_release_resources
  AFTER UPDATE ON events
  FOR EACH ROW
  WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
  EXECUTE FUNCTION release_resources_on_event_deactivate();

-- ============================================================
-- TRIGGER: manter status do recurso em sincronia com alocações
-- ============================================================

CREATE OR REPLACE FUNCTION sync_resource_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_resource_id UUID;
  v_has_allocation BOOLEAN;
BEGIN
  -- Determina o resource_id afetado
  IF TG_OP = 'INSERT' THEN
    v_resource_id := NEW.resource_id;
  ELSE
    v_resource_id := OLD.resource_id;
  END IF;

  -- Verifica se o recurso ainda tem alocações em eventos ativos/futuros
  SELECT EXISTS (
    SELECT 1
    FROM event_resources er
    JOIN events e ON e.id = er.event_id
    WHERE er.resource_id = v_resource_id
      AND e.is_active = true
      AND e.date >= CURRENT_DATE
  ) INTO v_has_allocation;

  UPDATE resources
    SET status = CASE WHEN v_has_allocation THEN 'indisponível'::resource_status
                      ELSE 'disponível'::resource_status END
  WHERE id = v_resource_id;

  RETURN NULL;
END;
$$;

CREATE TRIGGER event_resources_sync_status
  AFTER INSERT OR DELETE ON event_resources
  FOR EACH ROW EXECUTE FUNCTION sync_resource_status();

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_resources_church
  ON resources(church_id)
  WHERE is_active = true;

CREATE INDEX idx_resources_responsible
  ON resources(responsible_id);

CREATE INDEX idx_resources_status
  ON resources(church_id, status)
  WHERE is_active = true;

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Liderança pode ler (LEADERSHIP = admin, pastor, presbítero, diácono, líder)
CREATE POLICY "resources_select"
  ON resources FOR SELECT
  USING (
    church_id = get_my_church_id()
    AND is_active = true
    AND get_my_role() = ANY(ARRAY['admin','pastor','presbítero','diácono','líder'])
  );

-- Pastor, presbítero, diácono podem inserir (SENIOR_LEADERSHIP)
CREATE POLICY "resources_insert"
  ON resources FOR INSERT
  WITH CHECK (
    church_id = get_my_church_id()
    AND get_my_role() = ANY(ARRAY['admin','pastor','presbítero','diácono'])
  );

-- Pastor, presbítero, diácono podem atualizar
CREATE POLICY "resources_update"
  ON resources FOR UPDATE
  USING (
    church_id = get_my_church_id()
    AND get_my_role() = ANY(ARRAY['admin','pastor','presbítero','diácono'])
  )
  WITH CHECK (
    church_id = get_my_church_id()
    AND get_my_role() = ANY(ARRAY['admin','pastor','presbítero','diácono'])
  );

-- Pastor, presbítero, diácono podem deletar (soft-delete via is_active)
CREATE POLICY "resources_delete"
  ON resources FOR DELETE
  USING (
    church_id = get_my_church_id()
    AND get_my_role() = ANY(ARRAY['admin','pastor','presbítero','diácono'])
  );
