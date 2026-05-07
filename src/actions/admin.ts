"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/session";
import { z } from "zod";

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

// ─── Guard: apenas admin SaaS ─────────────────────────────────────────────────

async function requireAdmin(): Promise<{ error: string } | null> {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return { error: "Acesso negado. Apenas administradores do SaaS." };
  }
  return null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminStats {
  total_tenants: number;
  total_members: number;
  active_tenants: number;
  by_plan: { plan: string; count: number }[];
}

export interface AdminTribe {
  id: string;
  church_id: string;
  church_name: string;
  name: string;
  tribe_name: string | null;
  color: string | null;
}

export interface AdminBadge {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  created_at: string;
}

export interface ScoreConfigRow {
  action_type: string;
  points: number;
  label: string;
  description: string | null;
  updated_at: string;
}

// ─── getAdminStats ────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<ActionResult<AdminStats>> {
  const guard = await requireAdmin();
  if (guard) return { data: null, error: guard.error };

  const admin = createAdminClient();

  // Total de tenants
  const { count: totalTenants, error: tenantErr } = await admin
    .from("tenants")
    .select("id", { count: "exact", head: true });
  if (tenantErr) return { data: null, error: tenantErr.message };

  // Total de membros ativos
  const { count: totalMembers, error: memberErr } = await admin
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);
  if (memberErr) return { data: null, error: memberErr.message };

  // Tenants com pelo menos 1 membro ativo (aproximação de "ativo")
  const { data: activeTenantData, error: activeErr } = await admin
    .from("members")
    .select("church_id")
    .eq("is_active", true);
  if (activeErr) return { data: null, error: activeErr.message };

  const activeTenants = new Set(
    (activeTenantData ?? []).map((r: { church_id: string }) => r.church_id)
  ).size;

  // Breakdown por plano
  const { data: planData, error: planErr } = await admin
    .from("tenants")
    .select("plan");
  if (planErr) return { data: null, error: planErr.message };

  const planMap: Record<string, number> = {};
  for (const row of planData ?? []) {
    const plan = (row as { plan: string }).plan ?? "free";
    planMap[plan] = (planMap[plan] ?? 0) + 1;
  }
  const byPlan = Object.entries(planMap).map(([plan, count]) => ({
    plan,
    count,
  }));

  return {
    data: {
      total_tenants: totalTenants ?? 0,
      total_members: totalMembers ?? 0,
      active_tenants: activeTenants,
      by_plan: byPlan,
    },
    error: null,
  };
}

// ─── listAdminTribes ──────────────────────────────────────────────────────────

export async function listAdminTribes(): Promise<ActionResult<AdminTribe[]>> {
  const guard = await requireAdmin();
  if (guard) return { data: null, error: guard.error };

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("teams")
    .select(
      "id, church_id, name, tribe_name, color, tenants!teams_church_id_fkey(name)"
    )
    .order("name");

  if (error) return { data: null, error: error.message };

  const tribes: AdminTribe[] = (data ?? []).map(
    (row: {
      id: string;
      church_id: string;
      name: string;
      tribe_name: string | null;
      color: string | null;
      tenants: { name: string } | { name: string }[] | null;
    }) => ({
      id: row.id,
      church_id: row.church_id,
      church_name: Array.isArray(row.tenants)
        ? (row.tenants[0]?.name ?? "—")
        : (row.tenants?.name ?? "—"),
      name: row.name,
      tribe_name: row.tribe_name,
      color: row.color,
    })
  );

  return { data: tribes, error: null };
}

// ─── updateAdminTribe ─────────────────────────────────────────────────────────

const updateTribeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida (hex)")
    .optional(),
});

export async function updateAdminTribe(input: {
  id: string;
  name: string;
  color?: string;
}): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAdmin();
  if (guard) return { data: null, error: guard.error };

  const parsed = updateTribeSchema.safeParse(input);
  if (!parsed.success)
    return { data: null, error: parsed.error.issues[0].message };

  const admin = createAdminClient();
  const { error } = await admin
    .from("teams")
    .update({ name: parsed.data.name, color: parsed.data.color ?? null })
    .eq("id", parsed.data.id);

  if (error) return { data: null, error: error.message };
  return { data: { id: parsed.data.id }, error: null };
}

// ─── listAdminBadges ──────────────────────────────────────────────────────────

export async function listAdminBadges(): Promise<ActionResult<AdminBadge[]>> {
  const guard = await requireAdmin();
  if (guard) return { data: null, error: guard.error };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("badges")
    .select(
      "id, name, description, icon, trigger_type, trigger_config, created_at"
    )
    .order("name");

  if (error) return { data: null, error: error.message };
  return { data: (data ?? []) as AdminBadge[], error: null };
}

// ─── createAdminBadge ─────────────────────────────────────────────────────────

const badgeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(200).optional(),
  trigger_type: z.enum([
    "first_checkin",
    "invite_count",
    "streak",
    "tenure",
    "manual",
  ]),
  trigger_config: z.record(z.string(), z.unknown()).default({}),
});

export async function createAdminBadge(
  input: z.input<typeof badgeSchema>
): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAdmin();
  if (guard) return { data: null, error: guard.error };

  const parsed = badgeSchema.safeParse(input);
  if (!parsed.success)
    return { data: null, error: parsed.error.issues[0].message };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("badges")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: { id: (data as { id: string }).id }, error: null };
}

// ─── updateAdminBadge ─────────────────────────────────────────────────────────

export async function updateAdminBadge(
  id: string,
  input: z.input<typeof badgeSchema>
): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAdmin();
  if (guard) return { data: null, error: guard.error };

  const parsed = badgeSchema.safeParse(input);
  if (!parsed.success)
    return { data: null, error: parsed.error.issues[0].message };

  const admin = createAdminClient();
  const { error } = await admin.from("badges").update(parsed.data).eq("id", id);

  if (error) return { data: null, error: error.message };
  return { data: { id }, error: null };
}

// ─── deleteAdminBadge ─────────────────────────────────────────────────────────

export async function deleteAdminBadge(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAdmin();
  if (guard) return { data: null, error: guard.error };

  const admin = createAdminClient();
  const { error } = await admin.from("badges").delete().eq("id", id);

  if (error) return { data: null, error: error.message };
  return { data: { id }, error: null };
}

// ─── getScoreConfig ───────────────────────────────────────────────────────────

export async function getScoreConfig(): Promise<
  ActionResult<ScoreConfigRow[]>
> {
  const guard = await requireAdmin();
  if (guard) return { data: null, error: guard.error };

  // Usa client normal — score_config tem RLS SELECT para todos autenticados
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("score_config")
    .select("action_type, points, label, description, updated_at")
    .order("action_type");

  if (error) return { data: null, error: error.message };
  return { data: (data ?? []) as ScoreConfigRow[], error: null };
}

// ─── listAdminTenants ─────────────────────────────────────────────────────────

export interface AdminTenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  created_at: string;
}

export async function listAdminTenants(): Promise<ActionResult<AdminTenant[]>> {
  const guard = await requireAdmin();
  if (guard) return { data: null, error: guard.error };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tenants")
    .select("id, name, slug, plan, created_at")
    .order("name");

  if (error) return { data: null, error: error.message };
  return { data: (data ?? []) as AdminTenant[], error: null };
}

// ─── getTenantFeatureOverrides ────────────────────────────────────────────────

export interface TenantFeatureOverride {
  feature_key: string;
  enabled: boolean;
}

export async function getTenantFeatureOverrides(
  tenantId: string
): Promise<ActionResult<TenantFeatureOverride[]>> {
  const guard = await requireAdmin();
  if (guard) return { data: null, error: guard.error };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tenant_feature_overrides")
    .select("feature_key, enabled")
    .eq("tenant_id", tenantId);

  if (error) return { data: null, error: error.message };
  return { data: (data ?? []) as TenantFeatureOverride[], error: null };
}

// ─── setTenantFeatureOverride ─────────────────────────────────────────────────

const featureOverrideSchema = z.object({
  tenant_id: z.string().uuid(),
  feature_key: z.string().min(1).max(100),
  enabled: z.boolean(),
});

export async function setTenantFeatureOverride(input: {
  tenant_id: string;
  feature_key: string;
  enabled: boolean;
}): Promise<ActionResult<{ feature_key: string }>> {
  const guard = await requireAdmin();
  if (guard) return { data: null, error: guard.error };

  const parsed = featureOverrideSchema.safeParse(input);
  if (!parsed.success)
    return { data: null, error: parsed.error.issues[0].message };

  const admin = createAdminClient();
  const { error } = await admin.from("tenant_feature_overrides").upsert(
    {
      tenant_id: parsed.data.tenant_id,
      feature_key: parsed.data.feature_key,
      enabled: parsed.data.enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id,feature_key" }
  );

  if (error) return { data: null, error: error.message };
  return { data: { feature_key: parsed.data.feature_key }, error: null };
}

// ─── removeTenantFeatureOverride ──────────────────────────────────────────────

export async function removeTenantFeatureOverride(input: {
  tenant_id: string;
  feature_key: string;
}): Promise<ActionResult<{ feature_key: string }>> {
  const guard = await requireAdmin();
  if (guard) return { data: null, error: guard.error };

  const parsed = z
    .object({ tenant_id: z.string().uuid(), feature_key: z.string().min(1) })
    .safeParse(input);
  if (!parsed.success)
    return { data: null, error: parsed.error.issues[0].message };

  const admin = createAdminClient();
  const { error } = await admin
    .from("tenant_feature_overrides")
    .delete()
    .eq("tenant_id", parsed.data.tenant_id)
    .eq("feature_key", parsed.data.feature_key);

  if (error) return { data: null, error: error.message };
  return { data: { feature_key: parsed.data.feature_key }, error: null };
}

// ─── updateScoreConfig ────────────────────────────────────────────────────────

const scoreUpdateSchema = z.object({
  action_type: z.string(),
  points: z.number().int().min(0).max(10000),
});

export async function updateScoreConfig(
  input: z.input<typeof scoreUpdateSchema>
): Promise<ActionResult<{ action_type: string; points: number }>> {
  const guard = await requireAdmin();
  if (guard) return { data: null, error: guard.error };

  const parsed = scoreUpdateSchema.safeParse(input);
  if (!parsed.success)
    return { data: null, error: parsed.error.issues[0].message };

  const admin = createAdminClient();
  const { error } = await admin
    .from("score_config")
    .update({
      points: parsed.data.points,
      updated_at: new Date().toISOString(),
    })
    .eq("action_type", parsed.data.action_type);

  if (error) return { data: null, error: error.message };
  return {
    data: { action_type: parsed.data.action_type, points: parsed.data.points },
    error: null,
  };
}
