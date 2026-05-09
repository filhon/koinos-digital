"use server";

import { headers } from "next/headers";
import { requireAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/actions/audit";
import {
  updateProfileSchema,
  updateUsernameSchema,
  updatePublicVisibilitySchema,
  usernameSchema,
  type UpdateProfileInput,
  type UpdatePublicVisibilityInput,
} from "@/lib/validators/profile";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MemberAddress = {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
};

export type MemberProfile = {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  avatar_url: string | null;
  address: MemberAddress | null;
  birth_date: string | null;
  created_at: string;
  public_email: boolean;
  public_phone: boolean;
  public_birth_date: boolean;
};

export type GetProfileResult =
  | { success: true; data: MemberProfile }
  | { success: false; error: string };

export type ProfileActionResult =
  | { success: true }
  | { success: false; error: string };

// ─── getProfile ───────────────────────────────────────────────────────────────

export async function getProfile(): Promise<GetProfileResult> {
  const user = await requireAuth();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("members")
    .select(
      "id, name, username, email, phone, role, avatar_url, address, birth_date, created_at, public_email, public_phone, public_birth_date"
    )
    .eq("church_id", user.church_id)
    .eq("email", user.email!)
    .maybeSingle();

  if (error || !data) {
    return { success: false, error: "Perfil não encontrado." };
  }

  return {
    success: true,
    data: {
      id: data.id as string,
      name: data.name as string,
      username: (data.username as string | null) ?? null,
      email: data.email as string | null,
      phone: data.phone as string | null,
      role: data.role as string,
      avatar_url: data.avatar_url as string | null,
      address: (data.address as MemberAddress) ?? null,
      birth_date: data.birth_date as string | null,
      created_at: data.created_at as string,
      public_email: (data.public_email as boolean) ?? false,
      public_phone: (data.public_phone as boolean) ?? false,
      public_birth_date: (data.public_birth_date as boolean) ?? false,
    },
  };
}

// ─── updateProfile ────────────────────────────────────────────────────────────

export async function updateProfile(
  data: UpdateProfileInput
): Promise<ProfileActionResult> {
  const parsed = updateProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const user = await requireAuth();
  const admin = createAdminClient();
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const { phone, address, avatar_url } = parsed.data;

  const updateData: Record<string, unknown> = {};
  if (phone !== undefined) updateData.phone = phone || null;
  if (address !== undefined) updateData.address = address;
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url || null;

  if (Object.keys(updateData).length === 0) {
    return { success: true };
  }

  const { data: member } = await admin
    .from("members")
    .select("id")
    .eq("church_id", user.church_id)
    .eq("email", user.email!)
    .maybeSingle();

  if (!member) {
    return { success: false, error: "Membro não encontrado." };
  }

  const { error } = await admin
    .from("members")
    .update(updateData)
    .eq("id", member.id as string);

  if (error) {
    return { success: false, error: "Erro ao atualizar perfil." };
  }

  await logAudit({
    churchId: user.church_id,
    userId: user.id,
    action: "update_profile",
    entityType: "member",
    entityId: member.id as string,
    metadata: { fields: Object.keys(updateData) },
    ip,
  });

  return { success: true };
}

// ─── Usernames reservados ─────────────────────────────────────────────────────

const RESERVED_USERNAMES = new Set([
  "login",
  "signup",
  "logout",
  "dashboard",
  "admin",
  "api",
  "termos",
  "privacidade",
  "convite",
  "verificar",
  "redefinir",
  "esqueci",
  "perfil",
  "checkin",
  "agenda",
  "config",
  "configuracoes",
  "suporte",
  "koinos",
  "help",
  "about",
  "contato",
  "blog",
  "status",
]);

// ─── suggestUsername ──────────────────────────────────────────────────────────

export async function suggestUsername(
  fullName: string
): Promise<string | null> {
  const normalized = fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "");

  const parts = normalized.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;

  const first = parts[0];
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  const base = (first + last).slice(0, 28);

  if (base.length < 3) return null;

  const admin = createAdminClient();

  for (let i = 0; i <= 99; i++) {
    const candidate = i === 0 ? base : `${base}${i}`;
    if (RESERVED_USERNAMES.has(candidate)) continue;

    const { data } = await admin
      .from("members")
      .select("id")
      .ilike("username", candidate)
      .maybeSingle();

    if (!data) return candidate;
  }

  return null;
}

// ─── checkUsernameAvailability ────────────────────────────────────────────────

export async function checkUsernameAvailability(
  username: string
): Promise<{ available: boolean; error?: string }> {
  const trimmed = username.trim().toLowerCase();

  const parsed = usernameSchema.safeParse(trimmed);
  if (!parsed.success) {
    return { available: false, error: parsed.error.issues[0].message };
  }

  if (RESERVED_USERNAMES.has(trimmed)) {
    return { available: false, error: "Username reservado" };
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("members")
    .select("id")
    .ilike("username", trimmed)
    .maybeSingle();

  return { available: !data };
}

// ─── updateUsername ───────────────────────────────────────────────────────────

export async function updateUsername(
  username: string
): Promise<ProfileActionResult> {
  const user = await requireAuth();
  const admin = createAdminClient();
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const trimmed = username.trim().toLowerCase();

  const parsed = updateUsernameSchema.safeParse({ username: trimmed });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  if (RESERVED_USERNAMES.has(trimmed)) {
    return { success: false, error: "Username não disponível." };
  }

  const { data: existing } = await admin
    .from("members")
    .select("id")
    .ilike("username", trimmed)
    .neq("email", user.email!)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "Username já está em uso." };
  }

  const { data: member } = await admin
    .from("members")
    .select("id, username")
    .eq("church_id", user.church_id)
    .eq("email", user.email!)
    .maybeSingle();

  if (!member) {
    return { success: false, error: "Membro não encontrado." };
  }

  const { error } = await admin
    .from("members")
    .update({ username: trimmed })
    .eq("id", member.id as string);

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Username já está em uso." };
    }
    return { success: false, error: "Erro ao atualizar username." };
  }

  await logAudit({
    churchId: user.church_id,
    userId: user.id,
    action: "update_username",
    entityType: "member",
    entityId: member.id as string,
    metadata: {
      previousUsername: (member.username as string | null) ?? null,
      newUsername: trimmed,
    },
    ip,
  });

  return { success: true };
}

// ─── updatePublicVisibility ───────────────────────────────────────────────────

export async function updatePublicVisibility(
  data: UpdatePublicVisibilityInput
): Promise<ProfileActionResult> {
  const parsed = updatePublicVisibilitySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const user = await requireAuth();
  const admin = createAdminClient();

  const { data: member } = await admin
    .from("members")
    .select("id")
    .eq("church_id", user.church_id)
    .eq("email", user.email!)
    .maybeSingle();

  if (!member) {
    return { success: false, error: "Membro não encontrado." };
  }

  const { error } = await admin
    .from("members")
    .update({
      public_email: parsed.data.public_email,
      public_phone: parsed.data.public_phone,
      public_birth_date: parsed.data.public_birth_date,
    })
    .eq("id", member.id as string);

  if (error) {
    return { success: false, error: "Erro ao atualizar visibilidade." };
  }

  return { success: true };
}

// ─── getPublicProfile ─────────────────────────────────────────────────────────

export type PublicBadge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked_at: string;
};

export type PublicProfileData = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  church_name: string;
  church_slug: string;
  badges: PublicBadge[];
  team_name: string | null;
  team_color: string | null;
  total_points: number;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
};

export type GetPublicProfileResult =
  | { success: true; data: PublicProfileData }
  | { success: false; error: string; notFound?: boolean };

export async function getPublicProfile(
  username: string
): Promise<GetPublicProfileResult> {
  const admin = createAdminClient();

  const { data: member, error } = await admin
    .from("members")
    .select(
      "id, name, username, avatar_url, email, phone, birth_date, public_email, public_phone, public_birth_date, church_id"
    )
    .ilike("username", username)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !member) {
    return { success: false, error: "Perfil não encontrado.", notFound: true };
  }

  // Church name
  const { data: tenant } = await admin
    .from("tenants")
    .select("name, slug")
    .eq("id", member.church_id as string)
    .maybeSingle();

  // Badges desbloqueados
  const { data: memberBadges } = await admin
    .from("member_badges")
    .select("unlocked_at, badges(id, name, description, icon)")
    .eq("member_id", member.id as string)
    .order("unlocked_at", { ascending: true });

  const badges: PublicBadge[] = (memberBadges ?? [])
    .map((mb) => {
      const badge = mb.badges as unknown as {
        id: string;
        name: string;
        description: string;
        icon: string;
      } | null;
      if (!badge?.id) return null;
      return {
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        unlocked_at: mb.unlocked_at as string,
      };
    })
    .filter((b): b is PublicBadge => b !== null);

  // Equipe (Liga)
  const { data: memberTeam } = await admin
    .from("member_teams")
    .select("teams(name, color)")
    .eq("member_id", member.id as string)
    .maybeSingle();

  const teamData = memberTeam?.teams as unknown as {
    name: string;
    color: string;
  } | null;

  // Total de pontos
  const { data: scoreData } = await admin
    .from("score_events")
    .select("points")
    .eq("member_id", member.id as string);

  const totalPoints = (scoreData ?? []).reduce(
    (sum, e) => sum + ((e.points as number) ?? 0),
    0
  );

  return {
    success: true,
    data: {
      id: member.id as string,
      name: member.name as string,
      username: member.username as string,
      avatar_url: (member.avatar_url as string | null) ?? null,
      church_name: tenant?.name ?? "",
      church_slug: tenant?.slug ?? "",
      badges,
      team_name: teamData?.name ?? null,
      team_color: teamData?.color ?? null,
      total_points: totalPoints,
      email: member.public_email ? (member.email as string | null) : null,
      phone: member.public_phone ? (member.phone as string | null) : null,
      birth_date: member.public_birth_date
        ? (member.birth_date as string | null)
        : null,
    },
  };
}
