"use server";

import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/with-permission";
import { logAudit } from "@/actions/audit";
import { encrypt, decrypt } from "@/lib/encryption/aes";
import {
  createMemberSchema,
  updateMemberSchema,
  addFamilyLinkSchema,
  listMembersSchema,
  updateMemberRoleSchema,
  updateMemberTagsSchema,
  type CreateMemberInput,
  type UpdateMemberInput,
  type AddFamilyLinkInput,
  type ListMembersInput,
  type UpdateMemberRoleInput,
  type UpdateMemberTagsInput,
} from "@/lib/validators/members";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AuthUser } from "@/lib/auth/session";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MemberRow {
  id: string;
  church_id: string;
  home_church_id: string | null;
  name: string;
  cpf: string | null;
  rg: string | null;
  email: string | null;
  birth_date: string | null;
  gender: "M" | "F" | null;
  role: string;
  phone: string | null;
  avatar_url: string | null;
  invited_by: string | null;
  is_active: boolean;
  received_at: string | null;
  baptized_at: string | null;
  address: Record<string, string> | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface MemberWithLinks extends MemberRow {
  family_links: {
    id: string;
    related_member_id: string;
    relationship: string;
    related_member: {
      id: string;
      name: string;
      avatar_url: string | null;
      role: string;
    };
  }[];
}

export interface FamilyGroup {
  familyId: string; // canonical ID (lowest UUID in group)
  members: MemberRow[];
}

export interface ListMembersResult {
  individuals: MemberRow[];
  families: FamilyGroup[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sanitizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

/** Remove CPF/RG do objeto antes de retornar ao cliente — descriptografa para display apenas em getById */
function stripSensitive(member: MemberRow): MemberRow {
  return { ...member, cpf: member.cpf ? "***.***.***-**" : null, rg: null };
}

// ─── Server Actions ───────────────────────────────────────────────────────────

/**
 * Lista membros do tenant com busca, filtros e paginação.
 * Retorna dados agrupados por família + individuais.
 */
export const listMembers = withPermission(
  async (
    user: AuthUser,
    input: ListMembersInput
  ): Promise<ActionResult<ListMembersResult>> => {
    const parsed = listMembersSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const { search, role, status, page, pageSize, church_id_filter } =
      parsed.data;

    // Cross-congregation: validate that the target church is a child of the user's church
    let effectiveChurchId = user.church_id;
    if (church_id_filter && church_id_filter !== user.church_id) {
      const leadershipRoles = [
        "admin",
        "pastor",
        "presbítero",
        "diácono",
        "líder",
      ];
      if (!leadershipRoles.includes(user.role)) {
        return {
          data: null,
          error: "Sem permissão para ver esta congregação.",
        };
      }
      if (user.parent_tenant_id !== null) {
        return {
          data: null,
          error: "Esta funcionalidade é exclusiva da Igreja Matriz.",
        };
      }
      const adminClient = createAdminClient();
      const { data: childTenant } = await adminClient
        .from("tenants")
        .select("id")
        .eq("id", church_id_filter)
        .eq("parent_tenant_id", user.church_id)
        .eq("is_active", true)
        .maybeSingle();
      if (!childTenant) {
        return { data: null, error: "Congregação não encontrada." };
      }
      effectiveChurchId = church_id_filter;
    }

    const supabase = await createClient();

    let query = supabase
      .from("members")
      .select("*", { count: "exact" })
      .eq("church_id", effectiveChurchId)
      .order("name");

    if (status === "active") query = query.eq("is_active", true);
    if (status === "inactive") query = query.eq("is_active", false);
    if (role !== "all") query = query.eq("role", role);
    if (search && search.trim().length > 0) {
      query = query.ilike("name", `%${search.trim()}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return { data: null, error: `Erro ao listar membros: ${error.message}` };
    }

    const members = (data ?? []) as MemberRow[];
    const total = count ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    // Build family groups using family_links
    const memberIds = members.map((m) => m.id);

    let links: { member_id: string; related_member_id: string }[] = [];
    if (memberIds.length > 0) {
      const { data: linksData } = await supabase
        .from("family_links")
        .select("member_id, related_member_id")
        .eq("church_id", effectiveChurchId)
        .in("member_id", memberIds);
      links = linksData ?? [];
    }

    // Union-Find grouping
    const parent: Record<string, string> = {};
    const find = (x: string): string => {
      if (!parent[x]) return x;
      parent[x] = find(parent[x]);
      return parent[x];
    };
    const union = (a: string, b: string) => {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) {
        if (ra < rb) parent[rb] = ra;
        else parent[ra] = rb;
      }
    };

    for (const link of links) {
      union(link.member_id, link.related_member_id);
    }

    const grouped: Record<string, MemberRow[]> = {};
    for (const member of members) {
      const root = find(member.id);
      if (!grouped[root]) grouped[root] = [];
      grouped[root].push(stripSensitive(member));
    }

    const families: FamilyGroup[] = [];
    const individuals: MemberRow[] = [];

    for (const [familyId, grpMembers] of Object.entries(grouped)) {
      if (grpMembers.length === 1) {
        individuals.push(grpMembers[0]);
      } else {
        families.push({ familyId, members: grpMembers });
      }
    }

    return {
      data: { individuals, families, total, page, pageSize, totalPages },
      error: null,
    };
  },
  { module: "membros", minRole: "líder" }
);

/**
 * Busca um membro pelo ID com vínculos familiares.
 * CPF/RG são descriptografados apenas aqui para liderança.
 */
export const getMemberById = withPermission(
  async (
    user: AuthUser,
    memberId: string
  ): Promise<ActionResult<MemberWithLinks>> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("members")
      .select(
        `
        *,
        family_links!family_links_member_id_fkey (
          id,
          related_member_id,
          relationship,
          related_member:members!family_links_related_member_id_fkey (
            id, name, avatar_url, role
          )
        )
      `
      )
      .eq("id", memberId)
      .eq("church_id", user.church_id)
      .single();

    if (error || !data) {
      return { data: null, error: "Membro não encontrado." };
    }

    // Decrypt sensitive fields for leadership
    const member = data as MemberWithLinks;
    if (member.cpf) {
      try {
        member.cpf = decrypt(member.cpf);
      } catch {
        member.cpf = "***.***.***-**";
      }
    }
    if (member.rg) {
      try {
        member.rg = decrypt(member.rg);
      } catch {
        member.rg = null;
      }
    }

    return { data: member, error: null };
  },
  { module: "membros", minRole: "líder" }
);

/**
 * Cria um novo membro manualmente (liderança).
 */
export const createMember = withPermission(
  async (
    user: AuthUser,
    input: CreateMemberInput
  ): Promise<ActionResult<{ id: string }>> => {
    const parsed = createMemberSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const { cpf, rg, ...rest } = parsed.data;
    const supabase = await createClient();

    const encryptedCpf = encrypt(sanitizeCpf(cpf));
    const encryptedRg = rg ? encrypt(rg) : null;

    const { data, error } = await supabase
      .from("members")
      .insert({
        ...rest,
        church_id: user.church_id,
        cpf: encryptedCpf,
        rg: encryptedRg,
        email: rest.email || null,
        birth_date: rest.birth_date || null,
        received_at: rest.received_at || null,
        baptized_at: rest.baptized_at || null,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return {
          data: null,
          error: "Já existe um membro com este CPF nesta igreja.",
        };
      }
      return { data: null, error: `Erro ao criar membro: ${error.message}` };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "member_created",
      entityType: "member",
      entityId: data.id,
      metadata: { name: parsed.data.name, role: parsed.data.role },
    });

    return { data: { id: data.id }, error: null };
  },
  { module: "membros", minRole: "líder" }
);

/**
 * Atualiza dados de um membro.
 */
export const updateMember = withPermission(
  async (
    user: AuthUser,
    memberId: string,
    input: UpdateMemberInput
  ): Promise<ActionResult<{ id: string }>> => {
    const parsed = updateMemberSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const { cpf, rg, ...rest } = parsed.data;
    const updates: Record<string, unknown> = { ...rest };

    if (cpf) updates.cpf = encrypt(sanitizeCpf(cpf));
    if (rg) updates.rg = encrypt(rg);
    if (rg === "") updates.rg = null;

    const supabase = await createClient();

    const { error } = await supabase
      .from("members")
      .update(updates)
      .eq("id", memberId)
      .eq("church_id", user.church_id);

    if (error) {
      return {
        data: null,
        error: `Erro ao atualizar membro: ${error.message}`,
      };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "member_updated",
      entityType: "member",
      entityId: memberId,
      metadata: { fields: Object.keys(updates) },
    });

    return { data: { id: memberId }, error: null };
  },
  { module: "membros", minRole: "líder" }
);

/**
 * Soft-delete de membro (is_active = false).
 */
export const deleteMember = withPermission(
  async (
    user: AuthUser,
    memberId: string
  ): Promise<ActionResult<{ id: string }>> => {
    const supabase = await createClient();

    const { error } = await supabase
      .from("members")
      .update({ is_active: false })
      .eq("id", memberId)
      .eq("church_id", user.church_id);

    if (error) {
      return { data: null, error: `Erro ao inativar membro: ${error.message}` };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "member_deactivated",
      entityType: "member",
      entityId: memberId,
    });

    return { data: { id: memberId }, error: null };
  },
  { module: "membros", minRole: "diácono" }
);

/**
 * Adiciona vínculo familiar bidirecional.
 * O trigger do banco já cria o lado inverso automaticamente.
 */
export const addFamilyLink = withPermission(
  async (
    user: AuthUser,
    input: AddFamilyLinkInput
  ): Promise<ActionResult<{ id: string }>> => {
    const parsed = addFamilyLinkSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const { memberId, relatedMemberId, relationship } = parsed.data;

    if (memberId === relatedMemberId) {
      return {
        data: null,
        error: "Um membro não pode ser vinculado a si mesmo.",
      };
    }

    const supabase = await createClient();

    // Verify both members belong to the same church
    const { data: verifyData, error: verifyError } = await supabase
      .from("members")
      .select("id")
      .eq("church_id", user.church_id)
      .in("id", [memberId, relatedMemberId]);

    if (verifyError || !verifyData || verifyData.length < 2) {
      return {
        data: null,
        error: "Um ou ambos os membros não foram encontrados nesta igreja.",
      };
    }

    const { data, error } = await supabase
      .from("family_links")
      .insert({
        church_id: user.church_id,
        member_id: memberId,
        related_member_id: relatedMemberId,
        relationship,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { data: null, error: "Vínculo já existe entre estes membros." };
      }
      return {
        data: null,
        error: `Erro ao adicionar vínculo: ${error.message}`,
      };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "family_link_added",
      entityType: "family_link",
      entityId: data.id,
      metadata: { memberId, relatedMemberId, relationship },
    });

    return { data: { id: data.id }, error: null };
  },
  { module: "membros", minRole: "líder" }
);

/**
 * Altera o papel (role) de um membro. Apenas pastor ou admin podem executar.
 * Atualiza o JWT custom claims via admin client para efeito imediato.
 */
export const updateMemberRole = withPermission(
  async (
    user: AuthUser,
    input: UpdateMemberRoleInput
  ): Promise<ActionResult<{ id: string }>> => {
    const parsed = updateMemberRoleSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const { memberId, newRole } = parsed.data;
    const supabase = await createClient();

    // Busca role atual e email para poder atualizar o JWT
    const { data: current, error: fetchError } = await supabase
      .from("members")
      .select("role, email")
      .eq("id", memberId)
      .eq("church_id", user.church_id)
      .single();

    if (fetchError || !current) {
      return { data: null, error: "Membro não encontrado." };
    }

    const oldRole = current.role as string;
    if (oldRole === newRole) {
      return { data: { id: memberId }, error: null };
    }

    // Atualiza role na tabela members
    const { error } = await supabase
      .from("members")
      .update({ role: newRole })
      .eq("id", memberId)
      .eq("church_id", user.church_id);

    if (error) {
      return { data: null, error: `Erro ao alterar papel: ${error.message}` };
    }

    // Atualiza JWT claims se o membro possuir conta auth (via email)
    if (current.email) {
      try {
        const admin = createAdminClient();
        const {
          data: { users },
        } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const authUser = users.find((u) => u.email === current.email);
        if (authUser) {
          await admin.auth.admin.updateUserById(authUser.id, {
            app_metadata: { church_id: user.church_id, role: newRole },
          });
        }
      } catch {
        // Falha silenciosa — role já foi salvo no DB; JWT será atualizado no próximo login
      }
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "member_role_changed",
      entityType: "member",
      entityId: memberId,
      metadata: { oldRole, newRole },
    });

    return { data: { id: memberId }, error: null };
  },
  { module: "membros", minRole: "pastor" }
);

/**
 * Remove vínculo familiar (ambas as direções).
 */
export const removeFamilyLink = withPermission(
  async (
    user: AuthUser,
    memberId: string,
    relatedMemberId: string
  ): Promise<ActionResult<{ removed: number }>> => {
    const supabase = await createClient();

    const { error, count } = await supabase
      .from("family_links")
      .delete({ count: "exact" })
      .eq("church_id", user.church_id)
      .or(
        `and(member_id.eq.${memberId},related_member_id.eq.${relatedMemberId}),` +
          `and(member_id.eq.${relatedMemberId},related_member_id.eq.${memberId})`
      );

    if (error) {
      return { data: null, error: `Erro ao remover vínculo: ${error.message}` };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "family_link_removed",
      entityType: "family_link",
      metadata: { memberId, relatedMemberId },
    });

    return { data: { removed: count ?? 0 }, error: null };
  },
  { module: "membros", minRole: "líder" }
);

/**
 * Atualiza as tags de atribuição de um membro.
 * Apenas liderança pode definir tags. Máximo de 3 tags por membro.
 */
export const updateMemberTags = withPermission(
  async (
    user: AuthUser,
    input: UpdateMemberTagsInput
  ): Promise<ActionResult<{ id: string; tags: string[] }>> => {
    const parsed = updateMemberTagsSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const { memberId, tags } = parsed.data;
    const supabase = await createClient();

    // Garante que o membro pertence ao mesmo tenant
    const { data: existing, error: fetchError } = await supabase
      .from("members")
      .select("id")
      .eq("id", memberId)
      .eq("church_id", user.church_id)
      .maybeSingle();

    if (fetchError || !existing) {
      return { data: null, error: "Membro não encontrado." };
    }

    const { error } = await supabase
      .from("members")
      .update({ tags })
      .eq("id", memberId)
      .eq("church_id", user.church_id);

    if (error) {
      return { data: null, error: `Erro ao atualizar tags: ${error.message}` };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "member_tags_updated",
      entityType: "member",
      entityId: memberId,
      metadata: { tags },
    });

    return { data: { id: memberId, tags }, error: null };
  },
  { module: "membros", minRole: "presbítero" }
);
