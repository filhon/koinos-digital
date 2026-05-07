-- Migration: tenant_feature_overrides
-- Permite ao admin SaaS habilitar/desabilitar features específicas por tenant,
-- sobrescrevendo o plano base. Usado para acesso de demonstração e suporte.

CREATE TABLE IF NOT EXISTS tenant_feature_overrides (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feature_key text        NOT NULL,
  enabled     boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, feature_key)
);

ALTER TABLE tenant_feature_overrides ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados não têm acesso direto; o app usa service_role (admin client).
CREATE POLICY "tenant_feature_overrides_deny_authenticated"
  ON tenant_feature_overrides
  FOR ALL
  TO authenticated
  USING (false);

CREATE INDEX idx_tenant_feature_overrides_tenant ON tenant_feature_overrides(tenant_id);
