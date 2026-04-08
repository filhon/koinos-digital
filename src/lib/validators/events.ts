import { z } from "zod";

export const EVENT_MODALITIES = ["presencial", "online"] as const;

export const RECURRENCE_FREQUENCIES = ["semanal", "mensal"] as const;

const recurrenceRuleSchema = z.object({
  frequency: z.enum(RECURRENCE_FREQUENCIES),
  weekday: z.number().int().min(0).max(6).optional(), // 0=domingo
  dayOfMonth: z.number().int().min(1).max(31).optional(),
});

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

export type CreateEventInput = z.input<typeof createEventSchema>;
export type UpdateEventInput = z.input<typeof updateEventSchema>;
export type ListEventsInput = z.input<typeof listEventsSchema>;
export type RecurrenceRule = z.infer<typeof recurrenceRuleSchema>;
