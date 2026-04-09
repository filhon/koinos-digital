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

  let query = supabase
    .from("resources")
    .select(
      "id, name, status, responsible:members!resources_responsible_id_fkey(name)"
    )
    .eq("church_id", churchId)
    .eq("is_active", true)
    .order("name")
    .limit(8);

  if (q.length > 0) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ resources: data ?? [] });
}
