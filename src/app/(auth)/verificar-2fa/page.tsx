"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { verifyMfaChallenge } from "@/actions/mfa";

export default function Verificar2FAPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleVerify() {
    if (code.length !== 6) {
      setError("Digite os 6 dígitos do código.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await verifyMfaChallenge(code);
      if (!result.success) {
        setError(result.error);
        return;
      }
      const next = searchParams.get("next") ?? "/dashboard";
      router.push(next);
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <ShieldCheck className="h-7 w-7 text-gray-700" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            Verificação em dois fatores
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Insira o código de 6 dígitos do seu aplicativo autenticador.
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            autoFocus
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] outline-none transition-all focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          />

          {error && (
            <p className="flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <button
            onClick={handleVerify}
            disabled={isPending || code.length !== 6}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "oklch(0.205 0 0)" }}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Verificar
          </button>
        </div>
      </div>
    </div>
  );
}
