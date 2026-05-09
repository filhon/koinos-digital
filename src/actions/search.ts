"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/with-permission";

const searchSchema = z.object({ q: z.string().min(2).max(100) });

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  category: "member" | "event" | "song" | "post";
  href: string;
}

export interface SearchResults {
  members: SearchResult[];
  events: SearchResult[];
  songs: SearchResult[];
  posts: SearchResult[];
}

export const globalSearch = withPermission(
  async (user, input: { q: string }) => {
    const parsed = searchSchema.safeParse(input);
    if (!parsed.success)
      return { success: false as const, error: "Busca inválida" };

    const { q } = parsed.data;
    const supabase = await createClient();
    const churchId = user.church_id;

    const [membersRes, eventsRes, songsRes, postsRes] = await Promise.all([
      supabase
        .from("members")
        .select("id, name, role")
        .eq("church_id", churchId)
        .eq("is_active", true)
        .ilike("name", `%${q}%`)
        .limit(5),

      supabase
        .from("events")
        .select("id, name, date")
        .eq("church_id", churchId)
        .eq("is_active", true)
        .ilike("name", `%${q}%`)
        .order("date", { ascending: true })
        .limit(5),

      supabase
        .from("songs")
        .select("id, name, artist")
        .eq("church_id", churchId)
        .eq("is_active", true)
        .or(`name.ilike.%${q}%,artist.ilike.%${q}%`)
        .limit(5),

      supabase
        .from("posts")
        .select("id, content")
        .eq("church_id", churchId)
        .eq("is_active", true)
        .ilike("content", `%${q}%`)
        .limit(3),
    ]);

    const members: SearchResult[] = (membersRes.data ?? []).map((m) => ({
      id: m.id as string,
      title: m.name as string,
      subtitle: m.role as string,
      category: "member" as const,
      href: `/membros/${m.id as string}`,
    }));

    const events: SearchResult[] = (eventsRes.data ?? []).map((e) => ({
      id: e.id as string,
      title: e.name as string,
      subtitle: e.date
        ? new Date(e.date as string).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
          })
        : undefined,
      category: "event" as const,
      href: `/eventos/${e.id as string}`,
    }));

    const songs: SearchResult[] = (songsRes.data ?? []).map((s) => ({
      id: s.id as string,
      title: s.name as string,
      subtitle: (s.artist as string | undefined) ?? undefined,
      category: "song" as const,
      href: `/repertorio`,
    }));

    const posts: SearchResult[] = (postsRes.data ?? []).map((p) => ({
      id: p.id as string,
      title:
        ((p.content as string) ?? "").substring(0, 60) +
        (((p.content as string | null)?.length ?? 0 > 60) ? "…" : ""),
      category: "post" as const,
      href: `/comunicacao`,
    }));

    return {
      success: true as const,
      data: { members, events, songs, posts } as SearchResults,
    };
  },
  { minRole: "visitante" }
);
