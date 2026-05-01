import { z } from "zod";
import { validateCPF } from "@/lib/utils/cpf";

export const MEMBER_ROLES = [
  "pastor",
  "presbítero",
  "diácono",
  "tesoureiro",
  "líder",
  "membro",
  "visitante",
] as const;

export const RELATIONSHIP_TYPES = [
  "cônjuge",
  "pai",
  "mãe",
  "filho",
  "filha",
  "irmão",
  "irmã",
] as const;

const addressSchema = z.object({
  rua: z.string().max(200).optional(),
  numero: z.string().max(20).optional(),
  complemento: z.string().max(100).optional(),
  bairro: z.string().max(100).optional(),
  cidade: z.string().max(100).optional(),
  estado: z.string().length(2).optional(),
  cep: z
    .string()
    .regex(/^\d{5}-?\d{3}$/, "CEP inválido")
    .optional(),
});

export const PRESET_TAGS = [
  "Intercessor",
  "Servidor",
  "Líder de Louvor",
  "Evangelista",
  "Discipulador",
  "Testemunha",
] as const;

export const tagsSchema = z
  .array(z.string().min(1).max(50))
  .max(3, "Máximo de 3 tags por membro")
  .default([]);

export const createMemberSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter ao menos 2 caracteres")
    .max(200, "Nome muito longo"),
  cpf: z
    .string()
    .min(1, "CPF é obrigatório")
    .refine((v) => validateCPF(v.replace(/\D/g, "")), "CPF inválido"),
  rg: z.string().max(20).optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  birth_date: z.string().optional(),
  gender: z.enum(["M", "F"]).optional(),
  role: z.enum(MEMBER_ROLES).default("membro"),
  phone: z.string().max(20).optional(),
  received_at: z.string().optional(),
  baptized_at: z.string().optional(),
  home_church_id: z.string().uuid().optional(),
  address: addressSchema.optional(),
  tags: tagsSchema.optional(),
});

export const updateMemberSchema = createMemberSchema
  .omit({ cpf: true })
  .extend({
    cpf: z
      .string()
      .refine((v) => validateCPF(v.replace(/\D/g, "")), "CPF inválido")
      .optional(),
    is_active: z.boolean().optional(),
  })
  .partial();

export const addFamilyLinkSchema = z.object({
  memberId: z.string().uuid("ID inválido"),
  relatedMemberId: z.string().uuid("ID inválido"),
  relationship: z.enum(RELATIONSHIP_TYPES),
});

export const listMembersSchema = z.object({
  search: z.string().optional(),
  role: z
    .enum([...MEMBER_ROLES, "all"])
    .optional()
    .default("all"),
  status: z.enum(["active", "inactive", "all"]).optional().default("active"),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
  /** Filtra por uma unidade/congregação específica (apenas para liderança de matriz). */
  church_id_filter: z.string().uuid().optional(),
});

export const updateMemberRoleSchema = z.object({
  memberId: z.string().uuid("ID inválido"),
  newRole: z.enum(MEMBER_ROLES),
});

export const updateMemberTagsSchema = z.object({
  memberId: z.string().uuid("ID inválido"),
  tags: tagsSchema,
});

export type CreateMemberInput = z.input<typeof createMemberSchema>;
export type UpdateMemberInput = z.input<typeof updateMemberSchema>;
export type AddFamilyLinkInput = z.input<typeof addFamilyLinkSchema>;
export type ListMembersInput = z.input<typeof listMembersSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type UpdateMemberTagsInput = z.infer<typeof updateMemberTagsSchema>;
