"use server";

import { headers } from "next/headers";
import { requireAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/encryption/aes";
import { logAudit } from "@/actions/audit";
import {
  LGPD_PURPOSES,
  LGPD_LABELS,
  type LgpdPurpose,
} from "@/lib/validators/onboarding";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConsentRecord = {
  purpose: LgpdPurpose;
  label: string;
  description: string;
  consented: boolean;
  updated_at: string;
};

export type GetConsentsResult =
  | { success: true; data: ConsentRecord[] }
  | { success: false; error: string };

export type PrivacyActionResult =
  | { success: true }
  | { success: false; error: string };

export type ExportResult =
  | { success: true; json: string; csv: string }
  | { success: false; error: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getMemberId(
  admin: ReturnType<typeof createAdminClient>,
  churchId: string,
  email: string
): Promise<string | null> {
  const { data } = await admin
    .from("members")
    .select("id")
    .eq("church_id", churchId)
    .eq("email", email)
    .maybeSingle();
  return data?.id ?? null;
}

// ─── getConsents ──────────────────────────────────────────────────────────────

export async function getConsents(): Promise<GetConsentsResult> {
  const user = await requireAuth();
  const admin = createAdminClient();

  const memberId = await getMemberId(admin, user.church_id, user.email!);
  if (!memberId) return { success: false, error: "Membro não encontrado." };

  const { data, error } = await admin
    .from("consent_records")
    .select("purpose, consented, created_at")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: "Erro ao buscar consentimentos." };

  // Most recent record per purpose wins
  const seen = new Set<string>();
  const consentMap = new Map<
    string,
    { consented: boolean; created_at: string }
  >();
  for (const row of data ?? []) {
    if (!seen.has(row.purpose)) {
      seen.add(row.purpose);
      consentMap.set(row.purpose, {
        consented: row.consented as boolean,
        created_at: row.created_at as string,
      });
    }
  }

  const result: ConsentRecord[] = LGPD_PURPOSES.map((purpose) => {
    const entry = consentMap.get(purpose);
    return {
      purpose,
      label: LGPD_LABELS[purpose].title,
      description: LGPD_LABELS[purpose].description,
      consented: entry?.consented ?? false,
      updated_at: entry?.created_at ?? "",
    };
  });

  return { success: true, data: result };
}

// ─── updateConsent ────────────────────────────────────────────────────────────

export async function updateConsent(
  purpose: LgpdPurpose,
  consented: boolean
): Promise<PrivacyActionResult> {
  // "cadastro" consent is mandatory — cannot be revoked while account is active
  if (purpose === "cadastro" && !consented) {
    return {
      success: false,
      error:
        'O consentimento de "Cadastro e identificação" é obrigatório para uso do sistema. Para remoção de dados, utilize a opção "Excluir conta".',
    };
  }

  const user = await requireAuth();
  const admin = createAdminClient();
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const memberId = await getMemberId(admin, user.church_id, user.email!);
  if (!memberId) return { success: false, error: "Membro não encontrado." };

  // Insert new record to maintain immutable audit trail
  const { error } = await admin.from("consent_records").insert({
    member_id: memberId,
    purpose,
    consented,
    ip,
    terms_version: "1.0",
  });

  if (error)
    return { success: false, error: "Erro ao atualizar consentimento." };

  await logAudit({
    churchId: user.church_id,
    userId: user.id,
    action: "update_consent",
    entityType: "consent_records",
    entityId: memberId,
    metadata: { purpose, consented },
    ip,
  });

  return { success: true };
}

// ─── exportMyData ─────────────────────────────────────────────────────────────

export async function exportMyData(): Promise<ExportResult> {
  const user = await requireAuth();
  const admin = createAdminClient();
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const memberId = await getMemberId(admin, user.church_id, user.email!);
  if (!memberId) return { success: false, error: "Membro não encontrado." };

  // Fetch member row
  const { data: memberRow, error: memberError } = await admin
    .from("members")
    .select(
      "id, name, email, phone, role, avatar_url, address, birth_date, created_at, updated_at"
    )
    .eq("id", memberId)
    .single();

  if (memberError || !memberRow) {
    return { success: false, error: "Erro ao buscar dados do perfil." };
  }

  // Fetch all consent records
  const { data: consentsRows } = await admin
    .from("consent_records")
    .select("purpose, consented, created_at, terms_version")
    .eq("member_id", memberId)
    .order("created_at", { ascending: true });

  // Decrypt CPF for export (this is legitimate LGPD data portability)
  const { data: memberWithCpf } = await admin
    .from("members")
    .select("cpf")
    .eq("id", memberId)
    .single();

  let cpfDecrypted: string | null = null;
  if (memberWithCpf?.cpf) {
    try {
      cpfDecrypted = decrypt(memberWithCpf.cpf as string);
    } catch {
      cpfDecrypted = null;
    }
  }

  // Build JSON export
  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: {
      name: memberRow.name,
      email: memberRow.email,
      cpf: cpfDecrypted,
      phone: memberRow.phone,
      role: memberRow.role,
      avatar_url: memberRow.avatar_url,
      address: memberRow.address,
      birth_date: memberRow.birth_date,
      created_at: memberRow.created_at,
      updated_at: memberRow.updated_at,
    },
    consents: consentsRows ?? [],
  };

  const jsonStr = JSON.stringify(exportData, null, 2);

  // Build CSV export (consents history)
  const csvHeader = "finalidade,consentido,data,versao_termos";
  const csvRows = (consentsRows ?? []).map((r) =>
    [
      `"${r.purpose}"`,
      r.consented ? "sim" : "não",
      `"${r.created_at}"`,
      `"${r.terms_version ?? ""}"`,
    ].join(",")
  );
  const csvStr = [csvHeader, ...csvRows].join("\n");

  await logAudit({
    churchId: user.church_id,
    userId: user.id,
    action: "export_my_data",
    entityType: "member",
    entityId: memberId,
    ip,
  });

  return { success: true, json: jsonStr, csv: csvStr };
}

// ─── requestDeletion ──────────────────────────────────────────────────────────

export async function requestDeletion(): Promise<PrivacyActionResult> {
  const user = await requireAuth();
  const admin = createAdminClient();
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const memberId = await getMemberId(admin, user.church_id, user.email!);
  if (!memberId) return { success: false, error: "Membro não encontrado." };

  // Soft-delete: mark as inactive
  const { error } = await admin
    .from("members")
    .update({ is_active: false })
    .eq("id", memberId);

  if (error) return { success: false, error: "Erro ao processar solicitação." };

  await logAudit({
    churchId: user.church_id,
    userId: user.id,
    action: "request_deletion",
    entityType: "member",
    entityId: memberId,
    metadata: {
      note: "Soft-delete solicitado pelo próprio membro. Anonimização pendente de processamento manual.",
    },
    ip,
  });

  return { success: true };
}
