"use server";

import { headers } from "next/headers";
import { requireAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/actions/audit";
import {
  updateProfileSchema,
  type UpdateProfileInput,
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
  email: string | null;
  phone: string | null;
  role: string;
  avatar_url: string | null;
  address: MemberAddress | null;
  birth_date: string | null;
  created_at: string;
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
      "id, name, email, phone, role, avatar_url, address, birth_date, created_at"
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
      email: data.email as string | null,
      phone: data.phone as string | null,
      role: data.role as string,
      avatar_url: data.avatar_url as string | null,
      address: (data.address as MemberAddress) ?? null,
      birth_date: data.birth_date as string | null,
      created_at: data.created_at as string,
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
