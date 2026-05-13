/**
 * Script para popular a tabela bible_verses com a Almeida Antiga (AA) — domínio público.
 *
 * Decisão de licenciamento: A NVI (Nova Versão Internacional) é protegida por copyright
 * da Biblica/IBS. A ACF (Almeida Corrigida Fiel) e a AA (Almeida Antiga) estão em
 * domínio público. Este script usa a AA disponível em:
 * https://github.com/thiagobodruk/biblia
 *
 * Como executar:
 *   npx tsx src/scripts/seed-bible.ts
 *
 * Pré-requisito: variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env
 */

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { config } from "dotenv";
import { resolve } from "path";

// Carrega .env.local a partir da raiz do projeto
config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BIBLE_JSON_URL =
  "https://raw.githubusercontent.com/thiagobodruk/biblia/master/json/aa.json";
const VERSION = "AA";
const BATCH_SIZE = 1000;

// Mapa abreviação → nome completo em PT-BR
const BOOK_NAMES: Record<string, string> = {
  gn: "Gênesis",
  ex: "Êxodo",
  lv: "Levítico",
  nm: "Números",
  dt: "Deuteronômio",
  js: "Josué",
  jz: "Juízes",
  rt: "Rute",
  "1sm": "1 Samuel",
  "2sm": "2 Samuel",
  "1rs": "1 Reis",
  "2rs": "2 Reis",
  "1cr": "1 Crônicas",
  "2cr": "2 Crônicas",
  ed: "Esdras",
  ne: "Neemias",
  et: "Ester",
  jó: "Jó",
  sl: "Salmos",
  pv: "Provérbios",
  ec: "Eclesiastes",
  ct: "Cânticos",
  is: "Isaías",
  jr: "Jeremias",
  lm: "Lamentações",
  ez: "Ezequiel",
  dn: "Daniel",
  os: "Oséias",
  jl: "Joel",
  am: "Amós",
  ob: "Obadias",
  jn: "Jonas",
  mq: "Miquéias",
  na: "Naum",
  hc: "Habacuque",
  sf: "Sofonias",
  ag: "Ageu",
  zc: "Zacarias",
  ml: "Malaquias",
  mt: "Mateus",
  mc: "Marcos",
  lc: "Lucas",
  jo: "João",
  atos: "Atos",
  rm: "Romanos",
  "1co": "1 Coríntios",
  "2co": "2 Coríntios",
  gl: "Gálatas",
  ef: "Efésios",
  fp: "Filipenses",
  cl: "Colossenses",
  "1ts": "1 Tessalonicenses",
  "2ts": "2 Tessalonicenses",
  "1tm": "1 Timóteo",
  "2tm": "2 Timóteo",
  tt: "Tito",
  fm: "Filemom",
  hb: "Hebreus",
  tg: "Tiago",
  "1pe": "1 Pedro",
  "2pe": "2 Pedro",
  "1jo": "1 João",
  "2jo": "2 João",
  "3jo": "3 João",
  jd: "Judas",
  ap: "Apocalipse",
};

interface BibleBook {
  abbrev: string;
  chapters: string[][];
}

async function fetchBible(): Promise<BibleBook[]> {
  console.log("Baixando Bíblia (AA)...");
  const res = await fetch(BIBLE_JSON_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  let text = await res.text();
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  return JSON.parse(text) as BibleBook[];
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios."
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Verifica se já existe dados
  const { count } = await supabase
    .from("bible_verses")
    .select("*", { count: "exact", head: true })
    .eq("version", VERSION);

  if ((count ?? 0) > 0) {
    console.log(
      `Já existem ${count} versículos da versão ${VERSION}. Pulando seed.`
    );
    console.log(
      "Para re-inserir, delete os registros manualmente e execute novamente."
    );
    return;
  }

  const bible = await fetchBible();
  console.log(`${bible.length} livros encontrados.`);

  let totalInserted = 0;
  let batch: Array<{
    id: string;
    book: string;
    chapter: number;
    verse: number;
    text: string;
    version: string;
  }> = [];

  for (const book of bible) {
    const bookName = BOOK_NAMES[book.abbrev];
    if (!bookName) {
      console.warn(`Abreviação desconhecida: ${book.abbrev} — pulando.`);
      continue;
    }

    for (let ci = 0; ci < book.chapters.length; ci++) {
      const chapter = book.chapters[ci];
      for (let vi = 0; vi < chapter.length; vi++) {
        batch.push({
          id: randomUUID(),
          book: bookName,
          chapter: ci + 1,
          verse: vi + 1,
          text: chapter[vi],
          version: VERSION,
        });

        if (batch.length >= BATCH_SIZE) {
          const { error } = await supabase.from("bible_verses").insert(batch);
          if (error) throw new Error(`Erro ao inserir lote: ${error.message}`);
          totalInserted += batch.length;
          console.log(`Inseridos: ${totalInserted} versículos...`);
          batch = [];
        }
      }
    }
  }

  // Último lote
  if (batch.length > 0) {
    const { error } = await supabase.from("bible_verses").insert(batch);
    if (error) throw new Error(`Erro ao inserir último lote: ${error.message}`);
    totalInserted += batch.length;
  }

  console.log(`\nConcluído! Total inserido: ${totalInserted} versículos.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
