import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export const metadata = { title: "Página não encontrada — Koinos" };

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "var(--surface-0)" }}
    >
      {/* Número grande tipográfico */}
      <div
        className="select-none leading-none mb-6"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(6rem, 20vw, 14rem)",
          color: "oklch(from var(--primary) l c h / 0.08)",
          letterSpacing: "-0.04em",
        }}
        aria-hidden="true"
      >
        404
      </div>

      <div className="max-w-sm -mt-12 relative z-10">
        <h1
          className="text-2xl font-semibold mb-2"
          style={{ color: "var(--foreground)" }}
        >
          Página não encontrada
        </h1>
        <p
          className="text-sm leading-relaxed mb-8"
          style={{ color: "var(--muted-foreground)" }}
        >
          O endereço que você buscou não existe ou foi movido. Verifique o link
          ou volte ao início.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            <Home className="size-4" aria-hidden="true" />
            Ir para o início
          </Link>
          <Link
            href="javascript:history.back()"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
            style={{ color: "var(--foreground)" }}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar
          </Link>
        </div>
      </div>

      {/* Marca discreta no rodapé */}
      <p
        className="absolute bottom-8 text-xs"
        style={{ color: "oklch(from var(--muted-foreground) l c h / 0.5)" }}
      >
        Koinos — Sistema de Gestão para Igrejas
      </p>
    </div>
  );
}
