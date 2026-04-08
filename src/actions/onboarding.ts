"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createChurchSchema,
  registerMemberSchema,
  type CreateChurchInput,
  type RegisterMemberInput,
} from "@/lib/validators/onboarding";
import { encrypt, decrypt } from "@/lib/encryption/aes";
import { logAudit } from "@/actions/audit";
import { requireAuth } from "@/lib/auth/session";

export type ActionResult =
  | { success: true; message?: string; redirectTo?: string }
  | {
      success: false;
      error: string;
      existingChurch?: { id: string; name: string };
    };

// ─── Slug helper ──────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

async function uniqueSlug(
  supabase: ReturnType<typeof createAdminClient>,
  base: string
): Promise<string> {
  const slug = slugify(base);
  let attempt = 0;
  while (true) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt}`;
    const { data } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
    attempt++;
  }
}

// ─── Invite code helper ───────────────────────────────────────────────────────

function randomCode(length = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// ─── Server Action ────────────────────────────────────────────────────────────

export async function createChurch(
  data: CreateChurchInput
): Promise<ActionResult> {
  // 1. Validate payload
  const parsed = createChurchSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { personal, consents, church } = parsed.data;

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Auth client (anon key, manages session cookies)
  const supabase = await createClient();
  // Admin client (service_role, bypasses RLS for all DB writes)
  const admin = createAdminClient();

  // 2. Create / verify Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: personal.email,
    password: personal.password,
    options: {
      data: { full_name: personal.name },
    },
  });

  // Supabase returns error.code === "user_already_exists" for unconfirmed duplicates,
  // but for confirmed users it returns no error and authData.user.identities === [].
  // In both cases we fall back to signInWithPassword.
  const isConfirmedDuplicate =
    !authError && authData.user && authData.user.identities?.length === 0;

  if (authError?.code === "user_already_exists" || isConfirmedDuplicate) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: personal.email,
      password: personal.password,
    });
    if (signInError) {
      return {
        success: false,
        error: "E-mail já cadastrado com senha diferente. Faça login primeiro.",
      };
    }
  } else if (authError) {
    if (authError.code === "over_email_send_rate_limit") {
      return {
        success: false,
        error:
          "Limite de envio de e-mail atingido. Aguarde alguns minutos e tente novamente.",
      };
    }
    return { success: false, error: "Erro ao criar conta. Tente novamente." };
  }

  // Re-fetch user after sign-up/sign-in
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Sessão inválida. Tente novamente." };
  }

  const userId = user.id;

  // 3. Check church uniqueness via admin (bypasses RLS)
  if (church.cnpj) {
    const { data: existing } = await admin
      .from("tenants")
      .select("id, name")
      .eq("cnpj", church.cnpj)
      .maybeSingle();

    if (existing) {
      await associateAsVisitor(admin, existing.id, userId, personal, ip);
      return {
        success: false,
        error: `Encontramos sua igreja! Você foi adicionado como visitante. A liderança poderá atualizar seu papel.`,
        existingChurch: { id: existing.id, name: existing.name },
      };
    }
  } else {
    const { data: existing } = await admin
      .from("tenants")
      .select("id, name")
      .ilike("name", church.churchName)
      .maybeSingle();

    if (existing) {
      await associateAsVisitor(admin, existing.id, userId, personal, ip);
      return {
        success: false,
        error: `Encontramos uma igreja com este nome! Você foi adicionado como visitante. A liderança poderá atualizar seu papel.`,
        existingChurch: { id: existing.id, name: existing.name },
      };
    }
  }

  // 4. Create tenant via admin
  const slug = await uniqueSlug(admin, church.churchName);
  const addressJson = JSON.stringify(church.address);

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .insert({
      name: church.churchName,
      cnpj: church.cnpj ?? null,
      slug,
      plan: "gratuito",
      shared_finances: false,
    })
    .select("id")
    .single();

  if (tenantError || !tenant) {
    console.error("[onboarding] Erro ao criar tenant:", tenantError);
    return {
      success: false,
      error: "Erro ao criar a igreja. Tente novamente.",
    };
  }

  const churchId = tenant.id;

  // 5. Encrypt CPF and create member (pastor) via admin
  const encryptedCpf = encrypt(personal.cpf.replace(/\D/g, ""));

  const { data: member, error: memberError } = await admin
    .from("members")
    .insert({
      church_id: churchId,
      home_church_id: churchId,
      name: personal.name,
      cpf: encryptedCpf,
      email: personal.email,
      role: "pastor",
      phone: church.phone,
      is_active: true,
    })
    .select("id")
    .single();

  if (memberError || !member) {
    console.error("[onboarding] Erro ao criar member:", memberError);
    await admin.from("tenants").delete().eq("id", churchId);
    return {
      success: false,
      error: "Erro ao criar o perfil. Tente novamente.",
    };
  }

  // 6. Create general invite link via admin
  let inviteCode = randomCode();
  for (let i = 0; i < 5; i++) {
    const { data: existingCode } = await admin
      .from("invite_links")
      .select("id")
      .eq("code", inviteCode)
      .maybeSingle();
    if (!existingCode) break;
    inviteCode = randomCode();
  }

  await admin.from("invite_links").insert({
    church_id: churchId,
    member_id: null,
    code: inviteCode,
    active: true,
  });

  // 7. Register LGPD consents via admin
  const consentInserts = Object.entries(consents.consents).map(
    ([purpose, consented]) => ({
      member_id: member.id,
      purpose,
      consented,
      ip,
      terms_version: consents.termsVersion,
    })
  );

  await admin.from("consent_records").insert(consentInserts);

  // 8. Set JWT custom claims via admin
  try {
    await admin.auth.admin.updateUserById(userId, {
      app_metadata: {
        church_id: churchId,
        role: "pastor",
      },
    });
  } catch (err) {
    console.error("[onboarding] Erro ao definir JWT claims:", err);
  }

  // 9. Refresh session so new claims take effect
  await supabase.auth.refreshSession();

  // 10. Audit log
  await logAudit({
    churchId,
    userId,
    action: "create_church",
    entityType: "tenant",
    entityId: churchId,
    metadata: {
      churchName: church.churchName,
      slug,
      inviteCode,
      address: addressJson,
      denomination: church.denomination ?? null,
    },
    ip,
  });

  return { success: true, redirectTo: "/dashboard" };
}

// ─── Server Action: registerMember (via invite link) ─────────────────────────

export async function registerMember(
  data: RegisterMemberInput
): Promise<ActionResult> {
  const parsed = registerMemberSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const {
    name,
    cpf,
    email,
    password,
    phone,
    inviteCode,
    consents,
    termsVersion,
  } = parsed.data;

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const supabase = await createClient();
  const admin = createAdminClient();

  // 1. Validate invite code
  const { data: invite, error: inviteError } = await admin
    .from("invite_links")
    .select("id, church_id, member_id, active")
    .eq("code", inviteCode)
    .maybeSingle();

  if (inviteError || !invite || !invite.active) {
    return { success: false, error: "Link de convite inválido ou revogado." };
  }

  const churchId = invite.church_id as string;
  const invitedBy = invite.member_id as string | null;

  // 2. Create / verify Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });

  const isConfirmedDuplicate =
    !authError && authData.user && authData.user.identities?.length === 0;

  if (authError?.code === "user_already_exists" || isConfirmedDuplicate) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      return {
        success: false,
        error: "E-mail já cadastrado com senha diferente. Faça login primeiro.",
      };
    }
  } else if (authError) {
    if (authError.code === "over_email_send_rate_limit") {
      return {
        success: false,
        error:
          "Limite de envio de e-mail atingido. Aguarde alguns minutos e tente novamente.",
      };
    }
    return { success: false, error: "Erro ao criar conta. Tente novamente." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { success: false, error: "Sessão inválida. Tente novamente." };

  const userId = user.id;
  const rawCpf = cpf.replace(/\D/g, "");

  // 3. CPF matching: check if member already exists in this church
  const { data: allMembers } = await admin
    .from("members")
    .select("id, cpf, email, role")
    .eq("church_id", churchId);

  let existingMemberId: string | null = null;
  let existingRole: string | null = null;

  if (allMembers) {
    for (const m of allMembers) {
      if (!m.cpf) continue;
      try {
        const decrypted = decrypt(m.cpf as string);
        if (decrypted === rawCpf) {
          existingMemberId = m.id as string;
          existingRole = m.role as string;
          break;
        }
      } catch {
        // skip unreadable records
      }
    }
  }

  let memberId: string;
  let role: string;

  if (existingMemberId) {
    // CPF match → associate + update email if different
    memberId = existingMemberId;
    role = existingRole ?? "visitante";

    const memberRow = allMembers!.find((m) => m.id === existingMemberId);
    if (memberRow && memberRow.email !== email) {
      await admin
        .from("members")
        .update({ email, updated_at: new Date().toISOString() })
        .eq("id", existingMemberId);

      await logAudit({
        churchId,
        userId,
        action: "update_member_email_on_invite",
        entityType: "member",
        entityId: existingMemberId,
        metadata: { previousEmail: memberRow.email, newEmail: email },
        ip,
      });
    }
  } else {
    // CPF not found → create new member as visitante
    const encryptedCpf = encrypt(rawCpf);

    const { data: newMember, error: memberError } = await admin
      .from("members")
      .insert({
        church_id: churchId,
        home_church_id: churchId,
        name,
        cpf: encryptedCpf,
        email,
        role: "visitante",
        phone: phone ? phone.replace(/\D/g, "") : null,
        invited_by: invitedBy,
        is_active: true,
      })
      .select("id")
      .single();

    if (memberError || !newMember) {
      console.error(
        "[onboarding] Erro ao criar member via convite:",
        memberError
      );
      return {
        success: false,
        error: "Erro ao criar o perfil. Tente novamente.",
      };
    }

    memberId = newMember.id as string;
    role = "visitante";
  }

  // 4. LGPD consents
  const consentInserts = Object.entries(consents).map(
    ([purpose, consented]) => ({
      member_id: memberId,
      purpose,
      consented,
      ip,
      terms_version: termsVersion,
    })
  );
  await admin.from("consent_records").insert(consentInserts);

  // 5. JWT custom claims
  try {
    await admin.auth.admin.updateUserById(userId, {
      app_metadata: { church_id: churchId, role },
    });
  } catch (err) {
    console.error("[onboarding] Erro ao definir JWT claims:", err);
  }

  await supabase.auth.refreshSession();

  // 6. Audit log
  await logAudit({
    churchId,
    userId,
    action: "register_via_invite",
    entityType: "member",
    entityId: memberId,
    metadata: { inviteCode, invitedBy, role },
    ip,
  });

  return { success: true, redirectTo: "/dashboard" };
}

// ─── Server Action: generateInviteLink ───────────────────────────────────────

export type InviteLink = {
  id: string;
  code: string;
  member_id: string | null;
  member_name: string | null;
  active: boolean;
  created_at: string;
};

export type GetInviteLinksResult =
  | { success: true; data: InviteLink[] }
  | { success: false; error: string };

export async function getInviteLinks(): Promise<GetInviteLinksResult> {
  const user = await requireAuth();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("invite_links")
    .select("id, code, member_id, active, created_at, members(name)")
    .eq("church_id", user.church_id)
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: "Erro ao buscar links." };

  const links = (data ?? []).map((row: Record<string, unknown>) => {
    const memberName = row.members
      ? ((row.members as { name?: string }).name ?? null)
      : null;
    return {
      id: row.id as string,
      code: row.code as string,
      member_id: row.member_id as string | null,
      member_name: memberName,
      active: row.active as boolean,
      created_at: row.created_at as string,
    };
  });

  return { success: true, data: links };
}

export type GenerateInviteResult =
  | { success: true; code: string }
  | { success: false; error: string };

/**
 * Gera um link de convite.
 * personal = true → link pessoal do membro logado (member_id preenchido)
 * personal = false → link geral da igreja (member_id = null), apenas liderança
 */
export async function generateInviteLink(
  personal: boolean
): Promise<GenerateInviteResult> {
  const user = await requireAuth();

  // Link geral exige liderança (pastor/presbítero/diácono/líder)
  if (!personal) {
    const leadershipRoles = [
      "pastor",
      "presbítero",
      "diácono",
      "líder",
      "admin",
    ];
    if (!leadershipRoles.includes(user.role)) {
      return {
        success: false,
        error: "Apenas liderança pode gerar links gerais.",
      };
    }
  }

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const admin = createAdminClient();

  // Busca o member_id do usuário logado
  let memberId: string | null = null;
  if (personal) {
    const { data: member } = await admin
      .from("members")
      .select("id")
      .eq("church_id", user.church_id)
      .eq("email", user.email!)
      .maybeSingle();
    memberId = member?.id ?? null;
  }

  let code = randomCode();
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await admin
      .from("invite_links")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!existing) break;
    code = randomCode();
  }

  const { error } = await admin.from("invite_links").insert({
    church_id: user.church_id,
    member_id: memberId,
    code,
    active: true,
  });

  if (error) return { success: false, error: "Erro ao gerar link." };

  await logAudit({
    churchId: user.church_id,
    userId: user.id,
    action: "generate_invite_link",
    entityType: "invite_links",
    metadata: { personal, code },
    ip,
  });

  return { success: true, code };
}

export type RevokeInviteResult =
  | { success: true }
  | { success: false; error: string };

export async function revokeInviteLink(
  inviteLinkId: string
): Promise<RevokeInviteResult> {
  const user = await requireAuth();

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const admin = createAdminClient();

  // Confirm the link belongs to this church
  const { data: link } = await admin
    .from("invite_links")
    .select("id, member_id")
    .eq("id", inviteLinkId)
    .eq("church_id", user.church_id)
    .maybeSingle();

  if (!link) return { success: false, error: "Link não encontrado." };

  // Members can only revoke their own personal links
  const leadershipRoles = ["pastor", "presbítero", "diácono", "líder", "admin"];
  const isLeadership = leadershipRoles.includes(user.role);

  if (!isLeadership) {
    const { data: member } = await admin
      .from("members")
      .select("id")
      .eq("church_id", user.church_id)
      .eq("email", user.email!)
      .maybeSingle();

    if (!member || link.member_id !== member.id) {
      return {
        success: false,
        error: "Você só pode revogar seus próprios links.",
      };
    }
  }

  const { error } = await admin
    .from("invite_links")
    .update({ active: false })
    .eq("id", inviteLinkId);

  if (error) return { success: false, error: "Erro ao revogar link." };

  await logAudit({
    churchId: user.church_id,
    userId: user.id,
    action: "revoke_invite_link",
    entityType: "invite_links",
    entityId: inviteLinkId,
    ip,
  });

  return { success: true };
}

// ─── Helper: associate existing user as visitor ───────────────────────────────

async function associateAsVisitor(
  supabase: ReturnType<typeof createAdminClient>,
  churchId: string,
  userId: string,
  personal: { name: string; email: string; cpf: string; phone?: string },
  ip: string
) {
  // Check if already a member
  const { data: existing } = await supabase
    .from("members")
    .select("id")
    .eq("church_id", churchId)
    .eq("email", personal.email)
    .maybeSingle();

  if (!existing) {
    const encryptedCpf = encrypt(personal.cpf.replace(/\D/g, ""));
    await supabase.from("members").insert({
      church_id: churchId,
      home_church_id: churchId,
      name: personal.name,
      cpf: encryptedCpf,
      email: personal.email,
      role: "visitante",
      is_active: true,
    });
  }

  await logAudit({
    churchId,
    userId,
    action: "auto_associate_visitor",
    entityType: "member",
    metadata: { email: personal.email },
    ip,
  });
}
