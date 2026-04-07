import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Autenticação obrigatória: rate limit por usuário autenticado
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
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { success, remaining, reset } = await rateLimit({
    identifier: `ai:${user.id}`,
    limit: 10,
    window: 60, // 10 por minuto por usuário
  });

  if (!success) {
    const retryAfter = reset - Math.floor(Date.now() / 1000);
    return NextResponse.json(
      { error: "Limite de requisições IA atingido. Tente novamente em breve." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(reset),
        },
      }
    );
  }

  // TODO: implementar lógica de geração de liturgia com GPT-4.1 (Fase 2)
  return NextResponse.json(
    { error: "Not implemented" },
    {
      status: 501,
      headers: { "X-RateLimit-Remaining": String(remaining) },
    }
  );
}
