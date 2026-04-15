import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const ELECTION_STATUSES = [
  "rascunho",
  "aberta",
  "encerrada",
  "cancelada",
] as const;
export type ElectionStatus = (typeof ELECTION_STATUSES)[number];

export const ELECTION_TYPES = ["candidatos", "sim_nao"] as const;
export type ElectionType = (typeof ELECTION_TYPES)[number];

export const VOTE_METHODS = ["presencial", "remoto"] as const;
export type VoteMethod = (typeof VOTE_METHODS)[number];

// ─── Assembly schemas ─────────────────────────────────────────────────────────

export const createAssemblySchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter ao menos 3 caracteres")
    .max(200, "Nome muito longo"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido"),
  location: z
    .string()
    .min(3, "Local deve ter ao menos 3 caracteres")
    .max(300, "Local muito longo"),
  reason: z
    .string()
    .min(3, "Motivo deve ter ao menos 3 caracteres")
    .max(500, "Motivo muito longo"),
  agenda: z
    .string()
    .max(2000, "Pauta muito longa")
    .optional()
    .or(z.literal("")),
  has_election: z.boolean().default(false),
});

export type CreateAssemblyInput = z.infer<typeof createAssemblySchema>;

export const updateAssemblySchema = createAssemblySchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateAssemblyInput = z.infer<typeof updateAssemblySchema>;

export const listAssembliesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ListAssembliesInput = z.infer<typeof listAssembliesSchema>;

// ─── Election schemas ─────────────────────────────────────────────────────────

export const createElectionSchema = z.object({
  assembly_id: z.string().uuid(),
  name: z
    .string()
    .min(3, "Nome deve ter ao menos 3 caracteres")
    .max(200, "Nome muito longo"),
  description: z
    .string()
    .max(1000, "Descrição muito longa")
    .optional()
    .or(z.literal("")),
  type: z.enum(ELECTION_TYPES),
  quorum: z.coerce
    .number()
    .int()
    .min(1, "Quórum deve ser ao menos 1")
    .optional()
    .nullable(),
  allow_remote_vote: z.boolean().default(false),
});

export type CreateElectionInput = z.infer<typeof createElectionSchema>;

export const updateElectionSchema = createElectionSchema
  .omit({ assembly_id: true })
  .partial()
  .extend({ id: z.string().uuid() });

export type UpdateElectionInput = z.infer<typeof updateElectionSchema>;

// ─── Candidate schemas ────────────────────────────────────────────────────────

export const addCandidateSchema = z.object({
  election_id: z.string().uuid(),
  member_id: z.string().uuid(),
  position: z
    .string()
    .max(200, "Cargo muito longo")
    .optional()
    .or(z.literal("")),
});

export type AddCandidateInput = z.infer<typeof addCandidateSchema>;

export const removeCandidateSchema = z.object({
  candidate_id: z.string().uuid(),
  election_id: z.string().uuid(),
});

export type RemoveCandidateInput = z.infer<typeof removeCandidateSchema>;

// ─── Vote schemas ─────────────────────────────────────────────────────────────

export const castVoteSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("candidatos"),
    election_id: z.string().uuid(),
    candidate_id: z.string().uuid(),
    method: z.enum(VOTE_METHODS).default("presencial"),
    vote_code: z.string().optional(), // obrigatório se method = remoto
  }),
  z.object({
    type: z.literal("sim_nao"),
    election_id: z.string().uuid(),
    vote_value: z.enum(["sim", "nao", "abstencao"]),
    method: z.enum(VOTE_METHODS).default("presencial"),
    vote_code: z.string().optional(),
  }),
]);

export type CastVoteInput = z.infer<typeof castVoteSchema>;

export const requestVoteCodeSchema = z.object({
  election_id: z.string().uuid(),
});

export type RequestVoteCodeInput = z.infer<typeof requestVoteCodeSchema>;

// ─── Row types ────────────────────────────────────────────────────────────────

export interface AssemblyRow {
  id: string;
  church_id: string;
  name: string;
  date: string;
  start_time: string;
  location: string;
  reason: string;
  agenda: string | null;
  has_election: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // joined
  election_count?: number;
}

export interface ElectionRow {
  id: string;
  assembly_id: string;
  church_id: string;
  name: string;
  description: string | null;
  type: ElectionType;
  quorum: number | null;
  active_members_at_open: number | null;
  allow_remote_vote: boolean;
  status: ElectionStatus;
  opened_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  candidates?: CandidateRow[];
  vote_count?: number;
  has_voted?: boolean;
}

export interface CandidateRow {
  id: string;
  election_id: string;
  member_id: string;
  position: string | null;
  created_at: string;
  // joined
  member_name?: string;
  member_avatar?: string | null;
  vote_count?: number;
}

export interface ElectionResultCandidate {
  candidate_id: string;
  member_id: string;
  member_name: string;
  position: string | null;
  vote_count: number;
  percentage: number;
}

export interface ElectionResultSimNao {
  sim: number;
  nao: number;
  abstencao: number;
  total: number;
  sim_percentage: number;
  nao_percentage: number;
  abstencao_percentage: number;
}

export interface ElectionResults {
  election: ElectionRow;
  total_votes: number;
  quorum: number;
  active_members: number;
  quorum_reached: boolean;
  quorum_percentage: number;
  results_candidatos?: ElectionResultCandidate[];
  results_sim_nao?: ElectionResultSimNao;
}
