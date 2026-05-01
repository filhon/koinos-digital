import { z } from "zod";

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const createCongregationSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter ao menos 2 caracteres")
    .max(200, "Nome muito longo"),
  denomination: z
    .string()
    .max(100, "Denominação muito longa")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .max(20, "Telefone muito longo")
    .optional()
    .or(z.literal("")),
  address_text: z
    .string()
    .max(500, "Endereço muito longo")
    .optional()
    .or(z.literal("")),
});

export type CreateCongregationInput = z.infer<typeof createCongregationSchema>;

export const toggleSharedFinancesSchema = z.object({
  congregation_id: z.string().uuid("ID inválido"),
  shared_finances: z.boolean(),
});

export type ToggleSharedFinancesInput = z.infer<
  typeof toggleSharedFinancesSchema
>;

// ─── Row types ────────────────────────────────────────────────────────────────

export interface CongregationRow {
  id: string;
  name: string;
  slug: string;
  denomination: string | null;
  phone: string | null;
  shared_finances: boolean;
  is_active: boolean;
  member_count: number;
  invite_code: string | null;
  created_at: string;
}
