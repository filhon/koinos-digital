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
  const eventId = request.nextUrl.searchParams.get("event_id")?.trim() ?? "";

  // If event_id is provided, restrict results to music groups associated with the event.
  let musicGroupIds: string[] = [];
  if (eventId) {
    const { data: emg } = await supabase
      .from("event_music_groups")
      .select("music_group_id")
      .eq("event_id", eventId);

    musicGroupIds = (emg ?? []).map((r) => r.music_group_id as string);
  }

  let query = supabase
    .from("songs")
    .select("id, name, artist, central_message")
    .eq("church_id", churchId)
    .eq("is_active", true)
    .order("name")
    .limit(8);

  // Filter by music groups if we found any for this event.
  // If the event has no associated music groups, fall back to all songs in the tenant.
  if (musicGroupIds.length > 0) {
    query = query.in("music_group_id", musicGroupIds);
  }

  if (q.length > 0) {
    query = query.or(`name.ilike.%${q}%,artist.ilike.%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ songs: data ?? [] });
}
