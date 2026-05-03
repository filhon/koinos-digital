-- Sessão 5.3 — Seed feature_flags por plano (cumulativo)
-- Planos: gratis → crescimento → igreja → catedral
-- Add-ons: sem linha na tabela = isFeatureEnabled retorna false por padrão

-- ─── GRÁTIS ──────────────────────────────────────────────────────────────────
INSERT INTO feature_flags (plan, feature_key, enabled) VALUES
  ('gratis', 'membros',           true),
  ('gratis', 'agenda',            true),
  ('gratis', 'eventos',           true),
  ('gratis', 'mural',             true),
  ('gratis', 'gamificacao_basica',true)
ON CONFLICT (plan, feature_key) DO NOTHING;

-- ─── CRESCIMENTO (inclui Grátis + mais) ─────────────────────────────────────
INSERT INTO feature_flags (plan, feature_key, enabled) VALUES
  ('crescimento', 'membros',            true),
  ('crescimento', 'agenda',             true),
  ('crescimento', 'eventos',            true),
  ('crescimento', 'mural',              true),
  ('crescimento', 'gamificacao_basica', true),
  ('crescimento', 'ministerios',        true),
  ('crescimento', 'escalas',            true),
  ('crescimento', 'grupos_musicais',    true),
  ('crescimento', 'repertorio',         true),
  ('crescimento', 'recursos',           true)
ON CONFLICT (plan, feature_key) DO NOTHING;

-- ─── IGREJA (inclui Crescimento + mais) ─────────────────────────────────────
INSERT INTO feature_flags (plan, feature_key, enabled) VALUES
  ('igreja', 'membros',            true),
  ('igreja', 'agenda',             true),
  ('igreja', 'eventos',            true),
  ('igreja', 'mural',              true),
  ('igreja', 'gamificacao_basica', true),
  ('igreja', 'ministerios',        true),
  ('igreja', 'escalas',            true),
  ('igreja', 'grupos_musicais',    true),
  ('igreja', 'repertorio',         true),
  ('igreja', 'recursos',           true),
  ('igreja', 'financeiro_basico',  true),
  ('igreja', 'assembleia',         true)
ON CONFLICT (plan, feature_key) DO NOTHING;

-- ─── CATEDRAL (inclui Igreja + mais) ────────────────────────────────────────
INSERT INTO feature_flags (plan, feature_key, enabled) VALUES
  ('catedral', 'membros',            true),
  ('catedral', 'agenda',             true),
  ('catedral', 'eventos',            true),
  ('catedral', 'mural',              true),
  ('catedral', 'gamificacao_basica', true),
  ('catedral', 'ministerios',        true),
  ('catedral', 'escalas',            true),
  ('catedral', 'grupos_musicais',    true),
  ('catedral', 'repertorio',         true),
  ('catedral', 'recursos',           true),
  ('catedral', 'financeiro_basico',  true),
  ('catedral', 'assembleia',         true),
  ('catedral', 'multi_congregacao',  true),
  ('catedral', 'suporte_prioritario',true)
ON CONFLICT (plan, feature_key) DO NOTHING;

-- ─── ADD-ONS ─────────────────────────────────────────────────────────────────
-- Não inseridos em nenhum plano base.
-- isFeatureEnabled retorna false (registro ausente) até ativação por tenant.
-- Chaves: liturgia_ia, escala_ia, landing_dominio, financeiro_avancado,
--         assembleia_votacao, analytics_gamificacao
