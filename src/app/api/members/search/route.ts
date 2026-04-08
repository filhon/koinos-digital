import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

  const churchId = user.app_metadata?.church_id as string | undefined;
  if (!churchId) {
    return NextResponse.json(
      { error: "Igreja não identificada." },
      { status: 403 }
    );
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const exclude = request.nextUrl.searchParams.get("exclude") ?? "";

  let query = supabase
    .from("members")
    .select("id, name, role, avatar_url")
    .eq("church_id", churchId)
    .eq("is_active", true)
    .order("name")
    .limit(8);

  if (q.length > 0) {
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
