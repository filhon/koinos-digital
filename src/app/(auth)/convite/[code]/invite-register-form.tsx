"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  AtSign,
  X,
} from "lucide-react";

import {
  registerMemberSchema,
  LGPD_PURPOSES,
  LGPD_LABELS,
  type RegisterMemberInput,
} from "@/lib/validators/onboarding";
import { registerMember } from "@/actions/onboarding";
import { suggestUsername, checkUsernameAvailability } from "@/actions/profile";
import { Turnstile } from "@marsidev/react-turnstile";
import { formatCPF, formatPhone } from "@/lib/utils/cpf";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { CURRENT_TERMS_VERSION } from "@/lib/constants/legal";

// ─── Username availability indicator ─────────────────────────────────────────

type UsernameAvailState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available" }
  | { status: "unavailable"; message?: string };

function UsernameIndicator({ state }: { state: UsernameAvailState }) {
  if (state.status === "idle") return null;
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={state.status}
        initial={{ opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="flex items-center gap-1"
      >
        {state.status === "checking" && (
          <>
            <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
            <span className="text-xs text-gray-400">Verificando...</span>
          </>
        )}
        {state.status === "available" && (
          <>
            <Check className="h-3 w-3 text-green-600" />
            <span className="text-xs font-medium text-green-700">
              Disponível
            </span>
          </>
        )}
        {state.status === "unavailable" && (
          <>
            <X className="h-3 w-3 text-red-500" />
            <span className="text-xs text-red-600">
              {state.message ?? "Já está em uso"}
            </span>
          </>
        )}
      </motion.span>
    </AnimatePresence>
  );
}

const TERMS_VERSION = CURRENT_TERMS_VERSION;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

function inputCls(hasError?: boolean) {
  return `w-full rounded-lg border px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:ring-2 focus:ring-offset-0 ${
    hasError
      ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
      : "border-gray-200 bg-white focus:border-gray-400 focus:ring-gray-100"
  }`;
}

interface Props {
  inviteCode: string;
  churchName: string;
}

export function InviteRegisterForm({ inviteCode }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [showPw, setShowPw] = useState(false);
  const [consents, setConsents] = useState<Record<string, boolean>>(
    Object.fromEntries(LGPD_PURPOSES.map((p) => [p, false]))
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isDev = process.env.NODE_ENV === "development";
  const turnstileToken = useRef<string>(isDev ? "dev-bypass" : "");
  const [turnstileReady, setTurnstileReady] = useState(isDev);
  const [usernameValue, setUsernameValue] = useState("");
  const [usernameAvail, setUsernameAvail] = useState<UsernameAvailState>({
    status: "idle",
  });
  const nameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const usernameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerMemberSchema),
    defaultValues: {
      inviteCode,
      termsVersion: TERMS_VERSION,
      name: "",
      username: "",
      cpf: "",
      email: "",
      password: "",
      phone: "",
      consents: Object.fromEntries(
        LGPD_PURPOSES.map((p) => [p, false])
      ) as Record<(typeof LGPD_PURPOSES)[number], boolean>,
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const nameValue = watch("name");

  const checkAvail = useCallback(async (u: string) => {
    if (u.length < 3) {
      setUsernameAvail({ status: "idle" });
      return;
    }
    setUsernameAvail({ status: "checking" });
    const result = await checkUsernameAvailability(u);
    setUsernameAvail(
      result.available
        ? { status: "available" }
        : { status: "unavailable", message: result.error }
    );
  }, []);

  // Sugestão automática ao preencher o nome
  useEffect(() => {
    if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
    if (!nameValue || nameValue.length < 3) return;

    nameDebounceRef.current = setTimeout(async () => {
      if (usernameValue.length > 0) return;
      const suggestion = await suggestUsername(nameValue);
      if (suggestion) {
        setUsernameValue(suggestion);
        setValue("username", suggestion, { shouldValidate: false });
        checkAvail(suggestion);
      }
    }, 500);

    return () => {
      if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
    };
  }, [nameValue, usernameValue, setValue, checkAvail]);

  function handleUsernameInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, "");
    setUsernameValue(raw);
    setValue("username", raw, { shouldValidate: false });
    setUsernameAvail({ status: "idle" });

    if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
    if (raw.length >= 3) {
      usernameDebounceRef.current = setTimeout(() => checkAvail(raw), 500);
    }
  }

  async function goToStep2() {
    const valid = await trigger([
      "name",
      "username",
      "cpf",
      "email",
      "password",
      "phone",
    ]);
    if (valid) setStep(2);
  }

  function toggleConsent(purpose: string) {
    const next = !consents[purpose];
    setConsents((prev) => ({ ...prev, [purpose]: next }));
    setValue(`consents.${purpose as (typeof LGPD_PURPOSES)[number]}`, next);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function onSubmit(data: any) {
    setServerError(null);
    startTransition(async () => {
      const result = await registerMember({
        ...(data as RegisterMemberInput),
        turnstileToken: turnstileToken.current,
      });
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      router.push(result.redirectTo ?? "/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Hidden fields */}
      <input type="hidden" {...register("inviteCode")} />
      <input type="hidden" {...register("termsVersion")} />

      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                step >= s
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {step > s ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : s}
            </div>
            <span
              className={`text-xs font-medium transition-colors ${
                step >= s ? "text-gray-700" : "text-gray-400"
              }`}
            >
              {s === 1 ? "Seus dados" : "Consentimentos LGPD"}
            </span>
            {s < 2 && <div className="mx-1 h-px w-6 bg-gray-200" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
            className="space-y-5"
          >
            {/* Nome */}
            <motion.div variants={staggerItem}>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Nome completo
              </label>
              <input
                type="text"
                autoComplete="name"
                placeholder="João da Silva"
                {...register("name")}
                className={inputCls(!!errors.name)}
              />
              <FieldError message={errors.name?.message} />
            </motion.div>

            {/* Username */}
            <motion.div variants={staggerItem}>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Nome de usuário
              </label>
              <div className="relative">
                <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  autoComplete="off"
                  autoCapitalize="none"
                  placeholder="joaosilva"
                  value={usernameValue}
                  maxLength={30}
                  {...register("username")}
                  onChange={handleUsernameInput}
                  className={`${inputCls(
                    !!(errors as Record<string, unknown>).username ||
                      usernameAvail.status === "unavailable"
                  )} pl-9`}
                />
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                {(errors as Record<string, { message?: string }>).username
                  ?.message ? (
                  <FieldError
                    message={
                      (errors as Record<string, { message?: string }>).username
                        ?.message
                    }
                  />
                ) : (
                  <UsernameIndicator state={usernameAvail} />
                )}
                {!(errors as Record<string, unknown>).username &&
                  usernameAvail.status === "idle" && (
                    <p className="text-xs text-gray-400">
                      Sugerido automaticamente com base no seu nome
                    </p>
                  )}
              </div>
            </motion.div>

            {/* CPF */}
            <motion.div variants={staggerItem}>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                CPF
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                maxLength={14}
                {...register("cpf")}
                onChange={(e) => {
                  const fmt = formatCPF(e.target.value);
                  setValue("cpf", fmt, { shouldValidate: false });
                  e.target.value = fmt;
                }}
                className={inputCls(!!errors.cpf)}
              />
              <FieldError message={errors.cpf?.message} />
            </motion.div>

            {/* Email */}
            <motion.div variants={staggerItem}>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="voce@exemplo.com"
                {...register("email")}
                className={inputCls(!!errors.email)}
              />
              <FieldError message={errors.email?.message} />
            </motion.div>

            {/* Senha */}
            <motion.div variants={staggerItem}>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Mín. 8 caracteres, 1 maiúscula, 1 número"
                  {...register("password")}
                  className={`${inputCls(!!errors.password)} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <FieldError message={errors.password?.message} />
            </motion.div>

            {/* Telefone */}
            <motion.div variants={staggerItem}>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Telefone{" "}
                <span className="text-gray-400 text-xs">(opcional)</span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="(11) 99999-9999"
                maxLength={15}
                {...register("phone")}
                onChange={(e) => {
                  const fmt = formatPhone(e.target.value);
                  setValue("phone", fmt, { shouldValidate: false });
                  e.target.value = fmt;
                }}
                className={inputCls(!!errors.phone)}
              />
              <FieldError message={errors.phone?.message} />
            </motion.div>

            <motion.div variants={staggerItem} className="pt-1">
              <button
                type="button"
                onClick={goToStep2}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-85"
              >
                Continuar
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, x: 16, transition: { duration: 0.15 } }}
            className="space-y-5"
          >
            {/* Consentimentos LGPD */}
            <motion.div variants={staggerItem} className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                Como utilizaremos seus dados
              </p>
              {LGPD_PURPOSES.map((purpose) => {
                const { title, description } = LGPD_LABELS[purpose];
                const isRequired = purpose === "cadastro";
                const checked = consents[purpose];

                return (
                  <label
                    key={purpose}
                    htmlFor={`consent-${purpose}`}
                    className={`flex cursor-pointer gap-3 rounded-xl border p-3.5 transition-colors ${
                      checked
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                          checked
                            ? "border-gray-900 bg-gray-900"
                            : "border-gray-300"
                        }`}
                      >
                        {checked && (
                          <Check
                            className="h-3 w-3 text-white"
                            strokeWidth={3}
                          />
                        )}
                      </div>
                      <input
                        id={`consent-${purpose}`}
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggleConsent(purpose)}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {title}
                        {isRequired && (
                          <span className="ml-1.5 rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                            Obrigatório
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">
                        {description}
                      </p>
                    </div>
                  </label>
                );
              })}
              <FieldError
                message={
                  errors.consents?.root?.message ?? errors.consents?.message
                }
              />
              <p className="mt-2 text-xs text-gray-500">
                Ao se cadastrar, você concorda com os{" "}
                <a
                  href="/termos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-gray-700 underline underline-offset-2 hover:text-gray-900"
                >
                  Termos de Uso
                </a>{" "}
                e a{" "}
                <a
                  href="/privacidade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-gray-700 underline underline-offset-2 hover:text-gray-900"
                >
                  Política de Privacidade
                </a>{" "}
                do Koinos.
              </p>
            </motion.div>

            {/* Turnstile */}
            {!isDev && (
              <motion.div
                variants={staggerItem}
                className="w-full overflow-hidden rounded-[6px]"
              >
                <Turnstile
                  siteKey={
                    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ??
                    "1x00000000000000000000AA"
                  }
                  options={{
                    theme: "light",
                    appearance: "always",
                    size: "flexible",
                  }}
                  style={{ width: "100%" }}
                  onSuccess={(token) => {
                    turnstileToken.current = token;
                    setTurnstileReady(true);
                  }}
                  onError={() => setTurnstileReady(false)}
                  onExpire={() => setTurnstileReady(false)}
                />
              </motion.div>
            )}

            {/* Server error */}
            {serverError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="text-sm text-red-700">{serverError}</p>
              </motion.div>
            )}

            <motion.div variants={staggerItem} className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
              <button
                type="submit"
                disabled={isPending || !turnstileReady}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Entrar na comunidade
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
