"use server";

import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/with-permission";
import {
  getTalentHistorySchema,
  type GetTalentHistoryInput,
  type MyLevelData,
  type TalentHistoryPage,
} from "@/lib/validators/levels";
import type { AuthUser } from "@/lib/auth/session";

const PAGE_SIZE = 20;

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

// ─── getMemberId helper ───────────────────────────────────────────────────────

async function getMemberRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: AuthUser
): Promise<{
  id: string;
  total_xp: number;
  wallet_balance: number;
  current_level: number;
} | null> {
  if (!user.email) return null;
  const { data } = await supabase
    .from("members")
    .select("id, total_xp, wallet_balance, current_level")
    .eq("church_id", user.church_id)
    .eq("email", user.email)
    .maybeSingle();
  return data ?? null;
}

// ─── getMyLevel ───────────────────────────────────────────────────────────────
// Retorna dados de nível, XP e saldo de Talentos do membro logado.

export const getMyLevel = withPermission(
  async (user: AuthUser): Promise<ActionResult<MyLevelData>> => {
    const supabase = await createClient();
    const member = await getMemberRow(supabase, user);

    if (!member) {
      return { data: null, error: "Membro não encontrado." };
    }

    // Buscar todos os níveis para calcular xp do nível atual e do próximo
    const { data: levels, error } = await supabase
      .from("levels")
      .select("level, name, icon, min_xp")
      .order("level", { ascending: true });

    if (error) return { data: null, error: error.message };

    const lvls = levels ?? [];
    const currentLevelRow =
      lvls.find((l) => l.level === member.current_level) ?? lvls[0];
    const nextLevelRow =
      lvls.find((l) => l.level === member.current_level + 1) ?? null;

    return {
      data: {
        level: member.current_level,
        name: currentLevelRow?.name ?? "Semente",
        icon: currentLevelRow?.icon ?? "🌱",
        total_xp: member.total_xp,
        wallet_balance: member.wallet_balance,
        current_level_min_xp: currentLevelRow?.min_xp ?? 0,
        next_level_min_xp: nextLevelRow?.min_xp ?? null,
        next_level_name: nextLevelRow?.name ?? null,
      },
      error: null,
    };
  },
  { minRole: "visitante" }
);

// ─── getMyTalentHistory ───────────────────────────────────────────────────────
// Retorna histórico paginado de transações de Talentos do membro logado.

export const getMyTalentHistory = withPermission(
  async (
    user: AuthUser,
    input: GetTalentHistoryInput = { page: 1 }
  ): Promise<ActionResult<TalentHistoryPage>> => {
    const parsed = getTalentHistorySchema.safeParse(input);
    if (!parsed.success)
      return { data: null, error: parsed.error.issues[0].message };

    const { page } = parsed.data;
    const supabase = await createClient();
    const member = await getMemberRow(supabase, user);

    if (!member) {
      return { data: { transactions: [], hasMore: false }, error: null };
    }

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE; // fetch one extra to check hasMore

    const { data, error } = await supabase
      .from("talent_transactions")
      .select("id, amount, type, source, reference_id, created_at")
      .eq("member_id", member.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) return { data: null, error: error.message };

    const rows = data ?? [];
    const hasMore = rows.length > PAGE_SIZE;

    return {
      data: {
        transactions: rows.slice(0, PAGE_SIZE).map((r) => ({
          id: r.id as string,
          amount: r.amount as number,
          type: r.type as "earned" | "spent",
          source: r.source as string,
          reference_id: (r.reference_id as string | null) ?? null,
          created_at: r.created_at as string,
        })),
        hasMore,
      },
      error: null,
    };
  },
  { minRole: "visitante" }
);
