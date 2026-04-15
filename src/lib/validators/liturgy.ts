import { z } from "zod";

export const LITURGY_ITEM_TYPES = [
  "acolhimento",
  "louvor",
  "oracao",
  "leitura_biblica",
  "pregacao",
  "oferta",
  "avisos",
  "comunhao",
  "batismo",
  "texto_livre",
] as const;

export type LiturgyItemType = (typeof LITURGY_ITEM_TYPES)[number];

export const LITURGY_ITEM_TYPE_LABELS: Record<LiturgyItemType, string> = {
  acolhimento: "Acolhimento",
  louvor: "Louvor",
  oracao: "Oração",
  leitura_biblica: "Leitura Bíblica",
  pregacao: "Pregação",
  oferta: "Oferta",
  avisos: "Avisos",
  comunhao: "Comunhão",
  batismo: "Batismo",
  texto_livre: "Texto Livre",
};

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const createLiturgySchema = z.object({
  event_id: z.string().uuid(),
});

export const updateLiturgyItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Título obrigatório").max(200),
  content: z.string().max(2000).nullable().optional(),
  type: z.enum(LITURGY_ITEM_TYPES),
});

export const reorderLiturgyItemsSchema = z.object({
  liturgy_id: z.string().uuid(),
  ordered_ids: z.array(z.string().uuid()).min(1),
});

export const addLiturgyItemSchema = z.object({
  liturgy_id: z.string().uuid(),
  type: z.enum(LITURGY_ITEM_TYPES),
  title: z.string().min(1, "Título obrigatório").max(200),
  content: z.string().max(2000).nullable().optional(),
});

export const removeLiturgyItemSchema = z.object({
  id: z.string().uuid(),
});

// ─── Input types ──────────────────────────────────────────────────────────────

export type CreateLiturgyInput = z.infer<typeof createLiturgySchema>;
export type UpdateLiturgyItemInput = z.infer<typeof updateLiturgyItemSchema>;
export type ReorderLiturgyItemsInput = z.infer<
  typeof reorderLiturgyItemsSchema
>;
export type AddLiturgyItemInput = z.infer<typeof addLiturgyItemSchema>;
export type RemoveLiturgyItemInput = z.infer<typeof removeLiturgyItemSchema>;

// ─── Row types ────────────────────────────────────────────────────────────────

export interface LiturgyItemRow {
  id: string;
  liturgy_id: string;
  church_id: string;
  type: LiturgyItemType;
  title: string;
  content: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LiturgyRow {
  id: string;
  event_id: string;
  church_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  items: LiturgyItemRow[];
}
