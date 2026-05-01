"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { withPermission } from "@/lib/auth/with-permission";
import { logAudit } from "@/actions/audit";
import type { AuthUser } from "@/lib/auth/session";
import {
  createCongregationSchema,
  toggleSharedFinancesSchema,
  type CreateCongregationInput,
  type ToggleSharedFinancesInput,
  type CongregationRow,
} from "@/lib/validators/congregacoes";

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  admin: ReturnType<typeof createAdminClient>,
  base: string
): Promise<string> {
  const slug = slugify(base);
  let attempt = 0;
  while (true) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt}`;
    const { data } = await admin
      .from("tenants")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
    attempt++;
  }
}

function randomCode(length = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/** Verifica se o usuário é pastor de uma Igreja Matriz (sem parent_tenant_id). */
function assertMatrixPastor(user: AuthUser): string | null {
  if (user.role !== "pastor" && user.role !== "admin") {
    return "Apenas o pastor da Igreja Matriz pode gerenciar congregações.";
  }
  if (user.parent_tenant_id !== null) {
    return "Esta ação só está disponível para a Igreja Matriz.";
  }
  return null;
}

// ─── listCongregations ────────────────────────────────────────────────────────

export const listCongregations = withPermission(
  async (user: AuthUser): Promise<ActionResult<CongregationRow[]>> => {
    const err = assertMatrixPastor(user);
    if (err) return { data: null, error: err };

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("tenants")
      .select(
        "id, name, slug, denomination, phone, shared_finances, is_active, created_at"
      )
      .eq("parent_tenant_id", user.church_id)
      .order("name");

    if (error) return { data: null, error: error.message };

    const rows: CongregationRow[] = await Promise.all(
      (data ?? []).map(async (t) => {
        // Count active members
        const { count: memberCount } = await admin
          .from("members")
          .select("id", { count: "exact", head: true })
          .eq("church_id", t.id)
          .eq("is_active", true);

        // Find congregation_pastor invite
        const { data: invite } = await admin
          .from("invite_links")
          .select("code")
          .eq("church_id", t.id)
          .eq("invite_type", "congregation_pastor")
          .eq("active", true)
          .maybeSingle();

        return {
          id: t.id,
          name: t.name,
          slug: t.slug,
          denomination: t.denomination ?? null,
          phone: t.phone ?? null,
          shared_finances: t.shared_finances ?? false,
          is_active: t.is_active ?? true,
          member_count: memberCount ?? 0,
          invite_code: invite?.code ?? null,
          created_at: t.created_at,
        };
      })
    );

    return { data: rows, error: null };
  },
  { minRole: "pastor", module: "configuracoes" }
);

// ─── createCongregation ───────────────────────────────────────────────────────

export const createCongregation = withPermission(
  async (
    user: AuthUser,
    input: CreateCongregationInput
  ): Promise<ActionResult<{ id: string; invite_code: string }>> => {
    const err = assertMatrixPastor(user);
    if (err) return { data: null, error: err };

    const parsed = createCongregationSchema.safeParse(input);
    if (!parsed.success)
      return { data: null, error: parsed.error.issues[0].message };

    const { name, denomination, phone, address_text } = parsed.data;

    const headerStore = await headers();
    const ip =
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    const admin = createAdminClient();

    // Create child tenant
    const slug = await uniqueSlug(admin, name);

    const { data: tenant, error: tenantError } = await admin
      .from("tenants")
      .insert({
        name,
        slug,
        denomination: denomination || null,
        phone: phone || null,
        address_text: address_text || null,
        plan: "gratuito",
        shared_finances: false,
        parent_tenant_id: user.church_id,
        is_active: true,
      })
      .select("id")
      .single();

    if (tenantError || !tenant)
      return {
        data: null,
        error: "Erro ao criar congregação. Tente novamente.",
      };

    // Generate congregation_pastor invite link
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

    await admin.from("invite_links").insert({
      church_id: tenant.id,
      member_id: null,
      code,
      active: true,
      invite_type: "congregation_pastor",
    });

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "create_congregation",
      entityType: "tenant",
      entityId: tenant.id,
      metadata: { name, slug, parent_tenant_id: user.church_id },
      ip,
    });

    return { data: { id: tenant.id, invite_code: code }, error: null };
  },
  { minRole: "pastor", module: "configuracoes" }
);

// ─── toggleSharedFinances ─────────────────────────────────────────────────────

export const toggleSharedFinances = withPermission(
  async (
    user: AuthUser,
    input: ToggleSharedFinancesInput
  ): Promise<ActionResult<null>> => {
    const err = assertMatrixPastor(user);
    if (err) return { data: null, error: err };

    const parsed = toggleSharedFinancesSchema.safeParse(input);
    if (!parsed.success)
      return { data: null, error: parsed.error.issues[0].message };

    const headerStore = await headers();
    const ip =
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    const admin = createAdminClient();

    // Verify congregation belongs to this matrix
    const { data: child } = await admin
      .from("tenants")
      .select("id")
      .eq("id", parsed.data.congregation_id)
      .eq("parent_tenant_id", user.church_id)
      .maybeSingle();

    if (!child) return { data: null, error: "Congregação não encontrada." };

    const { error } = await admin
      .from("tenants")
      .update({ shared_finances: parsed.data.shared_finances })
      .eq("id", parsed.data.congregation_id);

    if (error) return { data: null, error: error.message };

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "toggle_shared_finances",
      entityType: "tenant",
      entityId: parsed.data.congregation_id,
      metadata: { shared_finances: parsed.data.shared_finances },
      ip,
    });

    return { data: null, error: null };
  },
  { minRole: "pastor", module: "configuracoes" }
);

// ─── deactivateCongregation ───────────────────────────────────────────────────

export const deactivateCongregation = withPermission(
  async (
    user: AuthUser,
    congregationId: string
  ): Promise<ActionResult<null>> => {
    const err = assertMatrixPastor(user);
    if (err) return { data: null, error: err };

    const headerStore = await headers();
    const ip =
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    const admin = createAdminClient();

    const { data: child } = await admin
      .from("tenants")
      .select("id, name")
      .eq("id", congregationId)
      .eq("parent_tenant_id", user.church_id)
      .maybeSingle();

    if (!child) return { data: null, error: "Congregação não encontrada." };

    const { error } = await admin
      .from("tenants")
      .update({ is_active: false })
      .eq("id", congregationId);

    if (error) return { data: null, error: error.message };

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "deactivate_congregation",
      entityType: "tenant",
      entityId: congregationId,
      metadata: { name: child.name },
      ip,
    });

    return { data: null, error: null };
  },
  { minRole: "pastor", module: "configuracoes" }
);

// ─── regenerateCongregationInvite ─────────────────────────────────────────────

export const regenerateCongregationInvite = withPermission(
  async (
    user: AuthUser,
    congregationId: string
  ): Promise<ActionResult<{ code: string }>> => {
    const err = assertMatrixPastor(user);
    if (err) return { data: null, error: err };

    const admin = createAdminClient();

    const { data: child } = await admin
      .from("tenants")
      .select("id")
      .eq("id", congregationId)
      .eq("parent_tenant_id", user.church_id)
      .maybeSingle();

    if (!child) return { data: null, error: "Congregação não encontrada." };

    // Revoke existing congregation_pastor invite
    await admin
      .from("invite_links")
      .update({ active: false })
      .eq("church_id", congregationId)
      .eq("invite_type", "congregation_pastor");

    // Generate new one
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
      church_id: congregationId,
      member_id: null,
      code,
      active: true,
      invite_type: "congregation_pastor",
    });

    if (error) return { data: null, error: error.message };

    return { data: { code }, error: null };
  },
  { minRole: "pastor", module: "configuracoes" }
);
