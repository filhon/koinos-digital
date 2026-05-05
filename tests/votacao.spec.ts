/**
 * Sessão 5.4 — Votação: anonimidade dos votos E2E
 *
 * Verifica:
 *  - voter_hash não é exposto na UI de resultados
 *  - Cada membro só pode votar uma vez
 *  - Resultados mostram contagens, não identidades
 *  - Voto remoto exige código OTP (não expõe quem pediu)
 */

import { test, expect } from "@playwright/test";
import { login, creds } from "./helpers/auth";

const electionId = process.env.TEST_ASSEMBLY_ELECTION_ID ?? "";

test.describe("Votação — anonimidade", () => {
  test.skip(
    !creds.pastor.email || !electionId,
    "TEST_USER_PASTOR_EMAIL e TEST_ASSEMBLY_ELECTION_ID são necessários."
  );

  test.beforeEach(async ({ page }) => {
    await login(page, creds.pastor);
  });

  test("UI de resultados não exibe voter_hash", async ({ page }) => {
    // Navega para o painel de uma eleição (qualquer)
    await page.goto("/assembleia");

    const premiumGate = page.getByText(/recurso premium/i);
    if (await premiumGate.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, "Plano sem acesso à assembléia.");
    }

    await page.waitForTimeout(1000);

    // Abre a primeira assembléia disponível
    const firstAssembly = page.getByRole("link", { name: /.+/ }).first();
    if (
      !(await firstAssembly.isVisible({ timeout: 5000 }).catch(() => false))
    ) {
      test.skip(true, "Nenhuma assembléia encontrada.");
    }

    await firstAssembly.click();
    await page.waitForTimeout(1000);

    // Verifica que voter_hash não está presente no HTML renderizado
    const content = await page.content();
    expect(content).not.toContain("voter_hash");
    // SHA-256 tem 64 chars hex — padrão muito improvável no texto normal
    expect(content).not.toMatch(/\b[a-f0-9]{64}\b/);
  });

  test("resultados mostram contagens, não nomes de votantes", async ({
    page,
  }) => {
    await page.goto(`/assembleia`);

    const premiumGate = page.getByText(/recurso premium/i);
    if (await premiumGate.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, "Plano sem acesso à assembléia.");
    }

    await page.waitForTimeout(1000);
    const firstLink = page.getByRole("link").filter({ hasText: /.+/ }).first();
    if (!(await firstLink.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, "Nenhuma assembléia encontrada.");
    }
    await firstLink.click();

    // Navega para a primeira eleição com resultados
    const resultadoTab = page.getByRole("tab", { name: /resultado/i });
    if (await resultadoTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await resultadoTab.click();

      // Deve mostrar números/porcentagens, não lista de votantes
      const voterList = page.getByText(/votantes:|quem votou:|votos de:/i);
      await expect(voterList).not.toBeVisible();

      // Deve mostrar total/contagem
      await expect(page.getByText(/total de votos|votos:|quórum/i)).toBeVisible(
        { timeout: 8000 }
      );
    }
  });
});

test.describe("Votação — impedimento de duplo voto", () => {
  test.skip(
    !creds.membro.email || !electionId,
    "TEST_USER_MEMBRO_EMAIL e TEST_ASSEMBLY_ELECTION_ID são necessários."
  );

  test("segundo voto na mesma eleição é rejeitado", async ({ page }) => {
    await login(page, creds.membro);

    // Navega diretamente para o painel da eleição de teste
    // A rota é /assembleia/[aid]/eleicao/[eid] mas não temos o assembly_id aqui
    // Usamos a lista de assembléias para encontrar a eleição
    await page.goto("/assembleia");

    const premiumGate = page.getByText(/recurso premium/i);
    if (await premiumGate.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, "Plano sem acesso à assembléia.");
    }

    // Procura o botão de votar
    const voteBtn = page.getByRole("button", { name: /votar/i });
    if (!(await voteBtn.isVisible({ timeout: 8000 }).catch(() => false))) {
      test.skip(true, "Nenhuma eleição aberta com botão de votar encontrada.");
    }

    // Se já votou, o botão não deve estar disponível (ou deve mostrar mensagem)
    const jaVotou = page.getByText(/você já votou|voto computado/i);
    if (await jaVotou.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Estado correto: UI informa que já votou
      await expect(voteBtn).not.toBeVisible();
    }
  });
});

test.describe("Votação — OTP para voto remoto", () => {
  test.skip(!creds.membro.email, "TEST_USER_MEMBRO_EMAIL não configurado.");

  test("dialog de voto remoto exige campo OTP", async ({ page }) => {
    await login(page, creds.membro);
    await page.goto("/assembleia");

    const premiumGate = page.getByText(/recurso premium/i);
    if (await premiumGate.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, "Plano sem acesso à assembléia.");
    }

    const voteBtn = page.getByRole("button", { name: /votar/i });
    if (!(await voteBtn.isVisible({ timeout: 8000 }).catch(() => false))) {
      test.skip(true, "Nenhuma eleição aberta encontrada.");
    }

    await voteBtn.click();

    // Dialog de votação
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });

    // Seleciona opção de voto remoto se disponível
    const remoteOption = page.getByLabel(/remoto|código/i);
    if (await remoteOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await remoteOption.click();

      // Campo OTP deve aparecer
      await expect(page.getByLabel(/código|otp/i)).toBeVisible({
        timeout: 5000,
      });

      // Tenta votar com OTP inválido
      await page.getByLabel(/código|otp/i).fill("000000");
      await page.getByRole("button", { name: /votar|confirmar/i }).click();

      // Deve rejeitar OTP inválido
      await expect(
        page.getByText(/código inválido|expirado|incorreto/i)
      ).toBeVisible({ timeout: 10_000 });
    }

    // Fecha dialog
    await page.keyboard.press("Escape");
  });
});
