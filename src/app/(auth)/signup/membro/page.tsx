"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Link2,
  MessageCircle,
  AlertCircle,
} from "lucide-react";

export default function SignupMembroPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Cole o link ou código do convite antes de continuar.");
      return;
    }
    // Aceita URL completa ou só o código
    const match = trimmed.match(/convite\/([a-z0-9]+)/i);
    const finalCode = match ? match[1] : trimmed;
    router.push(`/convite/${finalCode}`);
  }

  return (
    <div className="w-full">
      <Link
        href="/signup"
        className="mb-6 inline-flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Entrar como Membro
        </h1>
        <p className="mt-1 text-sm text-gray-500 leading-relaxed">
          Para criar sua conta no Koinos como membro, você precisa de um{" "}
          <strong className="text-gray-700">link de convite</strong> gerado pela
          liderança da sua igreja.
        </p>
      </div>

      {/* Tem link de convite */}
      <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
            <Link2 className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Tenho um link de convite
            </p>
            <p className="text-xs text-gray-500">
              Cole o link ou o código abaixo
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
            placeholder="https://koinos.app/convite/abc123 ou abc123"
            className={`w-full rounded-lg border px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:ring-2 focus:ring-offset-0 ${
              error
                ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
                : "border-gray-200 bg-white focus:border-gray-400 focus:ring-gray-100"
            }`}
          />
          {error && (
            <p className="flex items-center gap-1.5 text-xs text-red-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          )}
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-88"
          >
            Continuar
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Não tem link de convite */}
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200">
            <MessageCircle className="h-4 w-4 text-gray-500" />
          </div>
          <p className="text-sm font-semibold text-gray-700">
            Não tenho um link de convite
          </p>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          Peça ao pastor ou líder responsável da sua igreja para gerar um
          convite pelo painel do Koinos. O link pode ser gerado em{" "}
          <strong className="text-gray-600">Configurações → Convites</strong>.
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        Já tem uma conta?{" "}
        <Link
          href="/login"
          className="font-medium text-gray-900 hover:underline"
        >
          Fazer login
        </Link>
      </p>
    </div>
  );
}
