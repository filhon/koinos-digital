-- ============================================================
-- Sessão 3.6 — Check-in por QR Code
-- ============================================================

-- Tabela de check-ins
CREATE TABLE IF NOT EXISTS public.check_ins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  church_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  method text NOT NULL CHECK (method IN ('qr_app', 'qr_web', 'manual')),
  geo_lat numeric(10, 7),
  geo_lng numeric(10, 7),
  visitor_name text,
  visitor_phone text
);

-- Índices
CREATE INDEX check_ins_event_id_idx ON public.check_ins(event_id);
CREATE INDEX check_ins_member_id_idx ON public.check_ins(member_id) WHERE member_id IS NOT NULL;
CREATE INDEX check_ins_church_id_idx ON public.check_ins(church_id);
CREATE UNIQUE INDEX check_ins_member_event_unique ON public.check_ins(event_id, member_id)
  WHERE member_id IS NOT NULL;

-- RLS
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY check_ins_select ON public.check_ins
  FOR SELECT TO authenticated
  USING (church_id = get_my_church_id());

CREATE POLICY check_ins_insert ON public.check_ins
  FOR INSERT TO authenticated
  WITH CHECK (church_id = get_my_church_id());

-- ─── Função: award_checkin_points ──────────────────────────────────────────
-- Trigger: INSERT em check_ins → +10 pts para o membro (se logado)
CREATE OR REPLACE FUNCTION public.award_checkin_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid;
BEGIN
  IF NEW.member_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT team_id INTO v_team_id
  FROM public.member_teams
  WHERE member_id = NEW.member_id
  LIMIT 1;

  INSERT INTO public.score_events (member_id, team_id, church_id, points, action_type, reference_id)
  VALUES (NEW.member_id, v_team_id, NEW.church_id, 10, 'checkin', NEW.id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER check_ins_award_points
  AFTER INSERT ON public.check_ins
  FOR EACH ROW EXECUTE FUNCTION award_checkin_points();

-- ─── RPC: get_checkin_count ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_checkin_count(p_event_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.check_ins
  WHERE event_id = p_event_id;
$$;

-- ─── RPC: get_checkin_list ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_checkin_list(p_event_id uuid)
RETURNS TABLE (
  id uuid,
  member_id uuid,
  member_name text,
  member_avatar text,
  checked_in_at timestamptz,
  method text,
  visitor_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ci.id,
    ci.member_id,
    m.name AS member_name,
    m.avatar_url AS member_avatar,
    ci.checked_in_at,
    ci.method,
    ci.visitor_name
  FROM public.check_ins ci
  LEFT JOIN public.members m ON m.id = ci.member_id
  WHERE ci.event_id = p_event_id
  ORDER BY ci.checked_in_at DESC;
$$;
