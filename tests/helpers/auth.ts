/**
 * Helpers de autenticação compartilhados entre todos os specs.
 *
 * Turnstile: em dev (NODE_ENV=development) sem TURNSTILE_SECRET_KEY real,
 * o servidor bypassa a validação (ver src/lib/turnstile.ts).
 * O widget usa a chave de teste do Cloudflare (1x00000000000000000000AA),
 * que auto-completa sem interação humana.
 */

import type { Page } from "@playwright/test";

export interface TestCredentials {
  email: string;
  password: string;
}

/** Preenche e submete o formulário de login. Aguarda redirecionamento para /dashboard. */
export async function login(
  page: Page,
  { email, password }: TestCredentials
): Promise<void> {
  await page.goto("/login");

  await page.getByLabel("E-mail").fill(email);
  await page.locator("#password").fill(password);

  /* Aguarda o widget Turnstile disparar (chave de teste auto-completa) */
  await page.waitForTimeout(1500);

  await page.getByRole("button", { name: /entrar/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 20_000 });
}

/** Faz logout via API para limpar sessão entre testes. */
export async function logout(page: Page): Promise<void> {
  // Tenta clicar no menu de usuário → sair
  const avatarTrigger = page.getByRole("button", {
    name: /meu perfil|avatar/i,
  });
  if (await avatarTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
    await avatarTrigger.click();
    const logoutBtn = page.getByRole("menuitem", { name: /sair/i });
    if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutBtn.click();
      await page.waitForURL("**/login", { timeout: 10_000 });
      return;
    }
  }
  // Fallback: navegar para /api/auth/signout ou limpar cookies
  await page.goto("/login");
  await page.context().clearCookies();
}

/** Credenciais padrão lidas de env. */
export const creds = {
  pastor: {
    email: process.env.TEST_USER_PASTOR_EMAIL ?? "",
    password: process.env.TEST_USER_PASTOR_PASSWORD ?? "",
  },
  membro: {
    email: process.env.TEST_USER_MEMBRO_EMAIL ?? "",
    password: process.env.TEST_USER_MEMBRO_PASSWORD ?? "",
  },
  tesoureiro: {
    email: process.env.TEST_USER_TESOUREIRO_EMAIL ?? "",
    password: process.env.TEST_USER_TESOUREIRO_PASSWORD ?? "",
  },
  tenantB: {
    email: process.env.TEST_USER_TENANT_B_EMAIL ?? "",
    password: process.env.TEST_USER_TENANT_B_PASSWORD ?? "",
  },
} as const;

/** Verifica se as credenciais de teste estão configuradas; pula o teste caso contrário. */
export function requireCreds(...keys: (keyof typeof creds)[]): void | never {
  for (const key of keys) {
    if (!creds[key].email || !creds[key].password) {
      // Sinaliza skip via erro de configuração (test.skip não é chamável aqui)
      throw new Error(
        `TEST_USER_${key.toUpperCase()}_EMAIL / _PASSWORD não estão configurados. ` +
          "Adicione-os ao .env.test para rodar este spec."
      );
    }
  }
}
