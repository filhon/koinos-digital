/**
 * Sessão 5.4 — Auth E2E
 *
 * Cobre:
 *  - Signup → criar igreja → dashboard
 *  - Convite → cadastro → matching CPF
 */

import { test, expect, type Page } from "@playwright/test";
import { login, creds } from "./helpers/auth";

async function acceptRequiredConsent(page: Page) {
  const cadastro = page.getByRole("checkbox", { name: /cadastro/i });
  await cadastro.check({ force: true });
  await expect(cadastro).toBeChecked();
}

async function fillChurchData(page: Page, churchName: string, cnpj: string) {
  await page.getByPlaceholder("Igreja Batista Central").fill(churchName);
  await page.getByPlaceholder("00.000.000/0000-00").fill(cnpj);
  await page.getByPlaceholder("(11) 99999-9999").fill("(11) 98765-4321");
  await page.getByPlaceholder("Rua / Avenida").fill("Rua E2E");
  await page.getByPlaceholder("Nº").fill("100");
  await page.getByPlaceholder("Bairro").fill("Centro");
  await page.getByPlaceholder("CEP").fill("01001-000");
  await page.getByPlaceholder("Cidade").fill("São Paulo");
  await page.getByPlaceholder("UF").fill("SP");
}

// ─── Signup → Criar Igreja → Dashboard ───────────────────────────────────────

test.describe.serial("Signup → criar igreja → dashboard", () => {
  // Usa timestamp para evitar colisões de email/nome entre runs
  const ts = Date.now();
  const email = `e2e_pastor_${ts}@koinos.test`;
  const password = "SenhaForte#2026";
  const churchName = `Igreja E2E ${ts}`;
  // CNPJ fictício com formato válido (não precisa existir no Receita Federal)
  const cnpj = "11222333000181";

  test("cria conta, preenche wizard e chega ao dashboard", async ({ page }) => {
    /* /signup redireciona diretamente para /signup/igreja */
    await page.goto("/signup/igreja");
    await expect(page.getByText("Crie sua conta")).toBeVisible({
      timeout: 10_000,
    });

    /* Step 1: dados pessoais — inputs sem id/htmlFor, usar placeholder */
    await page.getByPlaceholder("João da Silva").fill(`Pastor E2E ${ts}`);
    await page.getByPlaceholder("000.000.000-00").fill("123.456.789-09");
    await page.getByPlaceholder("voce@exemplo.com").fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: "Continuar" }).click();

    /* Step 2: privacidade LGPD */
    await expect(page.getByText("Sua privacidade")).toBeVisible({
      timeout: 8_000,
    });
    await acceptRequiredConsent(page);
    await page.getByRole("button", { name: "Continuar" }).click();

    /* Step 3: dados da igreja */
    await expect(page.getByText("Dados da igreja")).toBeVisible({
      timeout: 8_000,
    });
    await fillChurchData(page, churchName, cnpj);
    /* Step 3 submit diz "Revisar" */
    await page.getByRole("button", { name: "Revisar" }).click();

    /* Step 4: confirmação */
    await expect(page.getByText("Tudo certo?")).toBeVisible({ timeout: 8_000 });
    await page.getByRole("button", { name: /criar minha igreja/i }).click();

    /* Deve redirecionar para /dashboard */
    await page.waitForURL("**/dashboard", { timeout: 30_000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test("exibe erro ao tentar criar segunda igreja com mesmo CNPJ", async ({
    page,
  }) => {
    const duplicateEmail = `e2e_duplicate_${ts}@koinos.test`;
    await page.goto("/signup/igreja");
    await expect(page.getByText("Crie sua conta")).toBeVisible({
      timeout: 10_000,
    });

    await page.getByPlaceholder("João da Silva").fill(`Pastor Duplicado ${ts}`);
    await page.getByPlaceholder("000.000.000-00").fill("987.654.321-00");
    await page.getByPlaceholder("voce@exemplo.com").fill(duplicateEmail);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByText("Sua privacidade")).toBeVisible({
      timeout: 8_000,
    });
    await acceptRequiredConsent(page);
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByText("Dados da igreja")).toBeVisible({
      timeout: 8_000,
    });
    await fillChurchData(page, `Outra Igreja ${ts}`, cnpj);
    await page.getByRole("button", { name: "Revisar" }).click();
    await expect(page.getByText("Tudo certo?")).toBeVisible({ timeout: 8_000 });
    await page.getByRole("button", { name: /criar minha igreja/i }).click();

    // Espera mensagem de erro de duplicidade
    await expect(
      page.getByText(
        /encontramos sua igreja|cnpj.*já.*cadastrado|já existe|duplicado/i
      )
    ).toBeVisible({ timeout: 15_000 });
  });
});

// ─── Convite → Cadastro → Matching CPF ───────────────────────────────────────

test.describe("Convite → cadastro → matching CPF", () => {
  test.skip(
    !process.env.TEST_INVITE_CODE || !process.env.TEST_INVITE_CPF,
    "Defina TEST_INVITE_CODE e TEST_INVITE_CPF no .env.test para rodar este spec."
  );

  const inviteCode = process.env.TEST_INVITE_CODE ?? "";
  const inviteCpf = process.env.TEST_INVITE_CPF ?? ""; // apenas dígitos

  test("acessa link de convite e exibe formulário de cadastro", async ({
    page,
  }) => {
    await page.goto(`/convite/${inviteCode}`);
    await expect(page.getByRole("heading", { name: /convite/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByRole("button", { name: /cadastrar|aceitar/i })
    ).toBeVisible();
  });

  test("realiza cadastro com CPF cadastrado (matching) e chega ao dashboard", async ({
    page,
  }) => {
    const ts = Date.now();
    await page.goto(`/convite/${inviteCode}`);

    // Preenche nome
    await page.getByPlaceholder("João da Silva").fill(`Membro E2E ${ts}`);

    // Preenche CPF que deve dar matching
    await page.getByPlaceholder("000.000.000-00").fill(inviteCpf);

    // Email e senha para novo usuário
    const email = `membro_e2e_${ts}@koinos.test`;
    await page.getByPlaceholder("voce@exemplo.com").fill(email);
    await page.locator('input[type="password"]').fill("SenhaForte#2026");

    // Consentimentos LGPD
    const checkboxes = page.getByRole("checkbox");
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      const cb = checkboxes.nth(i);
      if (!(await cb.isChecked())) await cb.check();
    }

    await page.waitForTimeout(1500); // Turnstile
    await page.getByRole("button", { name: /cadastrar|aceitar/i }).click();

    // Deve chegar ao dashboard
    await page.waitForURL("**/dashboard", { timeout: 30_000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test("exibe erro ao usar código de convite inválido", async ({ page }) => {
    await page.goto("/convite/codigo-invalido-99999");
    await expect(
      page.getByText(/inválido|expirado|não encontrado/i)
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ─── Redirecionamento de rotas protegidas para login ─────────────────────────

test.describe("Proteção de rotas", () => {
  test("acesso sem autenticação redireciona para /login", async ({ page }) => {
    // Limpa cookies para garantir sessão vazia
    await page.context().clearCookies();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });
  });

  test("acesso ao /financeiro sem role adequado redireciona para /403", async ({
    page,
  }) => {
    test.skip(!creds.membro.email, "TEST_USER_MEMBRO_EMAIL não configurado.");
    await login(page, creds.membro);
    await page.goto("/financeiro");
    // Pode ser /403 ou exibir PremiumGate — não deve mostrar dados financeiros
    const url = page.url();
    const has403 = url.includes("403");
    const hasPremiumGate = await page
      .getByText(/recurso premium/i)
      .isVisible({ timeout: 8_000 })
      .catch(() => false);
    expect(has403 || hasPremiumGate).toBe(true);
  });
});
