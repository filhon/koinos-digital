-- Session 5.8: Liturgy song linking + music delegation
-- Adds song_id FK on liturgy_items and music_delegated_to FK on liturgies.
-- The 'cântico' ENUM value is added if not already present.

-- ─── 1. Add 'cântico' to liturgy_item_type enum ───────────────────────────────
-- Must run outside an explicit transaction block (PostgreSQL DDL for ENUM values).
ALTER TYPE liturgy_item_type ADD VALUE IF NOT EXISTS 'cântico';

-- ─── 2. Add song_id to liturgy_items ─────────────────────────────────────────
ALTER TABLE liturgy_items
  ADD COLUMN IF NOT EXISTS song_id uuid REFERENCES songs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS liturgy_items_song_id_idx
  ON liturgy_items(song_id)
  WHERE song_id IS NOT NULL;

-- ─── 3. Add music_delegated_to to liturgies ───────────────────────────────────
ALTER TABLE liturgies
  ADD COLUMN IF NOT EXISTS music_delegated_to uuid REFERENCES members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS liturgies_music_delegated_to_idx
  ON liturgies(music_delegated_to)
  WHERE music_delegated_to IS NOT NULL;
