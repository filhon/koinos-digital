"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { X, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ShopItemWithStatus } from "@/lib/validators/shop";

// ─── Celebration burst ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  angle: (i / 12) * 360,
  distance: 48 + Math.sin(i * 1.2) * 16,
  size: 4 + (i % 3) * 2,
  color: i % 2 === 0 ? "oklch(0.78 0.14 82)" : "oklch(0.32 0.096 224)",
}));

// ─── PurchaseDialog ───────────────────────────────────────────────────────────

interface PurchaseDialogProps {
  item: ShopItemWithStatus;
  walletBalance: number;
  isPurchasing: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function PurchaseDialog({
  item,
  walletBalance,
  isPurchasing,
  onConfirm,
  onClose,
}: PurchaseDialogProps) {
  const afterBalance = walletBalance - item.price;
  const canAfford = walletBalance >= item.price;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-[oklch(0.12_0.04_230/0.55)] p-4 backdrop-blur-sm sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-[oklch(0.995_0.002_70)] shadow-xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[oklch(0.88_0.01_220)/0.6] p-5">
          <div>
            <h2 className="font-display text-lg font-semibold leading-tight text-[oklch(0.18_0.012_230)]">
              Confirmar compra
            </h2>
            <p className="mt-0.5 text-sm text-[oklch(0.52_0.016_220)]">
              {item.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[oklch(0.52_0.016_220)] transition-colors hover:bg-[oklch(0.94_0.008_220)] hover:text-[oklch(0.18_0.012_230)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5">
          {/* Balance breakdown */}
          <div className="rounded-xl bg-[oklch(0.982_0.004_80)] p-4 text-sm">
            <div className="flex justify-between text-[oklch(0.52_0.016_220)]">
              <span>Saldo atual</span>
              <span className="font-medium text-[oklch(0.18_0.012_230)]">
                ⚡ {walletBalance.toLocaleString("pt-BR")}
              </span>
            </div>
            <div className="mt-1.5 flex justify-between text-[oklch(0.52_0.016_220)]">
              <span>Custo</span>
              <span className="font-medium text-[oklch(0.55_0.148_28)]">
                − ⚡ {item.price.toLocaleString("pt-BR")}
              </span>
            </div>
            <div className="mt-3 border-t border-[oklch(0.88_0.01_220)] pt-3 flex justify-between">
              <span className="font-semibold text-[oklch(0.18_0.012_230)]">
                Saldo após
              </span>
              <span
                className={
                  canAfford
                    ? "font-bold text-accent-500"
                    : "font-bold text-[oklch(0.55_0.148_28)]"
                }
              >
                ⚡ {Math.max(0, afterBalance).toLocaleString("pt-BR")}
              </span>
            </div>
          </div>

          {/* Insufficient funds warning */}
          {!canAfford && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 rounded-xl border border-[oklch(0.55_0.148_28/0.3)] bg-[oklch(0.55_0.148_28/0.06)] p-3.5"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[oklch(0.55_0.148_28)]" />
              <p className="text-xs text-[oklch(0.55_0.148_28)]">
                Talentos insuficientes. Você precisa de mais{" "}
                <strong>
                  {(item.price - walletBalance).toLocaleString("pt-BR")}
                </strong>{" "}
                Talentos para adquirir este item.
              </p>
            </motion.div>
          )}

          {/* Item description */}
          <p className="text-xs leading-relaxed text-[oklch(0.52_0.016_220)]">
            {item.description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-[oklch(0.88_0.01_220)/0.6] bg-[oklch(0.99_0.003_75)/0.5] p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isPurchasing}
            className="flex-1 rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={!canAfford || isPurchasing}
            className="flex-1 rounded-xl bg-primary-700 text-white hover:bg-[oklch(0.28_0.09_224)]"
          >
            {isPurchasing ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-3.5 w-3.5" />
            )}
            {isPurchasing ? "Comprando..." : "Confirmar"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
