-- ─────────────────────────────────────────────────────────────────────────────
-- Sessão 3.4 — Streaks de devoção
-- Tabelas: daily_readings, devotion_streaks
-- Funções: mark_daily_reading, reset_expired_streaks
-- Atualiza: get_mural_posts para incluir author_streak
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Tabela: daily_readings ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.daily_readings (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  date       date    NOT NULL UNIQUE,
  book       text    NOT NULL,
  chapter    integer NOT NULL CHECK (chapter > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS daily_readings_date_idx ON public.daily_readings(date);

ALTER TABLE public.daily_readings ENABLE ROW LEVEL SECURITY;

-- Todos os membros autenticados lêem
CREATE POLICY daily_readings_select ON public.daily_readings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Apenas admin/service_role insere (via seed/migrations)
CREATE POLICY daily_readings_insert ON public.daily_readings
  FOR INSERT WITH CHECK ((SELECT (auth.jwt()->'app_metadata'->>'role')) = 'admin');

-- ─── 2. Tabela: devotion_streaks ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.devotion_streaks (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id       uuid    NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id       uuid    NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  current_streak  integer NOT NULL DEFAULT 0,
  longest_streak  integer NOT NULL DEFAULT 0,
  last_read_date  date,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member_id)
);

CREATE INDEX IF NOT EXISTS devotion_streaks_member_id_idx ON public.devotion_streaks(member_id);
CREATE INDEX IF NOT EXISTS devotion_streaks_church_id_idx ON public.devotion_streaks(church_id);

ALTER TABLE public.devotion_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY devotion_streaks_select ON public.devotion_streaks
  FOR SELECT USING (church_id = (SELECT (auth.jwt()->'app_metadata'->>'church_id')::uuid));

CREATE POLICY devotion_streaks_insert ON public.devotion_streaks
  FOR INSERT WITH CHECK (
    church_id = (SELECT (auth.jwt()->'app_metadata'->>'church_id')::uuid)
  );

CREATE POLICY devotion_streaks_update ON public.devotion_streaks
  FOR UPDATE USING (
    church_id = (SELECT (auth.jwt()->'app_metadata'->>'church_id')::uuid)
  );

-- ─── 3. Função: mark_daily_reading ───────────────────────────────────────────
-- SECURITY DEFINER: chamada via admin client na Server Action.
-- Retorna jsonb com current_streak, bonus_points, base_points ou error.

CREATE OR REPLACE FUNCTION public.mark_daily_reading(
  p_member_id        uuid,
  p_church_id        uuid,
  p_daily_reading_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_streak       public.devotion_streaks%ROWTYPE;
  v_reading_date date;
  v_new_streak   integer;
  v_bonus_points integer := 0;
  v_base_points  integer := 10;
  v_team_id      uuid;
BEGIN
  -- Obter a data da leitura programada
  SELECT date INTO v_reading_date
  FROM public.daily_readings
  WHERE id = p_daily_reading_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Leitura não encontrada');
  END IF;

  -- Buscar streak existente
  SELECT * INTO v_streak
  FROM public.devotion_streaks
  WHERE member_id = p_member_id;

  IF FOUND THEN
    -- Verificar se já foi marcado hoje
    IF v_streak.last_read_date = v_reading_date THEN
      RETURN jsonb_build_object('error', 'Leitura já registrada para hoje');
    END IF;

    -- Calcular novo streak
    IF v_streak.last_read_date IS NULL
       OR v_streak.last_read_date < (v_reading_date - INTERVAL '1 day') THEN
      -- Pulou um dia ou primeiro uso: reset
      v_new_streak := 1;
    ELSE
      -- Consecutivo (last_read_date = ontem)
      v_new_streak := v_streak.current_streak + 1;
    END IF;

    UPDATE public.devotion_streaks
    SET
      current_streak = v_new_streak,
      longest_streak = GREATEST(v_streak.longest_streak, v_new_streak),
      last_read_date = v_reading_date,
      updated_at     = now()
    WHERE member_id = p_member_id;
  ELSE
    -- Primeiro registro do membro
    v_new_streak := 1;
    INSERT INTO public.devotion_streaks(church_id, member_id, current_streak, longest_streak, last_read_date)
    VALUES (p_church_id, p_member_id, 1, 1, v_reading_date);
  END IF;

  -- Bônus de milestone
  IF v_new_streak = 7 THEN
    v_bonus_points := 20;
  ELSIF v_new_streak = 30 THEN
    v_bonus_points := 100;
  END IF;

  -- Buscar equipe do membro para pontuar
  SELECT team_id INTO v_team_id
  FROM public.member_teams
  WHERE member_id = p_member_id;

  IF v_team_id IS NOT NULL THEN
    -- Pontos base
    INSERT INTO public.score_events(church_id, member_id, team_id, points, action_type, reference_id)
    VALUES (p_church_id, p_member_id, v_team_id, v_base_points, 'daily_reading', p_daily_reading_id);

    -- Pontos bônus (milestone)
    IF v_bonus_points > 0 THEN
      INSERT INTO public.score_events(church_id, member_id, team_id, points, action_type, reference_id)
      VALUES (p_church_id, p_member_id, v_team_id, v_bonus_points, 'daily_reading', p_daily_reading_id);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'current_streak', v_new_streak,
    'bonus_points',   v_bonus_points,
    'base_points',    v_base_points
  );
END;
$$;

-- ─── 4. Função: reset_expired_streaks ────────────────────────────────────────
-- Chamada no login (check client-side) para zerar streaks vencidos.
-- Retorna número de streaks resetados.

CREATE OR REPLACE FUNCTION public.reset_expired_streaks(p_church_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.devotion_streaks
  SET current_streak = 0,
      updated_at     = now()
  WHERE church_id    = p_church_id
    AND current_streak > 0
    AND last_read_date < (CURRENT_DATE - INTERVAL '1 day');

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ─── 5. Atualizar get_mural_posts para incluir author_streak ─────────────────
-- DROP obrigatório: mudança no tipo de retorno.

DROP FUNCTION IF EXISTS get_mural_posts(uuid, int, int);

CREATE FUNCTION get_mural_posts(
  p_member_id uuid,
  p_limit     int DEFAULT 10,
  p_offset    int DEFAULT 0
)
RETURNS TABLE (
  id                uuid,
  church_id         uuid,
  author_id         uuid,
  content           text,
  pinned_until      timestamptz,
  created_at        timestamptz,
  author_name       text,
  author_avatar_url text,
  author_role       text,
  author_team_name  text,
  author_team_color text,
  author_streak     integer,
  comment_count     bigint,
  reaction_orar     bigint,
  reaction_gratidao bigint,
  user_orar         boolean,
  user_gratidao     boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH post_stats AS (
    SELECT
      p.id,
      p.church_id,
      p.author_id,
      p.content,
      p.pinned_until,
      p.created_at,
      m.name                            AS author_name,
      m.avatar_url                      AS author_avatar_url,
      m.role                            AS author_role,
      t.name                            AS author_team_name,
      t.color                           AS author_team_color,
      COALESCE(ds.current_streak, 0)    AS author_streak,
      COUNT(DISTINCT c.id) FILTER (WHERE c.is_active = true)  AS comment_count,
      COUNT(DISTINCT r.id) FILTER (WHERE r.type = 'orar')     AS reaction_orar,
      COUNT(DISTINCT r.id) FILTER (WHERE r.type = 'gratidão') AS reaction_gratidao
    FROM posts p
    LEFT JOIN members m         ON m.id  = p.author_id
    LEFT JOIN member_teams mt   ON mt.member_id = m.id
    LEFT JOIN teams t           ON t.id  = mt.team_id
    LEFT JOIN devotion_streaks ds ON ds.member_id = m.id
    LEFT JOIN comments c        ON c.post_id = p.id
    LEFT JOIN reactions r       ON r.post_id = p.id
    WHERE p.church_id = get_my_church_id()
      AND p.is_active = true
    GROUP BY p.id, m.id, t.id, ds.current_streak
  )
  SELECT
    ps.id,
    ps.church_id,
    ps.author_id,
    ps.content,
    ps.pinned_until,
    ps.created_at,
    ps.author_name,
    ps.author_avatar_url,
    ps.author_role,
    ps.author_team_name,
    ps.author_team_color,
    ps.author_streak,
    ps.comment_count,
    ps.reaction_orar,
    ps.reaction_gratidao,
    EXISTS(
      SELECT 1 FROM reactions r2
      WHERE r2.post_id = ps.id
        AND r2.member_id = p_member_id
        AND r2.type = 'orar'
    ) AS user_orar,
    EXISTS(
      SELECT 1 FROM reactions r2
      WHERE r2.post_id = ps.id
        AND r2.member_id = p_member_id
        AND r2.type = 'gratidão'
    ) AS user_gratidao
  FROM post_stats ps
  ORDER BY
    CASE WHEN ps.pinned_until > now() THEN 0 ELSE 1 END ASC,
    CASE WHEN ps.author_role IN ('admin','pastor','presbítero','diácono','tesoureiro','líder')
         THEN 0 ELSE 1 END ASC,
    (
      (ps.reaction_orar + ps.reaction_gratidao) * 0.3
      + ps.comment_count * 0.5
      - EXTRACT(EPOCH FROM (now() - ps.created_at)) / 3600.0 * 0.01
    ) DESC,
    ps.created_at DESC
  LIMIT p_limit
  OFFSET p_offset
$$;
