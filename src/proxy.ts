import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";
import type { MemberRole } from "@/lib/auth/session";

// ─── Hostname → tenant slug resolver ─────────────────────────────────────────

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "koinos.digital";
const APP_HOSTNAME = `app.${APP_DOMAIN}`;

/**
 * Retorna o slug do tenant se o hostname for:
 *  - {slug}.koinos.digital  → extrai o slug do subdomínio
 *  - domínio personalizado  → busca no banco pelo campo custom_domain
 * Retorna null se o hostname for o app principal ou localhost.
 */
async function resolveTenantSlug(
  hostname: string,
  request: NextRequest
): Promise<string | null> {
  // Remove porta (ex: localhost:3000)
  const host = hostname.split(":")[0];

  // É o app principal ou ambiente local → não é landing page
  if (
    host === APP_HOSTNAME ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".vercel.app")
  ) {
    return null;
  }

  // Subdomínio padrão: {slug}.koinos.digital
  const subdomainRegex = new RegExp(
    `^([a-z0-9-]+)\\.${APP_DOMAIN.replace(/\./g, "\\.")}$`
  );
  const subMatch = subdomainRegex.exec(host);
  if (subMatch) {
    return subMatch[1]; // slug extraído do subdomínio
  }

  // Domínio personalizado: busca no banco (anon key — tabela tem RLS pública para is_published)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data } = await supabase
    .from("tenants")
    .select("slug")
    .eq("custom_domain", host)
    .eq("is_published", true)
    .maybeSingle();

  return data?.slug ?? null;
}

// Rotas que exigem roles específicos além de estar autenticado.
// A ordem importa: mais específico primeiro.
const ROUTE_GUARDS: Array<{
  test: (pathname: string) => boolean;
  roles: MemberRole[];
  redirect?: string;
}> = [
  {
    // Financeiro: tesoureiro, diácono, presbítero, pastor, admin
    test: (p) => p.startsWith("/dashboard/financeiro"),
    roles: ["admin", "pastor", "presbítero", "diácono", "tesoureiro"],
  },
  {
    // Configurações: apenas pastor/admin (configurações avançadas do tenant)
    test: (p) => p.startsWith("/dashboard/configuracoes"),
    roles: ["admin", "pastor"],
  },
  {
    // Assembléia: apenas pastor/admin (criação e gestão de assembleias)
    test: (p) => p.startsWith("/dashboard/assembleia"),
    roles: ["admin", "pastor"],
  },
  {
    // Painel admin SaaS: exclusivo para admin global
    test: (p) => p.startsWith("/admin"),
    roles: ["admin"],
    redirect: "/dashboard",
  },
];

// Rotas que exigem AAL2 (2FA verificado na sessão atual)
const AAL2_ROUTES = [
  "/dashboard/configuracoes",
  "/dashboard/financeiro",
  "/dashboard/assembleia",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? request.nextUrl.hostname;

  // ── Resolução de hostname para tenant ──────────────────────────────────────
  // Só intercepta se NÃO for uma rota interna do Next.js ou do dashboard
  if (
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/dashboard") &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/signup") &&
    !pathname.startsWith("/convite") &&
    !pathname.startsWith("/verificar-2fa") &&
    !pathname.startsWith("/403") &&
    !pathname.startsWith("/perfil") &&
    !pathname.startsWith("/checkin") &&
    !pathname.startsWith("/c/") &&
    !pathname.startsWith("/agenda") &&
    !pathname.startsWith("/membros") &&
    !pathname.startsWith("/ministerios") &&
    !pathname.startsWith("/escalas") &&
    !pathname.startsWith("/eventos") &&
    !pathname.startsWith("/liturgia") &&
    !pathname.startsWith("/grupos-musicais") &&
    !pathname.startsWith("/repertorio") &&
    !pathname.startsWith("/recursos") &&
    !pathname.startsWith("/financeiro") &&
    !pathname.startsWith("/mural") &&
    !pathname.startsWith("/gamificacao") &&
    !pathname.startsWith("/assembleia") &&
    !pathname.startsWith("/configuracoes") &&
    !pathname.startsWith("/landing-page")
  ) {
    const slug = await resolveTenantSlug(hostname, request);
    if (slug) {
      // Reescreve a URL internamente para /[slug]{pathname}
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `/${slug}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(rewriteUrl);
    }
  }

  // Refresh automático do token (obrigatório — não remover)
  const response = await updateSession(request);

  // Rotas protegidas: /dashboard/* e /admin/*
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verifica guards de role para rotas específicas
    const role = ((user.app_metadata as Record<string, unknown>)?.role ??
      "visitante") as MemberRole;

    for (const guard of ROUTE_GUARDS) {
      if (guard.test(pathname) && !guard.roles.includes(role)) {
        const forbiddenUrl = request.nextUrl.clone();
        forbiddenUrl.pathname = guard.redirect ?? "/403";
        return NextResponse.redirect(forbiddenUrl);
      }
    }

    // Verifica AAL2 para rotas sensíveis
    const requiresAal2 = AAL2_ROUTES.some((route) =>
      pathname.startsWith(route)
    );
    if (requiresAal2) {
      const { data: aalData } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const hasActiveMfa = aalData?.nextLevel === "aal2";
      const isAal2 = aalData?.currentLevel === "aal2";

      // Só redireciona se o usuário TEM 2FA configurado mas ainda não verificou nesta sessão
      if (hasActiveMfa && !isAal2) {
        const mfaUrl = request.nextUrl.clone();
        mfaUrl.pathname = "/verificar-2fa";
        mfaUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(mfaUrl);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Aplica em todas as rotas exceto:
     * - _next/static, _next/image, favicon.ico, arquivos públicos
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
