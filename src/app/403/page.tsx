import Link from "next/link";
import { ShieldX } from "lucide-react";

export const metadata = { title: "Acesso negado — Koinos" };

export default function ForbiddenPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 px-6 text-center"
      style={{ background: "var(--surface-0)" }}
    >
      <div
        className="flex items-center justify-center rounded-full size-20"
        style={{ background: "var(--surface-1)" }}
      >
        <ShieldX
          className="size-10"
          style={{ color: "var(--color-warning)" }}
          aria-hidden="true"
        />
      </div>

      <div className="space-y-2 max-w-sm">
        <p
          className="text-sm font-semibold uppercase tracking-widest"
          style={{ color: "var(--color-warning)" }}
        >
          Erro 403
        </p>
        <h1
          className="text-2xl font-bold"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--foreground)",
          }}
        >
          Acesso negado
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          Você não tem permissão para acessar esta página.
          Entre em contato com o pastor ou administrador da sua igreja caso acredite que isso é um erro.
        </p>
      </div>

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
        style={{
          background: "var(--primary)",
          color: "var(--primary-foreground)",
        }}
      >
        Voltar ao início
      </Link>
    </div>
  );
}
