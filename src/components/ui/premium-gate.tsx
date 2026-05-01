"use client";

import { Lock } from "lucide-react";
import { motion } from "framer-motion";

interface PremiumGateProps {
  /** Chave da feature (futuro: verificação via subscriptions/feature_flags). */
  feature: string;
  children: React.ReactNode;
}

/**
 * Protege conteúdo premium. Por ora é pass-through — quando o módulo de
 * billing (Fase 5) for implementado, este componente verificará a assinatura
 * e exibirá o paywall quando necessário.
 */
export function PremiumGate({ children }: PremiumGateProps) {
  // TODO (sessão 5.x): verificar subscriptions/feature_flags via useQuery
  const isPremium = true; // pass-through até billing estar implementado

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
            Faça upgrade do seu plano para acessar relatórios avançados.
          </p>
        </div>
      </motion.div>
    );
  }

  return <>{children}</>;
}
