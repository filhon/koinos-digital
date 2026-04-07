"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { enrollTotp, verifyAndActivateTotp, unenrollTotp } from "@/actions/mfa";
import { createClient } from "@/lib/supabase/client";

interface Props {
  activeFactor: { id: string } | null;
}

type Step = "idle" | "qr" | "confirm" | "done";

export default function SecurityPanel({ activeFactor }: Props) {
  const [step, setStep] = useState<Step>("idle");
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [code, setCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleStart() {
    setError(null);
    startTransition(async () => {
      const result = await enrollTotp();
      if (!result.success) {
        setError(result.error);
        return;
      }
      setFactorId(result.factorId);
      setQrCode(result.qrCode);
      setSecret(result.secret);
      setStep("qr");
    });
  }

  function handleConfirm() {
    if (code.length !== 6) {
      setError("Digite os 6 dígitos do código.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await verifyAndActivateTotp(factorId, code);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setStep("done");
    });
  }

  async function handleDisable() {
    if (!activeFactor) return;
    setError(null);

    // Reautentica com senha antes de desativar
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      setError("Sessão inválida.");
      return;
    }

    startTransition(async () => {
      const { error: reauthErr } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: disablePassword,
      });
      if (reauthErr) {
        setError("Senha incorreta. Confirme sua senha para desativar o 2FA.");
        return;
      }

      const result = await unenrollTotp(activeFactor.id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      // Recarrega a página para refletir o estado
      window.location.reload();
    });
  }

  // Estado: 2FA já ativo
  if (activeFactor && step !== "done") {
    return (
      <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="h-6 w-6 text-green-600" />
          <div>
            <p className="font-semibold text-green-900">2FA ativo</p>
            <p className="text-sm text-green-700">
              Sua conta está protegida com autenticação em dois fatores.
            </p>
          </div>
        </div>

        {!showDisableForm ? (
          <button
            onClick={() => setShowDisableForm(true)}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 transition-colors"
          >
            <ShieldOff className="h-4 w-4" />
            Desativar 2FA
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-gray-600">
              Confirme sua senha para desativar o 2FA:
            </p>
            <input
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              placeholder="Sua senha atual"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            />
            {error && (
              <p className="flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleDisable}
                disabled={isPending || !disablePassword}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirmar desativação
              </button>
              <button
                onClick={() => {
                  setShowDisableForm(false);
                  setError(null);
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Step: idle */}
      {step === "idle" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-6 w-6 text-gray-400" />
            <div>
              <p className="font-semibold text-gray-900">
                Autenticação em dois fatores
              </p>
              <p className="text-sm text-gray-500">
                Adicione uma camada extra de segurança à sua conta.
              </p>
            </div>
          </div>
          {error && (
            <p className="mb-4 flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
          <button
            onClick={handleStart}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "oklch(0.205 0 0)" }}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Ativar 2FA
          </button>
        </div>
      )}

      {/* Step: QR */}
      {step === "qr" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
          <p className="font-semibold text-gray-900">
            1. Escaneie o QR code no seu aplicativo
          </p>
          <p className="text-sm text-gray-500">
            Use Google Authenticator, Authy ou qualquer app compatível com TOTP.
          </p>

          {qrCode && (
            <div className="flex justify-center">
              {/* qrCode é um SVG data URI ou uma imagem base64 */}
              <Image
                src={qrCode}
                alt="QR Code 2FA"
                width={200}
                height={200}
                unoptimized
                className="rounded-lg border border-gray-100"
              />
            </div>
          )}

          <div>
            <p className="mb-1 text-xs text-gray-500">
              Ou insira o código manualmente:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-gray-50 border border-gray-200 px-3 py-2 text-xs font-mono tracking-widest break-all">
                {showSecret ? secret : "••••••••••••••••••••••••••••••••"}
              </code>
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showSecret ? "Ocultar" : "Mostrar"}
              >
                {showSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              setStep("confirm");
              setError(null);
            }}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "oklch(0.205 0 0)" }}
          >
            Já escaneei — continuar
          </button>
        </div>
      )}

      {/* Step: confirm code */}
      {step === "confirm" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
          <p className="font-semibold text-gray-900">
            2. Digite o código gerado pelo aplicativo
          </p>
          <p className="text-sm text-gray-500">
            Insira o código de 6 dígitos exibido no seu app para confirmar a
            ativação.
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          />
          {error && (
            <p className="flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={isPending || code.length !== 6}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "oklch(0.205 0 0)" }}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Ativar 2FA
            </button>
            <button
              onClick={() => setStep("qr")}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      )}

      {/* Step: done */}
      {step === "done" && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">
                2FA ativado com sucesso!
              </p>
              <p className="text-sm text-green-700">
                Sua conta agora exige verificação a cada login.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
