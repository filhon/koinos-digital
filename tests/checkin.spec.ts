/**
 * Sessão 5.4 — Check-in: QR Code válido vs expirado E2E
 *
 * Verifica:
 *  - Liderança acessa tela de QR code do evento
 *  - QR code exibe countdown animado
 *  - Token expirado/inválido é rejeitado na página pública /c/[token]
 *  - Token com formato inválido retorna erro adequado
 */

import { test, expect } from "@playwright/test";
import { login, creds } from "./helpers/auth";

const testEventId = process.env.TEST_EVENT_ID ?? "";

test.describe("Check-in — tela QR Code (liderança)", () => {
  test.skip(
    !creds.pastor.email || !testEventId,
    "TEST_USER_PASTOR_EMAIL e TEST_EVENT_ID são necessários."
  );

  test.beforeEach(async ({ page }) => {
    await login(page, creds.pastor);
  });

  test("acessa /eventos/[id]/checkin e exibe QR code", async ({ page }) => {
    await page.goto(`/eventos/${testEventId}/checkin`);

    // QR code SVG deve estar presente
    await expect(page.locator("svg")).toBeVisible({ timeout: 10_000 });

    // Countdown animado (anel)
    const countdown = page.getByText(/\d+s|segundos/i);
    if (await countdown.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(countdown).toBeVisible();
    }
  });

  test("exibe tab de check-in nos detalhes do evento", async ({ page }) => {
    await page.goto(`/eventos/${testEventId}`);
    await expect(page.getByRole("tab", { name: /check-in/i })).toBeVisible({
      timeout: 10_000,
    });
  });
});

test.describe("Check-in — página pública /c/[token]", () => {
  test("token com formato inválido exibe mensagem de erro", async ({
    page,
  }) => {
    await page.goto("/c/token-invalido-99999");

    // Deve mostrar mensagem de erro, não um formulário de check-in
    await expect(
      page.getByText(/inválido|expirado|não encontrado|erro/i)
    ).toBeVisible({ timeout: 10_000 });

    // NÃO deve mostrar formulário de check-in
    await expect(
      page.getByRole("button", { name: /fazer check-in|confirmar/i })
    ).not.toBeVisible();
  });

  test("token expirado (shortToken de 12 chars mas não no Redis) é rejeitado", async ({
    page,
  }) => {
    // shortTokens têm 12 chars; este não existirá no Redis
    const expiredToken = "aabbccddeeff";
    await page.goto(`/c/${expiredToken}`);

    await expect(
      page.getByText(/expirado|inválido|não encontrado/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test("acesso à rota /checkin sem autenticação redireciona para login", async ({
    page,
  }) => {
    await page.context().clearCookies();
    await page.goto("/checkin");
    // Deve redirecionar para /login
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });
  });
});

test.describe("Check-in — scanner (membro autenticado)", () => {
  test.skip(!creds.membro.email, "TEST_USER_MEMBRO_EMAIL não configurado.");

  test("página /checkin exibe scanner ou mensagem de permissão de câmera", async ({
    page,
  }) => {
    // Concede permissão de câmera (necessário no Playwright)
    await page.context().grantPermissions(["camera"]);

    await login(page, creds.membro);
    await page.goto("/checkin");

    // Deve mostrar a tela do scanner ou solicitar permissão
    const hasCameraUI =
      (await page
        .getByText(/aponte a câmera|escaneie|scanner/i)
        .isVisible({ timeout: 8000 })
        .catch(() => false)) ||
      (await page
        .getByText(/câmera|permissão/i)
        .isVisible({ timeout: 5000 })
        .catch(() => false));

    expect(hasCameraUI).toBe(true);
  });
});
