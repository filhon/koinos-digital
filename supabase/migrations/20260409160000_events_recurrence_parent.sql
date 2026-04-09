-- Sessão 2.9 — Recorrência complexa de eventos
-- Adiciona parent_event_id para relacionar instâncias ao evento pai

ALTER TABLE events
  ADD COLUMN parent_event_id UUID REFERENCES events(id) ON DELETE SET NULL;

-- Índice parcial (só cobre instâncias, não eventos avulsos)
CREATE INDEX idx_events_parent_event_id
  ON events(parent_event_id)
  WHERE parent_event_id IS NOT NULL;

-- Índice composto para queries "todos os próximos" (parent_id + date)
CREATE INDEX idx_events_parent_date
  ON events(parent_event_id, date)
  WHERE parent_event_id IS NOT NULL;
