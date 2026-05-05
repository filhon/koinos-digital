import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const darkModeScheduleSchema = z.object({
  enabled: z.boolean(),
  enableAt: z.string().regex(timeRegex, "Formato HH:MM inválido"),
  disableAt: z.string().regex(timeRegex, "Formato HH:MM inválido"),
});

export type DarkModeSchedule = z.infer<typeof darkModeScheduleSchema>;
