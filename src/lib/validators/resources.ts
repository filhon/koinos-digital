import { z } from "zod";

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const createResourceSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  responsible_id: z
    .string()
    .uuid("ID de responsável inválido")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  value: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === "" || v === undefined || v === null) return undefined;
      const n = typeof v === "string" ? parseFloat(v.replace(",", ".")) : v;
      return isNaN(n) ? undefined : n;
    }),
});

export const updateResourceSchema = createResourceSchema.partial();

export const listResourcesSchema = z.object({
  status: z.enum(["all", "disponível", "indisponível"]).default("all"),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const allocateResourceSchema = z.object({
  resourceId: z.string().uuid("ID de recurso inválido"),
  eventId: z.string().uuid("ID de evento inválido"),
});

export const deallocateResourceSchema = z.object({
  resourceId: z.string().uuid("ID de recurso inválido"),
  eventId: z.string().uuid("ID de evento inválido"),
});

// ─── Input types ─────────────────────────────────────────────────────────────

export type CreateResourceInput = z.input<typeof createResourceSchema>;
export type UpdateResourceInput = z.input<typeof updateResourceSchema>;
export type ListResourcesInput = z.input<typeof listResourcesSchema>;
export type AllocateResourceInput = z.infer<typeof allocateResourceSchema>;
export type DeallocateResourceInput = z.infer<typeof deallocateResourceSchema>;
