import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";
import type { MemberRole } from "@/lib/auth/session";

// Rotas que exigem roles específicos além de estar autenticado.
// A ordem importa: mais específico primeiro.
const ROUTE_GUARDS: Array<{
  test: (pathname: string) => boolean;
  roles: MemberRole[];
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
];

export async function middleware(request: NextRequest) {
  // Refresh automático do token (obrigatório — não remover)
  const response = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Rotas protegidas: /dashboard/*
  if (pathname.startsWith("/dashboard")) {
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
        forbiddenUrl.pathname = "/403";
        return NextResponse.redirect(forbiddenUrl);
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
