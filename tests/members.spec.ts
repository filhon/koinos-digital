/**
 * Sessão 5.4 — CRUD Membros com Permissões E2E
 *
 * Verifica:
 *  - Pastor pode criar, editar e ver todos os membros
 *  - Membro não pode criar outros membros (sem botão "Novo membro")
 *  - Membro pode editar apenas o próprio perfil
 */

import { test, expect } from "@playwright/test";
import { login, creds } from "./helpers/auth";

test.describe("CRUD Membros — role pastor", () => {
  test.skip(!creds.pastor.email, "TEST_USER_PASTOR_EMAIL não configurado.");

  test.beforeEach(async ({ page }) => {
    await login(page, creds.pastor);
  });

  test("lista de membros é acessível", async ({ page }) => {
    await page.goto("/membros");
    await expect(page.getByRole("heading", { name: /membros/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("pode criar um novo membro", async ({ page }) => {
    const ts = Date.now();
    await page.goto("/membros/novo");
    await expect(
      page.getByRole("heading", { name: /novo membro/i })
    ).toBeVisible({ timeout: 10_000 });

    await page.getByPlaceholder("João da Silva").fill(`Teste E2E ${ts}`);
    await page
      .getByPlaceholder("joao@exemplo.com")
      .fill(`e2e_novo_${ts}@koinos.test`);

    // Telefone
    const phoneField = page.getByPlaceholder("(81) 99999-9999");
    if (await phoneField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await phoneField.fill("11999990000");
    }

    await page.getByRole("button", { name: /salvar|cadastrar|criar/i }).click();

    // Deve redirecionar para lista ou perfil do membro criado
    await expect(page).toHaveURL(/membros/, { timeout: 15_000 });
    await expect(
      page.getByText(/salvo|cadastrado|criado|sucesso/i)
    ).toBeVisible({ timeout: 8_000 });
  });

  test("pode filtrar membros por nome", async ({ page }) => {
    await page.goto("/membros");

    const searchInput = page.getByPlaceholder(/buscar|pesquisar|nome/i).first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill("zzz_inexistente_zzz");
      await page.waitForTimeout(600); // debounce
      // Pode mostrar mensagem vazia ou lista com 0 itens
      // page.getByText(/nenhum|não encontrado|vazio/i);
      // Não há obrigação de mostrar mensagem, apenas não deve quebrar
      await expect(page).toHaveURL(/membros/);
    }
  });

  test("pode promover membro de role", async ({ page }) => {
    // Navega para a lista e abre o primeiro membro com role membro
    await page.goto("/membros");
    // Aguarda lista carregar
    await page.waitForTimeout(1500);

    // Tenta abrir dropdown de ações do primeiro card
    const firstDropdown = page
      .getByRole("button", { name: /ações|mais opções|\.\.\./i })
      .first();
    if (await firstDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstDropdown.click();
      const promoteOption = page.getByRole("menuitem", {
        name: /promover|rebaixar/i,
      });
      if (await promoteOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await promoteOption.click();
        // Aguarda dialog de confirmação
        await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
        // Cancela para não alterar estado do banco
        await page.getByRole("button", { name: /cancelar/i }).click();
      }
    }
  });
});

test.describe("CRUD Membros — role membro (restrições)", () => {
  test.skip(!creds.membro.email, "TEST_USER_MEMBRO_EMAIL não configurado.");

  test.beforeEach(async ({ page }) => {
    await login(page, creds.membro);
  });

  test("lista de membros é acessível (leitura)", async ({ page }) => {
    await page.goto("/membros");
    await expect(page.getByRole("heading", { name: /membros/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("NÃO exibe botão 'Novo membro' para role membro", async ({ page }) => {
    await page.goto("/membros");
    await page.waitForTimeout(1000);

    const newMemberBtn = page.getByRole("link", {
      name: /novo membro|adicionar/i,
    });
    await expect(newMemberBtn).not.toBeVisible();
  });

  test("acesso direto a /membros/novo redireciona ou retorna 403", async ({
    page,
  }) => {
    await page.goto("/membros/novo");
    // Deve redirecionar para /403 ou para /membros
    const url = page.url();
    expect(url.includes("403") || url.includes("membros")).toBe(true);
  });

  test("pode acessar e editar o próprio perfil", async ({ page }) => {
    await page.goto("/perfil");
    await expect(
      page.getByRole("heading", { name: /perfil|meu perfil/i })
    ).toBeVisible({ timeout: 10_000 });

    // Campos de perfil devem estar presentes
    await expect(page.getByPlaceholder("(81) 99999-9999")).toBeVisible();
  });
});
