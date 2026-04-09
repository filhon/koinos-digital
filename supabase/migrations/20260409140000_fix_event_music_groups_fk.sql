-- ─── FK: event_music_groups.music_group_id → music_groups.id ─────────────────
--
-- A coluna foi criada como placeholder na sessão 2.3 (antes de music_groups existir).
-- A FK correspondente não foi adicionada na sessão 2.6. Sem ela, o PostgREST do
-- Supabase não consegue resolver o join music_group:music_groups(id, name) na
-- query listEventMusicGroups, retornando null em vez dos dados do grupo.

ALTER TABLE event_music_groups
  ADD CONSTRAINT event_music_groups_music_group_id_fkey
  FOREIGN KEY (music_group_id) REFERENCES music_groups(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_event_music_groups_music_group
  ON event_music_groups(music_group_id);
