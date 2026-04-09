import { z } from "zod";

// ─── Ministry ─────────────────────────────────────────────────────────────────

export const createMinistrySchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter ao menos 2 caracteres")
    .max(200, "Nome muito longo"),
  counselor_id: z
    .string()
    .uuid("ID inválido")
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  leader_id: z
    .string()
    .uuid("ID inválido")
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
});

export const updateMinistrySchema = createMinistrySchema.partial().extend({
  is_active: z.boolean().optional(),
});

// ─── Ministry Members ─────────────────────────────────────────────────────────

export const addMinistryMemberSchema = z.object({
  ministryId: z.string().uuid("ministryId inválido"),
  memberId: z.string().uuid("memberId inválido"),
});

export const removeMinistryMemberSchema = z.object({
  ministryId: z.string().uuid("ministryId inválido"),
  memberId: z.string().uuid("memberId inválido"),
});

// ─── Scales ───────────────────────────────────────────────────────────────────

export const upsertScaleMemberSchema = z.object({
  eventMinistryId: z.string().uuid("eventMinistryId inválido"),
  memberId: z.string().uuid("memberId inválido"),
});

export const removeScaleMemberSchema = z.object({
  eventMinistryId: z.string().uuid("eventMinistryId inválido"),
  memberId: z.string().uuid("memberId inválido"),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateMinistryInput = z.input<typeof createMinistrySchema>;
export type UpdateMinistryInput = z.input<typeof updateMinistrySchema>;
export type AddMinistryMemberInput = z.input<typeof addMinistryMemberSchema>;
export type RemoveMinistryMemberInput = z.input<
  typeof removeMinistryMemberSchema
>;
export type UpsertScaleMemberInput = z.input<typeof upsertScaleMemberSchema>;
export type RemoveScaleMemberInput = z.input<typeof removeScaleMemberSchema>;
