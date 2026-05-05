"use server";

import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/with-permission";
import {
  darkModeScheduleSchema,
  type DarkModeSchedule,
} from "@/lib/validators/aparencia";

export const getDarkModeSchedule = withPermission(
  async (user) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("members")
      .select("dark_mode_schedule")
      .eq("church_id", user.church_id)
      .eq("email", user.email ?? "")
      .maybeSingle();

    if (error) return { success: false as const, error: error.message };
    return {
      success: true as const,
      data: (data?.dark_mode_schedule as DarkModeSchedule | null) ?? null,
    };
  },
  { minRole: "visitante" }
);

export const saveDarkModeSchedule = withPermission(
  async (user, input: DarkModeSchedule) => {
    const parsed = darkModeScheduleSchema.safeParse(input);
    if (!parsed.success)
      return { success: false as const, error: "Dados inválidos" };

    const supabase = await createClient();
    const { error } = await supabase
      .from("members")
      .update({ dark_mode_schedule: parsed.data })
      .eq("church_id", user.church_id)
      .eq("email", user.email ?? "");

    if (error) return { success: false as const, error: error.message };
    return { success: true as const };
  },
  { minRole: "visitante" }
);
