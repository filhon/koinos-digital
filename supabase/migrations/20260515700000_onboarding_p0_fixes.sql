-- ─── P0 fixes for onboarding ────────────────────────────────────────────────

-- P0.1: Fix RLS UPDATE policy on onboarding_progress (missing church_id check)
DROP POLICY IF EXISTS "onboarding_progress_update" ON public.onboarding_progress;

CREATE POLICY "onboarding_progress_update" ON public.onboarding_progress
  FOR UPDATE USING (
    member_id = (SELECT auth.uid())
    AND church_id = (SELECT get_my_church_id())
  );

-- P0.3: Add expires_at column to invite_links (30-day default)
ALTER TABLE public.invite_links
  ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT (now() + interval '30 days');

-- P0.4: Atomic tenant + member creation (single transaction)
CREATE OR REPLACE FUNCTION public.create_church_with_pastor(
  p_church_name   text,
  p_cnpj          text,
  p_slug          text,
  p_member_name   text,
  p_username      text,
  p_cpf           text,
  p_email         text,
  p_phone         text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_church_id uuid;
  v_member_id uuid;
BEGIN
  INSERT INTO tenants (name, cnpj, slug, plan, shared_finances)
  VALUES (p_church_name, NULLIF(p_cnpj, ''), p_slug, 'gratuito', false)
  RETURNING id INTO v_church_id;

  INSERT INTO members (church_id, home_church_id, name, username, cpf, email, role, phone, is_active)
  VALUES (v_church_id, v_church_id, p_member_name, NULLIF(p_username, ''), p_cpf, p_email, 'pastor', p_phone, true)
  RETURNING id INTO v_member_id;

  RETURN jsonb_build_object('church_id', v_church_id, 'member_id', v_member_id);
END;
$$;
