"use server";

import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/with-permission";
import type { AuthUser } from "@/lib/auth/session";

export interface BibleVerse {
  verse: number;
  text: string;
}

export interface TodayReadingFull {
  id: string;
  date: string;
  book: string;
  chapter: number;
  verses: BibleVerse[];
  already_read: boolean;
  streak: {
    current_streak: number;
    longest_streak: number;
    last_read_date: string | null;
  };
}

export interface ReadingHistoryDay {
  date: string;
  book: string;
  chapter: number;
  read: boolean;
}

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

// ─── getTodayReading ──────────────────────────────────────────────────────────

export const getTodayReading = withPermission(
  async (user: AuthUser): Promise<ActionResult<TodayReadingFull | null>> => {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    // Busca member_id pelo email
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("church_id", user.church_id)
      .eq("email", user.email ?? "")
      .maybeSingle();

    const memberId = member?.id as string | null;

    // Leitura do dia + versículos (paralelo)
    const [readingRes, streakRes] = await Promise.all([
      supabase
        .from("daily_readings")
        .select("id, date, book, chapter")
        .eq("date", today)
        .maybeSingle(),
      memberId
        ? supabase
            .from("devotion_streaks")
            .select("current_streak, longest_streak, last_read_date")
            .eq("member_id", memberId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (readingRes.error)
      return { data: null, error: readingRes.error.message };

    const reading = readingRes.data;
    if (!reading) return { data: null, error: null };

    const s = streakRes.data;
    const streak = {
      current_streak: (s?.current_streak as number) ?? 0,
      longest_streak: (s?.longest_streak as number) ?? 0,
      last_read_date: (s?.last_read_date as string | null) ?? null,
    };

    const already_read = !!memberId && streak.last_read_date === today;

    // Busca versículos do capítulo
    const { data: versesData, error: versesError } = await supabase
      .from("bible_verses")
      .select("verse, text")
      .eq("book", reading.book as string)
      .eq("chapter", reading.chapter as number)
      .order("verse", { ascending: true });

    if (versesError) return { data: null, error: versesError.message };

    const verses = (versesData ?? []).map((v) => ({
      verse: v.verse as number,
      text: v.text as string,
    }));

    return {
      data: {
        id: reading.id as string,
        date: reading.date as string,
        book: reading.book as string,
        chapter: reading.chapter as number,
        verses,
        already_read,
        streak,
      },
      error: null,
    };
  },
  { minRole: "visitante" }
);

// ─── getChapterVerses ─────────────────────────────────────────────────────────
// Busca versículos de qualquer capítulo pelo nome do livro + número do capítulo.

export const getChapterVerses = withPermission(
  async (
    user: AuthUser,
    input: { book: string; chapter: number }
  ): Promise<ActionResult<BibleVerse[]>> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("bible_verses")
      .select("verse, text")
      .eq("book", input.book)
      .eq("chapter", input.chapter)
      .order("verse", { ascending: true });

    if (error) return { data: null, error: error.message };

    return {
      data: (data ?? []).map((v) => ({
        verse: v.verse as number,
        text: v.text as string,
      })),
      error: null,
    };
  },
  { minRole: "visitante" }
);

// ─── getReadingHistory ────────────────────────────────────────────────────────
// Retorna o histórico dos últimos N dias: quais foram lidos, qual livro/capítulo.

export const getReadingHistory = withPermission(
  async (
    user: AuthUser,
    input: { days?: number }
  ): Promise<ActionResult<ReadingHistoryDay[]>> => {
    const supabase = await createClient();
    const days = Math.min(input.days ?? 30, 90);
    const today = new Date();

    // Gera array de datas dos últimos N dias
    const dates: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }

    const from = dates[0];
    const to = dates[dates.length - 1];

    // Busca readings do período
    const { data: readings, error: readingsError } = await supabase
      .from("daily_readings")
      .select("date, book, chapter")
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: true });

    if (readingsError) return { data: null, error: readingsError.message };

    // Busca member_id para verificar leituras concluídas
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("church_id", user.church_id)
      .eq("email", user.email ?? "")
      .maybeSingle();

    const memberId = member?.id as string | null;

    // Busca streak para verificar last_read_date e score_events
    const readDates = new Set<string>();
    if (memberId) {
      const { data: scoreEvents } = await supabase
        .from("score_events")
        .select("created_at")
        .eq("member_id", memberId)
        .eq("action_type", "daily_read")
        .gte("created_at", from + "T00:00:00")
        .lte("created_at", to + "T23:59:59");

      (scoreEvents ?? []).forEach((e) => {
        const d = (e.created_at as string).split("T")[0];
        readDates.add(d);
      });
    }

    const readingsMap = new Map<string, { book: string; chapter: number }>();
    (readings ?? []).forEach((r) => {
      readingsMap.set(r.date as string, {
        book: r.book as string,
        chapter: r.chapter as number,
      });
    });

    const history: ReadingHistoryDay[] = dates.map((date) => {
      const r = readingsMap.get(date);
      return {
        date,
        book: r?.book ?? "",
        chapter: r?.chapter ?? 0,
        read: readDates.has(date),
      };
    });

    return { data: history, error: null };
  },
  { minRole: "visitante" }
);
