/**
 * Sessão 5.3 — Testes de feature flags e PremiumGate
 *
 * Verifica que cada plano vê apenas as rotas/funcionalidades que deve ver.
 * Requer variáveis de ambiente com credenciais de teste por plano:
 *   TEST_USER_GRATIS_EMAIL / TEST_USER_GRATIS_PASSWORD
 *   TEST_USER_CRESCIMENTO_EMAIL / TEST_USER_CRESCIMENTO_PASSWORD
 *   TEST_USER_IGREJA_EMAIL / TEST_USER_IGREJA_PASSWORD
 *   TEST_USER_CATEDRAL_EMAIL / TEST_USER_CATEDRAL_PASSWORD
 */

import { test, expect, type Page } from "@playwright/test";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.locator("#password").fill(password);
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: /entrar/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 20_000 });
}

/** Verifica que a rota exibe o PremiumGate (ícone de cadeado). */
async function expectLocked(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByText("Recurso Premium", { exact: false })).toBeVisible(
    { timeout: 8000 }
  );
}

/** Verifica que a rota NÃO exibe o PremiumGate. */
async function expectUnlocked(page: Page, path: string, heading: string) {
  await page.goto(path);
  await expect(
    page.getByText("Recurso Premium", { exact: false })
  ).not.toBeVisible({
    timeout: 8000,
  });
  await expect(
    page.getByRole("heading", { name: heading, exact: false })
  ).toBeVisible();
}

// ─── Fixtures de credenciais ──────────────────────────────────────────────────

const users = {
  gratis: {
    email: process.env.TEST_USER_GRATIS_EMAIL ?? "",
    password: process.env.TEST_USER_GRATIS_PASSWORD ?? "",
  },
  crescimento: {
    email: process.env.TEST_USER_CRESCIMENTO_EMAIL ?? "",
    password: process.env.TEST_USER_CRESCIMENTO_PASSWORD ?? "",
  },
  igreja: {
    email: process.env.TEST_USER_IGREJA_EMAIL ?? "",
    password: process.env.TEST_USER_IGREJA_PASSWORD ?? "",
  },
  catedral: {
    email: process.env.TEST_USER_CATEDRAL_EMAIL ?? "",
    password: process.env.TEST_USER_CATEDRAL_PASSWORD ?? "",
  },
};

// ─── Plano Grátis ─────────────────────────────────────────────────────────────

test.describe("Plano Grátis", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !users.gratis.email || !users.gratis.password,
      "TEST_USER_GRATIS_EMAIL / _PASSWORD não configurados."
    );
    await login(page, users.gratis.email, users.gratis.password);
  });

  test("pode acessar membros", async ({ page }) => {
    await expectUnlocked(page, "/membros", "Membros");
  });

  test("pode acessar agenda", async ({ page }) => {
    await expectUnlocked(page, "/agenda", "Agenda");
  });

  test("pode acessar eventos", async ({ page }) => {
    await expectUnlocked(page, "/eventos", "Eventos");
  });

  test("pode acessar mural", async ({ page }) => {
    await expectUnlocked(page, "/mural", "Mural");
  });

  test("pode acessar gamificação", async ({ page }) => {
    await expectUnlocked(page, "/gamificacao", "Gamificação");
  });

  test("NÃO pode acessar ministérios", async ({ page }) => {
    await expectLocked(page, "/ministerios");
  });

  test("NÃO pode acessar escalas", async ({ page }) => {
    await expectLocked(page, "/escalas");
  });

  test("NÃO pode acessar grupos musicais", async ({ page }) => {
    await expectLocked(page, "/grupos-musicais");
  });

  test("NÃO pode acessar repertório", async ({ page }) => {
    await expectLocked(page, "/repertorio");
  });

  test("NÃO pode acessar recursos", async ({ page }) => {
    await expectLocked(page, "/recursos");
  });

  test("NÃO pode acessar financeiro", async ({ page }) => {
    await expectLocked(page, "/financeiro");
  });

  test("NÃO pode acessar assembléia", async ({ page }) => {
    await expectLocked(page, "/assembleia");
  });
});

// ─── Plano Crescimento ────────────────────────────────────────────────────────

test.describe("Plano Crescimento", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !users.crescimento.email || !users.crescimento.password,
      "TEST_USER_CRESCIMENTO_EMAIL / _PASSWORD não configurados."
    );
    await login(page, users.crescimento.email, users.crescimento.password);
  });

  test("pode acessar ministérios", async ({ page }) => {
    await expectUnlocked(page, "/ministerios", "Ministérios");
  });

  test("pode acessar escalas", async ({ page }) => {
    await expectUnlocked(page, "/escalas", "Minha Escala");
  });

  test("pode acessar grupos musicais", async ({ page }) => {
    await expectUnlocked(page, "/grupos-musicais", "Grupos Musicais");
  });

  test("pode acessar repertório", async ({ page }) => {
    await expectUnlocked(page, "/repertorio", "Repertório");
  });

  test("pode acessar recursos", async ({ page }) => {
    await expectUnlocked(page, "/recursos", "Recursos");
  });

  test("NÃO pode acessar financeiro", async ({ page }) => {
    await expectLocked(page, "/financeiro");
  });

  test("NÃO pode acessar assembléia", async ({ page }) => {
    await expectLocked(page, "/assembleia");
  });
});

// ─── Plano Igreja ─────────────────────────────────────────────────────────────

test.describe("Plano Igreja", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !users.igreja.email || !users.igreja.password,
      "TEST_USER_IGREJA_EMAIL / _PASSWORD não configurados."
    );
    await login(page, users.igreja.email, users.igreja.password);
  });

  test("pode acessar financeiro", async ({ page }) => {
    await expectUnlocked(page, "/financeiro", "Financeiro");
  });

  test("pode acessar assembléia", async ({ page }) => {
    await expectUnlocked(page, "/assembleia", "Assembléia");
  });

  test("NÃO pode acessar multi-congregações", async ({ page }) => {
    await expectLocked(page, "/configuracoes/congregacoes");
  });

  test("NÃO pode acessar relatórios (add-on)", async ({ page }) => {
    await expectLocked(page, "/financeiro/relatorios");
  });
});

// ─── Plano Catedral ───────────────────────────────────────────────────────────

test.describe("Plano Catedral", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !users.catedral.email || !users.catedral.password,
      "TEST_USER_CATEDRAL_EMAIL / _PASSWORD não configurados."
    );
    await login(page, users.catedral.email, users.catedral.password);
  });

  test("pode acessar multi-congregações", async ({ page }) => {
    await expectUnlocked(page, "/configuracoes/congregacoes", "Congregações");
  });

  test("NÃO pode acessar add-on financeiro_avancado sem compra", async ({
    page,
  }) => {
    await expectLocked(page, "/financeiro/relatorios");
  });

  test("NÃO pode acessar add-on landing_dominio sem compra", async ({
    page,
  }) => {
    await expectLocked(page, "/landing-page/dominio");
  });
});
