import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get("ref");
  const version = searchParams.get("version") || "JFAA";

  if (!ref) {
    return NextResponse.json(
      { error: "Parâmetro 'ref' obrigatório." },
      { status: 400 }
    );
  }

  // Parse very naive "Jo 3:16" assuming a specific format
  const parsed = ref.match(/^([\w]+)\s*(\d+):(\d+)$/);
  if (!parsed) {
    return NextResponse.json(
      { error: "Formato inválido. Use 'Lv 3:16'" },
      { status: 400 }
    );
  }

  const book = parsed[1];
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
