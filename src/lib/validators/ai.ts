import { z } from "zod";

export const aiRecommendationSchema = z.object({
  leituras: z.array(
    z.object({
      livro: z.string(),
      capitulo: z.number(),
      versiculo_inicial: z.number(),
      versiculo_final: z.number(),
      justificativa: z.string(),
    })
  ),
  canticos: z.array(
    z.object({
      titulo: z.string(),
      artista: z.string(),
      justificativa: z.string(),
    })
  ),
});

export type AIRecommendationResult = z.infer<typeof aiRecommendationSchema>;

// ─── Escala automática por IA ─────────────────────────────────────────────────

/** Schema Zod para validar a resposta bruta da IA (strict JSON). */
export const scaleSuggestionAISchema = z.object({
  suggestions: z
    .array(
      z.object({
        memberId: z.string().uuid("ID de membro inválido"),
        reason: z.string().min(5).max(300),
      })
    )
    .min(1)
    .max(20),
});

export type ScaleSuggestionAI = z.infer<typeof scaleSuggestionAISchema>;

/** Input da Server Action suggestScale. */
export const suggestScaleInputSchema = z.object({
  eventMinistryId: z.string().uuid("ID de escala inválido"),
  context: z.string().max(200).optional(),
});

export type SuggestScaleInput = z.infer<typeof suggestScaleInputSchema>;

/** Resultado enriquecido retornado ao cliente (após validação + lookup de nome/avatar). */
export interface ScaleSuggestionResult {
  memberId: string;
  memberName: string;
  memberAvatar: string | null;
  reason: string;
}
