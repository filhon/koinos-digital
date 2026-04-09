"use server";

import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/with-permission";
import { logAudit } from "@/actions/audit";
import {
  createSongSchema,
  updateSongSchema,
  type CreateSongInput,
  type UpdateSongInput,
} from "@/lib/validators/music-groups";
import type { AuthUser } from "@/lib/auth/session";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SongRow {
  id: string;
  music_group_id: string;
  church_id: string;
  name: string;
  artist: string;
  lyrics: string | null;
  chord_url: string | null;
  youtube_url: string | null;
  central_message: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SongWithGroup extends SongRow {
  music_group: { id: string; name: string } | null;
}

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

// ─── Helper: verificar se user é líder do grupo ───────────────────────────────

async function isGroupLeader(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: AuthUser,
  musicGroupId: string
): Promise<boolean> {
  if (["admin", "pastor", "presbítero", "diácono"].includes(user.role)) {
    return true;
  }

  const { data: group } = await supabase
    .from("music_groups")
    .select("leader_id")
    .eq("id", musicGroupId)
    .eq("is_active", true)
    .single();

  if (!group?.leader_id) return false;

  const { data: memberProfile } = await supabase
    .from("members")
    .select("id")
    .eq("church_id", user.church_id)
    .eq("email", user.email!)
    .maybeSingle();

  return memberProfile?.id === group.leader_id;
}

// ─── listSongs ────────────────────────────────────────────────────────────────

export const listSongs = withPermission(
  async (
    user: AuthUser,
    musicGroupId: string,
    search?: string
  ): Promise<ActionResult<SongRow[]>> => {
    const supabase = await createClient();

    let query = supabase
      .from("songs")
      .select("*")
      .eq("music_group_id", musicGroupId)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (search?.trim()) {
      query = query.or(
        `name.ilike.%${search.trim()}%,artist.ilike.%${search.trim()}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data ?? []) as SongRow[], error: null };
  },
  { module: "repertorio", minRole: "visitante" }
);

// ─── listAllGroupsSongs ───────────────────────────────────────────────────────
// Lista músicas de todos os grupos do tenant (para página /repertorio)

export const listAllGroupsSongs = withPermission(
  async (
    user: AuthUser,
    opts?: { musicGroupId?: string; search?: string }
  ): Promise<ActionResult<SongWithGroup[]>> => {
    const supabase = await createClient();

    let query = supabase
      .from("songs")
      .select(
        `
        *,
        music_group:music_groups!songs_music_group_id_fkey(id, name)
        `
      )
      .eq("church_id", user.church_id)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (opts?.musicGroupId) {
      query = query.eq("music_group_id", opts.musicGroupId);
    }

    if (opts?.search?.trim()) {
      query = query.or(
        `name.ilike.%${opts.search.trim()}%,artist.ilike.%${opts.search.trim()}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return {
      data: (data ?? []).map((s) => ({
        ...(s as SongRow),
        music_group: (Array.isArray(s.music_group)
          ? s.music_group[0]
          : s.music_group) as { id: string; name: string } | null,
      })),
      error: null,
    };
  },
  { module: "repertorio", minRole: "visitante" }
);

// ─── getSongById ──────────────────────────────────────────────────────────────

export const getSongById = withPermission(
  async (
    user: AuthUser,
    songId: string
  ): Promise<ActionResult<SongWithGroup>> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("songs")
      .select(
        `
        *,
        music_group:music_groups!songs_music_group_id_fkey(id, name)
        `
      )
      .eq("id", songId)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return { data: null, error: "Música não encontrada" };
    }

    return {
      data: {
        ...(data as SongRow),
        music_group: (Array.isArray(data.music_group)
          ? data.music_group[0]
          : data.music_group) as { id: string; name: string } | null,
      },
      error: null,
    };
  },
  { module: "repertorio", minRole: "visitante" }
);

// ─── createSong ───────────────────────────────────────────────────────────────

export const createSong = withPermission(
  async (
    user: AuthUser,
    input: CreateSongInput
  ): Promise<ActionResult<SongRow>> => {
    const parsed = createSongSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();

    const canManage = await isGroupLeader(
      supabase,
      user,
      parsed.data.music_group_id
    );
    if (!canManage) {
      return {
        data: null,
        error: "Apenas o líder do grupo musical pode adicionar músicas",
      };
    }

    const { data: row, error } = await supabase
      .from("songs")
      .insert({
        music_group_id: parsed.data.music_group_id,
        church_id: user.church_id,
        name: parsed.data.name,
        artist: parsed.data.artist,
        lyrics: parsed.data.lyrics ?? null,
        chord_url: parsed.data.chord_url ?? null,
        youtube_url: parsed.data.youtube_url ?? null,
        central_message: parsed.data.central_message ?? null,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "create",
      entityType: "song",
      entityId: row.id,
      metadata: { name: row.name, artist: row.artist },
    }).catch(() => {});

    return { data: row as SongRow, error: null };
  },
  { module: "repertorio", minRole: "líder" }
);

// ─── updateSong ───────────────────────────────────────────────────────────────

export const updateSong = withPermission(
  async (
    user: AuthUser,
    songId: string,
    input: UpdateSongInput
  ): Promise<ActionResult<SongRow>> => {
    const parsed = updateSongSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();

    const { data: existing, error: fetchError } = await supabase
      .from("songs")
      .select("id, music_group_id, name")
      .eq("id", songId)
      .eq("is_active", true)
      .single();

    if (fetchError || !existing) {
      return { data: null, error: "Música não encontrada" };
    }

    const canManage = await isGroupLeader(
      supabase,
      user,
      existing.music_group_id
    );
    if (!canManage) {
      return {
        data: null,
        error: "Apenas o líder do grupo musical pode editar músicas",
      };
    }

    const { data: row, error } = await supabase
      .from("songs")
      .update({
        ...parsed.data,
        lyrics: parsed.data.lyrics ?? null,
        chord_url: parsed.data.chord_url ?? null,
        youtube_url: parsed.data.youtube_url ?? null,
        central_message: parsed.data.central_message ?? null,
      })
      .eq("id", songId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "update",
      entityType: "song",
      entityId: songId,
      metadata: { fields: Object.keys(parsed.data) },
    }).catch(() => {});

    return { data: row as SongRow, error: null };
  },
  { module: "repertorio", minRole: "líder" }
);

// ─── deleteSong (soft-delete) ─────────────────────────────────────────────────

export const deleteSong = withPermission(
  async (
    user: AuthUser,
    songId: string
  ): Promise<ActionResult<{ id: string }>> => {
    const supabase = await createClient();

    const { data: existing, error: fetchError } = await supabase
      .from("songs")
      .select("id, music_group_id, name")
      .eq("id", songId)
      .eq("is_active", true)
      .single();

    if (fetchError || !existing) {
      return { data: null, error: "Música não encontrada" };
    }

    const canManage = await isGroupLeader(
      supabase,
      user,
      existing.music_group_id
    );
    if (!canManage) {
      return {
        data: null,
        error: "Apenas o líder do grupo musical pode excluir músicas",
      };
    }

    const { error } = await supabase
      .from("songs")
      .update({ is_active: false })
      .eq("id", songId);

    if (error) {
      return { data: null, error: error.message };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "delete",
      entityType: "song",
      entityId: songId,
      metadata: { name: existing.name },
    }).catch(() => {});

    return { data: { id: songId }, error: null };
  },
  { module: "repertorio", minRole: "líder" }
);
