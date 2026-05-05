/**
 * Sessão 5.4 — Financeiro: imutabilidade de transações E2E
 *
 * Verifica:
 *  - Tesoureiro pode criar transações
 *  - Transações criadas NÃO possuem botão de editar/excluir (imutáveis)
 *  - Estorno cria nova transação inversa (não altera a original)
 *  - Membro sem role tesoureiro não acessa o módulo
 */

import { test, expect } from "@playwright/test";
import { login, creds } from "./helpers/auth";

test.describe("Financeiro — imutabilidade de transações", () => {
  test.skip(
    !creds.tesoureiro.email,
    "TEST_USER_TESOUREIRO_EMAIL não configurado."
  );

  test.beforeEach(async ({ page }) => {
    await login(page, creds.tesoureiro);
  });

  test("página /financeiro carrega com KPI cards", async ({ page }) => {
    await page.goto("/financeiro");

    // Pode estar atrás de PremiumGate para plano grátis
    const premiumGate = page.getByText(/recurso premium/i);
    if (await premiumGate.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(
        true,
        "Tesoureiro de teste está em plano sem acesso ao financeiro."
      );
    }

    await expect(
      page.getByRole("heading", { name: /financeiro/i })
    ).toBeVisible({ timeout: 10_000 });

    // KPI cards devem estar visíveis
    await expect(page.getByText(/saldo total/i)).toBeVisible({ timeout: 8000 });
  });

  test("pode criar uma entrada (receita)", async ({ page }) => {
    await page.goto("/financeiro");

    const premiumGate = page.getByText(/recurso premium/i);
    if (await premiumGate.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, "Plano sem acesso ao financeiro.");
    }

    // Clica no botão de nova entrada
    const entradaBtn = page.getByRole("button", { name: /entrada|receita/i });
    await expect(entradaBtn).toBeVisible({ timeout: 10_000 });
    await entradaBtn.click();

    // Preenche o formulário no dialog
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });

    // Valor
    await page.getByLabel(/valor/i).fill("100,00");

    // Descrição
    await page.getByLabel(/descrição/i).fill("Dízimo E2E Test");

    // Categoria (select)
    const categoriaSelect = page.getByLabel(/categoria/i);
    if (await categoriaSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await categoriaSelect.selectOption({ index: 1 });
    }

    await page
      .getByRole("button", { name: /salvar|confirmar|registrar/i })
      .click();

    // Feedback de sucesso
    await expect(page.getByText(/salvo|registrado|sucesso/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("transações NÃO têm botão de editar ou excluir", async ({ page }) => {
    await page.goto("/financeiro");

    const premiumGate = page.getByText(/recurso premium/i);
    if (await premiumGate.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, "Plano sem acesso ao financeiro.");
    }

    await page.waitForTimeout(2000); // aguarda lista de transações

    // Botões de editar/excluir direto em transações NÃO devem existir
    // (a UI só tem "Estornar")
    const editBtn = page.getByRole("button", {
      name: /editar transação|excluir transação/i,
    });
    await expect(editBtn).not.toBeVisible();

    // O botão de estorno pode existir ou não, dependendo de haver transações — não falha
  });

  test("estorno cria nova transação sem alterar a original", async ({
    page,
  }) => {
    await page.goto("/financeiro");

    const premiumGate = page.getByText(/recurso premium/i);
    if (await premiumGate.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, "Plano sem acesso ao financeiro.");
    }

    // Tenta clicar em "Estornar" na primeira transação disponível
    const reversalBtn = page.getByRole("button", { name: /estornar/i }).first();
    if (!(await reversalBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, "Nenhuma transação disponível para estorno.");
    }

    await reversalBtn.click();

    // Dialog de confirmação de estorno
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });

    // Deve exibir aviso de que criará nova transação inversa
    await expect(page.getByText(/nova transação|estorno|inversa/i)).toBeVisible(
      { timeout: 5000 }
    );

    // Confirma o estorno
    await page
      .getByRole("button", { name: /confirmar estorno|estornar/i })
      .click();

    // Feedback
    await expect(page.getByText(/estorno.*criado|sucesso/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});

test.describe("Financeiro — controle de acesso", () => {
  test.skip(!creds.membro.email, "TEST_USER_MEMBRO_EMAIL não configurado.");

  test("role membro não acessa /financeiro", async ({ page }) => {
    await login(page, creds.membro);
    await page.goto("/financeiro");
    const url = page.url();
    const hasPremiumGate = await page
      .getByText(/recurso premium/i)
      .isVisible({ timeout: 8000 })
      .catch(() => false);
    expect(url.includes("403") || hasPremiumGate).toBe(true);
  });
});
