"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { validateCheckin } from "@/actions/checkin";
import {
  Camera,
  CheckCircle2,
  XCircle,
  RefreshCw,
  QrCode,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckinScannerProps {
  memberId: string;
}

type ScanState = "idle" | "scanning" | "success" | "error";

export function CheckinScanner({ memberId }: CheckinScannerProps) {
  const [state, setState] = useState<ScanState>("idle");
  const [message, setMessage] = useState("");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<import("qr-scanner").default | null>(null);
  const processingRef = useRef(false);

  const handleResult = useCallback(
    async (shortToken: string) => {
      if (processingRef.current) return;
      processingRef.current = true;

      setState("scanning");

      // Geolocalização opcional
      let geoLat: number | undefined;
      let geoLng: number | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 })
        );
        geoLat = pos.coords.latitude;
        geoLng = pos.coords.longitude;
      } catch {
        // geo opcional — ignora
      }

      const result = await validateCheckin(
        { shortToken, method: "qr_app", geoLat, geoLng },
        memberId
      );

      if (result.success) {
        setState("success");
        setMessage(result.message);
        // Vibração haptica
        if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
      } else {
        setState("error");
        setMessage(result.message);
      }

      // Volta para scanning após 3s
      setTimeout(() => {
        setState("scanning");
        setMessage("");
        processingRef.current = false;
      }, 3000);
    },
    [memberId]
  );

  useEffect(() => {
    let cleanup: (() => void) | null = null;

    const initScanner = async () => {
      if (!videoRef.current) return;

      try {
        const QrScanner = (await import("qr-scanner")).default;

        const scanner = new QrScanner(
          videoRef.current,
          async (result) => {
            // Extrai shortToken da URL /c/{token}
            const match = result.data.match(
              /\/c\/([A-Za-z0-9_-]{8,24})(?:\?|$)/
            );
            if (match) {
              await handleResult(match[1]);
            }
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: false,
            highlightCodeOutline: false,
          }
        );

        await scanner.start();
        scannerRef.current = scanner;
        setHasPermission(true);
        setState("scanning");
      } catch (err) {
        console.error("Erro ao iniciar scanner:", err);
        setHasPermission(false);
      }
    };

    initScanner();

    cleanup = () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };

    return () => {
      cleanup?.();
    };
  }, [handleResult]);

  return (
    <div className="min-h-screen bg-[oklch(0.08_0.01_250)] flex flex-col overflow-hidden">
      {/* Câmera de fundo */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          className="w-full h-full object-cover opacity-60"
          playsInline
          muted
        />
        {/* Vinheta */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70" />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <div className="px-5 pt-12 pb-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 backdrop-blur-sm px-4 py-1.5 text-xs font-medium text-white/80">
            <Zap className="size-3.5 text-amber-400" />
            Scanner QR Code
          </div>
          <h1 className="mt-3 text-xl font-bold text-white">Check-in Rápido</h1>
          <p className="mt-1 text-sm text-white/50">
            Aponte para o QR Code do evento
          </p>
        </div>

        {/* Área de scan */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            {/* Frame de scan */}
            <div className="relative size-64 sm:size-72">
              {/* Corners */}
              {["tl", "tr", "bl", "br"].map((corner) => (
                <div
                  key={corner}
                  className={cn(
                    "absolute size-8 border-[3px] border-white",
                    corner === "tl" &&
                      "top-0 left-0 rounded-tl-lg border-r-0 border-b-0",
                    corner === "tr" &&
                      "top-0 right-0 rounded-tr-lg border-l-0 border-b-0",
                    corner === "bl" &&
                      "bottom-0 left-0 rounded-bl-lg border-r-0 border-t-0",
                    corner === "br" &&
                      "bottom-0 right-0 rounded-br-lg border-l-0 border-t-0"
                  )}
                />
              ))}

              {/* Scan line animada */}
              {state === "scanning" && (
                <motion.div
                  className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[oklch(0.75_0.2_200)] to-transparent"
                  initial={{ top: "8px" }}
                  animate={{ top: "calc(100% - 8px)" }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              )}

              {/* Feedback overlay */}
              <AnimatePresence>
                {(state === "success" || state === "error") && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={cn(
                      "absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-3",
                      state === "success"
                        ? "bg-emerald-500/30 border-2 border-emerald-400"
                        : "bg-red-500/30 border-2 border-red-400"
                    )}
                  >
                    {state === "success" ? (
                      <CheckCircle2 className="size-16 text-emerald-400" />
                    ) : (
                      <XCircle className="size-16 text-red-400" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Status card inferior */}
        <div className="px-5 pb-12 space-y-3">
          <AnimatePresence mode="wait">
            {state === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 text-center"
              >
                {hasPermission === false ? (
                  <div className="space-y-2">
                    <Camera className="size-8 text-white/30 mx-auto" />
                    <p className="text-sm text-white/60">
                      Permissão de câmera necessária.
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-xs text-[oklch(0.65_0.15_200)] underline"
                    >
                      Tentar novamente
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <RefreshCw className="size-6 text-white/30 mx-auto animate-spin" />
                    <p className="text-sm text-white/50">Iniciando câmera…</p>
                  </div>
                )}
              </motion.div>
            )}

            {state === "scanning" && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 flex items-center gap-3"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-[oklch(0.65_0.15_200)]/20">
                  <QrCode className="size-5 text-[oklch(0.65_0.15_200)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Aguardando QR Code…
                  </p>
                  <p className="text-xs text-white/40">Câmera ativa e pronta</p>
                </div>
                <div className="ml-auto">
                  <span className="relative flex size-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500" />
                  </span>
                </div>
              </motion.div>
            )}

            {(state === "success" || state === "error") && (
              <motion.div
                key={state}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "rounded-2xl border p-4 flex items-center gap-3",
                  state === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-red-500/30 bg-red-500/10"
                )}
              >
                {state === "success" ? (
                  <CheckCircle2 className="size-8 shrink-0 text-emerald-400" />
                ) : (
                  <XCircle className="size-8 shrink-0 text-red-400" />
                )}
                <div>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      state === "success" ? "text-emerald-300" : "text-red-300"
                    )}
                  >
                    {state === "success" ? "Check-in realizado!" : "Erro"}
                  </p>
                  <p className="text-xs text-white/60">{message}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
