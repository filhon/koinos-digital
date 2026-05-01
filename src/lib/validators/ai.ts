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
