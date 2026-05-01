"use server";

import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
// fallback model google: import { google } from "@ai-sdk/google"
import { aiRecommendationSchema } from "@/lib/validators/ai";
import { createClient } from "@/lib/supabase/server";

export async function getAIRecommendations(
  objective: string,
  bibleVersion: string = "JFAA",
  musicGroupId?: string
) {
  try {
    const supabase = await createClient();

    // Fetch songs for context if musicGroupId is provided
    let repertoireContext = "";
    if (musicGroupId) {
      const { data: songs } = await supabase
        .from("songs")
        .select("name, artist")
        .eq("music_group_id", musicGroupId)
        .eq("is_active", true);

      if (songs && songs.length > 0) {
        repertoireContext =
          "Repertório disponível da igreja:\n" +
          songs.map((s) => `- ${s.name} (${s.artist})`).join("\n");
      }
    }

    const { object } = await generateObject({
      model: openai("gpt-4o"), // represents GPT-4.1 fallback chain in a real environment
      schema: aiRecommendationSchema,
      prompt: `
        Objetivo do culto: ${objective}
        Versão bíblica preferida: ${bibleVersion}
        
        Você é um assistente teológico e litúrgico montando uma sugestão para um culto cristão evangélico.
        Retorne de 1 a 3 sugestões de leituras bíblicas e de 2 a 4 cânticos ideais para o objetivo do culto.
        
        ${repertoireContext ? "Priorize os seguintes cânticos do nosso repertório se fizerem sentido:\n" + repertoireContext : ""}
      `,
    });

    return { data: object };
  } catch (error: unknown) {
    console.error("AI Recommendation Error:", error);

    // Fallback stub: usually we would try google("gemini-2.5-flash") here.
    return {
      data: {
        leituras: [
          {
            livro: "Salmos",
            capitulo: 23,
            versiculo_inicial: 1,
            versiculo_final: 6,
            justificativa: "Texto clássico de refrigério e confiança em Deus.",
          },
        ],
        canticos: [
          {
            titulo: "Maravilhosa Graça",
            artista: "Hinário",
            justificativa: "Cântico atemporal que reflete a graça de Deus.",
          },
        ],
      },
      error: "O modelo principal falhou, retornando fallback padrão.",
    };
  }
}
