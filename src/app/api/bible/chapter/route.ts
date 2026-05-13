import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/bible/chapter?book=Gênesis&chapter=1&version=AA
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const book = searchParams.get("book");
  const chapterParam = searchParams.get("chapter");
  const version = searchParams.get("version") || "AA";

  if (!book || !chapterParam) {
    return NextResponse.json(
      { error: "Parâmetros 'book' e 'chapter' são obrigatórios." },
      { status: 400 }
    );
  }

  const chapter = parseInt(chapterParam, 10);
  if (isNaN(chapter) || chapter < 1) {
    return NextResponse.json({ error: "Capítulo inválido." }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bible_verses")
    .select("verse, text")
    .eq("book", book)
    .eq("chapter", chapter)
    .eq("version", version)
    .order("verse", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: "Capítulo não encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    book,
    chapter,
    version,
    verses: data.map((v) => ({ verse: v.verse, text: v.text })),
  });
}
