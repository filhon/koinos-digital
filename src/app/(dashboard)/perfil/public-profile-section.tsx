"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, ExternalLink, User, AtSign } from "lucide-react";
import { toast } from "sonner";
import {
  checkUsernameAvailability,
  updateUsername,
  updatePublicVisibility,
} from "@/actions/profile";
import type { MemberProfile } from "@/actions/profile";

// ─── Types ─────────────────────────────────────────────────────────────────────

type AvailabilityState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available" }
  | { status: "unavailable"; message?: string }
  | { status: "error"; message: string };

// ─── UsernameAvailabilityIndicator ────────────────────────────────────────────

function UsernameAvailabilityIndicator({
  state,
}: {
  state: AvailabilityState;
}) {
  if (state.status === "idle") return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state.status}
        initial={{ opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="flex items-center gap-1.5"
      >
        {state.status === "checking" && (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[oklch(0.52_0.016_220)]" />
            <span className="text-xs text-[oklch(0.52_0.016_220)]">
              Verificando...
            </span>
          </>
        )}
        {state.status === "available" && (
          <>
            <Check className="h-3.5 w-3.5 text-[oklch(0.55_0.118_148)]" />
            <span className="text-xs font-medium text-[oklch(0.55_0.118_148)]">
              Disponível
            </span>
          </>
        )}
        {(state.status === "unavailable" || state.status === "error") && (
          <>
            <X className="h-3.5 w-3.5 text-[oklch(0.55_0.148_28)]" />
            <span className="text-xs text-[oklch(0.55_0.148_28)]">
              {state.status === "unavailable"
                ? (state.message ?? "Já está em uso")
                : state.message}
            </span>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── VisibilityToggle ─────────────────────────────────────────────────────────

function VisibilityToggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="flex cursor-pointer items-start gap-3"
      onClick={() => !disabled && onChange(!checked)}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          onChange(!checked);
        }}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.148_58/0.4)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? "bg-primary-700" : "bg-[oklch(0.88_0.01_220)]"
        }`}
      >
        <span
          className={`absolute inset-y-0.5 left-0.5 h-4 w-4 rounded-full bg-[oklch(0.995_0.002_70)] shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium transition-colors duration-200 ${checked ? "text-[oklch(0.18_0.012_230)]" : "text-[oklch(0.42_0.016_220)]"}`}
        >
          {label}
        </p>
        <p className="mt-0.5 text-xs text-[oklch(0.52_0.016_220)] leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

// ─── PublicProfileSection ─────────────────────────────────────────────────────

export function PublicProfileSection({ profile }: { profile: MemberProfile }) {
  const [username, setUsername] = useState(profile.username ?? "");
  const [availability, setAvailability] = useState<AvailabilityState>({
    status: "idle",
  });
  const [isSavingUsername, startSavingUsername] = useTransition();
  const [isSavingVisibility, startSavingVisibility] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [publicEmail, setPublicEmail] = useState(profile.public_email);
  const [publicPhone, setPublicPhone] = useState(profile.public_phone);
  const [publicBirthDate, setPublicBirthDate] = useState(
    profile.public_birth_date
  );

  const checkAvailability = useCallback(
    async (value: string) => {
      if (value === profile.username) {
        setAvailability({ status: "idle" });
        return;
      }
      if (value.length < 3) {
        setAvailability({ status: "idle" });
        return;
      }
      setAvailability({ status: "checking" });
      const result = await checkUsernameAvailability(value);
      if (result.available) {
        setAvailability({ status: "available" });
      } else {
        setAvailability({
          status: "unavailable",
          message: result.error,
        });
      }
    },
    [profile.username]
  );

  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, "");
    setUsername(raw);
    setAvailability({ status: "idle" });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (raw.length >= 3) {
      debounceRef.current = setTimeout(() => checkAvailability(raw), 500);
    }
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleSaveUsername() {
    if (availability.status !== "available" && username !== profile.username) {
      return;
    }
    startSavingUsername(async () => {
      const result = await updateUsername(username);
      if (result.success) {
        toast.success("Username atualizado!");
        setAvailability({ status: "idle" });
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleVisibilityChange(
    field: "email" | "phone" | "birth_date",
    value: boolean
  ) {
    if (field === "email") setPublicEmail(value);
    if (field === "phone") setPublicPhone(value);
    if (field === "birth_date") setPublicBirthDate(value);

    const next = {
      public_email: field === "email" ? value : publicEmail,
      public_phone: field === "phone" ? value : publicPhone,
      public_birth_date: field === "birth_date" ? value : publicBirthDate,
    };

    startSavingVisibility(async () => {
      const result = await updatePublicVisibility(next);
      if (!result.success) {
        toast.error(result.error);
        // Reverte
        if (field === "email") setPublicEmail(!value);
        if (field === "phone") setPublicPhone(!value);
        if (field === "birth_date") setPublicBirthDate(!value);
      }
    });
  }

  const canSave =
    username.length >= 3 &&
    (username === profile.username || availability.status === "available") &&
    !isSavingUsername;

  const usernameInputError =
    username.length > 0 && username.length < 3 && "Mínimo 3 caracteres";

  const hasUsername = !!profile.username;

  return (
    <div className="rounded-2xl border border-[oklch(0.88_0.01_220/0.6)] bg-[oklch(0.99_0.003_75)] shadow-[0_2px_4px_oklch(0.32_0.096_224/0.06),0_4px_12px_oklch(0.32_0.096_224/0.05)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-[oklch(0.88_0.01_220/0.6)] px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-accent-500" />
            <h2 className="font-display text-[1.125rem] tracking-[-0.01em] text-[oklch(0.18_0.012_230)]">
              Perfil público
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-[oklch(0.52_0.016_220)]">
            Como os outros membros veem você na comunidade
          </p>
        </div>
        {hasUsername && (
          <Link
            href={`/${profile.username}`}
            target="_blank"
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.01_220)] px-3 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-[oklch(0.982_0.004_80)]"
          >
            <ExternalLink className="h-3 w-3" />
            Ver perfil
          </Link>
        )}
      </div>

      <div className="divide-y divide-[oklch(0.88_0.01_220/0.5)]">
        {/* Username */}
        <div className="px-5 py-5">
          <label
            htmlFor="username-input"
            className="mb-2 block text-sm font-medium text-[oklch(0.18_0.012_230)]"
          >
            Nome de usuário
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[oklch(0.52_0.016_220)]" />
              <input
                id="username-input"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                maxLength={30}
                placeholder="seu.username"
                autoComplete="off"
                autoCapitalize="none"
                className={`h-10 w-full rounded-xl border pl-9 pr-3 text-sm text-[oklch(0.18_0.012_230)] placeholder:text-[oklch(0.52_0.016_220)] outline-none transition-all focus:ring-2 focus:ring-offset-0 ${
                  usernameInputError || availability.status === "unavailable"
                    ? "border-[oklch(0.55_0.148_28)] bg-[oklch(0.97_0.005_28/0.4)] focus:border-[oklch(0.55_0.148_28)] focus:ring-[oklch(0.55_0.148_28/0.2)]"
                    : availability.status === "available"
                      ? "border-[oklch(0.55_0.118_148)] bg-white focus:border-[oklch(0.55_0.118_148)] focus:ring-[oklch(0.55_0.118_148/0.2)]"
                      : "border-[oklch(0.88_0.01_220)] bg-white focus:border-accent-500 focus:ring-[oklch(0.62_0.148_58/0.2)]"
                }`}
              />
            </div>
            <button
              type="button"
              onClick={handleSaveUsername}
              disabled={!canSave}
              className="h-10 rounded-xl bg-primary-700 px-4 text-sm font-medium text-[oklch(0.97_0.006_220)] transition-all disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:brightness-90 active:enabled:scale-[0.97]"
            >
              {isSavingUsername ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Salvar"
              )}
            </button>
          </div>

          {/* Availability + format error */}
          <div className="mt-2">
            {usernameInputError ? (
              <p className="flex items-center gap-1.5 text-xs text-[oklch(0.55_0.148_28)]">
                <X className="h-3.5 w-3.5" />
                {usernameInputError}
              </p>
            ) : (
              <UsernameAvailabilityIndicator state={availability} />
            )}
            {!usernameInputError && availability.status === "idle" && (
              <p className="text-xs text-[oklch(0.52_0.016_220)]">
                Apenas letras minúsculas, números, ponto e underscore.
                {!hasUsername && (
                  <span className="ml-1 font-medium text-accent-500">
                    Defina o seu para ativar o perfil público.
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Visibilidade de dados opcionais */}
        <div className="px-5 py-5">
          <p className="mb-4 text-sm font-medium text-[oklch(0.18_0.012_230)]">
            Dados visíveis no perfil público
          </p>
          <div className="flex flex-col gap-4">
            <VisibilityToggle
              label="Endereço de e-mail"
              description="Outros membros poderão ver e entrar em contato pelo seu e-mail."
              checked={publicEmail}
              onChange={(v) => handleVisibilityChange("email", v)}
              disabled={isSavingVisibility}
            />
            <VisibilityToggle
              label="Telefone"
              description="Seu número de celular ficará visível no seu perfil público."
              checked={publicPhone}
              onChange={(v) => handleVisibilityChange("phone", v)}
              disabled={isSavingVisibility}
            />
            <VisibilityToggle
              label="Data de nascimento"
              description="Sua data de nascimento aparecerá no seu perfil."
              checked={publicBirthDate}
              onChange={(v) => handleVisibilityChange("birth_date", v)}
              disabled={isSavingVisibility}
            />
          </div>

          {isSavingVisibility && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-[oklch(0.52_0.016_220)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Salvando...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
