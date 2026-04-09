"use server";

import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/with-permission";
import { logAudit } from "@/actions/audit";
import {
  createMusicGroupSchema,
  updateMusicGroupSchema,
  addMusicGroupMemberSchema,
  removeMusicGroupMemberSchema,
  type CreateMusicGroupInput,
  type UpdateMusicGroupInput,
  type AddMusicGroupMemberInput,
  type RemoveMusicGroupMemberInput,
} from "@/lib/validators/music-groups";
import type { AuthUser } from "@/lib/auth/session";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MemberSummary {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string;
}

export interface MusicGroupRow {
  id: string;
  church_id: string;
  name: string;
  leader_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MusicGroupWithRelations extends MusicGroupRow {
  leader: MemberSummary | null;
  member_count: number;
}

export interface MusicGroupMemberRow {
  id: string;
  member: MemberSummary;
}

export interface MusicGroupFull extends MusicGroupWithRelations {
  music_group_members: MusicGroupMemberRow[];
}

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

// ─── listMusicGroups ──────────────────────────────────────────────────────────

export const listMusicGroups = withPermission(
  async (
    user: AuthUser,
    search?: string
  ): Promise<ActionResult<MusicGroupWithRelations[]>> => {
    const supabase = await createClient();

    let query = supabase
      .from("music_groups")
      .select(
        `
        *,
        leader:members!music_groups_leader_id_fkey(id, name, avatar_url, role)
        `
      )
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (search?.trim()) {
      query = query.ilike("name", `%${search.trim()}%`);
    }

    const { data: groups, error: groupsError } = await query;

    if (groupsError) {
      return { data: null, error: groupsError.message };
    }

    // Contagem de membros por grupo
    const { data: memberRows } = await supabase
      .from("music_group_members")
      .select("music_group_id")
      .eq("church_id", user.church_id);

    const countMap = (memberRows ?? []).reduce<Record<string, number>>(
      (acc, row) => {
        acc[row.music_group_id] = (acc[row.music_group_id] ?? 0) + 1;
        return acc;
      },
      {}
    );

    const result = (groups ?? []).map((g) => ({
      ...(g as MusicGroupRow),
      leader: (g.leader as MemberSummary) ?? null,
      member_count: countMap[g.id] ?? 0,
    }));

    return { data: result, error: null };
  },
  { module: "grupos-musicais", minRole: "visitante" }
);

// ─── getMusicGroupById ────────────────────────────────────────────────────────

export const getMusicGroupById = withPermission(
  async (
    user: AuthUser,
    groupId: string
  ): Promise<ActionResult<MusicGroupFull>> => {
    const supabase = await createClient();

    const { data: group, error: groupError } = await supabase
      .from("music_groups")
      .select(
        `
        *,
        leader:members!music_groups_leader_id_fkey(id, name, avatar_url, role)
        `
      )
      .eq("id", groupId)
      .eq("is_active", true)
      .single();

    if (groupError || !group) {
      return { data: null, error: "Grupo musical não encontrado" };
    }

    const { data: memberRows } = await supabase
      .from("music_group_members")
      .select(
        `
        id,
        member:members!music_group_members_member_id_fkey(id, name, avatar_url, role)
        `
      )
      .eq("music_group_id", groupId)
      .order("created_at", { ascending: true });

    const memberCount = (memberRows ?? []).filter(
      (r) => r.member !== null
    ).length;

    return {
      data: {
        ...(group as MusicGroupRow),
        leader: (group.leader as MemberSummary) ?? null,
        member_count: memberCount,
        music_group_members: (memberRows ?? [])
          .filter((r) => r.member !== null)
          .map((r) => ({
            id: r.id,
            member: (Array.isArray(r.member)
              ? r.member[0]
              : r.member) as unknown as MemberSummary,
          })),
      },
      error: null,
    };
  },
  { module: "grupos-musicais", minRole: "visitante" }
);

// ─── createMusicGroup ─────────────────────────────────────────────────────────

export const createMusicGroup = withPermission(
  async (
    user: AuthUser,
    input: CreateMusicGroupInput
  ): Promise<ActionResult<MusicGroupRow>> => {
    const parsed = createMusicGroupSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();

    const { data: row, error } = await supabase
      .from("music_groups")
      .insert({
        church_id: user.church_id,
        name: parsed.data.name,
        leader_id: parsed.data.leader_id ?? null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return {
          data: null,
          error: "Já existe um grupo musical com este nome",
        };
      }
      return { data: null, error: error.message };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "create",
      entityType: "music_group",
      entityId: row.id,
      metadata: { name: row.name },
    }).catch(() => {});

    return { data: row as MusicGroupRow, error: null };
  },
  { module: "grupos-musicais", minRole: "presbítero" }
);

// ─── updateMusicGroup ─────────────────────────────────────────────────────────

export const updateMusicGroup = withPermission(
  async (
    user: AuthUser,
    groupId: string,
    input: UpdateMusicGroupInput
  ): Promise<ActionResult<MusicGroupRow>> => {
    const parsed = updateMusicGroupSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();

    const { data: existing, error: fetchError } = await supabase
      .from("music_groups")
      .select("id, name")
      .eq("id", groupId)
      .eq("is_active", true)
      .single();

    if (fetchError || !existing) {
      return { data: null, error: "Grupo musical não encontrado" };
    }

    const { data: row, error } = await supabase
      .from("music_groups")
      .update({
        ...parsed.data,
        leader_id: parsed.data.leader_id ?? null,
      })
      .eq("id", groupId)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return {
          data: null,
          error: "Já existe um grupo musical com este nome",
        };
      }
      return { data: null, error: error.message };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "update",
      entityType: "music_group",
      entityId: groupId,
      metadata: { fields: Object.keys(parsed.data) },
    }).catch(() => {});

    return { data: row as MusicGroupRow, error: null };
  },
  { module: "grupos-musicais", minRole: "presbítero" }
);

// ─── deleteMusicGroup (soft-delete) ──────────────────────────────────────────

export const deleteMusicGroup = withPermission(
  async (
    user: AuthUser,
    groupId: string
  ): Promise<ActionResult<{ id: string }>> => {
    const supabase = await createClient();

    const { data: existing, error: fetchError } = await supabase
      .from("music_groups")
      .select("id, name")
      .eq("id", groupId)
      .eq("is_active", true)
      .single();

    if (fetchError || !existing) {
      return { data: null, error: "Grupo musical não encontrado" };
    }

    const { error } = await supabase
      .from("music_groups")
      .update({ is_active: false })
      .eq("id", groupId);

    if (error) {
      return { data: null, error: error.message };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "delete",
      entityType: "music_group",
      entityId: groupId,
      metadata: { name: existing.name },
    }).catch(() => {});

    return { data: { id: groupId }, error: null };
  },
  { module: "grupos-musicais", minRole: "presbítero" }
);

// ─── addMusicGroupMember ──────────────────────────────────────────────────────

export const addMusicGroupMember = withPermission(
  async (
    user: AuthUser,
    input: AddMusicGroupMemberInput
  ): Promise<ActionResult<{ id: string }>> => {
    const parsed = addMusicGroupMemberSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();

    const { data: group, error: groupError } = await supabase
      .from("music_groups")
      .select("id, leader_id")
      .eq("id", parsed.data.musicGroupId)
      .eq("is_active", true)
      .single();

    if (groupError || !group) {
      return { data: null, error: "Grupo musical não encontrado" };
    }

    // Líder só pode gerenciar o próprio grupo
    if (user.role === "líder") {
      const { data: memberProfile } = await supabase
        .from("members")
        .select("id")
        .eq("church_id", user.church_id)
        .eq("email", user.email!)
        .maybeSingle();

      if (!memberProfile || group.leader_id !== memberProfile.id) {
        return {
          data: null,
          error: "Apenas o líder do grupo pode gerenciar seus componentes",
        };
      }
    }

    const { data: row, error } = await supabase
      .from("music_group_members")
      .insert({
        music_group_id: parsed.data.musicGroupId,
        member_id: parsed.data.memberId,
        church_id: user.church_id,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { data: null, error: "Membro já pertence a este grupo" };
      }
      return { data: null, error: error.message };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "add_music_group_member",
      entityType: "music_group",
      entityId: parsed.data.musicGroupId,
      metadata: { memberId: parsed.data.memberId },
    }).catch(() => {});

    return { data: { id: row.id }, error: null };
  },
  { module: "grupos-musicais", minRole: "líder" }
);

// ─── removeMusicGroupMember ───────────────────────────────────────────────────

export const removeMusicGroupMember = withPermission(
  async (
    user: AuthUser,
    input: RemoveMusicGroupMemberInput
  ): Promise<ActionResult<{ ok: true }>> => {
    const parsed = removeMusicGroupMemberSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();

    const { data: group, error: groupError } = await supabase
      .from("music_groups")
      .select("id, leader_id")
      .eq("id", parsed.data.musicGroupId)
      .eq("is_active", true)
      .single();

    if (groupError || !group) {
      return { data: null, error: "Grupo musical não encontrado" };
    }

    // Líder só pode gerenciar o próprio grupo
    if (user.role === "líder") {
      const { data: memberProfile } = await supabase
        .from("members")
        .select("id")
        .eq("church_id", user.church_id)
        .eq("email", user.email!)
        .maybeSingle();

      if (!memberProfile || group.leader_id !== memberProfile.id) {
        return {
          data: null,
          error: "Apenas o líder do grupo pode gerenciar seus componentes",
        };
      }
    }

    const { error } = await supabase
      .from("music_group_members")
      .delete()
      .eq("music_group_id", parsed.data.musicGroupId)
      .eq("member_id", parsed.data.memberId);

    if (error) {
      return { data: null, error: error.message };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "remove_music_group_member",
      entityType: "music_group",
      entityId: parsed.data.musicGroupId,
      metadata: { memberId: parsed.data.memberId },
    }).catch(() => {});

    return { data: { ok: true }, error: null };
  },
  { module: "grupos-musicais", minRole: "líder" }
);
