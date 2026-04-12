-- ─── Sessão 3.7: Tags de atribuição + painel admin SaaS ──────────────────────
-- Contém:
--   1. Coluna tags text[] em members (máx 3)
--   2. Tabela score_config com valores padrão de pontuação
--   3. Atualização das funções de pontuação para ler score_config
--   4. Atualização de get_mural_posts para incluir author_tags
--   5. View members_admin_view (sem dados sensíveis)
--   6. NOTA sobre RLS futura de transactions e votes para admin

-- ─── 1. Coluna tags em members ───────────────────────────────────────────────

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

-- Constraint: máximo 3 tags por membro
ALTER TABLE members
  ADD CONSTRAINT members_tags_max_3
  CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 3);

-- Índice GIN para filtrar membros por tag
CREATE INDEX IF NOT EXISTS members_tags_gin_idx ON members USING GIN (tags);

-- ─── 2. Tabela de configuração de pontuação ───────────────────────────────────
-- Admin SaaS pode editar os valores padrão que as funções de pontuação usam.

CREATE TABLE IF NOT EXISTS score_config (
  action_type text        PRIMARY KEY,
  points      integer     NOT NULL DEFAULT 0,
  label       text        NOT NULL,
  description text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE score_config ENABLE ROW LEVEL SECURITY;

-- Todos autenticados lêem (necessário para renderizar gamificação)
CREATE POLICY score_config_select ON score_config
  FOR SELECT TO authenticated USING (true);

-- Apenas admin SaaS pode atualizar
CREATE POLICY score_config_admin_update ON score_config
  FOR UPDATE TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'app_metadata' ->> 'role'),
      'visitante'
    ) = 'admin'
  )
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'app_metadata' ->> 'role'),
      'visitante'
    ) = 'admin'
  );

-- Valores padrão (correspondem aos valores hardcoded anteriores)
INSERT INTO score_config (action_type, points, label, description) VALUES
  ('checkin',    10,  'Check-in em evento',   'Pontos por check-in confirmado em evento'),
  ('invite',     50,  'Convite aceito',        'Pontos quando um convite seu é aceito pelo novo membro'),
  ('daily_read', 10,  'Leitura diária',        'Pontos base por completar a leitura do dia'),
  ('streak_7',   20,  'Streak 7 dias',         'Bônus por 7 dias consecutivos de leitura'),
  ('streak_30',  100, 'Streak 30 dias',        'Bônus por 30 dias consecutivos de leitura')
ON CONFLICT (action_type) DO NOTHING;

-- ─── 3. Atualizar award_checkin_points para ler score_config ─────────────────

CREATE OR REPLACE FUNCTION public.award_checkin_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id   uuid;
  v_church_id uuid;
  v_points    integer := 10; -- fallback
BEGIN
  SELECT mt.team_id, m.church_id
    INTO v_team_id, v_church_id
  FROM public.member_teams mt
  JOIN public.members m ON m.id = mt.member_id
  WHERE mt.member_id = NEW.member_id;

  -- Ler valor configurado (fallback para 10 se não encontrado)
  SELECT points INTO v_points
  FROM public.score_config
  WHERE action_type = 'checkin';

  v_points := COALESCE(v_points, 10);

  IF v_team_id IS NOT NULL THEN
    INSERT INTO public.score_events (church_id, member_id, team_id, points, action_type, reference_id)
    VALUES (v_church_id, NEW.member_id, v_team_id, v_points, 'checkin', NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- ─── 4. Atualizar award_invite_points para ler score_config ──────────────────

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
  v_points  integer := 50; -- fallback
BEGIN
  SELECT team_id INTO v_team_id
  FROM public.member_teams
  WHERE member_id = p_inviter_member_id;

  SELECT points INTO v_points
  FROM public.score_config
  WHERE action_type = 'invite';

  v_points := COALESCE(v_points, 50);

  IF v_team_id IS NOT NULL THEN
    INSERT INTO public.score_events (church_id, member_id, team_id, points, action_type)
    VALUES (p_church_id, p_inviter_member_id, v_team_id, v_points, 'invite');
  END IF;
END;
$$;

-- ─── 5. Atualizar mark_daily_reading para ler score_config ───────────────────

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
  v_streak        public.devotion_streaks%ROWTYPE;
  v_reading_date  date;
  v_new_streak    integer;
  v_bonus_points  integer := 0;
  v_base_points   integer := 10;
  v_bonus_7       integer := 20;
  v_bonus_30      integer := 100;
  v_team_id       uuid;
BEGIN
  -- Ler valores de pontuação configurados
  SELECT points INTO v_base_points  FROM public.score_config WHERE action_type = 'daily_read';
  SELECT points INTO v_bonus_7      FROM public.score_config WHERE action_type = 'streak_7';
  SELECT points INTO v_bonus_30     FROM public.score_config WHERE action_type = 'streak_30';
  v_base_points := COALESCE(v_base_points, 10);
  v_bonus_7     := COALESCE(v_bonus_7, 20);
  v_bonus_30    := COALESCE(v_bonus_30, 100);

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

  -- Bônus de milestone
  IF v_new_streak = 7 THEN
    v_bonus_points := v_bonus_7;
  ELSIF v_new_streak = 30 THEN
    v_bonus_points := v_bonus_30;
  END IF;

  SELECT team_id INTO v_team_id
  FROM public.member_teams
  WHERE member_id = p_member_id;

  IF v_team_id IS NOT NULL THEN
    INSERT INTO public.score_events(church_id, member_id, team_id, points, action_type, reference_id)
    VALUES (p_church_id, p_member_id, v_team_id, v_base_points, 'daily_reading', p_daily_reading_id);

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

-- ─── 6. Atualizar get_mural_posts para incluir author_tags ───────────────────
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
  author_tags       text[],
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
      COUNT(DISTINCT c.id) FILTER (WHERE c.is_active = true)  AS comment_count,
      COUNT(DISTINCT r.id) FILTER (WHERE r.type = 'orar')     AS reaction_orar,
      COUNT(DISTINCT r.id) FILTER (WHERE r.type = 'gratidão') AS reaction_gratidao
    FROM posts p
    LEFT JOIN members m           ON m.id = p.author_id
    LEFT JOIN member_teams mt     ON mt.member_id = m.id
    LEFT JOIN teams t             ON t.id = mt.team_id
    LEFT JOIN devotion_streaks ds ON ds.member_id = m.id
    LEFT JOIN comments c          ON c.post_id = p.id
    LEFT JOIN reactions r         ON r.post_id = p.id
    WHERE p.church_id = get_my_church_id()
      AND p.is_active = true
    GROUP BY p.id, m.id, t.id, ds.current_streak, m.tags
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

-- ─── 7. View de membros para admin SaaS (sem dados sensíveis) ────────────────
-- Admin acessa apenas via esta view ou via Server Actions que fazem SELECT explícito.
-- CPF, RG, email, telefone e endereço nunca são retornados para o admin SaaS.

CREATE OR REPLACE VIEW members_admin_view AS
  SELECT
    id,
    church_id,
    home_church_id,
    name,
    role,
    avatar_url,
    is_active,
    tags,
    created_at,
    updated_at
  FROM members;

COMMENT ON VIEW members_admin_view IS
  'Vista de membros para admin SaaS — exclui CPF, RG, email, telefone, endereço. '
  'Usada nos Server Actions de admin para garantir conformidade LGPD.';

-- ─── NOTA: RLS futura para admin em tabelas financeiras e de votação ──────────
-- IMPORTANTE para sessões futuras (Fase 4/5):
--
-- Quando 'transactions' for criada, NÃO adicionar política SELECT para admin:
--   -- CREATE POLICY transactions_admin_block ON transactions
--   --   FOR SELECT TO authenticated
--   --   USING (COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') != 'admin');
--
-- Quando 'votes' for criada, NÃO expor voter_hash nem candidate_id para admin:
--   -- Criar view votes_admin_view sem esses campos se acesso parcial for necessário.
--
-- O admin SaaS NUNCA deve ver dados financeiros ou de votação dos tenants.
