-- Add cpf_hash column for fast CPF lookup without decrypting all records
ALTER TABLE members ADD COLUMN IF NOT EXISTS cpf_hash TEXT;

-- Index for church-scoped CPF hash lookups (avoids full table scan)
CREATE INDEX IF NOT EXISTS idx_members_church_cpf_hash ON members (church_id, cpf_hash);
