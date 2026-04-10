-- ─────────────────────────────────────────────────────────────────────────────
-- Sessão 3.3 — Gamificação: equipes + pontuação + placar
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Tabela: teams ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.teams (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  tribe_name  text        NOT NULL,
  color       text        NOT NULL DEFAULT '#6366f1',
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(church_id, name)
);

CREATE INDEX IF NOT EXISTS teams_church_id_idx ON public.teams(church_id);

-- ─── 2. Tabela: member_teams ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.member_teams (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id  uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id  uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  team_id    uuid        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  joined_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member_id)  -- um membro pertence a apenas uma equipe
);

CREATE INDEX IF NOT EXISTS member_teams_team_id_idx     ON public.member_teams(team_id);
CREATE INDEX IF NOT EXISTS member_teams_church_id_idx   ON public.member_teams(church_id);

-- ─── 3. Tabela: score_events ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.score_events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id    uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id    uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  team_id      uuid        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  points       integer     NOT NULL DEFAULT 0,
  action_type  text        NOT NULL CHECK (action_type IN ('checkin', 'invite', 'daily_reading')),
  reference_id uuid,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS score_events_church_id_idx  ON public.score_events(church_id);
CREATE INDEX IF NOT EXISTS score_events_member_id_idx  ON public.score_events(member_id);
CREATE INDEX IF NOT EXISTS score_events_team_id_idx    ON public.score_events(team_id);
CREATE INDEX IF NOT EXISTS score_events_created_at_idx ON public.score_events(created_at);

-- ─── 4. RLS: teams ───────────────────────────────────────────────────────────

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY teams_select ON public.teams
  FOR SELECT USING (church_id = (SELECT (auth.jwt()->'app_metadata'->>'church_id')::uuid));

CREATE POLICY teams_insert ON public.teams
  FOR INSERT WITH CHECK (
    church_id = (SELECT (auth.jwt()->'app_metadata'->>'church_id')::uuid)
    AND (auth.jwt()->'app_metadata'->>'role') IN ('admin','pastor','presbítero')
  );

CREATE POLICY teams_update ON public.teams
  FOR UPDATE USING (
    church_id = (SELECT (auth.jwt()->'app_metadata'->>'church_id')::uuid)
    AND (auth.jwt()->'app_metadata'->>'role') IN ('admin','pastor','presbítero')
  );

CREATE POLICY teams_delete ON public.teams
  FOR DELETE USING (
    church_id = (SELECT (auth.jwt()->'app_metadata'->>'church_id')::uuid)
    AND (auth.jwt()->'app_metadata'->>'role') IN ('admin','pastor')
  );

-- ─── 5. RLS: member_teams ────────────────────────────────────────────────────

ALTER TABLE public.member_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY member_teams_select ON public.member_teams
  FOR SELECT USING (church_id = (SELECT (auth.jwt()->'app_metadata'->>'church_id')::uuid));

CREATE POLICY member_teams_insert ON public.member_teams
  FOR INSERT WITH CHECK (
    church_id = (SELECT (auth.jwt()->'app_metadata'->>'church_id')::uuid)
  );

CREATE POLICY member_teams_update ON public.member_teams
  FOR UPDATE USING (
    church_id = (SELECT (auth.jwt()->'app_metadata'->>'church_id')::uuid)
    AND (auth.jwt()->'app_metadata'->>'role') IN ('admin','pastor','presbítero')
  );

-- ─── 6. RLS: score_events ────────────────────────────────────────────────────

ALTER TABLE public.score_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY score_events_select ON public.score_events
  FOR SELECT USING (church_id = (SELECT (auth.jwt()->'app_metadata'->>'church_id')::uuid));

-- Inserção feita via funções SECURITY DEFINER (triggers + Server Actions via service_role)
-- Não permitimos INSERT direto pelo client para evitar fraude de pontos.

-- ─── 7. Função: criar 12 tribos de Israel para um tenant ─────────────────────

CREATE OR REPLACE FUNCTION public.create_tribe_teams(p_church_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.teams (church_id, name, tribe_name, color)
  VALUES
    (p_church_id, 'Rúben',    'Rúben',    '#DC2626'),
    (p_church_id, 'Simeão',   'Simeão',   '#EA580C'),
    (p_church_id, 'Levi',     'Levi',     '#CA8A04'),
    (p_church_id, 'Judá',     'Judá',     '#16A34A'),
    (p_church_id, 'Dã',       'Dã',       '#0891B2'),
    (p_church_id, 'Naftali',  'Naftali',  '#2563EB'),
    (p_church_id, 'Gade',     'Gade',     '#7C3AED'),
    (p_church_id, 'Aser',     'Aser',     '#DB2777'),
    (p_church_id, 'Issacar',  'Issacar',  '#0D9488'),
    (p_church_id, 'Zebulom',  'Zebulom',  '#4F46E5'),
    (p_church_id, 'José',     'José',     '#D97706'),
    (p_church_id, 'Benjamim', 'Benjamim', '#65A30D')
  ON CONFLICT (church_id, name) DO NOTHING;
END;
$$;

-- ─── 8. Trigger: criar tribos ao inserir novo tenant ─────────────────────────

CREATE OR REPLACE FUNCTION public.trigger_create_tribe_teams()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.create_tribe_teams(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER tenants_create_tribes
  AFTER INSERT ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.trigger_create_tribe_teams();

-- ─── 9. Função: atribuir equipe com menos membros ao novo membro ──────────────

CREATE OR REPLACE FUNCTION public.assign_member_team()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid;
BEGIN
  -- Encontrar a equipe do mesmo tenant com menos membros
  SELECT t.id INTO v_team_id
  FROM public.teams t
  LEFT JOIN public.member_teams mt ON mt.team_id = t.id
  WHERE t.church_id = NEW.church_id
  GROUP BY t.id
  ORDER BY COUNT(mt.id) ASC, t.created_at ASC
  LIMIT 1;

  IF v_team_id IS NOT NULL THEN
    INSERT INTO public.member_teams (church_id, member_id, team_id)
    VALUES (NEW.church_id, NEW.id, v_team_id)
    ON CONFLICT (member_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER members_assign_team
  AFTER INSERT ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.assign_member_team();

-- ─── 10. Função: pontuar check-in (+10 pts) ───────────────────────────────────
-- O trigger em check_ins será criado na sessão 3.6 quando a tabela existir.
-- A função já está disponível.

CREATE OR REPLACE FUNCTION public.award_checkin_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id  uuid;
  v_church_id uuid;
BEGIN
  SELECT mt.team_id, m.church_id
    INTO v_team_id, v_church_id
  FROM public.member_teams mt
  JOIN public.members m ON m.id = mt.member_id
  WHERE mt.member_id = NEW.member_id;

  IF v_team_id IS NOT NULL THEN
    INSERT INTO public.score_events (church_id, member_id, team_id, points, action_type, reference_id)
    VALUES (v_church_id, NEW.member_id, v_team_id, 10, 'checkin', NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- ─── 11. Função: pontuar convite pessoal (+50 pts ao convidante) ─────────────
-- Chamada via Server Action (não trigger), pois precisamos saber quem convidou.

CREATE OR REPLACE FUNCTION public.award_invite_points(
  p_inviter_member_id uuid,
  p_church_id         uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid;
BEGIN
  SELECT team_id INTO v_team_id
  FROM public.member_teams
  WHERE member_id = p_inviter_member_id;

  IF v_team_id IS NOT NULL THEN
    INSERT INTO public.score_events (church_id, member_id, team_id, points, action_type)
    VALUES (p_church_id, p_inviter_member_id, v_team_id, 50, 'invite');
  END IF;
END;
$$;

-- ─── 12. RPC: placar por equipes ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_team_leaderboard(
  p_church_id uuid,
  p_period    text  -- 'monthly' ou 'annual'
)
RETURNS TABLE (
  team_id      uuid,
  team_name    text,
  team_color   text,
  total_points bigint,
  member_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id                                        AS team_id,
    t.name                                      AS team_name,
    t.color                                     AS team_color,
    COALESCE(SUM(se.points), 0)::bigint         AS total_points,
    COUNT(DISTINCT mt.member_id)::bigint        AS member_count
  FROM public.teams t
  LEFT JOIN public.member_teams mt ON mt.team_id = t.id
  LEFT JOIN public.score_events se
    ON se.team_id = t.id
   AND CASE
         WHEN p_period = 'monthly'
           THEN date_trunc('month', se.created_at) = date_trunc('month', now())
         ELSE
           date_trunc('year', se.created_at) = date_trunc('year', now())
       END
  WHERE t.church_id = p_church_id
  GROUP BY t.id, t.name, t.color
  ORDER BY COALESCE(SUM(se.points), 0) DESC, t.name ASC;
END;
$$;

-- ─── 13. RPC: ranking individual (top 10) ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_individual_leaderboard(
  p_church_id uuid,
  p_period    text
)
RETURNS TABLE (
  member_id     uuid,
  member_name   text,
  avatar_url    text,
  team_id       uuid,
  team_name     text,
  team_color    text,
  total_points  bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id                                  AS member_id,
    m.name                                AS member_name,
    m.avatar_url                          AS avatar_url,
    t.id                                  AS team_id,
    t.name                                AS team_name,
    t.color                               AS team_color,
    COALESCE(SUM(se.points), 0)::bigint   AS total_points
  FROM public.members m
  JOIN public.member_teams mt ON mt.member_id = m.id
  JOIN public.teams t ON t.id = mt.team_id
  LEFT JOIN public.score_events se
    ON se.member_id = m.id
   AND CASE
         WHEN p_period = 'monthly'
           THEN date_trunc('month', se.created_at) = date_trunc('month', now())
         ELSE
           date_trunc('year', se.created_at) = date_trunc('year', now())
       END
  WHERE m.church_id = p_church_id
    AND m.is_active = true
  GROUP BY m.id, m.name, m.avatar_url, t.id, t.name, t.color
  ORDER BY COALESCE(SUM(se.points), 0) DESC, m.name ASC
  LIMIT 10;
END;
$$;
