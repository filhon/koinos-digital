"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import type { Theme } from "@/lib/theme";

interface DarkModeSchedule {
  enabled: boolean;
  enableAt: string; // "HH:MM"
  disableAt: string; // "HH:MM"
}

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Tema lido do cookie server-side — evita flash */
  initialTheme: Theme;
}

/** Converte "HH:MM" em minutos desde meia-noite */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Retorna true se o horário atual está dentro da janela de dark mode */
function isDarkModeWindow(schedule: DarkModeSchedule): boolean {
  if (!schedule.enabled) return false;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const start = timeToMinutes(schedule.enableAt);
  const end = timeToMinutes(schedule.disableAt);

  if (start <= end) {
    // Janela dentro do mesmo dia (ex: 18:00–22:00)
    return current >= start && current < end;
  } else {
    // Janela atravessa meia-noite (ex: 18:00–06:00)
    return current >= start || current < end;
  }
}

/** Lê o agendamento do localStorage (salvo pelo form de aparência via cookie-free) */
function loadSchedule(): DarkModeSchedule | null {
  try {
    const raw = localStorage.getItem("koinos_dark_schedule");
    if (!raw) return null;
    return JSON.parse(raw) as DarkModeSchedule;
  } catch {
    return null;
  }
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applyTheme = useCallback((t: Theme) => {
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  /** Aplica o tema baseado no agendamento (se ativo) */
  const applyScheduledTheme = useCallback(() => {
    const schedule = loadSchedule();
    if (!schedule?.enabled) return false;

    const shouldBeDark = isDarkModeWindow(schedule);
    const desired: Theme = shouldBeDark ? "dark" : "light";
    setTheme(desired);
    applyTheme(desired);
    return true;
  }, [applyTheme]);

  // Na montagem: preferência do sistema como fallback + agendamento
  useEffect(() => {
    const scheduled = applyScheduledTheme();

    if (!scheduled && initialTheme === "light") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.matches) {
        // Persiste no cookie para que o servidor sirva o mesmo tema nas próximas navegações
        document.cookie = `koinos-theme=dark;path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
        applyTheme("dark");
        setTheme("dark");
      }
    }

    // Verifica agendamento a cada minuto
    intervalRef.current = setInterval(() => {
      applyScheduledTheme();
    }, 60_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "light" ? "dark" : "light";
      applyTheme(next);
      document.cookie = `koinos-theme=${next};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
      return next;
    });
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  return ctx;
}
