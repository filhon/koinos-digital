import { z } from "zod";

export const markReadSchema = z.object({
  daily_reading_id: z.string().uuid(),
});

export type MarkReadInput = z.infer<typeof markReadSchema>;

// ─── Result types ─────────────────────────────────────────────────────────────

export interface DailyReading {
  id: string;
  date: string;
  book: string;
  chapter: number;
}

export interface DevotionStreak {
  current_streak: number;
  longest_streak: number;
  last_read_date: string | null;
}

export interface TodayReadingData {
  reading: DailyReading | null;
  streak: DevotionStreak;
  already_read: boolean;
}
