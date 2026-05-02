"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";
import { checkFeatureAccess } from "@/actions/billing";
import Link from "next/link";

interface PremiumGateProps {
  /** Chave da feature (verificação via subscriptions/feature_flags). */
  feature: string;
  children: React.ReactNode;
}

/**
 * Protege conteúdo premium. Verifica com server se há acesso.
 */
export function PremiumGate({ feature, children }: PremiumGateProps) {
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  useEffect(() => {
    checkFeatureAccess(feature).then(setIsPremium);
  }, [feature]);

  if (isPremium === null) {
    return (
      <div className="h-24 flex items-center justify-center animate-pulse bg-muted rounded-xl" />
    );
  }

  if (!isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 p-12 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
          <Lock className="h-6 w-6 text-amber-500" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Recurso Premium</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Faça upgrade do seu plano para acessar recursos avançados.
          </p>
          <Link
            href="/dashboard/configuracoes/plano"
            className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-amber-700"
          >
            Ver Planos
          </Link>
        </div>
      </motion.div>
    );
  }

  return <>{children}</>;
}
