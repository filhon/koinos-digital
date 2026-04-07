import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "127.0.0.1";

  const { success, remaining, reset } = await rateLimit({
    identifier: `checkin:${ip}`,
    limit: 100,
    window: 60, // 100 por minuto por IP
  });

  if (!success) {
    const retryAfter = reset - Math.floor(Date.now() / 1000);
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente em breve." },
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

  // TODO: implementar lógica de check-in na sessão de módulos (Fase 2)
  return NextResponse.json(
    { error: "Not implemented" },
    {
      status: 501,
      headers: { "X-RateLimit-Remaining": String(remaining) },
    }
  );
}
