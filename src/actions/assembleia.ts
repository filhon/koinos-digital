"use server";

import { createHash, randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withPermission } from "@/lib/auth/with-permission";
import { logAudit } from "@/actions/audit";
import { sendEmail } from "@/lib/email";
import type { AuthUser } from "@/lib/auth/session";
import {
  createAssemblySchema,
  updateAssemblySchema,
  listAssembliesSchema,
  createElectionSchema,
  updateElectionSchema,
  addCandidateSchema,
  removeCandidateSchema,
  castVoteSchema,
  requestVoteCodeSchema,
  type CreateAssemblyInput,
  type UpdateAssemblyInput,
  type ListAssembliesInput,
  type CreateElectionInput,
  type UpdateElectionInput,
  type AddCandidateInput,
  type RemoveCandidateInput,
  type CastVoteInput,
  type RequestVoteCodeInput,
  type AssemblyRow,
  type ElectionRow,
  type CandidateRow,
  type ElectionResults,
} from "@/lib/validators/assembleia";

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Gera voter_hash usando admin client para ler o salt. */
async function computeVoterHash(
  memberId: string,
  electionId: string,
  adminClient: ReturnType<typeof createAdminClient>
): Promise<string | null> {
  const { data: saltRow } = await adminClient
    .from("election_salts")
    .select("salt")
    .eq("election_id", electionId)
    .single();

  if (!saltRow) return null;

  return createHash("sha256")
    .update(`${memberId}${electionId}${saltRow.salt}`)
    .digest("hex");
}

/** Gera OTP de 6 dígitos. */
function generateVoteCode(): string {
  return String(
    Math.floor(100000 + (randomBytes(3).readUIntBE(0, 3) % 900000))
  );
}

// ─── Assemblies ───────────────────────────────────────────────────────────────

export const listAssemblies = withPermission(
  async (
    user: AuthUser,
    input?: Partial<ListAssembliesInput>
  ): Promise<ActionResult<AssemblyRow[]>> => {
    const parsed = listAssembliesSchema.safeParse(input ?? {});
    if (!parsed.success)
      return {
        data: null,
        error: parsed.error.issues[0]?.message ?? "Erro de validação",
      };

    const { page, limit } = parsed.data;
    const offset = (page - 1) * limit;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("assemblies")
      .select("*")
      .eq("church_id", user.church_id)
      .eq("is_active", true)
      .order("date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return { data: null, error: error.message };
    return { data: data as AssemblyRow[], error: null };
  },
  { module: "assembleia", minRole: "visitante" }
);

export const getAssemblyById = withPermission(
  async (user: AuthUser, id: string): Promise<ActionResult<AssemblyRow>> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("assemblies")
      .select("*")
      .eq("id", id)
      .eq("church_id", user.church_id)
      .eq("is_active", true)
      .single();

    if (error || !data)
      return { data: null, error: "Assembléia não encontrada." };
    return { data: data as AssemblyRow, error: null };
  },
  { module: "assembleia", minRole: "visitante" }
);

export const createAssembly = withPermission(
  async (
    user: AuthUser,
    input: CreateAssemblyInput
  ): Promise<ActionResult<AssemblyRow>> => {
    const parsed = createAssemblySchema.safeParse(input);
    if (!parsed.success)
      return {
        data: null,
        error: parsed.error.issues[0]?.message ?? "Erro de validação",
      };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("assemblies")
      .insert({ ...parsed.data, church_id: user.church_id })
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "create_assembly",
      entityType: "assembly",
      entityId: data.id,
      metadata: { name: parsed.data.name, date: parsed.data.date },
    });

    return { data: data as AssemblyRow, error: null };
  },
  { module: "assembleia", minRole: "pastor" }
);

export const updateAssembly = withPermission(
  async (
    user: AuthUser,
    input: UpdateAssemblyInput
  ): Promise<ActionResult<AssemblyRow>> => {
    const parsed = updateAssemblySchema.safeParse(input);
    if (!parsed.success)
      return {
        data: null,
        error: parsed.error.issues[0]?.message ?? "Erro de validação",
      };

    const { id, ...rest } = parsed.data;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("assemblies")
      .update(rest)
      .eq("id", id)
      .eq("church_id", user.church_id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "update_assembly",
      entityType: "assembly",
      entityId: id,
    });

    return { data: data as AssemblyRow, error: null };
  },
  { module: "assembleia", minRole: "pastor" }
);

export const deleteAssembly = withPermission(
  async (user: AuthUser, id: string): Promise<ActionResult<void>> => {
    const supabase = await createClient();

    // Verificar se há eleições abertas
    const { data: openElections } = await supabase
      .from("elections")
      .select("id")
      .eq("assembly_id", id)
      .eq("status", "aberta");

    if (openElections && openElections.length > 0) {
      return {
        data: null,
        error:
          "Não é possível excluir uma assembléia com eleições em andamento.",
      };
    }

    const { error } = await supabase
      .from("assemblies")
      .update({ is_active: false })
      .eq("id", id)
      .eq("church_id", user.church_id);

    if (error) return { data: null, error: error.message };

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "delete_assembly",
      entityType: "assembly",
      entityId: id,
    });

    return { data: undefined, error: null };
  },
  { module: "assembleia", minRole: "pastor" }
);

// ─── Elections ────────────────────────────────────────────────────────────────

export const listElectionsByAssembly = withPermission(
  async (
    user: AuthUser,
    assemblyId: string
  ): Promise<ActionResult<ElectionRow[]>> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("elections")
      .select(
        `
        *,
        election_candidates(
          id, member_id, position, created_at,
          members(name, avatar_url)
        )
      `
      )
      .eq("assembly_id", assemblyId)
      .eq("church_id", user.church_id)
      .order("created_at", { ascending: true });

    if (error) return { data: null, error: error.message };

    const rows = (data ?? []).map((e) => ({
      ...e,
      candidates: (e.election_candidates ?? []).map(
        (c: Record<string, unknown>) => ({
          id: c.id,
          election_id: e.id,
          member_id: c.member_id,
          position: c.position,
          created_at: c.created_at,
          member_name: (c.members as Record<string, string>)?.name,
          member_avatar:
            (c.members as Record<string, string>)?.avatar_url ?? null,
        })
      ),
    }));

    return { data: rows as ElectionRow[], error: null };
  },
  { module: "assembleia", minRole: "visitante" }
);

export const getElectionById = withPermission(
  async (
    user: AuthUser,
    electionId: string
  ): Promise<ActionResult<ElectionRow>> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("elections")
      .select(
        `
        *,
        election_candidates(
          id, member_id, position, created_at,
          members(name, avatar_url)
        )
      `
      )
      .eq("id", electionId)
      .eq("church_id", user.church_id)
      .single();

    if (error || !data) return { data: null, error: "Eleição não encontrada." };

    const row = {
      ...data,
      candidates: (data.election_candidates ?? []).map(
        (c: Record<string, unknown>) => ({
          id: c.id,
          election_id: data.id,
          member_id: c.member_id,
          position: c.position,
          created_at: c.created_at,
          member_name: (c.members as Record<string, string>)?.name,
          member_avatar:
            (c.members as Record<string, string>)?.avatar_url ?? null,
        })
      ),
    };

    return { data: row as ElectionRow, error: null };
  },
  { module: "assembleia", minRole: "visitante" }
);

export const createElection = withPermission(
  async (
    user: AuthUser,
    input: CreateElectionInput
  ): Promise<ActionResult<ElectionRow>> => {
    const parsed = createElectionSchema.safeParse(input);
    if (!parsed.success)
      return {
        data: null,
        error: parsed.error.issues[0]?.message ?? "Erro de validação",
      };

    // Verificar assembly pertence ao church
    const supabase = await createClient();
    const { data: assembly } = await supabase
      .from("assemblies")
      .select("id, has_election")
      .eq("id", parsed.data.assembly_id)
      .eq("church_id", user.church_id)
      .single();

    if (!assembly) return { data: null, error: "Assembléia não encontrada." };

    const { data, error } = await supabase
      .from("elections")
      .insert({
        ...parsed.data,
        church_id: user.church_id,
        quorum: parsed.data.quorum ?? null,
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    // Gera e salva o salt (via admin client, sem RLS)
    const adminClient = createAdminClient();
    const salt = randomBytes(32).toString("hex");
    await adminClient
      .from("election_salts")
      .insert({ election_id: data.id, salt });

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "create_election",
      entityType: "election",
      entityId: data.id,
      metadata: { name: parsed.data.name, type: parsed.data.type },
    });

    return { data: data as ElectionRow, error: null };
  },
  { module: "assembleia", minRole: "presbítero" }
);

export const updateElection = withPermission(
  async (
    user: AuthUser,
    input: UpdateElectionInput
  ): Promise<ActionResult<ElectionRow>> => {
    const parsed = updateElectionSchema.safeParse(input);
    if (!parsed.success)
      return {
        data: null,
        error: parsed.error.issues[0]?.message ?? "Erro de validação",
      };

    const { id, ...rest } = parsed.data;
    const supabase = await createClient();

    // Só pode editar eleição em rascunho
    const { data: current } = await supabase
      .from("elections")
      .select("status")
      .eq("id", id)
      .eq("church_id", user.church_id)
      .single();

    if (!current) return { data: null, error: "Eleição não encontrada." };
    if (current.status !== "rascunho") {
      return {
        data: null,
        error: "Apenas eleições em rascunho podem ser editadas.",
      };
    }

    const { data, error } = await supabase
      .from("elections")
      .update(rest)
      .eq("id", id)
      .eq("church_id", user.church_id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as ElectionRow, error: null };
  },
  { module: "assembleia", minRole: "presbítero" }
);

export const openElection = withPermission(
  async (
    user: AuthUser,
    electionId: string
  ): Promise<ActionResult<ElectionRow>> => {
    const supabase = await createClient();
    const { data: election } = await supabase
      .from("elections")
      .select("status, type, church_id")
      .eq("id", electionId)
      .eq("church_id", user.church_id)
      .single();

    if (!election) return { data: null, error: "Eleição não encontrada." };
    if (election.status !== "rascunho") {
      return {
        data: null,
        error: "Somente eleições em rascunho podem ser abertas.",
      };
    }

    // Para tipo 'candidatos', verificar se há ao menos 1 candidato
    if (election.type === "candidatos") {
      const { count } = await supabase
        .from("election_candidates")
        .select("id", { count: "exact", head: true })
        .eq("election_id", electionId);

      if (!count || count === 0) {
        return {
          data: null,
          error: "Adicione ao menos um candidato antes de abrir a eleição.",
        };
      }
    }

    // Calcular quórum automático (membros ativos)
    const { data: countResult } = await supabase.rpc("count_active_members", {
      p_church_id: user.church_id,
    });
    const activeMembersCount = countResult ?? 0;

    const { data, error } = await supabase
      .from("elections")
      .update({
        status: "aberta",
        opened_at: new Date().toISOString(),
        active_members_at_open: activeMembersCount,
      })
      .eq("id", electionId)
      .eq("church_id", user.church_id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "open_election",
      entityType: "election",
      entityId: electionId,
      metadata: { active_members: activeMembersCount },
    });

    return { data: data as ElectionRow, error: null };
  },
  { module: "assembleia", minRole: "presbítero" }
);

export const closeElection = withPermission(
  async (
    user: AuthUser,
    electionId: string
  ): Promise<ActionResult<ElectionRow>> => {
    const supabase = await createClient();
    const { data: election } = await supabase
      .from("elections")
      .select("status")
      .eq("id", electionId)
      .eq("church_id", user.church_id)
      .single();

    if (!election) return { data: null, error: "Eleição não encontrada." };
    if (election.status !== "aberta") {
      return {
        data: null,
        error: "Somente eleições abertas podem ser encerradas.",
      };
    }

    const { data, error } = await supabase
      .from("elections")
      .update({ status: "encerrada", closed_at: new Date().toISOString() })
      .eq("id", electionId)
      .eq("church_id", user.church_id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "close_election",
      entityType: "election",
      entityId: electionId,
    });

    return { data: data as ElectionRow, error: null };
  },
  { module: "assembleia", minRole: "presbítero" }
);

export const cancelElection = withPermission(
  async (user: AuthUser, electionId: string): Promise<ActionResult<void>> => {
    const supabase = await createClient();
    const { data: election } = await supabase
      .from("elections")
      .select("status")
      .eq("id", electionId)
      .eq("church_id", user.church_id)
      .single();

    if (!election) return { data: null, error: "Eleição não encontrada." };
    if (election.status === "encerrada" || election.status === "cancelada") {
      return {
        data: null,
        error: "Não é possível cancelar uma eleição já encerrada ou cancelada.",
      };
    }

    const { error } = await supabase
      .from("elections")
      .update({ status: "cancelada", closed_at: new Date().toISOString() })
      .eq("id", electionId)
      .eq("church_id", user.church_id);

    if (error) return { data: null, error: error.message };

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "cancel_election",
      entityType: "election",
      entityId: electionId,
    });

    return { data: undefined, error: null };
  },
  { module: "assembleia", minRole: "pastor" }
);

// ─── Candidates ───────────────────────────────────────────────────────────────

export const addCandidate = withPermission(
  async (
    user: AuthUser,
    input: AddCandidateInput
  ): Promise<ActionResult<CandidateRow>> => {
    const parsed = addCandidateSchema.safeParse(input);
    if (!parsed.success)
      return {
        data: null,
        error: parsed.error.issues[0]?.message ?? "Erro de validação",
      };

    const supabase = await createClient();

    // Verificar eleição em rascunho
    const { data: election } = await supabase
      .from("elections")
      .select("status, type")
      .eq("id", parsed.data.election_id)
      .eq("church_id", user.church_id)
      .single();

    if (!election) return { data: null, error: "Eleição não encontrada." };
    if (election.type !== "candidatos") {
      return { data: null, error: "Esta eleição não é do tipo candidatos." };
    }
    if (election.status !== "rascunho") {
      return {
        data: null,
        error: "Candidatos só podem ser adicionados a eleições em rascunho.",
      };
    }

    // Verificar membro existe no church
    const { data: member } = await supabase
      .from("members")
      .select("id, name, avatar_url")
      .eq("id", parsed.data.member_id)
      .eq("church_id", user.church_id)
      .eq("is_active", true)
      .single();

    if (!member) return { data: null, error: "Membro não encontrado." };

    const { data, error } = await supabase
      .from("election_candidates")
      .insert(parsed.data)
      .select()
      .single();

    if (error) {
      if (error.code === "23505")
        return {
          data: null,
          error: "Este membro já é candidato nesta eleição.",
        };
      return { data: null, error: error.message };
    }

    return {
      data: {
        ...data,
        member_name: member.name,
        member_avatar: member.avatar_url ?? null,
      } as CandidateRow,
      error: null,
    };
  },
  { module: "assembleia", minRole: "presbítero" }
);

export const removeCandidate = withPermission(
  async (
    user: AuthUser,
    input: RemoveCandidateInput
  ): Promise<ActionResult<void>> => {
    const parsed = removeCandidateSchema.safeParse(input);
    if (!parsed.success)
      return {
        data: null,
        error: parsed.error.issues[0]?.message ?? "Erro de validação",
      };

    const supabase = await createClient();

    // Verificar eleição em rascunho
    const { data: election } = await supabase
      .from("elections")
      .select("status")
      .eq("id", parsed.data.election_id)
      .eq("church_id", user.church_id)
      .single();

    if (!election) return { data: null, error: "Eleição não encontrada." };
    if (election.status !== "rascunho") {
      return {
        data: null,
        error: "Candidatos só podem ser removidos de eleições em rascunho.",
      };
    }

    const { error } = await supabase
      .from("election_candidates")
      .delete()
      .eq("id", parsed.data.candidate_id)
      .eq("election_id", parsed.data.election_id);

    if (error) return { data: null, error: error.message };
    return { data: undefined, error: null };
  },
  { module: "assembleia", minRole: "presbítero" }
);

// ─── Voting ───────────────────────────────────────────────────────────────────

export const checkIfVoted = withPermission(
  async (
    user: AuthUser,
    electionId: string
  ): Promise<ActionResult<boolean>> => {
    const adminClient = createAdminClient();
    const hash = await computeVoterHash(user.id, electionId, adminClient);
    if (!hash) return { data: false, error: null };

    const supabase = await createClient();
    const { data } = await supabase
      .from("votes")
      .select("id")
      .eq("election_id", electionId)
      .eq("voter_hash", hash)
      .maybeSingle();

    return { data: !!data, error: null };
  },
  { module: "assembleia", minRole: "membro" }
);

export const requestVoteCode = withPermission(
  async (
    user: AuthUser,
    input: RequestVoteCodeInput
  ): Promise<ActionResult<void>> => {
    const parsed = requestVoteCodeSchema.safeParse(input);
    if (!parsed.success)
      return {
        data: null,
        error: parsed.error.issues[0]?.message ?? "Erro de validação",
      };

    const supabase = await createClient();

    // Verificar eleição aberta + voto remoto habilitado
    const { data: election } = await supabase
      .from("elections")
      .select("status, allow_remote_vote, name, assemblies(name)")
      .eq("id", parsed.data.election_id)
      .eq("church_id", user.church_id)
      .single();

    if (!election) return { data: null, error: "Eleição não encontrada." };
    if (election.status !== "aberta")
      return { data: null, error: "A eleição não está aberta." };
    if (!election.allow_remote_vote)
      return { data: null, error: "Voto remoto não habilitado nesta eleição." };

    // Verificar se já votou
    const adminClient = createAdminClient();
    const hash = await computeVoterHash(
      user.id,
      parsed.data.election_id,
      adminClient
    );
    if (hash) {
      const { data: existingVote } = await supabase
        .from("votes")
        .select("id")
        .eq("election_id", parsed.data.election_id)
        .eq("voter_hash", hash)
        .maybeSingle();

      if (existingVote)
        return { data: null, error: "Você já votou nesta eleição." };
    }

    // Buscar email e nome do membro
    const { data: member } = await adminClient
      .from("members")
      .select("name, email")
      .eq("id", user.id)
      .single();

    if (!member || !member.email) {
      return {
        data: null,
        error: "Não foi possível encontrar seu e-mail cadastrado.",
      };
    }

    const code = generateVoteCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // Upsert: um código por eleição por membro
    await adminClient.from("vote_codes").upsert(
      {
        election_id: parsed.data.election_id,
        member_id: user.id,
        code,
        expires_at: expiresAt.toISOString(),
        used_at: null,
      },
      { onConflict: "election_id,member_id" }
    );

    const assemblyName =
      (election.assemblies as unknown as { name: string })?.name ??
      "Assembléia";

    await sendEmail({
      to: member.email,
      subject: `Código de votação — ${election.name}`,
      template: "vote-code",
      data: {
        memberName: member.name,
        assemblyName,
        electionName: election.name,
        code,
        expiresAt: expiresAt.toLocaleString("pt-BR"),
      },
    });

    return { data: undefined, error: null };
  },
  { module: "assembleia", minRole: "membro" }
);

export const castVote = withPermission(
  async (user: AuthUser, input: CastVoteInput): Promise<ActionResult<void>> => {
    const parsed = castVoteSchema.safeParse(input);
    if (!parsed.success)
      return {
        data: null,
        error: parsed.error.issues[0]?.message ?? "Erro de validação",
      };

    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Verificar eleição aberta
    const { data: election } = await supabase
      .from("elections")
      .select("status, type, allow_remote_vote, church_id")
      .eq("id", parsed.data.election_id)
      .eq("church_id", user.church_id)
      .single();

    if (!election) return { data: null, error: "Eleição não encontrada." };
    if (election.status !== "aberta")
      return { data: null, error: "A eleição não está aberta para votação." };

    // Validar tipo vs input
    if (election.type === "candidatos" && parsed.data.type !== "candidatos") {
      return { data: null, error: "Esta eleição requer seleção de candidato." };
    }
    if (election.type === "sim_nao" && parsed.data.type !== "sim_nao") {
      return { data: null, error: "Esta eleição é do tipo Sim/Não." };
    }

    // Voto remoto: validar código OTP
    if (parsed.data.method === "remoto") {
      if (!election.allow_remote_vote) {
        return {
          data: null,
          error: "Voto remoto não habilitado nesta eleição.",
        };
      }
      if (!parsed.data.vote_code) {
        return {
          data: null,
          error: "Código de votação obrigatório para voto remoto.",
        };
      }

      const { data: codeRow } = await adminClient
        .from("vote_codes")
        .select("code, expires_at, used_at")
        .eq("election_id", parsed.data.election_id)
        .eq("member_id", user.id)
        .single();

      if (!codeRow)
        return { data: null, error: "Código de votação não encontrado." };
      if (codeRow.used_at)
        return { data: null, error: "Este código já foi utilizado." };
      if (new Date(codeRow.expires_at) < new Date()) {
        return {
          data: null,
          error: "Código de votação expirado. Solicite um novo.",
        };
      }
      if (codeRow.code !== parsed.data.vote_code) {
        return { data: null, error: "Código de votação inválido." };
      }

      // Marcar código como usado
      await adminClient
        .from("vote_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("election_id", parsed.data.election_id)
        .eq("member_id", user.id);
    }

    // Computar voter_hash
    const voterHash = await computeVoterHash(
      user.id,
      parsed.data.election_id,
      adminClient
    );
    if (!voterHash)
      return {
        data: null,
        error: "Erro interno: salt da eleição não encontrado.",
      };

    // Verificar se já votou
    const { data: existingVote } = await supabase
      .from("votes")
      .select("id")
      .eq("election_id", parsed.data.election_id)
      .eq("voter_hash", voterHash)
      .maybeSingle();

    if (existingVote)
      return { data: null, error: "Você já votou nesta eleição." };

    // Inserir voto
    const votePayload: Record<string, unknown> = {
      election_id: parsed.data.election_id,
      voter_hash: voterHash,
      method: parsed.data.method,
    };

    if (parsed.data.type === "candidatos") {
      // Verificar candidato pertence à eleição
      const { data: candidate } = await supabase
        .from("election_candidates")
        .select("id")
        .eq("id", parsed.data.candidate_id)
        .eq("election_id", parsed.data.election_id)
        .single();

      if (!candidate)
        return { data: null, error: "Candidato não encontrado nesta eleição." };
      votePayload.candidate_id = parsed.data.candidate_id;
    } else {
      votePayload.vote_value = parsed.data.vote_value;
    }

    const { error } = await adminClient.from("votes").insert(votePayload);
    if (error) {
      if (error.code === "23505")
        return { data: null, error: "Você já votou nesta eleição." };
      return { data: null, error: error.message };
    }

    return { data: undefined, error: null };
  },
  { module: "assembleia", minRole: "membro" }
);

// ─── Results ──────────────────────────────────────────────────────────────────

export const getElectionResults = withPermission(
  async (
    user: AuthUser,
    electionId: string
  ): Promise<ActionResult<ElectionResults>> => {
    const supabase = await createClient();

    const { data: election } = await supabase
      .from("elections")
      .select(
        `
        *,
        election_candidates(
          id, member_id, position,
          members(name, avatar_url)
        )
      `
      )
      .eq("id", electionId)
      .eq("church_id", user.church_id)
      .single();

    if (!election) return { data: null, error: "Eleição não encontrada." };

    // Buscar votos via admin (para ter contagem completa)
    const adminClient = createAdminClient();
    const { data: votes } = await adminClient
      .from("votes")
      .select("candidate_id, vote_value, method")
      .eq("election_id", electionId);

    const totalVotes = votes?.length ?? 0;
    const activeMembersAtOpen = election.active_members_at_open ?? 0;
    const quorumRequired =
      election.quorum ?? Math.ceil(activeMembersAtOpen / 2); // 50% + 1 padrão
    const quorumReached = totalVotes >= quorumRequired;
    const quorumPercentage =
      activeMembersAtOpen > 0
        ? Math.round((totalVotes / activeMembersAtOpen) * 100)
        : 0;

    interface CandidateMapped {
      id: string;
      election_id: string;
      member_id: string;
      position: string | null;
      created_at: string;
      member_name: string;
      member_avatar: string | null;
    }

    const candidates: CandidateMapped[] = (
      election.election_candidates ?? []
    ).map((c: Record<string, unknown>) => ({
      id: String(c.id ?? ""),
      election_id: electionId,
      member_id: String(c.member_id ?? ""),
      position: (c.position as string | null) ?? null,
      created_at: "",
      member_name: (c.members as Record<string, string>)?.name ?? "",
      member_avatar: (c.members as Record<string, string>)?.avatar_url ?? null,
    }));

    let results_candidatos;
    let results_sim_nao;

    if (election.type === "candidatos") {
      results_candidatos = candidates.map((c: CandidateMapped) => {
        const count = (votes ?? []).filter(
          (v) => v.candidate_id === c.id
        ).length;
        return {
          candidate_id: c.id,
          member_id: c.member_id,
          member_name: c.member_name || "—",
          position: c.position,
          vote_count: count,
          percentage:
            totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
        };
      });
      results_candidatos.sort(
        (a: { vote_count: number }, b: { vote_count: number }) =>
          b.vote_count - a.vote_count
      );
    } else {
      const sim = (votes ?? []).filter((v) => v.vote_value === "sim").length;
      const nao = (votes ?? []).filter((v) => v.vote_value === "nao").length;
      const abstencao = (votes ?? []).filter(
        (v) => v.vote_value === "abstencao"
      ).length;
      results_sim_nao = {
        sim,
        nao,
        abstencao,
        total: totalVotes,
        sim_percentage:
          totalVotes > 0 ? Math.round((sim / totalVotes) * 100) : 0,
        nao_percentage:
          totalVotes > 0 ? Math.round((nao / totalVotes) * 100) : 0,
        abstencao_percentage:
          totalVotes > 0 ? Math.round((abstencao / totalVotes) * 100) : 0,
      };
    }

    const electionRow = {
      ...election,
      candidates,
    };

    return {
      data: {
        election: electionRow as ElectionRow,
        total_votes: totalVotes,
        quorum: quorumRequired,
        active_members: activeMembersAtOpen,
        quorum_reached: quorumReached,
        quorum_percentage: quorumPercentage,
        results_candidatos,
        results_sim_nao,
      },
      error: null,
    };
  },
  { module: "assembleia", minRole: "visitante" }
);
