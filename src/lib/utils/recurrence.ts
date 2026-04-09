import {
  addWeeks,
  addMonths,
  addDays,
  startOfWeek,
  parseISO,
  getDay,
  isAfter,
  isBefore,
} from "date-fns";
import type { RecurrenceRule } from "@/lib/validators/events";

/**
 * Gera as datas das instâncias de um evento recorrente.
 * Não inclui a data base (o próprio evento pai).
 * Limita a 52 instâncias e máximo 1 ano a partir de baseDate.
 */
export function generateInstanceDates(
  baseDate: Date,
  rule: RecurrenceRule
): Date[] {
  const { frequency, interval = 1, days_of_week, end_date, count } = rule;

  const maxCount = Math.min(count ?? 52, 52);
  const oneYearLater = addMonths(baseDate, 12);
  const endDateObj = end_date ? parseISO(end_date) : null;
  const effectiveEnd =
    endDateObj && isBefore(endDateObj, oneYearLater)
      ? endDateObj
      : oneYearLater;

  const dates: Date[] = [];

  if (frequency === "semanal") {
    const baseDayOfWeek = getDay(baseDate);
    const effectiveDays =
      days_of_week && days_of_week.length > 0
        ? [...days_of_week].sort((a, b) => a - b)
        : [baseDayOfWeek];

    const baseWeekStart = startOfWeek(baseDate, { weekStartsOn: 0 });
    let weekOffset = 0;

    outer: while (dates.length < maxCount) {
      const weekStart = addWeeks(baseWeekStart, weekOffset * interval);

      for (const day of effectiveDays) {
        const d = addDays(weekStart, day);
        if (!isAfter(d, baseDate)) continue; // pula data base e anteriores
        if (isAfter(d, effectiveEnd)) break outer;
        if (dates.length >= maxCount) break outer;
        dates.push(d);
      }

      weekOffset++;
      if (weekOffset > 53) break; // segurança: nunca mais de 53 semanas
    }
  } else {
    // mensal
    for (let n = 1; n <= maxCount; n++) {
      const d = addMonths(baseDate, n * interval);
      if (isAfter(d, effectiveEnd)) break;
      dates.push(d);
    }
  }

  return dates;
}

/**
 * Calcula preview para exibição no formulário.
 * Retorna { count, lastDate } ou null se dados insuficientes.
 */
export function computeRecurrencePreview(
  baseDateStr: string,
  rule: Partial<RecurrenceRule>
): { count: number; lastDate: Date } | null {
  if (!baseDateStr || !rule.frequency) return null;
  if (!rule.end_date && !rule.count) return null;

  try {
    const base = parseISO(baseDateStr);
    const completeRule: RecurrenceRule = {
      frequency: rule.frequency,
      interval: rule.interval ?? 1,
      days_of_week: rule.days_of_week,
      end_date: rule.end_date,
      count: rule.count,
    };
    const dates = generateInstanceDates(base, completeRule);
    if (dates.length === 0) return null;
    return { count: dates.length, lastDate: dates[dates.length - 1] };
  } catch {
    return null;
  }
}
