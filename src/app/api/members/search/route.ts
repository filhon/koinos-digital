import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
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

  const { success } = await rateLimit({
    identifier: `members-search:${user.id}`,
    limit: 30,
    window: 60,
  });
  if (!success) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente em breve." },
      { status: 429 }
    );
  }

  const churchId = user.app_metadata?.church_id as string | undefined;
  if (!churchId) {
    return NextResponse.json(
      { error: "Igreja não identificada." },
      { status: 403 }
    );
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const exclude = request.nextUrl.searchParams.get("exclude") ?? "";

  if (q.length > 0 && (q.length < 2 || q.length > 100)) {
    return NextResponse.json(
      { error: "Busca deve ter entre 2 e 100 caracteres." },
      { status: 400 }
    );
  }

  let query = supabase
    .from("public_members")
    .select("id, name, role, avatar_url")
    .eq("is_active", true)
    .order("name")
    .limit(8);

  if (q.length >= 2) {
    query = query.ilike("name", `%${q}%`);
  }

  if (exclude) {
    query = query.neq("id", exclude);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ members: data ?? [] });
}
