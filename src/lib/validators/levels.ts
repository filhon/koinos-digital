import { z } from "zod";

export const getTalentHistorySchema = z.object({
  page: z.number().int().min(1).default(1),
});

export type GetTalentHistoryInput = z.infer<typeof getTalentHistorySchema>;

// ─── Result types ─────────────────────────────────────────────────────────────

export interface LevelRow {
  level: number;
  name: string;
  min_xp: number;
  icon: string;
}

export interface TalentTransaction {
  id: string;
  amount: number;
  type: "earned" | "spent";
  source: string;
  reference_id: string | null;
  created_at: string;
}

export interface MyLevelData {
  level: number;
  name: string;
  icon: string;
  total_xp: number;
  wallet_balance: number;
  current_level_min_xp: number;
  next_level_min_xp: number | null;
  next_level_name: string | null;
}

export interface TalentHistoryPage {
  transactions: TalentTransaction[];
  hasMore: boolean;
}

// Source labels in Portuguese
export const TALENT_SOURCE_LABELS: Record<string, string> = {
  checkin: "Check-in",
  invite: "Convite aceito",
  daily_reading: "Leitura diária",
  streak_bonus: "Bônus de sequência",
  shop_purchase: "Compra na Loja",
};
