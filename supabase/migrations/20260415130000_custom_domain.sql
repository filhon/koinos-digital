-- ─── Sessão 4.5: Domínio personalizado por tenant ────────────────────────────

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS custom_domain  text,
  ADD COLUMN IF NOT EXISTS domain_verified boolean NOT NULL DEFAULT false;

-- Índice único parcial: ignora NULLs (permite múltiplos tenants sem domínio)
CREATE UNIQUE INDEX IF NOT EXISTS tenants_custom_domain_uniq
  ON tenants (custom_domain)
  WHERE custom_domain IS NOT NULL;

-- RLS: leitura do custom_domain em tenants publicados (já coberta pela policy
-- existente de SELECT público para is_published = true, não precisa de nova policy).

-- Permite que o anon client leia custom_domain de tenants publicados
-- (necessário para o middleware resolver domínio → slug sem admin client)
-- A policy existente "tenants_select_public" cobre este campo automaticamente.
