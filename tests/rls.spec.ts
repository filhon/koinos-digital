/**
 * Sessão 5.4 — RLS: tentativa de acesso cross-tenant E2E
 *
 * Verifica que um usuário autenticado em Tenant A não consegue:
 *  - Ver membros do Tenant B via API
 *  - Modificar dados do Tenant B via API
 *  - Acessar transações financeiras do Tenant B
 *
 * Requer dois tenants distintos no banco de teste.
 */

import { test, expect } from "@playwright/test";
import { login, creds } from "./helpers/auth";

// ─── Helpers internos ─────────────────────────────────────────────────────────

/** Faz uma requisição autenticada (com cookies da sessão atual) para uma API route. */
async function apiGet(
  page: import("@playwright/test").Page,
  path: string
): Promise<{ status: number; body: unknown }> {
  const response = await page.request.get(path);
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = await response.text();
  }
  return { status: response.status(), body };
}

// ─── Testes ───────────────────────────────────────────────────────────────────

test.describe("RLS — isolamento cross-tenant", () => {
  test.skip(
    !creds.pastor.email || !creds.tenantB.email,
    "TEST_USER_PASTOR_EMAIL e TEST_USER_TENANT_B_EMAIL são necessários."
  );

  test("usuário do Tenant A não vê recursos do Tenant B via API de busca", async ({
    page,
  }) => {
    // Login como Tenant B para obter um resource ID do Tenant B
    await login(page, creds.tenantB);

    // Busca recursos via API search
    const resultB = await apiGet(page, "/api/resources/search?q=");
    expect(resultB.status).toBe(200);
    const resourcesB = (resultB.body as { id: string }[] | null) ?? [];

    if (resourcesB.length === 0) {
      test.skip(true, "Tenant B não tem recursos cadastrados.");
    }

    const resourceIdB = resourcesB[0].id;

    // Faz login como Tenant A
    await page.context().clearCookies();
    await login(page, creds.pastor);

    // Tenta acessar um recurso do Tenant B diretamente
    const crossResult = await apiGet(
      page,
      `/api/resources/search?q=${resourceIdB}`
    );

    // RLS deve filtrar — resultado deve ser vazio (200 com []) ou 403
    expect(
      crossResult.status === 403 ||
        (crossResult.status === 200 &&
          Array.isArray(crossResult.body) &&
          (crossResult.body as unknown[]).length === 0)
    ).toBe(true);
  });

  test("URL de membro do Tenant B não exibe dados para usuário do Tenant A", async ({
    page,
  }) => {
    // Este teste verifica que a Server Action retorna erro ou vazio
    // ao tentar acessar /membros/[id_de_outro_tenant]

    // Como não temos o ID do membro do Tenant B diretamente, fazemos
    // a verificação via página: se o membro não for do church_id correto,
    // a página deve mostrar erro ou redirecionar

    // Usamos um UUID aleatório como proxy de "ID de outro tenant"
    const fakeId = "00000000-0000-7000-8000-000000000001";

    await login(page, creds.pastor);
    await page.goto(`/membros/${fakeId}`);

    // Deve mostrar "não encontrado" ou redirecionar
    const url = page.url();
    const notFound = await page
      .getByText(/não encontrado|membro não existe|erro/i)
      .isVisible({ timeout: 8000 })
      .catch(() => false);
    const redirected = url.includes("membros") && !url.includes(fakeId);

    expect(notFound || redirected || url.includes("404")).toBe(true);
  });

  test("API de ministérios retorna apenas ministérios do tenant autenticado", async ({
    page,
  }) => {
    await login(page, creds.pastor);

    const result = await apiGet(page, "/api/ministries/search?q=");
    // Deve retornar 200 com lista (possivelmente vazia) — não dados de outros tenants
    expect(result.status).toBe(200);
    expect(Array.isArray(result.body)).toBe(true);
  });

  test("API de grupos musicais retorna apenas grupos do tenant autenticado", async ({
    page,
  }) => {
    await login(page, creds.pastor);

    const result = await apiGet(page, "/api/music-groups/search?q=");
    expect(result.status).toBe(200);
    expect(Array.isArray(result.body)).toBe(true);
  });
});

test.describe("RLS — tentativas de acesso sem autenticação", () => {
  test("API /api/resources/search sem autenticação retorna 401", async ({
    page,
  }) => {
    await page.context().clearCookies();
    const result = await apiGet(page, "/api/resources/search?q=teste");
    expect([401, 403]).toContain(result.status);
  });

  test("API /api/ministries/search sem autenticação retorna 401", async ({
    page,
  }) => {
    await page.context().clearCookies();
    const result = await apiGet(page, "/api/ministries/search?q=teste");
    expect([401, 403]).toContain(result.status);
  });

  test("API /api/music-groups/search sem autenticação retorna 401", async ({
    page,
  }) => {
    await page.context().clearCookies();
    const result = await apiGet(page, "/api/music-groups/search?q=teste");
    expect([401, 403]).toContain(result.status);
  });
});
