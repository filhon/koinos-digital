"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// global-error.tsx substitui o layout raiz — precisa incluir <html><body>
export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Erro crítico:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "oklch(0.98 0.003 240)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "24rem", width: "100%" }}>
          <div
            style={{
              width: "3rem",
              height: "3rem",
              borderRadius: "1rem",
              background: "oklch(0.95 0.02 25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
            }}
          >
            <AlertTriangle
              style={{
                width: "1.5rem",
                height: "1.5rem",
                color: "oklch(0.55 0.18 25)",
              }}
              aria-hidden="true"
            />
          </div>

          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              margin: "0 0 0.5rem",
              color: "oklch(0.2 0.01 240)",
            }}
          >
            Algo deu errado
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              lineHeight: 1.6,
              color: "oklch(0.5 0.01 240)",
              margin: "0 0 2rem",
            }}
          >
            Ocorreu um erro inesperado. Tente recarregar ou volte ao início.
            {error.digest && (
              <>
                <br />
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontFamily: "monospace",
                    color: "oklch(0.65 0.01 240)",
                  }}
                >
                  Código: {error.digest}
                </span>
              </>
            )}
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              alignItems: "center",
            }}
          >
            <button
              onClick={reset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                borderRadius: "0.5rem",
                padding: "0.625rem 1rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
                border: "none",
                background: "oklch(0.45 0.18 240)",
                color: "oklch(0.99 0.005 240)",
                width: "100%",
                justifyContent: "center",
              }}
            >
              <RefreshCw
                style={{ width: "1rem", height: "1rem" }}
                aria-hidden="true"
              />
              Tentar novamente
            </button>
            <Link
              href="/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                borderRadius: "0.5rem",
                border: "1px solid oklch(0.88 0.01 240)",
                padding: "0.625rem 1rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
                color: "oklch(0.3 0.01 240)",
                width: "100%",
                justifyContent: "center",
                boxSizing: "border-box",
              }}
            >
              <Home
                style={{ width: "1rem", height: "1rem" }}
                aria-hidden="true"
              />
              Ir para o início
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
