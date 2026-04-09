import { z } from "zod";

export const EVENT_MODALITIES = ["presencial", "online"] as const;

export const RECURRENCE_FREQUENCIES = ["semanal", "mensal"] as const;

// ─── Recurrence Rule Schema ───────────────────────────────────────────────────
// { frequency, interval, days_of_week?, end_date?, count? }
// Ao menos end_date ou count deve ser fornecido quando is_recurring = true.

const recurrenceRuleSchema = z.object({
  frequency: z.enum(RECURRENCE_FREQUENCIES),
  interval: z.number().int().min(1).max(12).default(1),
  days_of_week: z.array(z.number().int().min(0).max(6)).optional(),
  end_date: z.string().optional(),
  count: z.number().int().min(1).max(52).optional(),
});

export type RecurrenceRule = z.infer<typeof recurrenceRuleSchema>;

// ─── Base Event Schema ────────────────────────────────────────────────────────

const baseEventSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter ao menos 2 caracteres")
    .max(200, "Nome muito longo"),
  responsible_id: z.string().uuid("Selecione um responsável"),
  date: z.string().min(1, "Data é obrigatória"),
  start_time: z.string().min(1, "Horário de início é obrigatório"),
  end_time: z.string().optional(),
  modality: z.enum(EVENT_MODALITIES, {
    message: "Selecione a modalidade",
  }),
  location: z.string().max(300).optional(),
  meeting_link: z
    .string()
    .max(500)
    .url("Link inválido")
    .optional()
    .or(z.literal("")),
  description: z.string().max(2000).optional(),
  is_recurring: z.boolean().default(false),
  recurrence_rule: recurrenceRuleSchema.optional(),
});

export const createEventSchema = baseEventSchema.superRefine((data, ctx) => {
  if (data.modality === "presencial") {
    if (!data.location || data.location.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Endereço/local é obrigatório para eventos presenciais",
        path: ["location"],
      });
    }
  }
  if (data.modality === "online") {
    if (!data.meeting_link || data.meeting_link.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Link da reunião é obrigatório para eventos online",
        path: ["meeting_link"],
      });
    }
  }
  if (data.is_recurring && !data.recurrence_rule) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Regra de recorrência é obrigatória",
      path: ["recurrence_rule"],
    });
  }
  if (data.is_recurring && data.recurrence_rule) {
    if (!data.recurrence_rule.end_date && !data.recurrence_rule.count) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe uma data de encerramento ou número de ocorrências",
        path: ["recurrence_rule", "end_date"],
      });
    }
  }
});

export const updateEventSchema = baseEventSchema.partial().extend({
  is_active: z.boolean().optional(),
});

export const listEventsSchema = z.object({
  modality: z
    .enum([...EVENT_MODALITIES, "all"])
    .optional()
    .default("all"),
  upcoming: z.boolean().optional().default(true),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
});

// ─── Recurring edit scope ─────────────────────────────────────────────────────

export const RECURRING_EDIT_SCOPES = [
  "only_this",
  "this_and_following",
  "all",
] as const;

export const recurringEditScopeSchema = z.enum(RECURRING_EDIT_SCOPES);
export type RecurringEditScope = z.infer<typeof recurringEditScopeSchema>;

// ─── Input types ──────────────────────────────────────────────────────────────

export type CreateEventInput = z.input<typeof createEventSchema>;
export type UpdateEventInput = z.input<typeof updateEventSchema>;
export type ListEventsInput = z.input<typeof listEventsSchema>;
