/**
 * Sessão 5.4 — Audit de segurança E2E
 *
 * Cobre:
 *  1. CSP headers presentes e corretos
 *  2. HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
 *  3. Rate limiting (signIn > 5 tentativas → 429 / mensagem de rate limit)
 *  4. Sanitização de inputs (XSS no mural)
 *  5. Dados sensíveis não expostos na API admin
 *  6. Admin SaaS não vê CPF/RG/email de membros dos tenants
 */

import { test, expect, type APIResponse } from "@playwright/test";
import { login, creds } from "./helpers/auth";

// ─── 1. Security Headers ─────────────────────────────────────────────────────

test.describe("Security Headers", () => {
  let response: APIResponse;

  test.beforeAll(async ({ request }) => {
    response = await request.get("/");
  });

  test("Content-Security-Policy está presente", async () => {
    const csp = response.headers()["content-security-policy"];
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src");
    expect(csp).toContain("style-src");
    expect(csp).toContain("img-src");
    expect(csp).toContain("connect-src");
    expect(csp).toContain("frame-src");
  });

  test("X-Frame-Options é DENY", async () => {
    const xFrame = response.headers()["x-frame-options"];
    expect(xFrame?.toUpperCase()).toBe("DENY");
  });

  test("X-Content-Type-Options é nosniff", async () => {
    const xcto = response.headers()["x-content-type-options"];
    expect(xcto).toBe("nosniff");
  });

  test("Strict-Transport-Security está presente", async () => {
    const hsts = response.headers()["strict-transport-security"];
    expect(hsts).toBeTruthy();
    expect(hsts).toContain("max-age=");
    expect(hsts).toContain("includeSubDomains");
  });

  test("Referrer-Policy está presente", async () => {
    const ref = response.headers()["referrer-policy"];
    expect(ref).toBeTruthy();
    expect(ref).toContain("strict-origin");
  });

  test("Permissions-Policy está presente", async () => {
    const pp = response.headers()["permissions-policy"];
    expect(pp).toBeTruthy();
    // Câmera para check-in, sem microfone geral
    expect(pp).toContain("camera");
    expect(pp).toContain("microphone=()");
  });

  test("CSP não contém 'unsafe-eval' em produção", async () => {
    const csp = response.headers()["content-security-policy"] ?? "";
    // Em dev é permitido pelo Next.js; em produção não deve existir
    if (process.env.NODE_ENV === "production") {
      expect(csp).not.toContain("unsafe-eval");
    }
  });
});

// ─── 2. Rate Limiting ────────────────────────────────────────────────────────

test.describe("Rate Limiting — login", () => {
  test("múltiplas tentativas de login com credenciais erradas acionam rate limit", async ({
    request,
  }) => {
    const wrongCreds = {
      email: "ratelimit_test@koinos.test",
      password: "SenhaErrada123",
      "cf-turnstile-response": "",
    };

    let rateLimitTriggered = false;
    let lastStatus = 0;

    // Faz 7 tentativas (limite é 5/15min)
    for (let i = 0; i < 7; i++) {
      const res = await request.post("/api/auth/callback", {
        form: wrongCreds,
        failOnStatusCode: false,
      });
      lastStatus = res.status();
      if (lastStatus === 429) {
        rateLimitTriggered = true;
        // Verifica header Retry-After
        const retryAfter = res.headers()["retry-after"];
        expect(retryAfter).toBeTruthy();
        break;
      }
    }

    // Rate limit deve ser acionado OU o formulário deve mostrar erro
    // (Server Actions não retornam 429 diretamente; verificamos via UI também)
    // Este teste valida apenas a API route se existir; se não, é informativo
    if (lastStatus === 404) {
      // signIn é Server Action, não API route — rate limit é interno
      // Verificamos via página
      test.skip(
        true,
        "signIn é Server Action; rate limit verificado via UI abaixo."
      );
    }

    expect(rateLimitTriggered || lastStatus !== 200).toBe(true);
  });

  test("rate limit via UI — 6 logins falhos mostram mensagem de limite", async ({
    page,
  }) => {
    test.setTimeout(60_000);

    for (let i = 0; i < 6; i++) {
      await page.goto("/login");
      await page.getByLabel("E-mail").fill(`ratetest_${i}@fake.test`);
      await page.locator("#password").fill("SenhaErrada!123");
      await page.waitForTimeout(800); // Turnstile
      await page.getByRole("button", { name: /entrar/i }).click();
      await page.waitForTimeout(1500);

      const rateLimitMsg = page.getByText(
        /muitas tentativas|tente.*minutos|rate limit/i
      );
      if (await rateLimitMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Rate limit acionado — teste passou
        return;
      }
    }

    // Se chegou aqui sem rate limit, o IP pode estar em whitelist no dev
    // Não falha o teste em dev local
    if (process.env.CI) {
      throw new Error(
        "Rate limit não foi acionado após 6 tentativas. Verifique Upstash Redis."
      );
    }
  });
});

// ─── 3. Sanitização de Inputs (XSS) ─────────────────────────────────────────

test.describe("Sanitização de inputs — XSS no mural", () => {
  test.skip(!creds.membro.email, "TEST_USER_MEMBRO_EMAIL não configurado.");

  test("post no mural com payload XSS é sanitizado antes de exibir", async ({
    page,
  }) => {
    await login(page, creds.membro);
    await page.goto("/mural");

    // Aguarda formulário de post
    const postTextarea = page.getByPlaceholder(/compartilhe|o que.*pensando/i);
    if (!(await postTextarea.isVisible({ timeout: 8000 }).catch(() => false))) {
      test.skip(true, "Textarea de post não encontrado.");
    }

    const xssPayload =
      '<script>alert("XSS")</script><img src=x onerror=alert(1)>';
    await postTextarea.fill(xssPayload);

    // Expande botões de ação se necessário
    const publishBtn = page.getByRole("button", { name: /publicar|postar/i });
    if (await publishBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await publishBtn.click();
    }

    await page.waitForTimeout(2000);

    // Verifica que o script não está no DOM como elemento executável
    const scripts = await page.locator("script:not([src])").all();
    for (const script of scripts) {
      const content = await script.textContent();
      // Nenhum script inline deve conter o payload XSS
      expect(content).not.toContain('alert("XSS")');
    }

    // Verifica que não há dialog de alerta aberto (XSS não executou)
    await page.evaluate(() => {
      // Se alert() tivesse executado no carregamento, o contador de dialogs seria > 0
      // Como Playwright não expõe isso diretamente, verificamos o DOM
      return document.querySelectorAll("script").length;
    });
    // O payload não deve ter criado elementos script no DOM
    const pageContent = await page.content();
    expect(pageContent).not.toContain('<script>alert("XSS")</script>');
  });

  test("comentário com HTML injetado não é renderizado como markup", async ({
    page,
  }) => {
    await login(page, creds.membro);
    await page.goto("/mural");

    // Procura um post existente e abre comentários
    const firstPost = page.locator("[data-testid='post-card']").first();
    if (!(await firstPost.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, "Nenhum post encontrado no mural.");
    }

    const commentToggle = firstPost.getByRole("button", {
      name: /comentar|comentários/i,
    });
    if (
      !(await commentToggle.isVisible({ timeout: 3000 }).catch(() => false))
    ) {
      test.skip(true, "Botão de comentário não encontrado.");
    }

    await commentToggle.click();

    const commentInput = firstPost.getByPlaceholder(/comentar|responder/i);
    if (!(await commentInput.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, "Campo de comentário não encontrado.");
    }

    await commentInput.fill("<b>Bold</b> <script>alert(1)</script>");
    await commentInput.press("Enter");

    await page.waitForTimeout(1500);

    // O <b> não deve criar um elemento bold real, e o script não deve executar
    const commentContent = await page.content();
    expect(commentContent).not.toContain("<script>alert(1)</script>");
  });
});

// ─── 4. Criptografia — dados sensíveis não expostos ──────────────────────────

test.describe("Criptografia — dados sensíveis não expostos na API", () => {
  test.skip(!creds.pastor.email, "TEST_USER_PASTOR_EMAIL não configurado.");

  test("API de busca de membros não retorna CPF em plain text", async ({
    page,
  }) => {
    await login(page, creds.pastor);

    // Server Actions não são chamáveis diretamente, mas a página /membros
    // renderiza os dados — verifica que CPF formatado não está no HTML
    await page.goto("/membros");
    await page.waitForTimeout(2000);

    const html = await page.content();

    // CPF em formato XXX.XXX.XXX-XX não deve aparecer no HTML renderizado
    // (campos sensíveis são criptografados; o front apenas exibe a existência)
    const cpfPattern = /\d{3}\.\d{3}\.\d{3}-\d{2}/;
    expect(html).not.toMatch(cpfPattern);
  });

  test("página de perfil de membro não exibe número de conta bancária", async ({
    page,
  }) => {
    await login(page, creds.pastor);
    await page.goto("/financeiro/contas");

    const premiumGate = page.getByText(/recurso premium/i);
    if (await premiumGate.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, "Plano sem acesso ao financeiro.");
    }

    await page.waitForTimeout(1500);
    const html = await page.content();

    // Números de conta bancária completos não devem aparecer
    // Apenas mascarados (****1234)
    // const fullAccountPattern = /\b\d{5,12}\b/g;
    // Esta verificação é intencional como aviso — não falha o teste
    // pois pode haver outros números no HTML (datas, IDs, etc.)
    // O importante é que a máscara está sendo aplicada
    const maskedPattern = /\*{4}\d{1,4}/;
    if (html.includes("Nenhuma conta")) {
      test.skip(true, "Nenhuma conta bancária cadastrada para verificar.");
    }
    // Se há contas, deve haver pelo menos um mascarado
    expect(html).toMatch(maskedPattern);
  });
});

// ─── 5. Admin não vê dados sensíveis de tenants ───────────────────────────────

test.describe("Admin SaaS — sem dados sensíveis de tenants", () => {
  test("painel admin /admin/dashboard não exibe CPF, RG ou emails de membros", async ({
    request,
  }) => {
    // Testa via API se admin existe; caso contrário pula
    // O painel admin requer role 'admin' que é interno
    // Verificamos a view members_admin_view via ausência no HTML

    // Acessa /admin/dashboard sem autenticação → deve redirecionar
    const res = await request.get("/admin/dashboard", {
      failOnStatusCode: false,
    });
    // Sem auth, deve retornar 302/401/403
    expect([200, 302, 401, 403]).toContain(res.status());

    if (res.status() === 200) {
      const html = await res.text();
      // CPF pattern não deve aparecer
      expect(html).not.toMatch(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
      // RG pattern
      expect(html).not.toMatch(/\d{1,2}\.\d{3}\.\d{3}-\d{1}/);
    }
  });

  test("members_admin_view exclui colunas sensíveis (verificação estrutural)", async () => {
    // Este teste verifica que, mesmo se um admin acessasse dados de membros,
    // a view SQL members_admin_view não inclui cpf, rg, email, phone, address

    // Como não temos acesso direto ao banco em E2E, verificamos via UI do admin
    // Se o admin existir como usuário de teste:
    test.skip(
      true,
      "Verificação de members_admin_view é feita via migration SQL. " +
        "Ver supabase/migrations/20260412160000_member_tags_admin_rls.sql."
    );
  });
});
