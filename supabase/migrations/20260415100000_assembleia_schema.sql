-- ─── Sessão 4.2: Assembléia + Eleição/Votação ────────────────────────────────
-- Tabelas: assemblies, elections, election_candidates, election_salts, votes, vote_codes
-- Regras ADR: search_path fixo, (SELECT auth.uid()), RLS church_id

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE election_status AS ENUM ('rascunho', 'aberta', 'encerrada', 'cancelada');
CREATE TYPE election_type   AS ENUM ('candidatos', 'sim_nao');
CREATE TYPE vote_method     AS ENUM ('presencial', 'remoto');

-- ─── assemblies ───────────────────────────────────────────────────────────────

CREATE TABLE assemblies (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  date        DATE        NOT NULL,
  start_time  TIME        NOT NULL,
  location    TEXT        NOT NULL,
  reason      TEXT        NOT NULL,
  agenda      TEXT,
  has_election BOOLEAN    NOT NULL DEFAULT false,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX assemblies_church_id_idx ON assemblies(church_id);
CREATE INDEX assemblies_date_idx      ON assemblies(church_id, date DESC);

-- ─── elections ────────────────────────────────────────────────────────────────

CREATE TABLE elections (
  id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  assembly_id       UUID           NOT NULL REFERENCES assemblies(id) ON DELETE CASCADE,
  church_id         UUID           NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name              TEXT           NOT NULL,
  description       TEXT,
  type              election_type  NOT NULL DEFAULT 'candidatos',
  quorum            INTEGER,       -- NULL = calculado automaticamente na abertura
  active_members_at_open INTEGER,  -- snapshot de membros ativos ao abrir
  allow_remote_vote BOOLEAN        NOT NULL DEFAULT false,
  status            election_status NOT NULL DEFAULT 'rascunho',
  opened_at         TIMESTAMPTZ,
  closed_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX elections_assembly_id_idx ON elections(assembly_id);
CREATE INDEX elections_church_id_idx   ON elections(church_id);
CREATE INDEX elections_status_idx      ON elections(church_id, status);

-- ─── election_candidates ──────────────────────────────────────────────────────

CREATE TABLE election_candidates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID        NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  member_id   UUID        NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  position    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(election_id, member_id)
);

CREATE INDEX election_candidates_election_id_idx ON election_candidates(election_id);

-- ─── election_salts ───────────────────────────────────────────────────────────
-- Acesso restrito: apenas service_role lê. Nunca expor ao client.

CREATE TABLE election_salts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID        NOT NULL REFERENCES elections(id) ON DELETE CASCADE UNIQUE,
  salt        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── votes ────────────────────────────────────────────────────────────────────
-- Anônimo: voter_hash = SHA-256(member_id || election_id || salt)
-- UNIQUE(election_id, voter_hash) garante 1 voto por eleitor por eleição

CREATE TABLE votes (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id  UUID        NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  candidate_id UUID        REFERENCES election_candidates(id) ON DELETE CASCADE,
  voter_hash   TEXT        NOT NULL,
  vote_value   TEXT,       -- 'sim' | 'nao' | 'abstencao' para eleições sim_nao
  voted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  method       vote_method NOT NULL DEFAULT 'presencial',
  UNIQUE(election_id, voter_hash),
  -- Para tipo 'candidatos': candidate_id NOT NULL, vote_value NULL
  -- Para tipo 'sim_nao': candidate_id NULL, vote_value NOT NULL
  CONSTRAINT votes_type_check CHECK (
    (candidate_id IS NOT NULL AND vote_value IS NULL)
    OR
    (candidate_id IS NULL AND vote_value IN ('sim', 'nao', 'abstencao'))
  )
);

CREATE INDEX votes_election_id_idx ON votes(election_id);

-- ─── vote_codes ───────────────────────────────────────────────────────────────
-- Códigos temporários para voto remoto (OTP por email)

CREATE TABLE vote_codes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID        NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  member_id   UUID        NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  code        TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(election_id, member_id)
);

CREATE INDEX vote_codes_election_member_idx ON vote_codes(election_id, member_id);

-- ─── updated_at triggers ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Reutiliza função se já existir (criada em migrações anteriores)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'assemblies_updated_at'
  ) THEN
    CREATE TRIGGER assemblies_updated_at
      BEFORE UPDATE ON assemblies
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'elections_updated_at'
  ) THEN
    CREATE TRIGGER elections_updated_at
      BEFORE UPDATE ON elections
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- ─── Função: contar membros ativos do tenant ──────────────────────────────────

CREATE OR REPLACE FUNCTION count_active_members(p_church_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM members
  WHERE church_id = p_church_id
    AND is_active = true;
$$;

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE assemblies         ENABLE ROW LEVEL SECURITY;
ALTER TABLE elections          ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_salts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_codes         ENABLE ROW LEVEL SECURITY;

-- assemblies: todos membros lêem, pastor cria/atualiza

CREATE POLICY assemblies_select ON assemblies
  FOR SELECT
  USING (church_id = get_my_church_id() AND is_active = true);

CREATE POLICY assemblies_insert ON assemblies
  FOR INSERT
  WITH CHECK (
    church_id = get_my_church_id()
    AND get_my_role() IN ('admin', 'pastor')
  );

CREATE POLICY assemblies_update ON assemblies
  FOR UPDATE
  USING (church_id = get_my_church_id() AND get_my_role() IN ('admin', 'pastor'))
  WITH CHECK (church_id = get_my_church_id());

-- elections: todos membros lêem, presbítero+ cria/atualiza

CREATE POLICY elections_select ON elections
  FOR SELECT
  USING (church_id = get_my_church_id());

CREATE POLICY elections_insert ON elections
  FOR INSERT
  WITH CHECK (
    church_id = get_my_church_id()
    AND get_my_role() IN ('admin', 'pastor', 'presbítero')
  );

CREATE POLICY elections_update ON elections
  FOR UPDATE
  USING (church_id = get_my_church_id() AND get_my_role() IN ('admin', 'pastor', 'presbítero'))
  WITH CHECK (church_id = get_my_church_id());

-- election_candidates: todos lêem, presbítero+ escreve

CREATE POLICY election_candidates_select ON election_candidates
  FOR SELECT
  USING (
    election_id IN (
      SELECT id FROM elections WHERE church_id = get_my_church_id()
    )
  );

CREATE POLICY election_candidates_insert ON election_candidates
  FOR INSERT
  WITH CHECK (
    election_id IN (
      SELECT id FROM elections WHERE church_id = get_my_church_id()
    )
    AND get_my_role() IN ('admin', 'pastor', 'presbítero')
  );

CREATE POLICY election_candidates_delete ON election_candidates
  FOR DELETE
  USING (
    election_id IN (
      SELECT id FROM elections WHERE church_id = get_my_church_id()
    )
    AND get_my_role() IN ('admin', 'pastor', 'presbítero')
  );

-- election_salts: SEM policy de SELECT para usuários normais
-- Apenas service_role (admin client) pode ler
-- INSERT pela SA ao criar eleição

CREATE POLICY election_salts_insert ON election_salts
  FOR INSERT
  WITH CHECK (
    election_id IN (
      SELECT id FROM elections WHERE church_id = get_my_church_id()
    )
    AND get_my_role() IN ('admin', 'pastor', 'presbítero')
  );

-- votes: membro vê apenas seus votos via voter_hash (anônimo — não pode distinguir)
-- Na prática: apenas o conteo é útil (SELECT sem filtro pessoal)
-- Presbítero+ vê contagem total (via Server Action no admin client)
-- INSERT: qualquer membro autenticado do church pode votar (a SA valida tudo)

CREATE POLICY votes_select ON votes
  FOR SELECT
  USING (
    election_id IN (
      SELECT id FROM elections WHERE church_id = get_my_church_id()
    )
  );

CREATE POLICY votes_insert ON votes
  FOR INSERT
  WITH CHECK (
    election_id IN (
      SELECT id FROM elections WHERE church_id = get_my_church_id()
    )
  );

-- vote_codes: membro vê apenas o seu

CREATE POLICY vote_codes_select ON vote_codes
  FOR SELECT
  USING (
    member_id = (SELECT auth.uid())
    AND election_id IN (
      SELECT id FROM elections WHERE church_id = get_my_church_id()
    )
  );

CREATE POLICY vote_codes_insert ON vote_codes
  FOR INSERT
  WITH CHECK (
    member_id = (SELECT auth.uid())
    AND election_id IN (
      SELECT id FROM elections WHERE church_id = get_my_church_id()
    )
  );

CREATE POLICY vote_codes_update ON vote_codes
  FOR UPDATE
  USING (member_id = (SELECT auth.uid()));
