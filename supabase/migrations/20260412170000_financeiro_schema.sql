-- ─── Financeiro module ───────────────────────────────────────────────────────
-- Sessão 4.1 — Contas + Transações + KPIs

-- ============================================================
-- ENUM
-- ============================================================

CREATE TYPE transaction_type AS ENUM ('entrada', 'saída');

-- ============================================================
-- TABLE: accounts
-- ============================================================

CREATE TABLE accounts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name           TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 200),
  description    TEXT CHECK (char_length(description) <= 500),
  bank           TEXT CHECK (char_length(bank) <= 100),
  agency         TEXT CHECK (char_length(agency) <= 20),
  -- account_number armazenado criptografado (AES-256-GCM: iv:tag:ciphertext em hex)
  account_number TEXT,
  initial_balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  current_balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: transactions
-- ============================================================

CREATE TABLE transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  account_id     UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  type           transaction_type NOT NULL,
  date           DATE NOT NULL,
  description    TEXT NOT NULL CHECK (char_length(description) BETWEEN 2 AND 500),
  category       TEXT NOT NULL CHECK (char_length(category) BETWEEN 1 AND 100),
  value          NUMERIC(14, 2) NOT NULL CHECK (value > 0),
  -- member_id opcional: quem gerou a transação (doação, etc.)
  member_id      UUID REFERENCES members(id) ON DELETE SET NULL,
  receipt_url    TEXT,
  notes          TEXT CHECK (char_length(notes) <= 1000),
  -- Para estornos: referência à transação original
  reversal_of    UUID REFERENCES transactions(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
  -- NÃO tem updated_at: transações são imutáveis
);

-- ============================================================
-- TRIGGER: atualizar current_balance ao inserir transação
-- ============================================================

CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.type = 'entrada' THEN
    UPDATE accounts SET current_balance = current_balance + NEW.value
    WHERE id = NEW.account_id;
  ELSE
    UPDATE accounts SET current_balance = current_balance - NEW.value
    WHERE id = NEW.account_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER transactions_update_balance
  AFTER INSERT ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- ============================================================
-- TRIGGER: updated_at em accounts
-- ============================================================

-- Função set_updated_at() já existe (criada na sessão 2.3)
CREATE TRIGGER accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- POLICY DE IMUTABILIDADE: DENY UPDATE/DELETE em transactions
-- ============================================================
-- Usamos RLS para bloquear UPDATE e DELETE de qualquer role,
-- incluindo service_role via políticas permissivas vazias.
-- A regra de negócio é: correção = estorno (nova transação inversa).

-- Nota: UPDATE e DELETE não terão políticas permissivas → sempre negados por RLS.

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_accounts_church
  ON accounts(church_id)
  WHERE is_active = true;

CREATE INDEX idx_transactions_church
  ON transactions(church_id);

CREATE INDEX idx_transactions_account
  ON transactions(account_id);

CREATE INDEX idx_transactions_date
  ON transactions(church_id, date DESC);

CREATE INDEX idx_transactions_type
  ON transactions(church_id, type);

CREATE INDEX idx_transactions_reversal
  ON transactions(reversal_of)
  WHERE reversal_of IS NOT NULL;

-- ============================================================
-- RLS: accounts
-- ============================================================

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Leitura: tesoureiro, diácono, presbítero, pastor, admin
CREATE POLICY "accounts_select"
  ON accounts FOR SELECT
  USING (
    church_id = get_my_church_id()
    AND is_active = true
    AND get_my_role() = ANY(ARRAY['admin','pastor','presbítero','diácono','tesoureiro'])
  );

-- Insert: apenas tesoureiro+
CREATE POLICY "accounts_insert"
  ON accounts FOR INSERT
  WITH CHECK (
    church_id = get_my_church_id()
    AND get_my_role() = ANY(ARRAY['admin','pastor','tesoureiro'])
  );

-- Update: apenas tesoureiro+ (metadados da conta, não saldo diretamente)
CREATE POLICY "accounts_update"
  ON accounts FOR UPDATE
  USING (
    church_id = get_my_church_id()
    AND get_my_role() = ANY(ARRAY['admin','pastor','tesoureiro'])
  )
  WITH CHECK (
    church_id = get_my_church_id()
    AND get_my_role() = ANY(ARRAY['admin','pastor','tesoureiro'])
  );

-- Delete (soft-delete via is_active): apenas pastor+
CREATE POLICY "accounts_delete"
  ON accounts FOR DELETE
  USING (
    church_id = get_my_church_id()
    AND get_my_role() = ANY(ARRAY['admin','pastor'])
  );

-- ============================================================
-- RLS: transactions (IMUTÁVEIS — sem UPDATE/DELETE policies)
-- ============================================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Leitura: tesoureiro, diácono, presbítero, pastor, admin
CREATE POLICY "transactions_select"
  ON transactions FOR SELECT
  USING (
    church_id = get_my_church_id()
    AND get_my_role() = ANY(ARRAY['admin','pastor','presbítero','diácono','tesoureiro'])
  );

-- Insert: apenas tesoureiro+
CREATE POLICY "transactions_insert"
  ON transactions FOR INSERT
  WITH CHECK (
    church_id = get_my_church_id()
    AND get_my_role() = ANY(ARRAY['admin','pastor','tesoureiro'])
  );

-- Sem policies para UPDATE e DELETE → bloqueio total por RLS (imutabilidade)

-- ============================================================
-- STORAGE: bucket comprovantes
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comprovantes',
  'comprovantes',
  false,
  10485760, -- 10 MB
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Política de leitura: tesoureiro/pastor/admin da mesma church
CREATE POLICY "comprovantes_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'comprovantes'
    AND get_my_role() = ANY(ARRAY['admin','pastor','presbítero','diácono','tesoureiro'])
  );

-- Política de upload: tesoureiro+ pode fazer upload
CREATE POLICY "comprovantes_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'comprovantes'
    AND get_my_role() = ANY(ARRAY['admin','pastor','tesoureiro'])
  );

-- Política de delete: tesoureiro+ pode remover comprovante
CREATE POLICY "comprovantes_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'comprovantes'
    AND get_my_role() = ANY(ARRAY['admin','pastor','tesoureiro'])
  );
