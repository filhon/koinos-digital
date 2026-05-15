-- ─────────────────────────────────────────────────────────────────────────────
-- Sessão 8.1 — Níveis e Talentos (XP, moeda virtual, progressão)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Tabela: levels ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.levels (
  level    integer PRIMARY KEY,
  name     text    NOT NULL UNIQUE,
  min_xp   integer NOT NULL,
  icon     text    NOT NULL DEFAULT '⭐'
);

-- ─── 2. Seed: 30 níveis bíblicos ──────────────────────────────────────────────

INSERT INTO public.levels (level, name, min_xp, icon) VALUES
  (1,  'Semente',     0,      '🌱'),
  (2,  'Broto',       50,     '🌿'),
  (3,  'Raiz',        120,    '🪨'),
  (4,  'Arbusto',     200,    '🌾'),
  (5,  'Árvore',      350,    '🌳'),
  (6,  'Fruto',       550,    '🍇'),
  (7,  'Ceifa',       800,    '🌾'),
  (8,  'Obreiro',     1100,   '⚒️'),
  (9,  'Servo',       1500,   '🙏'),
  (10, 'Discípulo',   2000,   '📖'),
  (11, 'Sal',         2600,   '🧂'),
  (12, 'Luz',         3300,   '💡'),
  (13, 'Testemunha',  4100,   '🕊️'),
  (14, 'Guardião',    5000,   '🛡️'),
  (15, 'Profeta',     6000,   '📜'),
  (16, 'Sacerdote',   7200,   '⚗️'),
  (17, 'Ancião',      8500,   '🏛️'),
  (18, 'Pastor',      10000,  '🐑'),
  (19, 'Apóstolo',    12000,  '⛵'),
  (20, 'Querubim',    14500,  '✨'),
  (21, 'Serafim',     17500,  '🔥'),
  (22, 'Arcanjo',     21000,  '⚔️'),
  (23, 'Trono',       25000,  '👑'),
  (24, 'Dominação',   30000,  '🌟'),
  (25, 'Potestade',   36000,  '💫'),
  (26, 'Principado',  43000,  '🌙'),
  (27, 'Virtude',     51000,  '☀️'),
  (28, 'Coroa',       60000,  '💎'),
  (29, 'Glória',      70000,  '🌅'),
  (30, 'Eternidade',  80000,  '∞')
ON CONFLICT (level) DO NOTHING;

-- ─── 3. ALTER TABLE members ───────────────────────────────────────────────────

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS total_xp       integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wallet_balance integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_level  integer NOT NULL DEFAULT 1
    REFERENCES public.levels(level) ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS members_current_level_idx ON public.members(current_level);

-- ─── 4. ENUM e tabela: talent_transactions ───────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'talent_tx_type') THEN
    CREATE TYPE public.talent_tx_type AS ENUM ('earned', 'spent');
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.talent_transactions (
  id           uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id    uuid              NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  church_id    uuid              NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  amount       integer           NOT NULL,
  type         public.talent_tx_type NOT NULL,
  source       text              NOT NULL,
  reference_id uuid,
  created_at   timestamptz       NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS talent_transactions_member_id_idx   ON public.talent_transactions(member_id);
CREATE INDEX IF NOT EXISTS talent_transactions_church_id_idx   ON public.talent_transactions(church_id);
CREATE INDEX IF NOT EXISTS talent_transactions_created_at_idx  ON public.talent_transactions(created_at);

ALTER TABLE public.talent_transactions ENABLE ROW LEVEL SECURITY;

-- Membro vê apenas as suas próprias transações
CREATE POLICY talent_transactions_select ON public.talent_transactions
  FOR SELECT USING (member_id IN (
    SELECT id FROM public.members
    WHERE church_id = (SELECT (auth.jwt()->'app_metadata'->>'church_id')::uuid)
      AND email = auth.jwt()->>'email'
  ));

-- INSERT apenas via service_role (funções SECURITY DEFINER)
-- Sem política de INSERT para authenticated → bloqueado por padrão

-- ─── 5. Função: award_talents ─────────────────────────────────────────────────
-- Registra Talentos ganhos, atualiza total_xp e wallet_balance, detecta level-up.
-- Retorna { new_level, level_name } se houve promoção, NULL caso contrário.

CREATE OR REPLACE FUNCTION public.award_talents(
  p_member_id    uuid,
  p_amount       integer,
  p_source       text,
  p_reference_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_church_id    uuid;
  v_old_level    integer;
  v_new_total_xp integer;
  v_new_level    integer;
  v_level_name   text;
BEGIN
  -- Buscar church_id e nível atual do membro
  SELECT church_id, current_level
    INTO v_church_id, v_old_level
  FROM public.members
  WHERE id = p_member_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Registrar transação de Talentos
  INSERT INTO public.talent_transactions (member_id, church_id, amount, type, source, reference_id)
  VALUES (p_member_id, v_church_id, p_amount, 'earned', p_source, p_reference_id);

  -- Atualizar XP total e saldo — total_xp nunca diminui
  UPDATE public.members
  SET
    total_xp       = total_xp + p_amount,
    wallet_balance = wallet_balance + p_amount
  WHERE id = p_member_id
  RETURNING total_xp INTO v_new_total_xp;

  -- Verificar se atingiu novo nível
  SELECT level, name
    INTO v_new_level, v_level_name
  FROM public.levels
  WHERE min_xp <= v_new_total_xp
  ORDER BY level DESC
  LIMIT 1;

  IF v_new_level IS NOT NULL AND v_new_level > v_old_level THEN
    UPDATE public.members
    SET current_level = v_new_level
    WHERE id = p_member_id;

    RETURN jsonb_build_object(
      'new_level',   v_new_level,
      'level_name',  v_level_name
    );
  END IF;

  RETURN NULL;
END;
$$;

-- ─── 6. Atualizar award_checkin_points para também conceder Talentos ──────────

CREATE OR REPLACE FUNCTION public.award_checkin_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id   uuid;
  v_church_id uuid;
  v_points    integer := 10;
BEGIN
  SELECT mt.team_id, m.church_id
    INTO v_team_id, v_church_id
  FROM public.member_teams mt
  JOIN public.members m ON m.id = mt.member_id
  WHERE mt.member_id = NEW.member_id;

  SELECT points INTO v_points FROM public.score_config WHERE action_type = 'checkin';
  v_points := COALESCE(v_points, 10);

  IF v_team_id IS NOT NULL THEN
    INSERT INTO public.score_events (church_id, member_id, team_id, points, action_type, reference_id)
    VALUES (v_church_id, NEW.member_id, v_team_id, v_points, 'checkin', NEW.id);
  END IF;

  -- Conceder Talentos equivalentes (independente do placar da equipe)
  PERFORM public.award_talents(NEW.member_id, v_points, 'checkin', NEW.id);

  RETURN NEW;
END;
$$;

-- ─── 7. Atualizar award_invite_points para também conceder Talentos ───────────

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
  v_points  integer := 50;
BEGIN
  SELECT team_id INTO v_team_id
  FROM public.member_teams
  WHERE member_id = p_inviter_member_id;

  SELECT points INTO v_points FROM public.score_config WHERE action_type = 'invite';
  v_points := COALESCE(v_points, 50);

  IF v_team_id IS NOT NULL THEN
    INSERT INTO public.score_events (church_id, member_id, team_id, points, action_type)
    VALUES (p_church_id, p_inviter_member_id, v_team_id, v_points, 'invite');
  END IF;

  -- Conceder Talentos equivalentes
  PERFORM public.award_talents(p_inviter_member_id, v_points, 'invite', NULL);
END;
$$;

-- ─── 8. Atualizar mark_daily_reading para também conceder Talentos ────────────

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
  v_streak         public.devotion_streaks%ROWTYPE;
  v_reading_date   date;
  v_new_streak     integer;
  v_bonus_points   integer := 0;
  v_base_points    integer := 10;
  v_bonus_7        integer := 20;
  v_bonus_30       integer := 100;
  v_team_id        uuid;
  v_level_up       jsonb;
  v_level_up_base  jsonb;
BEGIN
  SELECT points INTO v_base_points  FROM public.score_config WHERE action_type = 'daily_read';
  SELECT points INTO v_bonus_7      FROM public.score_config WHERE action_type = 'streak_7';
  SELECT points INTO v_bonus_30     FROM public.score_config WHERE action_type = 'streak_30';
  v_base_points := COALESCE(v_base_points, 10);
  v_bonus_7     := COALESCE(v_bonus_7, 20);
  v_bonus_30    := COALESCE(v_bonus_30, 100);

  SELECT date INTO v_reading_date FROM public.daily_readings WHERE id = p_daily_reading_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Leitura não encontrada');
  END IF;

  SELECT * INTO v_streak FROM public.devotion_streaks WHERE member_id = p_member_id;

  IF FOUND THEN
    IF v_streak.last_read_date = v_reading_date THEN
      RETURN jsonb_build_object('error', 'Leitura já registrada para hoje');
    END IF;

    IF v_streak.last_read_date IS NULL
       OR v_streak.last_read_date < (v_reading_date - INTERVAL '1 day') THEN
      v_new_streak := 1;
    ELSE
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
    v_new_streak := 1;
    INSERT INTO public.devotion_streaks(church_id, member_id, current_streak, longest_streak, last_read_date)
    VALUES (p_church_id, p_member_id, 1, 1, v_reading_date);
  END IF;

  IF v_new_streak = 7 THEN
    v_bonus_points := v_bonus_7;
  ELSIF v_new_streak = 30 THEN
    v_bonus_points := v_bonus_30;
  END IF;

  SELECT team_id INTO v_team_id FROM public.member_teams WHERE member_id = p_member_id;

  IF v_team_id IS NOT NULL THEN
    INSERT INTO public.score_events(church_id, member_id, team_id, points, action_type, reference_id)
    VALUES (p_church_id, p_member_id, v_team_id, v_base_points, 'daily_reading', p_daily_reading_id);

    IF v_bonus_points > 0 THEN
      INSERT INTO public.score_events(church_id, member_id, team_id, points, action_type, reference_id)
      VALUES (p_church_id, p_member_id, v_team_id, v_bonus_points, 'daily_reading', p_daily_reading_id);
    END IF;
  END IF;

  -- Conceder Talentos base — captura possível level-up
  v_level_up_base := public.award_talents(p_member_id, v_base_points, 'daily_reading', p_daily_reading_id);

  -- Conceder Talentos de bônus de streak — pode também gerar level-up
  IF v_bonus_points > 0 THEN
    v_level_up := public.award_talents(p_member_id, v_bonus_points, 'streak_bonus', p_daily_reading_id);
  END IF;

  -- Prioriza level-up do bônus (maior avanço); fallback para o base
  v_level_up := COALESCE(v_level_up, v_level_up_base);

  RETURN jsonb_build_object(
    'current_streak', v_new_streak,
    'bonus_points',   v_bonus_points,
    'base_points',    v_base_points,
    'level_up',       v_level_up
  );
END;
$$;

-- ─── 9. Atualizar get_mural_posts para incluir author_level e author_level_name ─

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
  author_tags       text[],
  author_level      integer,
  author_level_name text,
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
      COALESCE(m.tags, '{}')            AS author_tags,
      COALESCE(m.current_level, 1)      AS author_level,
      COALESCE(lv.name, 'Semente')      AS author_level_name,
      COUNT(DISTINCT c.id) FILTER (WHERE c.is_active = true)  AS comment_count,
      COUNT(DISTINCT r.id) FILTER (WHERE r.type = 'orar')     AS reaction_orar,
      COUNT(DISTINCT r.id) FILTER (WHERE r.type = 'gratidão') AS reaction_gratidao
    FROM posts p
    LEFT JOIN members m           ON m.id  = p.author_id
    LEFT JOIN member_teams mt     ON mt.member_id = m.id
    LEFT JOIN teams t             ON t.id  = mt.team_id
    LEFT JOIN devotion_streaks ds ON ds.member_id = m.id
    LEFT JOIN levels lv           ON lv.level = m.current_level
    LEFT JOIN comments c          ON c.post_id = p.id
    LEFT JOIN reactions r         ON r.post_id = p.id
    WHERE p.church_id = get_my_church_id()
      AND p.is_active = true
    GROUP BY p.id, m.id, t.id, ds.current_streak, lv.name
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
    ps.author_tags,
    ps.author_level,
    ps.author_level_name,
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

-- ─── 10. Atualizar get_individual_leaderboard para incluir nível ──────────────
-- DROP obrigatório: mudança no tipo de retorno (novas colunas current_level + level_name).

DROP FUNCTION IF EXISTS public.get_individual_leaderboard(uuid, text);

CREATE FUNCTION public.get_individual_leaderboard(
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
  total_points  bigint,
  current_level integer,
  level_name    text
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
    COALESCE(SUM(se.points), 0)::bigint   AS total_points,
    COALESCE(m.current_level, 1)          AS current_level,
    COALESCE(lv.name, 'Semente')          AS level_name
  FROM public.members m
  JOIN public.member_teams mt ON mt.member_id = m.id
  JOIN public.teams t ON t.id = mt.team_id
  LEFT JOIN public.levels lv ON lv.level = m.current_level
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
  GROUP BY m.id, m.name, m.avatar_url, t.id, t.name, t.color, m.current_level, lv.name
  ORDER BY COALESCE(SUM(se.points), 0) DESC, m.name ASC
  LIMIT 10;
END;
$$;
