import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/esqueci-senha",
  "/redefinir-senha",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/convite/")) return true;
  // /[slug] → landing pages públicas de tenants
  // Heurística: single-segment paths que não são rotas conhecidas do app
  const segments = pathname.split("/").filter(Boolean);
  if (
    segments.length === 1 &&
    ![
      "login",
      "signup",
      "esqueci-senha",
      "redefinir-senha",
      "dashboard",
    ].includes(segments[0])
  ) {
    return true;
  }
  return false;
}

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
