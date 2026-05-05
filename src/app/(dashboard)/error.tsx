"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Erro no dashboard:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: "oklch(from var(--destructive) l c h / 0.1)" }}
      >
        <AlertTriangle
          className="size-6"
          style={{ color: "var(--destructive)" }}
          aria-hidden="true"
        />
      </div>

      <h2
        className="text-xl font-semibold mb-2"
        style={{ color: "var(--foreground)" }}
      >
        Algo deu errado
      </h2>
      <p
        className="text-sm leading-relaxed mb-8 max-w-sm"
        style={{ color: "var(--muted-foreground)" }}
      >
        Não foi possível carregar esta página. Tente novamente ou volte ao
        início.
        {error.digest && (
          <span
            className="block mt-2 text-xs font-mono"
            style={{ color: "oklch(from var(--muted-foreground) l c h / 0.6)" }}
          >
            ref: {error.digest}
          </span>
        )}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          style={{
            background: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Tentar novamente
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          style={{ color: "var(--foreground)" }}
        >
          <Home className="size-4" aria-hidden="true" />
          Início
        </Link>
      </div>
    </div>
  );
}
