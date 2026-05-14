import { z } from "zod";

export const FEEDBACK_TYPES = ["elogio", "sugestao", "reclamacao"] as const;
export const FEEDBACK_STATUSES = [
  "aberto",
  "em_analise",
  "respondido",
  "fechado",
] as const;

export type FeedbackType = (typeof FEEDBACK_TYPES)[number];
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const createFeedbackSchema = z
  .object({
    type: z.enum(FEEDBACK_TYPES, { error: "Selecione o tipo" }),
    title: z
      .string()
      .min(3, "Mínimo 3 caracteres")
      .max(100, "Máximo 100 caracteres"),
    description: z
      .string()
      .min(10, "Mínimo 10 caracteres")
      .max(2000, "Máximo 2000 caracteres"),
    allow_public: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.allow_public && data.type !== "elogio") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Divulgação pública só é permitida para elogios",
        path: ["allow_public"],
      });
    }
  });

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;

export const listFeedbacksSchema = z.object({
  type: z.enum(FEEDBACK_TYPES).optional(),
  status: z.enum(FEEDBACK_STATUSES).optional(),
  page: z.number().int().min(1).default(1),
});

export type ListFeedbacksInput = z.infer<typeof listFeedbacksSchema>;

// ─── Row types ────────────────────────────────────────────────────────────────

export interface FeedbackResponseRow {
  id: string;
  feedback_id: string;
  author_role: "admin" | "team";
  content: string;
  created_at: string;
}

export interface FeedbackRow {
  id: string;
  church_id: string;
  member_id: string;
  type: FeedbackType;
  title: string;
  description: string;
  allow_public: boolean;
  status: FeedbackStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  member?: { name: string; avatar_url: string | null; role: string } | null;
  responses?: FeedbackResponseRow[];
}
