"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  validateCheckin,
  validateCheckinTokenForVisitor,
} from "@/actions/checkin";
import {
  visitorCheckinSchema,
  type VisitorCheckinInput,
} from "@/lib/validators/checkin";
import {
  CheckCircle2,
  XCircle,
  QrCode,
  User,
  Phone,
  MapPin,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VisitorCheckinProps {
  shortToken: string;
  memberId: string | null;
}

type PageState = "form" | "loading" | "success" | "error";

export function VisitorCheckin({ shortToken, memberId }: VisitorCheckinProps) {
  const [state, setState] = useState<PageState>("loading");
  const [resultMessage, setResultMessage] = useState("");
  const [geoLat, setGeoLat] = useState<number | undefined>();
  const [geoLng, setGeoLng] = useState<number | undefined>();

  // Solicita geolocalização ao montar
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setGeoLat(pos.coords.latitude);
        setGeoLng(pos.coords.longitude);
      },
      () => {}
    );
  }, []);

  // Se membro logado → auto check-in
  useEffect(() => {
    if (memberId) {
      handleLoggedInCheckin();
      return;
    }

    let isActive = true;
    validateCheckinTokenForVisitor(shortToken).then((result) => {
      if (!isActive) return;
      setResultMessage(result.message);
      setState(result.success ? "form" : "error");
    });

    return () => {
      isActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId, shortToken]);

  async function handleLoggedInCheckin() {
    setState("loading");
    const result = await validateCheckin(
      { shortToken, method: "qr_app", geoLat, geoLng },
      memberId
    );
    setResultMessage(result.message);
    setState(result.success ? "success" : "error");
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VisitorCheckinInput>({
    resolver: zodResolver(visitorCheckinSchema),
    defaultValues: { shortToken },
  });

  async function onSubmit(data: VisitorCheckinInput) {
    setState("loading");
    const result = await validateCheckin(
      {
        shortToken,
        method: "qr_web",
        geoLat: data.geoLat,
        geoLng: data.geoLng,
      },
      null,
      data.visitorName,
      data.visitorPhone
    );
    setResultMessage(result.message);
    setState(result.success ? "success" : "error");
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.14 0.04 260) 0%, oklch(0.10 0.02 280) 100%)",
      }}
    >
      {/* Logo / brand */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 text-white/80">
          <QrCode className="size-6 text-[oklch(0.65_0.15_200)]" />
          <span className="text-lg font-bold tracking-tight">Koinos</span>
        </div>
        <p className="mt-1 text-xs text-white/30">Check-in de evento</p>
      </div>

      <AnimatePresence mode="wait">
        {/* Loading */}
        {state === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center space-y-4"
          >
            <Loader2 className="size-12 text-[oklch(0.65_0.15_200)] mx-auto animate-spin" />
            <p className="text-white/60 text-sm">Registrando check-in…</p>
          </motion.div>
        )}

        {/* Sucesso */}
        {state === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-center space-y-5 max-w-xs w-full"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
              className="mx-auto flex size-24 items-center justify-center rounded-full bg-emerald-500/20 ring-4 ring-emerald-500/30"
            >
              <CheckCircle2 className="size-12 text-emerald-400" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-white">Check-in feito!</h2>
              <p className="mt-2 text-sm text-white/60">{resultMessage}</p>
            </div>
            {memberId && (
              <p className="text-xs text-emerald-400/60">
                Pontos adicionados ao seu perfil ✨
              </p>
            )}
          </motion.div>
        )}

        {/* Erro */}
        {state === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-5 max-w-xs w-full"
          >
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-red-500/20">
              <XCircle className="size-10 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Não foi possível</h2>
              <p className="mt-2 text-sm text-white/60">{resultMessage}</p>
            </div>
            <button
              onClick={() => setState("form")}
              className="text-xs text-[oklch(0.65_0.15_200)] underline"
            >
              Tentar novamente
            </button>
          </motion.div>
        )}

        {/* Formulário visitante (não logado) */}
        {state === "form" && !memberId && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm"
          >
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 space-y-5">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-semibold text-white">
                  Identificação
                </h2>
                <p className="text-xs text-white/40">
                  Preencha para registrar sua presença
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <input type="hidden" {...register("shortToken")} />

                <div className="space-y-1">
                  <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                    <User className="size-3" />
                    Nome completo
                  </label>
                  <input
                    {...register("visitorName")}
                    placeholder="Seu nome"
                    className={cn(
                      "w-full rounded-xl border bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-colors",
                      errors.visitorName
                        ? "border-red-500/50 focus:border-red-500"
                        : "border-white/15 focus:border-[oklch(0.65_0.15_200)]"
                    )}
                  />
                  {errors.visitorName && (
                    <p className="text-xs text-red-400">
                      {errors.visitorName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                    <Phone className="size-3" />
                    Celular
                  </label>
                  <input
                    {...register("visitorPhone")}
                    placeholder="(11) 91234-5678"
                    inputMode="tel"
                    className={cn(
                      "w-full rounded-xl border bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-colors",
                      errors.visitorPhone
                        ? "border-red-500/50 focus:border-red-500"
                        : "border-white/15 focus:border-[oklch(0.65_0.15_200)]"
                    )}
                  />
                  {errors.visitorPhone && (
                    <p className="text-xs text-red-400">
                      {errors.visitorPhone.message}
                    </p>
                  )}
                </div>

                {geoLat !== undefined && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400/70">
                    <MapPin className="size-3" />
                    <span>Localização detectada</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[oklch(0.55_0.15_200)] hover:bg-[oklch(0.60_0.15_200)] active:scale-[0.98] py-3 text-sm font-semibold text-white transition-all"
                >
                  Fazer Check-in
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
