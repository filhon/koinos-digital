import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/bible?ref=Jo+3:16&version=AA
// GET /api/bible/chapter?book=Gênesis&chapter=1&version=AA
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get("ref");
  const version = searchParams.get("version") || "AA";

  if (!ref) {
    return NextResponse.json(
      { error: "Parâmetro 'ref' obrigatório." },
      { status: 400 }
    );
  }

  const parsed = ref.match(/^([\w\sÀ-ú]+)\s*(\d+):(\d+)$/);
  if (!parsed) {
    return NextResponse.json(
      { error: "Formato inválido. Use 'Jo 3:16' ou 'Gênesis 1:1'" },
      { status: 400 }
    );
  }

  const book = parsed[1].trim();
  const chapter = parseInt(parsed[2], 10);
  const verse = parseInt(parsed[3], 10);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bible_verses")
    .select("text")
    .eq("book", book)
    .eq("chapter", chapter)
    .eq("verse", verse)
    .eq("version", version)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Versículo não encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json({ verse: data.text });
}
