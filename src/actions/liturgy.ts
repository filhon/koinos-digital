"use server";

import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/with-permission";
import { logAudit } from "@/actions/audit";
import { createNotification } from "@/actions/notifications";
import { isLeadershipRole } from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/session";
import {
  createLiturgySchema,
  updateLiturgyItemSchema,
  reorderLiturgyItemsSchema,
  addLiturgyItemSchema,
  removeLiturgyItemSchema,
  addSongToLiturgySchema,
  delegateMusicSelectionSchema,
  revokeMusicDelegationSchema,
  type CreateLiturgyInput,
  type UpdateLiturgyItemInput,
  type ReorderLiturgyItemsInput,
  type AddLiturgyItemInput,
  type RemoveLiturgyItemInput,
  type AddSongToLiturgyInput,
  type DelegateMusicSelectionInput,
  type RevokeMusicDelegationInput,
  type LiturgyRow,
  type LiturgyItemRow,
  type LiturgyItemType,
  type MusicLeader,
} from "@/lib/validators/liturgy";

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

// ─── Default skeleton ─────────────────────────────────────────────────────────

const DEFAULT_LITURGY_ITEMS: Array<{ type: LiturgyItemType; title: string }> = [
  { type: "acolhimento", title: "Acolhimento e boas-vindas" },
  { type: "louvor", title: "Louvor de entrada" },
  { type: "oracao", title: "Oração de abertura" },
  { type: "leitura_biblica", title: "Leitura bíblica" },
  { type: "louvor", title: "Louvor de adoração" },
  { type: "avisos", title: "Avisos da semana" },
  { type: "oferta", title: "Oferta e dízimo" },
  { type: "pregacao", title: "Pregação" },
  { type: "oracao", title: "Oração de resposta" },
  { type: "louvor", title: "Louvor de encerramento" },
  { type: "oracao", title: "Bênção final" },
];

// ─── Permission helper ────────────────────────────────────────────────────────

async function canEditEventLiturgy(
  eventId: string,
  user: AuthUser
): Promise<boolean> {
  if (isLeadershipRole(user.role)) return true;

  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("responsible_id")
    .eq("id", eventId)
    .single();

  if (!event) return false;
  return event.responsible_id === user.id;
}

// ─── getLiturgyByEventId ───────────────────────────────────────────────────────

export const getLiturgyByEventId = withPermission(
  async (
    _user: AuthUser,
    eventId: string
  ): Promise<ActionResult<LiturgyRow | null>> => {
    const supabase = await createClient();

    const { data: liturgy, error } = await supabase
      .from("liturgies")
      .select(
        `*,
        delegated_member:members!music_delegated_to(id, name),
        items:liturgy_items(*)
       `
      )
      .eq("event_id", eventId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) return { data: null, error: error.message };
    if (!liturgy) return { data: null, error: null };

    const items = ((liturgy.items ?? []) as LiturgyItemRow[])
      .filter((i) => i.is_active)
      .sort((a, b) => a.order_index - b.order_index);

    return { data: { ...liturgy, items } as LiturgyRow, error: null };
  },
  { module: "liturgia", minRole: "visitante" }
);

// ─── createLiturgy ─────────────────────────────────────────────────────────────

export const createLiturgy = withPermission(
  async (
    user: AuthUser,
    input: CreateLiturgyInput
  ): Promise<ActionResult<LiturgyRow>> => {
    const parsed = createLiturgySchema.safeParse(input);
    if (!parsed.success)
      return {
        data: null,
        error: parsed.error.issues[0]?.message ?? "Erro de validação",
      };

    const canEdit = await canEditEventLiturgy(parsed.data.event_id, user);
    if (!canEdit)
      return {
        data: null,
        error: "Apenas o responsável ou liderança pode criar a liturgia.",
      };

    const supabase = await createClient();

    const { data: liturgy, error: liturgyError } = await supabase
      .from("liturgies")
      .insert({ event_id: parsed.data.event_id, church_id: user.church_id })
      .select()
      .single();

    if (liturgyError) return { data: null, error: liturgyError.message };

    const itemsToInsert = DEFAULT_LITURGY_ITEMS.map((item, idx) => ({
      liturgy_id: liturgy.id,
      church_id: user.church_id,
      type: item.type,
      title: item.title,
      order_index: idx,
    }));

    const { data: items, error: itemsError } = await supabase
      .from("liturgy_items")
      .insert(itemsToInsert)
      .select();

    if (itemsError) return { data: null, error: itemsError.message };

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "create",
      entityType: "liturgia",
      entityId: liturgy.id,
      metadata: { event_id: parsed.data.event_id, item_count: items.length },
    });

    const sortedItems = (items as LiturgyItemRow[]).sort(
      (a, b) => a.order_index - b.order_index
    );

    return {
      data: {
        ...liturgy,
        music_delegated_to: null,
        delegated_member: null,
        items: sortedItems,
      } as LiturgyRow,
      error: null,
    };
  },
  { module: "liturgia", minRole: "visitante" }
);

// ─── updateLiturgyItem ─────────────────────────────────────────────────────────

export const updateLiturgyItem = withPermission(
  async (
    user: AuthUser,
    input: UpdateLiturgyItemInput
  ): Promise<ActionResult<LiturgyItemRow>> => {
    const parsed = updateLiturgyItemSchema.safeParse(input);
    if (!parsed.success)
      return {
        data: null,
        error: parsed.error.issues[0]?.message ?? "Erro de validação",
      };

    const supabase = await createClient();

    const { data: itemRow } = await supabase
      .from("liturgy_items")
      .select("liturgy_id, liturgies!inner(event_id)")
      .eq("id", parsed.data.id)
      .single();

    if (!itemRow) return { data: null, error: "Item não encontrado." };

    const eventId = (itemRow.liturgies as unknown as { event_id: string })
      ?.event_id;
    if (!eventId) return { data: null, error: "Evento não encontrado." };

    const canEdit = await canEditEventLiturgy(eventId, user);
    if (!canEdit)
      return { data: null, error: "Sem permissão para editar este item." };

    const { data: updated, error } = await supabase
      .from("liturgy_items")
      .update({
        type: parsed.data.type,
        title: parsed.data.title,
        content: parsed.data.content ?? null,
      })
      .eq("id", parsed.data.id)
      .eq("church_id", user.church_id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    return { data: updated as LiturgyItemRow, error: null };
  },
  { module: "liturgia", minRole: "visitante" }
);

// ─── reorderLiturgyItems ───────────────────────────────────────────────────────

export const reorderLiturgyItems = withPermission(
  async (
    user: AuthUser,
    input: ReorderLiturgyItemsInput
  ): Promise<ActionResult<void>> => {
    const parsed = reorderLiturgyItemsSchema.safeParse(input);
    if (!parsed.success)
      return {
        data: null,
        error: parsed.error.issues[0]?.message ?? "Erro de validação",
      };

    const supabase = await createClient();

    const { data: liturgy } = await supabase
      .from("liturgies")
      .select("event_id")
      .eq("id", parsed.data.liturgy_id)
      .single();

    if (!liturgy) return { data: null, error: "Liturgia não encontrada." };

    const canEdit = await canEditEventLiturgy(liturgy.event_id, user);
    if (!canEdit) return { data: null, error: "Sem permissão para reordenar." };

    const updates = parsed.data.ordered_ids.map((id, idx) =>
      supabase
        .from("liturgy_items")
        .update({ order_index: idx })
        .eq("id", id)
        .eq("liturgy_id", parsed.data.liturgy_id)
        .eq("church_id", user.church_id)
    );

    const results = await Promise.all(updates);
    const firstError = results.find((r) => r.error);
    if (firstError?.error)
      return { data: null, error: firstError.error.message };

    return { data: undefined, error: null };
  },
  { module: "liturgia", minRole: "visitante" }
);

// ─── addLiturgyItem ────────────────────────────────────────────────────────────

export const addLiturgyItem = withPermission(
  async (
    user: AuthUser,
    input: AddLiturgyItemInput
  ): Promise<ActionResult<LiturgyItemRow>> => {
    const parsed = addLiturgyItemSchema.safeParse(input);
    if (!parsed.success)
      return {
        data: null,
        error: parsed.error.issues[0]?.message ?? "Erro de validação",
      };

    const supabase = await createClient();

    const { data: liturgy } = await supabase
      .from("liturgies")
      .select("event_id")
      .eq("id", parsed.data.liturgy_id)
      .single();

    if (!liturgy) return { data: null, error: "Liturgia não encontrada." };

    const canEdit = await canEditEventLiturgy(liturgy.event_id, user);
    if (!canEdit)
      return { data: null, error: "Sem permissão para adicionar item." };

    const { data: maxItem } = await supabase
      .from("liturgy_items")
      .select("order_index")
      .eq("liturgy_id", parsed.data.liturgy_id)
      .eq("is_active", true)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxItem?.order_index ?? -1) + 1;

    const { data: newItem, error } = await supabase
      .from("liturgy_items")
      .insert({
        liturgy_id: parsed.data.liturgy_id,
        church_id: user.church_id,
        type: parsed.data.type,
        title: parsed.data.title,
        content: parsed.data.content ?? null,
        order_index: nextOrder,
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    return { data: newItem as LiturgyItemRow, error: null };
  },
  { module: "liturgia", minRole: "visitante" }
);

// ─── removeLiturgyItem ─────────────────────────────────────────────────────────

export const removeLiturgyItem = withPermission(
  async (
    user: AuthUser,
    input: RemoveLiturgyItemInput
  ): Promise<ActionResult<void>> => {
    const parsed = removeLiturgyItemSchema.safeParse(input);
    if (!parsed.success)
      return {
        data: null,
        error: parsed.error.issues[0]?.message ?? "Erro de validação",
      };

    const supabase = await createClient();

    const { data: itemRow } = await supabase
      .from("liturgy_items")
      .select("liturgy_id, liturgies!inner(event_id)")
      .eq("id", parsed.data.id)
      .single();

    if (!itemRow) return { data: null, error: "Item não encontrado." };

    const eventId = (itemRow.liturgies as unknown as { event_id: string })
      ?.event_id;
    if (!eventId) return { data: null, error: "Evento não encontrado." };

    const canEdit = await canEditEventLiturgy(eventId, user);
    if (!canEdit)
      return { data: null, error: "Sem permissão para remover este item." };

    const { error } = await supabase
      .from("liturgy_items")
      .update({ is_active: false })
      .eq("id", parsed.data.id)
      .eq("church_id", user.church_id);

    if (error) return { data: null, error: error.message };

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "delete",
      entityType: "liturgia_item",
      entityId: parsed.data.id,
    });

    return { data: undefined, error: null };
  },
  { module: "liturgia", minRole: "visitante" }
);

// ─── addSongToLiturgy ─────────────────────────────────────────────────────────

export const addSongToLiturgy = withPermission(
  async (
    user: AuthUser,
    input: AddSongToLiturgyInput
  ): Promise<ActionResult<LiturgyItemRow>> => {
    const parsed = addSongToLiturgySchema.safeParse(input);
    if (!parsed.success)
      return {
        data: null,
        error: parsed.error.issues[0]?.message ?? "Erro de validação",
      };

    const supabase = await createClient();

    const { data: liturgy } = await supabase
      .from("liturgies")
      .select("event_id")
      .eq("id", parsed.data.liturgy_id)
      .single();

    if (!liturgy) return { data: null, error: "Liturgia não encontrada." };

    const canEdit = await canEditEventLiturgy(liturgy.event_id, user);
    if (!canEdit)
      return { data: null, error: "Sem permissão para editar esta liturgia." };

    const { data: song } = await supabase
      .from("songs")
      .select("name, central_message")
      .eq("id", parsed.data.song_id)
      .eq("church_id", user.church_id)
      .single();

    if (!song) return { data: null, error: "Música não encontrada." };

    const { data: maxItem } = await supabase
      .from("liturgy_items")
      .select("order_index")
      .eq("liturgy_id", parsed.data.liturgy_id)
      .eq("is_active", true)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxItem?.order_index ?? -1) + 1;

    const { data: newItem, error } = await supabase
      .from("liturgy_items")
      .insert({
        liturgy_id: parsed.data.liturgy_id,
        church_id: user.church_id,
        type: "cântico" as LiturgyItemType,
        title: song.name,
        content: song.central_message ?? null,
        song_id: parsed.data.song_id,
        order_index: nextOrder,
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    return { data: newItem as LiturgyItemRow, error: null };
  },
  { module: "liturgia", minRole: "visitante" }
);

// ─── delegateMusicSelection ───────────────────────────────────────────────────

export const delegateMusicSelection = withPermission(
  async (
    user: AuthUser,
    input: DelegateMusicSelectionInput
  ): Promise<ActionResult<{ member_id: string; member_name: string }>> => {
    const parsed = delegateMusicSelectionSchema.safeParse(input);
    if (!parsed.success)
      return {
        data: null,
        error: parsed.error.issues[0]?.message ?? "Erro de validação",
      };

    const supabase = await createClient();

    const { data: liturgy } = await supabase
      .from("liturgies")
      .select("event_id")
      .eq("id", parsed.data.liturgy_id)
      .single();

    if (!liturgy) return { data: null, error: "Liturgia não encontrada." };

    const { data: event } = await supabase
      .from("events")
      .select("responsible_id, name")
      .eq("id", liturgy.event_id)
      .single();

    if (!event) return { data: null, error: "Evento não encontrado." };

    if (event.responsible_id !== user.id) {
      return {
        data: null,
        error: "Apenas o responsável pelo evento pode delegar músicas.",
      };
    }

    const { data: member } = await supabase
      .from("members")
      .select("name")
      .eq("id", parsed.data.member_id)
      .eq("church_id", user.church_id)
      .single();

    if (!member) return { data: null, error: "Membro não encontrado." };

    const { error } = await supabase
      .from("liturgies")
      .update({ music_delegated_to: parsed.data.member_id })
      .eq("id", parsed.data.liturgy_id)
      .eq("church_id", user.church_id);

    if (error) return { data: null, error: error.message };

    // Fire-and-forget notification
    void createNotification({
      memberId: parsed.data.member_id,
      churchId: user.church_id,
      type: "music_delegation",
      message: `Você foi delegado(a) para escolher as músicas do culto "${event.name}".`,
    });

    return {
      data: { member_id: parsed.data.member_id, member_name: member.name },
      error: null,
    };
  },
  { module: "liturgia", minRole: "visitante" }
);

// ─── revokeMusicDelegation ────────────────────────────────────────────────────

export const revokeMusicDelegation = withPermission(
  async (
    user: AuthUser,
    input: RevokeMusicDelegationInput
  ): Promise<ActionResult<void>> => {
    const parsed = revokeMusicDelegationSchema.safeParse(input);
    if (!parsed.success)
      return {
        data: null,
        error: parsed.error.issues[0]?.message ?? "Erro de validação",
      };

    const supabase = await createClient();

    const { data: liturgy } = await supabase
      .from("liturgies")
      .select("event_id")
      .eq("id", parsed.data.liturgy_id)
      .single();

    if (!liturgy) return { data: null, error: "Liturgia não encontrada." };

    const { data: event } = await supabase
      .from("events")
      .select("responsible_id")
      .eq("id", liturgy.event_id)
      .single();

    if (!event || event.responsible_id !== user.id) {
      return {
        data: null,
        error: "Apenas o responsável pelo evento pode revogar a delegação.",
      };
    }

    const { error } = await supabase
      .from("liturgies")
      .update({ music_delegated_to: null })
      .eq("id", parsed.data.liturgy_id)
      .eq("church_id", user.church_id);

    if (error) return { data: null, error: error.message };

    return { data: undefined, error: null };
  },
  { module: "liturgia", minRole: "visitante" }
);

// ─── getEventMusicGroupLeaders ────────────────────────────────────────────────

export const getEventMusicGroupLeaders = withPermission(
  async (
    _user: AuthUser,
    eventId: string
  ): Promise<ActionResult<MusicLeader[]>> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("event_music_groups")
      .select(
        `
        music_group:music_groups!inner(
          id,
          name,
          leader:members!music_groups_leader_id_fkey(id, name, avatar_url)
        )
      `
      )
      .eq("event_id", eventId);

    if (error) return { data: null, error: error.message };

    // Flatten and deduplicate by leader id
    const leadersMap = new Map<string, MusicLeader>();
    for (const row of data ?? []) {
      const group = row.music_group as unknown as {
        id: string;
        name: string;
        leader: { id: string; name: string; avatar_url: string | null } | null;
      };
      if (group?.leader && !leadersMap.has(group.leader.id)) {
        leadersMap.set(group.leader.id, {
          id: group.leader.id,
          name: group.leader.name,
          avatar_url: group.leader.avatar_url,
          group_name: group.name,
        });
      }
    }

    return { data: Array.from(leadersMap.values()), error: null };
  },
  { module: "liturgia", minRole: "visitante" }
);
