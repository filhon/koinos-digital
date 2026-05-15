-- ─────────────────────────────────────────────────────────────────────────────
-- Sessão 8.2 — Loja Digital (itens digitais + compra com Talentos)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. ENUM: shop_category ───────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shop_category') THEN
    CREATE TYPE public.shop_category AS ENUM (
      'avatar_frame',
      'badge_special',
      'theme',
      'title',
      'boost'
    );
  END IF;
END;
$$;

-- ─── 2. Tabela: shop_items ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.shop_items (
  id             uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text              NOT NULL,
  description    text              NOT NULL,
  category       public.shop_category NOT NULL,
  price          integer           NOT NULL CHECK (price >= 0),
  icon_url       text,
  metadata       jsonb             NOT NULL DEFAULT '{}',
  is_active      boolean           NOT NULL DEFAULT true,
  max_purchases  integer,          -- null = ilimitado, 1 = compra única
  created_at     timestamptz       NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shop_items_category_idx  ON public.shop_items(category);
CREATE INDEX IF NOT EXISTS shop_items_is_active_idx ON public.shop_items(is_active);

ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

-- Todos podem ver itens ativos (anon + authenticated)
CREATE POLICY shop_items_select ON public.shop_items
  FOR SELECT USING (is_active = true);

-- Escrita apenas via service_role (sem policy para authenticated → bloqueado)

-- ─── 3. Tabela: shop_purchases ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.shop_purchases (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   uuid        NOT NULL REFERENCES public.members(id)    ON DELETE CASCADE,
  church_id   uuid        NOT NULL REFERENCES public.tenants(id)    ON DELETE CASCADE,
  item_id     uuid        NOT NULL REFERENCES public.shop_items(id) ON DELETE RESTRICT,
  price_paid  integer     NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shop_purchases_member_id_idx ON public.shop_purchases(member_id);
CREATE INDEX IF NOT EXISTS shop_purchases_item_id_idx   ON public.shop_purchases(item_id);
CREATE INDEX IF NOT EXISTS shop_purchases_church_id_idx ON public.shop_purchases(church_id);

ALTER TABLE public.shop_purchases ENABLE ROW LEVEL SECURITY;

-- Membro vê apenas suas próprias compras
CREATE POLICY shop_purchases_select ON public.shop_purchases
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM public.members
      WHERE church_id = (SELECT (auth.jwt()->'app_metadata'->>'church_id')::uuid)
        AND email = auth.jwt()->>'email'
    )
  );

-- ─── 4. Trigger: enforce max_purchases ───────────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_max_purchases()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max    integer;
  v_count  integer;
BEGIN
  SELECT max_purchases INTO v_max FROM public.shop_items WHERE id = NEW.item_id;

  IF v_max IS NULL THEN
    RETURN NEW; -- ilimitado
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.shop_purchases
  WHERE member_id = NEW.member_id AND item_id = NEW.item_id;

  IF v_count >= v_max THEN
    RAISE EXCEPTION 'purchase_limit_reached';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER shop_purchases_max_check
  BEFORE INSERT ON public.shop_purchases
  FOR EACH ROW EXECUTE FUNCTION public.check_max_purchases();

-- ─── 5. Tabela: member_equipped_items ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.member_equipped_items (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   uuid        NOT NULL REFERENCES public.members(id)    ON DELETE CASCADE,
  item_id     uuid        NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  category    text        NOT NULL,
  equipped_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (member_id, category)
);

CREATE INDEX IF NOT EXISTS member_equipped_items_member_idx ON public.member_equipped_items(member_id);

ALTER TABLE public.member_equipped_items ENABLE ROW LEVEL SECURITY;

-- Membro vê e gerencia apenas seus próprios itens equipados
CREATE POLICY member_equipped_items_select ON public.member_equipped_items
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM public.members
      WHERE church_id = (SELECT (auth.jwt()->'app_metadata'->>'church_id')::uuid)
        AND email = auth.jwt()->>'email'
    )
  );

-- ─── 6. ALTER TABLE members — active_boost ────────────────────────────────────

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS active_boost jsonb;
-- Estrutura: { "item_id": uuid, "multiplier": 1.5, "expires_at": "ISO8601" }

-- ─── 7. Atualizar award_talents — verificar active_boost ─────────────────────

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
  v_church_id      uuid;
  v_old_level      integer;
  v_boost          jsonb;
  v_multiplier     numeric := 1.0;
  v_final_amount   integer;
  v_new_total_xp   integer;
  v_new_level      integer;
  v_level_name     text;
BEGIN
  SELECT church_id, current_level, active_boost
    INTO v_church_id, v_old_level, v_boost
  FROM public.members
  WHERE id = p_member_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Verificar boost ativo não expirado
  IF v_boost IS NOT NULL
     AND (v_boost->>'expires_at') IS NOT NULL
     AND (v_boost->>'expires_at')::timestamptz > now() THEN
    v_multiplier := COALESCE((v_boost->>'multiplier')::numeric, 1.0);
  END IF;

  v_final_amount := CEIL(p_amount::numeric * v_multiplier)::integer;

  -- Registrar transação de Talentos (valor boosted)
  INSERT INTO public.talent_transactions (member_id, church_id, amount, type, source, reference_id)
  VALUES (p_member_id, v_church_id, v_final_amount, 'earned', p_source, p_reference_id);

  -- Atualizar XP total e saldo
  UPDATE public.members
  SET
    total_xp       = total_xp + v_final_amount,
    wallet_balance = wallet_balance + v_final_amount
  WHERE id = p_member_id
  RETURNING total_xp INTO v_new_total_xp;

  -- Verificar level-up
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
      'new_level',  v_new_level,
      'level_name', v_level_name
    );
  END IF;

  RETURN NULL;
END;
$$;

-- ─── 8. Seed: shop_items ──────────────────────────────────────────────────────

INSERT INTO public.shop_items (name, description, category, price, metadata, max_purchases) VALUES

-- avatar_frame
('Moldura Prateada',  'Anel prateado ao redor do seu avatar.',
  'avatar_frame', 100,  '{"style":"silver","color":"oklch(0.72 0.02 220)"}', 1),
('Moldura Dourada',   'Anel dourado ao redor do seu avatar.',
  'avatar_frame', 200,  '{"style":"gold","color":"oklch(0.78 0.14 82)"}', 1),
('Moldura Tribal',    'Moldura na cor da sua Tribo.',
  'avatar_frame', 150,  '{"style":"tribal","color":null}', 1),
('Moldura Brilhante', 'Efeito glow pulsante ao redor do avatar.',
  'avatar_frame', 300,  '{"style":"glow","color":"oklch(0.75 0.18 56)"}', 1),

-- title
('Desbravador',           'Título exibido no seu perfil.',
  'title', 100,  '{}', 1),
('Benção Ambulante',       'Título especial para os mais generosos.',
  'title', 200,  '{}', 1),
('Guerreiro de Oração',    'Para os que nunca param de interceder.',
  'title', 300,  '{}', 1),
('Adorador',               'Para quem louva com todo o coração.',
  'title', 250,  '{}', 1),

-- badge_special
('Colecionador', 'Badge brilhante exibido no perfil público.',
  'badge_special', 500,  '{"color":"oklch(0.75 0.18 56)","icon":"🏆"}', 1),
('Estrela Koinos', 'Badge premium exclusivo.',
  'badge_special', 1000, '{"color":"oklch(0.82 0.15 80)","icon":"⭐"}', 1),

-- theme
('Tema Celestial',  'Gradiente azul-dourado no perfil público.',
  'theme', 400,  '{"gradient":"linear-gradient(135deg, oklch(0.28 0.08 240) 0%, oklch(0.55 0.14 58) 100%)"}', 1),
('Tema Amanhecer',  'Gradiente quente no perfil público.',
  'theme', 300,  '{"gradient":"linear-gradient(135deg, oklch(0.45 0.12 38) 0%, oklch(0.72 0.14 72) 100%)"}', 1),
('Tema Noturno',    'Gradiente escuro com brilho sutil.',
  'theme', 300,  '{"gradient":"linear-gradient(135deg, oklch(0.12 0.04 260) 0%, oklch(0.32 0.06 220) 100%)"}', 1),

-- boost
('Boost de XP 2× por 24h',   'Dobra o XP ganho por 24 horas.',
  'boost', 150,  '{"duration_hours":24,"multiplier":2}', NULL),
('Boost de XP 1.5× por 7 dias', 'Aumenta o XP em 50% por 7 dias.',
  'boost', 500,  '{"duration_hours":168,"multiplier":1.5}', NULL)

ON CONFLICT DO NOTHING;

-- ─── 9. Atualizar get_mural_posts — incluir frame, título e boost ─────────────

DROP FUNCTION IF EXISTS get_mural_posts(uuid, int, int);

CREATE FUNCTION get_mural_posts(
  p_member_id uuid,
  p_limit     int DEFAULT 10,
  p_offset    int DEFAULT 0
)
RETURNS TABLE (
  id                    uuid,
  church_id             uuid,
  author_id             uuid,
  content               text,
  pinned_until          timestamptz,
  created_at            timestamptz,
  author_name           text,
  author_avatar_url     text,
  author_role           text,
  author_team_name      text,
  author_team_color     text,
  author_streak         integer,
  author_tags           text[],
  author_level          integer,
  author_level_name     text,
  author_equipped_frame jsonb,
  author_equipped_title text,
  author_has_boost      boolean,
  comment_count         bigint,
  reaction_orar         bigint,
  reaction_gratidao     bigint,
  user_orar             boolean,
  user_gratidao         boolean
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
      si_frame.metadata                 AS author_equipped_frame,
      si_title.name                     AS author_equipped_title,
      CASE
        WHEN m.active_boost IS NOT NULL
          AND (m.active_boost->>'expires_at')::timestamptz > now()
        THEN true ELSE false
      END                               AS author_has_boost,
      COUNT(DISTINCT c.id) FILTER (WHERE c.is_active = true)  AS comment_count,
      COUNT(DISTINCT r.id) FILTER (WHERE r.type = 'orar')     AS reaction_orar,
      COUNT(DISTINCT r.id) FILTER (WHERE r.type = 'gratidão') AS reaction_gratidao
    FROM posts p
    LEFT JOIN members m             ON m.id  = p.author_id
    LEFT JOIN member_teams mt       ON mt.member_id = m.id
    LEFT JOIN teams t               ON t.id  = mt.team_id
    LEFT JOIN devotion_streaks ds   ON ds.member_id = m.id
    LEFT JOIN levels lv             ON lv.level = m.current_level
    LEFT JOIN member_equipped_items mei_frame
                                    ON mei_frame.member_id = m.id
                                   AND mei_frame.category = 'avatar_frame'
    LEFT JOIN shop_items si_frame   ON si_frame.id = mei_frame.item_id
    LEFT JOIN member_equipped_items mei_title
                                    ON mei_title.member_id = m.id
                                   AND mei_title.category = 'title'
    LEFT JOIN shop_items si_title   ON si_title.id = mei_title.item_id
    LEFT JOIN comments c            ON c.post_id = p.id
    LEFT JOIN reactions r           ON r.post_id = p.id
    WHERE p.church_id = get_my_church_id()
      AND p.is_active = true
    GROUP BY p.id, m.id, t.id, ds.current_streak, lv.name,
             si_frame.metadata, si_title.name, m.active_boost
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
    ps.author_equipped_frame,
    ps.author_equipped_title,
    ps.author_has_boost,
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
    CASE WHEN ps.pinned_until > now() THEN 0 ELSE 1 END,
    ps.reaction_orar * 3 + ps.reaction_gratidao * 2 + ps.comment_count DESC,
    ps.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
$$;
