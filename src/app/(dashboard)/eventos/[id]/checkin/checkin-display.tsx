"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  Users,
  RefreshCw,
  Clock,
  CheckCircle2,
  Wifi,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { generateCheckinToken } from "@/actions/checkin";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  name: string;
  date: string;
  start_time: string;
  church_id: string;
}

interface CheckinDisplayProps {
  event: Event;
  initialCount: number;
}

const TOKEN_LIFETIME_MS = 30_000; // 30s

export function CheckinDisplay({ event, initialCount }: CheckinDisplayProps) {
  const router = useRouter();
  const [shortToken, setShortToken] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [checkinCount, setCheckinCount] = useState(initialCount);
  const [isGenerating, setIsGenerating] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const supabase = createClient();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.koinos.com.br";

  const generateToken = useCallback(async () => {
    setIsGenerating(true);
    try {
      const result = await generateCheckinToken(event.id);
      if ("code" in result) return; // PermissionDeniedResult
      setShortToken(result.shortToken);
      setCountdown(30);
    } catch (err) {
      console.error("Erro ao gerar token:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [event.id]);

  // Gera token inicial e configura rotação
  useEffect(() => {
    generateToken();

    intervalRef.current = setInterval(() => {
      generateToken();
    }, TOKEN_LIFETIME_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [generateToken]);

  // Countdown visual
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return 30;
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Supabase Realtime: sincroniza tokens de outros displays + conta check-ins
  useEffect(() => {
    // Canal de tokens (para sincronizar múltiplos displays)
    const tokenChannel = supabase
      .channel(`checkin:tokens:${event.id}`)
      .on("broadcast", { event: "token" }, (msg) => {
        const { shortToken: newToken } = msg.payload as {
          shortToken: string;
          expiresAt: number;
        };
        setShortToken(newToken);
        setCountdown(30);
      })
      .subscribe((status) => {
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    // Canal de contagem de check-ins em tempo real
    const countChannel = supabase
      .channel(`checkin:count:${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "check_ins",
          filter: `event_id=eq.${event.id}`,
        },
        () => {
          setCheckinCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tokenChannel);
      supabase.removeChannel(countChannel);
    };
  }, [event.id, supabase]);

  const qrValue = shortToken ? `${appUrl}/c/${shortToken}` : "";
  const circumference = 2 * Math.PI * 44; // r=44
  const dashOffset = circumference * (1 - countdown / 30);

  return (
    <div className="min-h-screen bg-[oklch(0.12_0.02_250)] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4" />
          Voltar
        </button>

        <div className="flex items-center gap-2">
          <div
            className={cn(
              "size-2 rounded-full transition-colors",
              realtimeConnected ? "bg-emerald-400" : "bg-amber-400"
            )}
          />
          <Wifi className="size-4 text-white/40" />
        </div>
      </header>

      {/* Corpo */}
      <main className="flex-1 flex flex-col items-center justify-center gap-8 px-6 py-8">
        {/* Evento info */}
        <div className="text-center space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[oklch(0.65_0.15_200)]">
            Check-in
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
            {event.name}
          </h1>
          <div className="flex items-center justify-center gap-1.5 text-white/50 text-sm">
            <Clock className="size-3.5" />
            <span>
              {format(parseISO(event.date), "dd 'de' MMMM", { locale: ptBR })}
              {" · "}
              {event.start_time.slice(0, 5)}
            </span>
          </div>
        </div>

        {/* QR Code com anel de countdown */}
        <div className="relative flex items-center justify-center">
          {/* Anel SVG */}
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 100 100"
          >
            {/* Track */}
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="4"
            />
            {/* Progress */}
            <motion.circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="oklch(0.65 0.15 200)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transition={{ duration: 0.9, ease: "linear" }}
            />
          </svg>

          {/* QR Container */}
          <div className="relative m-10 rounded-2xl bg-white p-4 shadow-2xl shadow-black/50">
            <AnimatePresence mode="wait">
              {isGenerating || !shortToken ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="size-48 sm:size-56 flex items-center justify-center"
                >
                  <RefreshCw className="size-8 text-gray-300 animate-spin" />
                </motion.div>
              ) : (
                <motion.div
                  key={shortToken}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <QRCodeSVG
                    value={qrValue}
                    size={224}
                    level="M"
                    includeMargin={false}
                    style={{ display: "block" }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Countdown + instrução */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
            <RefreshCw className="size-3.5" />
            <span>
              Novo código em{" "}
              <motion.span
                key={countdown}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "font-semibold tabular-nums",
                  countdown <= 5 ? "text-amber-400" : "text-white/80"
                )}
              >
                {countdown}s
              </motion.span>
            </span>
          </div>
          <p className="text-xs text-white/30 max-w-xs">
            Aponte a câmera para o QR Code ou acesse{" "}
            <span className="text-white/50 font-mono">koinos.com.br/c/…</span>
          </p>
        </div>

        {/* Contagem de check-ins */}
        <motion.div
          layout
          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4"
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/20">
            <CheckCircle2 className="size-5 text-emerald-400" />
          </div>
          <div>
            <motion.p
              key={checkinCount}
              initial={{ scale: 1.3, color: "oklch(0.75 0.18 160)" }}
              animate={{ scale: 1, color: "oklch(0.98 0 0)" }}
              className="text-2xl font-bold text-white tabular-nums"
            >
              {checkinCount}
            </motion.p>
            <p className="text-xs text-white/50">
              {checkinCount === 1
                ? "check-in realizado"
                : "check-ins realizados"}
            </p>
          </div>
          <div className="ml-4 flex items-center gap-1.5 text-xs text-white/40">
            <Users className="size-3.5" />
            <span>ao vivo</span>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
