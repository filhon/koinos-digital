"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withPermission } from "@/lib/auth/with-permission";
import type { AuthUser } from "@/lib/auth/session";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  markReadSchema,
  type MarkReadInput,
  type TodayReadingData,
  type DevotionStreak,
} from "@/lib/validators/devotion";

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

// ─── Helper ───────────────────────────────────────────────────────────────────

async function getMemberId(
  supabase: SupabaseClient,
  user: AuthUser
): Promise<string | null> {
  if (!user.email) return null;
  const { data } = await supabase
    .from("members")
    .select("id")
    .eq("church_id", user.church_id)
    .eq("email", user.email)
    .maybeSingle();
  return (data?.id as string) ?? null;
}

// ─── getTodayReading ──────────────────────────────────────────────────────────
// Retorna a leitura do dia, o streak do membro e se já foi marcada como lida.
// Dispara reset de streaks vencidos como efeito colateral (fire-and-forget).

export const getTodayReading = withPermission(
  async (user: AuthUser): Promise<ActionResult<TodayReadingData>> => {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    const memberId = await getMemberId(supabase, user);

    // Reset streaks vencidos no login (SECURITY DEFINER via admin)
    if (memberId) {
      const admin = createAdminClient();
      admin.rpc("reset_expired_streaks", { p_church_id: user.church_id }).then(
        () => {},
        () => {} // ignore errors
      );
    }

    // Buscar leitura do dia
    const { data: reading, error: readingError } = await supabase
      .from("daily_readings")
      .select("id, date, book, chapter")
      .eq("date", today)
      .maybeSingle();

    if (readingError) return { data: null, error: readingError.message };

    // Buscar streak do membro
    const streak: DevotionStreak = {
      current_streak: 0,
      longest_streak: 0,
      last_read_date: null,
    };

    if (memberId) {
      const { data: s } = await supabase
        .from("devotion_streaks")
        .select("current_streak, longest_streak, last_read_date")
        .eq("member_id", memberId)
        .maybeSingle();

      if (s) {
        streak.current_streak = s.current_streak as number;
        streak.longest_streak = s.longest_streak as number;
        streak.last_read_date = s.last_read_date as string | null;
      }
    }

    // Verificar se já leu hoje (last_read_date = hoje)
    const already_read = !!memberId && streak.last_read_date === today;

    return {
      data: {
        reading: reading
          ? {
              id: reading.id as string,
              date: reading.date as string,
              book: reading.book as string,
              chapter: reading.chapter as number,
            }
          : null,
        streak,
        already_read,
      },
      error: null,
    };
  },
  { minRole: "visitante" }
);

// ─── markRead ─────────────────────────────────────────────────────────────────
// Marca a leitura do dia como concluída e atualiza o streak.

export const markRead = withPermission(
  async (
    user: AuthUser,
    input: MarkReadInput
  ): Promise<
    ActionResult<{ current_streak: number; bonus_points: number }>
  > => {
    const parsed = markReadSchema.safeParse(input);
    if (!parsed.success)
      return { data: null, error: parsed.error.issues[0].message };

    const supabase = await createClient();
    const memberId = await getMemberId(supabase, user);
    if (!memberId) return { data: null, error: "Membro não encontrado." };

    const admin = createAdminClient();
    const { data, error } = await admin.rpc("mark_daily_reading", {
      p_member_id: memberId,
      p_church_id: user.church_id,
      p_daily_reading_id: parsed.data.daily_reading_id,
    });

    if (error) return { data: null, error: error.message };

    const result = data as {
      error?: string;
      current_streak?: number;
      bonus_points?: number;
      base_points?: number;
    };

    if (result?.error) return { data: null, error: result.error };

    return {
      data: {
        current_streak: result.current_streak ?? 0,
        bonus_points: result.bonus_points ?? 0,
      },
      error: null,
    };
  },
  { minRole: "visitante" }
);

// ─── getMyStreak ──────────────────────────────────────────────────────────────
// Retorna o streak atual do membro logado.

export const getMyStreak = withPermission(
  async (user: AuthUser): Promise<ActionResult<DevotionStreak>> => {
    const supabase = await createClient();
    const memberId = await getMemberId(supabase, user);

    if (!memberId) {
      return {
        data: { current_streak: 0, longest_streak: 0, last_read_date: null },
        error: null,
      };
    }

    const { data, error } = await supabase
      .from("devotion_streaks")
      .select("current_streak, longest_streak, last_read_date")
      .eq("member_id", memberId)
      .maybeSingle();

    if (error) return { data: null, error: error.message };

    return {
      data: {
        current_streak: (data?.current_streak as number) ?? 0,
        longest_streak: (data?.longest_streak as number) ?? 0,
        last_read_date: (data?.last_read_date as string | null) ?? null,
      },
      error: null,
    };
  },
  { minRole: "visitante" }
);
