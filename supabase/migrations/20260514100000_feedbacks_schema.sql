-- ─────────────────────────────────────────────────────────────────────────────
-- Sessão 7.2 — Módulo Feedbacks
-- ─────────────────────────────────────────────────────────────────────────────

-- ENUMs
CREATE TYPE feedback_type AS ENUM ('elogio', 'sugestao', 'reclamacao');
CREATE TYPE feedback_status AS ENUM ('aberto', 'em_analise', 'respondido', 'fechado');

-- ─── feedbacks ────────────────────────────────────────────────────────────────
CREATE TABLE feedbacks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id     uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type          feedback_type NOT NULL,
  title         text NOT NULL CHECK (char_length(title) <= 100),
  description   text NOT NULL CHECK (char_length(description) <= 2000),
  allow_public  boolean NOT NULL DEFAULT false,
  status        feedback_status NOT NULL DEFAULT 'aberto',
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX feedbacks_church_id_idx    ON feedbacks(church_id);
CREATE INDEX feedbacks_member_id_idx    ON feedbacks(member_id);
CREATE INDEX feedbacks_status_idx       ON feedbacks(status);
CREATE INDEX feedbacks_type_idx         ON feedbacks(type);
CREATE INDEX feedbacks_created_at_idx   ON feedbacks(created_at DESC);

-- trigger updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- reutiliza trigger function se já existir (pode existir de outras migrations)
CREATE OR REPLACE TRIGGER feedbacks_updated_at
  BEFORE UPDATE ON feedbacks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── feedback_responses ───────────────────────────────────────────────────────
CREATE TABLE feedback_responses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id   uuid NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
  author_role   text NOT NULL CHECK (author_role IN ('admin', 'team')),
  content       text NOT NULL CHECK (char_length(content) <= 2000),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX feedback_responses_feedback_id_idx ON feedback_responses(feedback_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE feedbacks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;

-- feedbacks: liderança do próprio tenant pode SELECT e INSERT
CREATE POLICY feedbacks_select
  ON feedbacks FOR SELECT
  USING (
    church_id = (SELECT get_my_church_id())
    AND is_leadership()
    AND is_active = true
  );

CREATE POLICY feedbacks_insert
  ON feedbacks FOR INSERT
  WITH CHECK (
    church_id = (SELECT get_my_church_id())
    AND is_leadership()
  );

-- soft-delete pelo próprio autor
CREATE POLICY feedbacks_update_author
  ON feedbacks FOR UPDATE
  USING (
    member_id = (SELECT auth.uid())
    AND church_id = (SELECT get_my_church_id())
  );

-- feedback_responses: SELECT para liderança do tenant via JOIN
CREATE POLICY feedback_responses_select
  ON feedback_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM feedbacks f
      WHERE f.id = feedback_responses.feedback_id
        AND f.church_id = (SELECT get_my_church_id())
        AND is_leadership()
        AND f.is_active = true
    )
  );

-- INSERT apenas via service_role (admin SaaS) — sem policy authenticated
-- O admin usa createAdminClient() que bypassa RLS
