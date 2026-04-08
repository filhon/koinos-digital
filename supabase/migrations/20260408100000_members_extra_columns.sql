-- ─── Members: add PRD 11.1 missing columns ────────────────────────────────────
-- address already added in 20260407140000_member_address_and_storage.sql

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS received_at  DATE,
  ADD COLUMN IF NOT EXISTS baptized_at  DATE;
