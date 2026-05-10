-- Migration: onboarding_progress
-- Tracks guided onboarding completion for pastor users

CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id            uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id     uuid        NOT NULL UNIQUE REFERENCES public.members(id) ON DELETE CASCADE,
  church_id     uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  steps_completed text[]    NOT NULL DEFAULT '{}',
  completed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- updated_at trigger
CREATE TRIGGER onboarding_progress_updated_at
  BEFORE UPDATE ON public.onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index for common lookups
CREATE INDEX idx_onboarding_progress_church ON public.onboarding_progress(church_id);

-- RLS
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onboarding_progress_select" ON public.onboarding_progress
  FOR SELECT USING (
    member_id = (SELECT auth.uid())
  );

CREATE POLICY "onboarding_progress_insert" ON public.onboarding_progress
  FOR INSERT WITH CHECK (
    member_id = (SELECT auth.uid())
    AND church_id = (SELECT get_my_church_id())
  );

CREATE POLICY "onboarding_progress_update" ON public.onboarding_progress
  FOR UPDATE USING (
    member_id = (SELECT auth.uid())
  );
