"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Moon, Sun, Clock } from "lucide-react";
import {
  darkModeScheduleSchema,
  type DarkModeSchedule,
} from "@/lib/validators/aparencia";
import { saveDarkModeSchedule } from "@/actions/aparencia";
import { useTheme } from "@/components/layout/ThemeProvider";
import { Button } from "@/components/ui/button";

interface Props {
  initialSchedule: DarkModeSchedule | null;
}

export function AparenciaForm({ initialSchedule }: Props) {
  const { theme, toggleTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  // Sincroniza o schedule do banco para o localStorage na montagem
  useState(() => {
    if (initialSchedule && typeof window !== "undefined") {
      localStorage.setItem(
        "koinos_dark_schedule",
        JSON.stringify(initialSchedule)
      );
    }
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DarkModeSchedule>({
    resolver: zodResolver(darkModeScheduleSchema),
    defaultValues: {
      enabled: initialSchedule?.enabled ?? false,
      enableAt: initialSchedule?.enableAt ?? "18:00",
      disableAt: initialSchedule?.disableAt ?? "06:00",
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const scheduleEnabled = watch("enabled");

  function onSubmit(data: DarkModeSchedule) {
    startTransition(async () => {
      localStorage.setItem("koinos_dark_schedule", JSON.stringify(data));

      const res = await saveDarkModeSchedule(data);
      const ok =
        res && typeof res === "object" && "success" in res && res.success;
      if (ok) {
        toast.success("Configurações salvas");
      } else {
        toast.error("Erro ao salvar");
      }
    });
  }

  return (
    <div className="space-y-4 max-w-lg">
      {/* Tema atual */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2
          className="text-sm font-semibold mb-4"
          style={{ color: "var(--foreground)" }}
        >
          Tema atual
        </h2>
        <div className="flex gap-3">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                if (theme !== t) toggleTheme();
              }}
              className="flex-1 flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all"
              style={{
                borderColor: theme === t ? "var(--primary)" : "var(--border)",
                background:
                  theme === t
                    ? "oklch(from var(--primary) l c h / 0.06)"
                    : "var(--surface-1)",
              }}
              aria-pressed={theme === t}
            >
              {t === "light" ? (
                <Sun
                  className="size-6"
                  style={{
                    color:
                      theme === "light"
                        ? "var(--primary)"
                        : "var(--muted-foreground)",
                  }}
                  aria-hidden="true"
                />
              ) : (
                <Moon
                  className="size-6"
                  style={{
                    color:
                      theme === "dark"
                        ? "var(--primary)"
                        : "var(--muted-foreground)",
                  }}
                  aria-hidden="true"
                />
              )}
              <span
                className="text-sm font-medium"
                style={{
                  color:
                    theme === t ? "var(--primary)" : "var(--muted-foreground)",
                }}
              >
                {t === "light" ? "Claro" : "Escuro"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Agendamento */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <h2
                className="text-sm font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                Programar dark mode
              </h2>
            </div>
            {/* Toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={scheduleEnabled}
              onClick={() => setValue("enabled", !scheduleEnabled)}
              className="relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors"
              style={{
                background: scheduleEnabled ? "var(--primary)" : "var(--muted)",
              }}
            >
              <span
                className="pointer-events-none block h-4 w-4 rounded-full shadow-sm transition-transform"
                style={{
                  background: "white",
                  transform: scheduleEnabled
                    ? "translateX(1rem)"
                    : "translateX(0)",
                }}
              />
              <span className="sr-only">Ativar agendamento</span>
            </button>
          </div>

          <p
            className="text-xs leading-relaxed"
            style={{ color: "var(--muted-foreground)" }}
          >
            Quando ativado, o modo escuro é aplicado automaticamente no horário
            definido, independente da sua preferência manual.
          </p>

          <div
            className="grid grid-cols-2 gap-4 transition-opacity"
            style={{
              opacity: scheduleEnabled ? 1 : 0.4,
              pointerEvents: scheduleEnabled ? "auto" : "none",
            }}
          >
            <div className="space-y-1.5">
              <label
                htmlFor="enableAt"
                className="text-xs font-medium"
                style={{ color: "var(--foreground)" }}
              >
                Ativar às
              </label>
              <input
                id="enableAt"
                type="time"
                {...register("enableAt")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={!scheduleEnabled}
              />
              {errors.enableAt && (
                <p className="text-xs text-destructive">
                  {errors.enableAt.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="disableAt"
                className="text-xs font-medium"
                style={{ color: "var(--foreground)" }}
              >
                Desativar às
              </label>
              <input
                id="disableAt"
                type="time"
                {...register("disableAt")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={!scheduleEnabled}
              />
              {errors.disableAt && (
                <p className="text-xs text-destructive">
                  {errors.disableAt.message}
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isPending ? "Salvando…" : "Salvar configurações"}
          </Button>
        </div>
      </form>
    </div>
  );
}
