/**
 * scripts/setup-e2e.ts
 *
 * Script de configuração do ambiente E2E.
 * Deve ser executado UMA VEZ após aplicar a migration 20260505100000_e2e_test_data.sql.
 *
 * O que faz:
 *  1. Lê ENCRYPTION_KEY e SUPABASE_SERVICE_ROLE_KEY do ambiente
 *  2. Criptografa o CPF do membro Ana (77777777) com a chave real
 *  3. Atualiza o registro do membro no banco com o CPF real criptografado
 *  4. Criptografa o número da conta E2E
 *  5. Atualiza a conta no banco
 *  6. Escreve (ou atualiza) o arquivo .env.test com todos os valores
 *
 * Uso:
 *   npx tsx scripts/setup-e2e.ts
 *   # ou
 *   npx ts-node --esm scripts/setup-e2e.ts
 *
 * Pré-requisitos:
 *  - .env.local com ENCRYPTION_KEY e SUPABASE_SERVICE_ROLE_KEY configurados
 *  - Migration 20260505100000_e2e_test_data.sql aplicada no banco
 */

import { createCipheriv, randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

// ─── Carrega .env.local manualmente (sem dotenv dependency) ──────────────────

function loadEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const vars: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed
      .slice(eqIdx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    vars[key] = value;
  }
  return vars;
}

const envLocal = loadEnvFile(resolve(process.cwd(), ".env.local"));
const env = { ...process.env, ...envLocal } as Record<string, string>;

// ─── Criptografia (replica src/lib/encryption/aes.ts) ────────────────────────

const ALGORITHM = "aes-256-gcm" as const;

function encrypt(plainText: string): string {
  const rawKey = env.ENCRYPTION_KEY;
  if (!rawKey) throw new Error("ENCRYPTION_KEY não definida no .env.local");

  const keyBuf = Buffer.from(rawKey, "hex");
  if (keyBuf.length !== 32)
    throw new Error("ENCRYPTION_KEY deve ter 32 bytes (64 hex chars)");

  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, keyBuf, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const tag = (
    cipher as ReturnType<typeof createCipheriv> & { getAuthTag(): Buffer }
  ).getAuthTag();

  return [
    iv.toString("hex"),
    tag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

// ─── Supabase admin client ────────────────────────────────────────────────────

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error(
    "❌  NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessários no .env.local"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Constantes E2E ───────────────────────────────────────────────────────────

const TENANT_A_ID = "11111111-1111-1111-1111-111111111111";
const MEMBER_ANA_ID = "77777777-7777-7777-7777-777777777777";
const ACCOUNT_E2E_ID = "dddddddd-0000-0000-0000-000000000001";

const TEST_CPF = "12345678901"; // CPF fictício válido para testes
const TEST_ACCOUNT_NUMBER = "123456-7";

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔧  Configurando dados E2E...\n");

  // 1. Criptografa CPF e atualiza membro Ana
  const encryptedCpf = encrypt(TEST_CPF);
  const { error: cpfErr } = await supabase
    .from("members")
    .update({ cpf: encryptedCpf })
    .eq("id", MEMBER_ANA_ID)
    .eq("church_id", TENANT_A_ID);

  if (cpfErr) {
    console.error("❌  Erro ao atualizar CPF do membro Ana:", cpfErr.message);
    process.exit(1);
  }
  console.log("✅  CPF do membro Ana criptografado e salvo.");

  // 2. Criptografa número de conta e atualiza
  const encryptedAccount = encrypt(TEST_ACCOUNT_NUMBER);
  const { error: accErr } = await supabase
    .from("accounts")
    .update({ account_number: encryptedAccount })
    .eq("id", ACCOUNT_E2E_ID)
    .eq("church_id", TENANT_A_ID);

  if (accErr) {
    console.error("❌  Erro ao atualizar número de conta:", accErr.message);
    process.exit(1);
  }
  console.log("✅  Número de conta criptografado e salvo.");

  // 3. Verifica se os IDs fixos existem no banco
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", "eeeeeeee-0000-0000-0000-000000000001")
    .maybeSingle();

  const { data: election } = await supabase
    .from("elections")
    .select("id, status")
    .eq("id", "ffffffff-0000-0000-0000-000000000001")
    .maybeSingle();

  if (!event) {
    console.warn(
      "⚠️   Evento E2E não encontrado. Execute a migration 20260505100000 primeiro."
    );
  }
  if (!election) {
    console.warn(
      "⚠️   Eleição E2E não encontrada. Execute a migration 20260505100000 primeiro."
    );
  }

  // 4. Escreve .env.test com todos os valores
  const envTestPath = resolve(process.cwd(), ".env.test");
  const content = `# ============================================================
# .env.test — Gerado automaticamente por scripts/setup-e2e.ts
# NÃO edite manualmente. Rode: npx tsx scripts/setup-e2e.ts
# ============================================================

PLAYWRIGHT_BASE_URL=http://localhost:3000

# Turnstile — chaves de teste do Cloudflare (always-pass)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA

# ─── Usuários de teste ────────────────────────────────────
# Senha de todos: Senha123

TEST_USER_PASTOR_EMAIL=pastor@teste.com
TEST_USER_PASTOR_PASSWORD=Senha123

TEST_USER_MEMBRO_EMAIL=membro@teste.com
TEST_USER_MEMBRO_PASSWORD=Senha123

TEST_USER_TESOUREIRO_EMAIL=tesoureiro@teste.com
TEST_USER_TESOUREIRO_PASSWORD=Senha123

# Segundo tenant (cross-tenant RLS)
TEST_USER_TENANT_B_EMAIL=pastor@beta.com
TEST_USER_TENANT_B_PASSWORD=Senha123

# ─── IDs fixos ────────────────────────────────────────────

# Código de convite com CPF para teste de matching
TEST_INVITE_CODE=CPFMATCH2026
# CPF do membro Ana (apenas dígitos — mesmo valor criptografado no banco)
TEST_INVITE_CPF=${TEST_CPF}

# UUID do evento E2E (para testes de check-in e liturgia)
TEST_EVENT_ID=eeeeeeee-0000-0000-0000-000000000001

# UUID da eleição em estado "aberta" (para testes de votação)
TEST_ASSEMBLY_ELECTION_ID=ffffffff-0000-0000-0000-000000000001

# ─── Feature flags de planos ──────────────────────────────
# Credenciais para cada plano (geradas pela migration 5.3)
# Use os mesmos usuários acima com o plano do tenant

TEST_USER_GRATIS_EMAIL=
TEST_USER_GRATIS_PASSWORD=

TEST_USER_CRESCIMENTO_EMAIL=
TEST_USER_CRESCIMENTO_PASSWORD=

TEST_USER_IGREJA_EMAIL=
TEST_USER_IGREJA_PASSWORD=

TEST_USER_CATEDRAL_EMAIL=pastor@teste.com
TEST_USER_CATEDRAL_PASSWORD=Senha123
`;

  writeFileSync(envTestPath, content, "utf8");
  console.log(`✅  .env.test gerado em ${envTestPath}`);

  console.log("\n✨  Setup E2E concluído!\n");
  console.log("   Para rodar os testes:");
  console.log("   $ npm run test:e2e\n");
}

main().catch((err) => {
  console.error("❌  Erro inesperado:", err);
  process.exit(1);
});
