-- ─────────────────────────────────────────────────────────────────────────────
-- Sessão 3.5 — Badges e conquistas
-- Tabelas: badges (global), member_badges (por tenant)
-- Função: check_and_award_badges
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Tabela: badges (global, sem church_id) ───────────────────────────────

CREATE TABLE IF NOT EXISTS public.badges (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text        NOT NULL UNIQUE,
  description    text        NOT NULL,
  icon           text        NOT NULL DEFAULT '🏆',
  trigger_type   text        NOT NULL CHECK (
    trigger_type IN ('first_checkin', 'invite_count', 'streak_days', 'tenure_days')
  ),
  trigger_config jsonb       NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ─── 2. Tabela: member_badges ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.member_badges (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id   uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  badge_id    uuid        NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (member_id, badge_id)
);

CREATE INDEX IF NOT EXISTS member_badges_member_id_idx ON public.member_badges(member_id);
CREATE INDEX IF NOT EXISTS member_badges_church_id_idx ON public.member_badges(church_id);
CREATE INDEX IF NOT EXISTS member_badges_badge_id_idx  ON public.member_badges(badge_id);

-- ─── 3. RLS: badges (leitura global para autenticados) ───────────────────────

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY badges_select ON public.badges
  FOR SELECT USING (auth.role() = 'authenticated');

-- ─── 4. RLS: member_badges ───────────────────────────────────────────────────

ALTER TABLE public.member_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY member_badges_select ON public.member_badges
  FOR SELECT USING (
    church_id = (SELECT (auth.jwt()->'app_metadata'->>'church_id')::uuid)
  );

-- Inserção feita exclusivamente via SECURITY DEFINER (check_and_award_badges).
-- Nenhum cliente insere diretamente.

-- ─── 5. Seed: badges iniciais ────────────────────────────────────────────────

INSERT INTO public.badges (name, description, icon, trigger_type, trigger_config)
VALUES
  (
    'Primeiro Passo',
    'Realizou o primeiro check-in em um evento da comunidade.',
    '👣',
    'first_checkin',
    '{}'
  ),
  (
    'Evangelista',
    'Convidou 5 pessoas que ingressaram na comunidade.',
    '📣',
    'invite_count',
    '{"count": 5}'
  ),
  (
    'Fiel',
    'Manteve 7 dias consecutivos de leitura devocional.',
    '🔥',
    'streak_days',
    '{"days": 7}'
  ),
  (
    'Devoto',
    'Manteve 30 dias consecutivos de leitura devocional.',
    '✨',
    'streak_days',
    '{"days": 30}'
  ),
  (
    'Veterano',
    'Está na comunidade há 1 ano ou mais.',
    '🌟',
    'tenure_days',
    '{"days": 365}'
  )
ON CONFLICT (name) DO NOTHING;

-- ─── 6. Função: check_and_award_badges ───────────────────────────────────────
-- SECURITY DEFINER: chamada via admin client na Server Action.
-- Verifica todas as condições de badges para o membro e atribui os que faltam.
-- Retorna jsonb com a lista de badges recém-desbloqueados.

CREATE OR REPLACE FUNCTION public.check_and_award_badges(
  p_member_id uuid,
  p_church_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_badge         RECORD;
  v_awarded       jsonb := '[]'::jsonb;
  v_condition     boolean;
  v_config        jsonb;
  v_streak        integer := 0;
  v_invite_count  integer := 0;
  v_checkin_count integer := 0;
  v_created_at    timestamptz;
  v_inserted      boolean;
BEGIN
  -- Dados do membro
  SELECT created_at INTO v_created_at
  FROM public.members
  WHERE id = p_member_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('awarded', '[]'::jsonb);
  END IF;

  -- Streak máximo já atingido
  SELECT COALESCE(longest_streak, 0) INTO v_streak
  FROM public.devotion_streaks
  WHERE member_id = p_member_id;

  -- Convites aceitos (score_events por action_type = 'invite')
  SELECT COUNT(*) INTO v_invite_count
  FROM public.score_events
  WHERE member_id = p_member_id
    AND action_type = 'invite';

  -- Check-ins registrados via score_events
  -- (a tabela check_ins será criada na sessão 3.6; usar score_events como proxy)
  SELECT COUNT(*) INTO v_checkin_count
  FROM public.score_events
  WHERE member_id = p_member_id
    AND action_type = 'checkin';

  FOR v_badge IN SELECT * FROM public.badges ORDER BY created_at ASC LOOP
    -- Pular se já desbloqueado
    IF EXISTS (
      SELECT 1 FROM public.member_badges
      WHERE member_id = p_member_id AND badge_id = v_badge.id
    ) THEN
      CONTINUE;
    END IF;

    v_config    := v_badge.trigger_config;
    v_condition := false;

    CASE v_badge.trigger_type
      WHEN 'first_checkin' THEN
        v_condition := v_checkin_count >= 1;

      WHEN 'invite_count' THEN
        v_condition := v_invite_count >= COALESCE((v_config->>'count')::integer, 1);

      WHEN 'streak_days' THEN
        v_condition := v_streak >= COALESCE((v_config->>'days')::integer, 1);

      WHEN 'tenure_days' THEN
        v_condition := v_created_at IS NOT NULL
          AND v_created_at <= now() - (
            COALESCE((v_config->>'days')::integer, 365) || ' days'
          )::interval;

      ELSE
        v_condition := false;
    END CASE;

    IF v_condition THEN
      INSERT INTO public.member_badges (church_id, member_id, badge_id)
      VALUES (p_church_id, p_member_id, v_badge.id)
      ON CONFLICT (member_id, badge_id) DO NOTHING;

      GET DIAGNOSTICS v_inserted = ROW_COUNT;

      IF v_inserted THEN
        v_awarded := v_awarded || jsonb_build_array(
          jsonb_build_object(
            'badge_id',    v_badge.id,
            'name',        v_badge.name,
            'icon',        v_badge.icon,
            'description', v_badge.description
          )
        );
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('awarded', v_awarded);
END;
$$;
