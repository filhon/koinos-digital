"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  initOneSignal,
  requestPushPermission,
  getPushPermissionStatus,
} from "@/lib/onesignal/client";

const DISMISSED_KEY = "koinos_push_dismissed_until";
const DISMISS_DAYS = 7;

interface PushPermissionBannerProps {
  memberId: string;
}

export function PushPermissionBanner({ memberId }: PushPermissionBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Não mostra se já tem permissão
    if (getPushPermissionStatus() !== "default") return;

    // Não mostra se foi dispensado recentemente
    const dismissedUntil = localStorage.getItem(DISMISSED_KEY);
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) return;

    // Não mostra se OneSignal não está configurado
    if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) return;

    // Inicializa o SDK e exibe o banner com pequeno delay
    initOneSignal(memberId).then(() => {
      setTimeout(() => setVisible(true), 2000);
    });
  }, [memberId]);

  function handleActivate() {
    requestPushPermission().catch(() => {});
    setVisible(false);
  }

  function handleDismiss() {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISSED_KEY, String(until));
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm"
        >
          <div className="rounded-xl border border-border bg-card shadow-lg p-4 flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2 shrink-0">
              <Bell className="size-4 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug">
                Ative as notificações
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Não perca nada da sua igreja. Escalas, avisos e novidades direto
                aqui.
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleActivate}
                  className="h-7 text-xs px-3"
                >
                  Ativar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="h-7 text-xs px-3"
                >
                  Agora não
                </Button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Fechar"
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
