import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E config — Koinos Digital
 *
 * Variáveis de ambiente necessárias (crie um .env.test):
 *   PLAYWRIGHT_BASE_URL          — padrão: http://localhost:3000
 *   TEST_USER_PASTOR_EMAIL       — pastor da Igreja Teste
 *   TEST_USER_PASTOR_PASSWORD
 *   TEST_USER_MEMBRO_EMAIL       — role membro
 *   TEST_USER_MEMBRO_PASSWORD
 *   TEST_USER_TESOUREIRO_EMAIL   — role tesoureiro
 *   TEST_USER_TESOUREIRO_PASSWORD
 *   TEST_USER_TENANT_B_EMAIL     — pastor de um segundo tenant (cross-tenant RLS)
 *   TEST_USER_TENANT_B_PASSWORD
 *   TEST_INVITE_CODE             — código de convite ativo no banco
 *   TEST_INVITE_CPF              — CPF cadastrado no convite (apenas dígitos)
 *   TEST_EVENT_ID                — UUID de um evento existente para testes de check-in/liturgia
 *   TEST_ASSEMBLY_ELECTION_ID    — UUID de uma eleição em estado "aberta"
 *   # Turnstile: use as chaves de teste do Cloudflare
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
 *   TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
 */

export default defineConfig({
  testDir: "./tests",

  /* Execução sequencial para evitar conflitos de estado no banco */
  fullyParallel: false,
  workers: 1,

  /* Em CI, falha se houver test.only acidental */
  forbidOnly: !!process.env.CI,

  /* Retries apenas em CI */
  retries: process.env.CI ? 2 : 0,

  /* Reporters */
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }], ["list"]]
    : [["html", { open: "on-failure" }], ["list"]],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    /* Aumenta timeout default para Server Actions lentas */
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      /* Pula testes de câmera no Firefox (permissão não-interativa) */
      testIgnore: ["**/checkin.spec.ts"],
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
      /* Mobile-first: roda todos os testes críticos */
    },
  ],

  /* Servidor de desenvolvimento — reusa se já estiver rodando */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      /* Garante que Turnstile está em modo de teste */
      NEXT_PUBLIC_TURNSTILE_SITE_KEY:
        process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ??
        "1x00000000000000000000AA",
      TURNSTILE_SECRET_KEY:
        process.env.TURNSTILE_SECRET_KEY ??
        "1x0000000000000000000000000000000AA",
    },
  },
});
