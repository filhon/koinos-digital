"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  Check,
  Church,
  CheckCircle2,
  AtSign,
  X,
} from "lucide-react";
import Link from "next/link";
import { Turnstile } from "@marsidev/react-turnstile";

import {
  personalDataSchema,
  churchDataSchema,
  LGPD_PURPOSES,
  LGPD_LABELS,
  type PersonalDataInput,
  type ConsentInput,
  type ChurchDataInput,
  type CreateChurchInput,
} from "@/lib/validators/onboarding";
import {
  createChurch,
  lookupCnpj,
  type CnpjPrefill,
} from "@/actions/onboarding";
import { suggestUsername, checkUsernameAvailability } from "@/actions/profile";
import { formatCPF } from "@/lib/utils/cpf";
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
            <span className="text-xs text-green-700 font-medium">
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

// ─── Constants ────────────────────────────────────────────────────────────────

const TERMS_VERSION = CURRENT_TERMS_VERSION;

const STEPS = [
  { label: "Sua conta" },
  { label: "Privacidade" },
  { label: "Sua igreja" },
  { label: "Confirmar" },
] as const;

// ─── Field error helper ───────────────────────────────────────────────────────

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
  return `w-full rounded-lg border px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all
    focus:ring-2 focus:ring-offset-0
    ${
      hasError
        ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
        : "border-gray-200 bg-white focus:border-gray-400 focus:ring-gray-100"
    }`;
}

// ─── Pre-check ────────────────────────────────────────────────────────────────

function formatCNPJInput(value: string): string {
  const n = value.replace(/\D/g, "").slice(0, 14);
  if (n.length <= 2) return n;
  if (n.length <= 5) return `${n.slice(0, 2)}.${n.slice(2)}`;
  if (n.length <= 8) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5)}`;
  if (n.length <= 12)
    return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8)}`;
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}`;
}

function StepPreCheck({
  onNotFound,
}: {
  onNotFound: (prefill?: CnpjPrefill) => void;
}) {
  const [cnpj, setCnpj] = useState("");
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [foundName, setFoundName] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCNPJInput(e.target.value);
    setCnpj(formatted);
    setCnpjError(null);
    setFoundName(null);
  }

  function handleCheck() {
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length !== 14) {
      setCnpjError("Digite o CNPJ completo (14 dígitos).");
      return;
    }
    startTransition(async () => {
      const result = await lookupCnpj(cnpj);
      if (result.status === "already_registered") {
        setFoundName(result.churchName);
      } else if (result.status === "not_found") {
        setCnpjError(
          "CNPJ não encontrado na Receita Federal. Verifique e tente novamente."
        );
      } else if (result.status === "api_error") {
        setCnpjError(
          "Não foi possível consultar o CNPJ agora. Tente novamente ou prossiga sem verificação."
        );
      } else if (result.status === "ok") {
        onNotFound(result.prefill);
      }
    });
  }

  if (foundName) {
    return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.div
          variants={staggerItem}
          className="rounded-2xl border border-green-200 bg-green-50 p-5 space-y-3"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <p className="text-sm font-semibold text-green-900">
              Igreja encontrada no Koinos!
            </p>
          </div>
          <p className="text-sm text-green-800 leading-relaxed">
            <strong>{foundName}</strong> já está cadastrada. Para entrar, você
            precisa de um link de convite gerado pela liderança da sua igreja.
          </p>
        </motion.div>

        <motion.div variants={staggerItem} className="space-y-3">
          <Link
            href="/signup/membro"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-88"
          >
            Entrar como Membro
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => {
              setFoundName(null);
              setCnpjError(null);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Tentar outro CNPJ
          </button>
        </motion.div>

        <motion.div
          variants={staggerItem}
          className="rounded-xl border border-gray-100 bg-gray-50 p-4"
        >
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-700">
              Sou pastor e quero criar uma congregação.
            </strong>{" "}
            Peça ao administrador da matriz para cadastrá-la pelo painel em{" "}
            <strong className="text-gray-700">
              Configurações → Congregações
            </strong>
            .
          </p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      <motion.div variants={staggerItem}>
        <p className="text-sm text-gray-600 leading-relaxed">
          Antes de prosseguir, vamos verificar se sua igreja já está cadastrada
          no Koinos. Digite o <strong>CNPJ</strong> da sua igreja.
        </p>
      </motion.div>

      <motion.div variants={staggerItem}>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          CNPJ da igreja
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={cnpj}
          onChange={handleChange}
          maxLength={18}
          placeholder="00.000.000/0000-00"
          className={`w-full rounded-lg border px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:ring-2 focus:ring-offset-0 ${
            cnpjError
              ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
              : "border-gray-200 bg-white focus:border-gray-400 focus:ring-gray-100"
          }`}
        />
        {cnpjError ? (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {cnpjError}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-gray-400">
            Minha igreja não tem CNPJ?{" "}
            <button
              type="button"
              onClick={() => onNotFound(undefined)}
              className="font-medium text-gray-600 hover:underline"
            >
              Prosseguir assim mesmo
            </button>
          </p>
        )}
      </motion.div>

      <motion.div variants={staggerItem} className="flex gap-3 pt-1">
        <Link href="/signup" className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <button
          type="button"
          onClick={handleCheck}
          disabled={isPending || cnpj.replace(/\D/g, "").length !== 14}
          className="btn-primary flex flex-1 items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Verificar
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Step components ─────────────────────────────────────────────────────────

function StepPersonal({
  onNext,
  onBack,
}: {
  onNext: (data: PersonalDataInput) => void;
  onBack: () => void;
}) {
  const [showPw, setShowPw] = useState(false);
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
    setValue,
    watch,
    formState: { errors },
  } = useForm<PersonalDataInput>({ resolver: zodResolver(personalDataSchema) });

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

  // Sugestão automática ao preencher o nome (debounce 500ms)
  useEffect(() => {
    if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
    if (!nameValue || nameValue.length < 3) return;

    nameDebounceRef.current = setTimeout(async () => {
      // Só sugere se o campo username ainda estiver vazio ou inalterado pelo usuário
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

  const usernameInputError = errors.username?.message;

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="space-y-5"
      >
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
                !!usernameInputError || usernameAvail.status === "unavailable"
              )} pl-9`}
            />
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            {usernameInputError ? (
              <FieldError message={usernameInputError} />
            ) : (
              <UsernameIndicator state={usernameAvail} />
            )}
            {!usernameInputError && usernameAvail.status === "idle" && (
              <p className="text-xs text-gray-400">
                Sugerido automaticamente com base no seu nome
              </p>
            )}
          </div>
        </motion.div>

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

        <motion.div variants={staggerItem} className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <button
            type="submit"
            className="btn-primary flex flex-1 items-center justify-center gap-2"
          >
            Continuar
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </motion.div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function StepConsent({
  onNext,
  onBack,
}: {
  onNext: (data: ConsentInput) => void;
  onBack: () => void;
}) {
  const [consents, setConsents] = useState<Record<string, boolean>>(
    Object.fromEntries(LGPD_PURPOSES.map((p) => [p, false]))
  );
  const [error, setError] = useState<string | null>(null);

  function toggle(purpose: string) {
    setConsents((prev) => ({ ...prev, [purpose]: !prev[purpose] }));
    setError(null);
  }

  function handleNext() {
    if (!consents.cadastro) {
      setError(
        "O consentimento de cadastro é obrigatório para usar o sistema."
      );
      return;
    }
    onNext({
      consents: consents as Record<(typeof LGPD_PURPOSES)[number], boolean>,
      termsVersion: TERMS_VERSION,
    });
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={staggerItem}>
        <p className="text-sm text-gray-600 leading-relaxed">
          Para usar o Koinos, precisamos do seu consentimento sobre como usamos
          seus dados, conforme a{" "}
          <strong>Lei Geral de Proteção de Dados (LGPD)</strong>. Você pode
          revogar qualquer consentimento a qualquer momento nas configurações de
          privacidade.
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Ao continuar, você concorda com os{" "}
          <Link
            href="/termos"
            target="_blank"
            className="font-medium text-gray-700 underline underline-offset-2 hover:text-gray-900"
          >
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link
            href="/privacidade"
            target="_blank"
            className="font-medium text-gray-700 underline underline-offset-2 hover:text-gray-900"
          >
            Política de Privacidade
          </Link>{" "}
          do Koinos.
        </p>
      </motion.div>

      <div className="space-y-3">
        {LGPD_PURPOSES.map((purpose) => {
          const { title, description } = LGPD_LABELS[purpose];
          const isRequired = purpose === "cadastro";
          const checked = consents[purpose];

          return (
            <motion.label
              key={purpose}
              variants={staggerItem}
              htmlFor={`consent-${purpose}`}
              className={`flex cursor-pointer gap-4 rounded-xl border p-4 transition-colors ${
                checked
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                    checked ? "border-gray-900 bg-gray-900" : "border-gray-300"
                  }`}
                >
                  {checked && (
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  )}
                </div>
                <input
                  id={`consent-${purpose}`}
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => toggle(purpose)}
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
            </motion.label>
          );
        })}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="btn-primary flex flex-1 items-center justify-center gap-2"
        >
          Continuar
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function formatCNPJ(value: string): string {
  const n = value.replace(/\D/g, "").slice(0, 14);
  if (n.length <= 2) return n;
  if (n.length <= 5) return `${n.slice(0, 2)}.${n.slice(2)}`;
  if (n.length <= 8) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5)}`;
  if (n.length <= 12)
    return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8)}`;
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}`;
}

function formatPhone(value: string): string {
  const n = value.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n.length ? `(${n}` : "";
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10)
    return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

function formatZip(value: string): string {
  const n = value.replace(/\D/g, "").slice(0, 8);
  if (n.length <= 5) return n;
  return `${n.slice(0, 5)}-${n.slice(5)}`;
}

function StepChurch({
  onNext,
  onBack,
  defaultValues,
}: {
  onNext: (data: ChurchDataInput) => void;
  onBack: () => void;
  defaultValues?: DefaultValues<ChurchDataInput>;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
    // zodResolver infers the pre-transform input type; ChurchDataInput is the post-transform
    // output type. The cast is safe because the schema and type refer to the same shape.
  } = useForm<ChurchDataInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(churchDataSchema) as any,
  });

  useEffect(() => {
    if (defaultValues) reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addrErr = errors.address;

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="space-y-5"
      >
        <motion.div variants={staggerItem}>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Nome da igreja <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Igreja Batista Central"
            {...register("churchName")}
            className={inputCls(!!errors.churchName)}
          />
          <FieldError message={errors.churchName?.message} />
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          <motion.div variants={staggerItem}>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              CNPJ <span className="text-gray-400 text-xs">(opcional)</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="00.000.000/0000-00"
              maxLength={18}
              {...register("cnpj")}
              onChange={(e) => {
                const fmt = formatCNPJ(e.target.value);
                setValue("cnpj", fmt, { shouldValidate: false });
                e.target.value = fmt;
              }}
              className={inputCls(!!errors.cnpj)}
            />
            <FieldError message={errors.cnpj?.message} />
          </motion.div>

          <motion.div variants={staggerItem}>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Denominação
            </label>
            <input
              type="text"
              placeholder="Batista, Assembleia…"
              {...register("denomination")}
              className={inputCls(!!errors.denomination)}
            />
            <FieldError message={errors.denomination?.message} />
          </motion.div>
        </div>

        <motion.div variants={staggerItem}>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Telefone <span className="text-red-500">*</span>
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

        <motion.div variants={staggerItem}>
          <p className="mb-3 text-sm font-semibold text-gray-700">Endereço</p>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Rua / Avenida"
                  {...register("address.street")}
                  className={inputCls(!!addrErr?.street)}
                />
                <FieldError message={addrErr?.street?.message} />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Nº"
                  {...register("address.number")}
                  className={inputCls(!!addrErr?.number)}
                />
                <FieldError message={addrErr?.number?.message} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="Complemento"
                  {...register("address.complement")}
                  className={inputCls()}
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Bairro"
                  {...register("address.neighborhood")}
                  className={inputCls(!!addrErr?.neighborhood)}
                />
                <FieldError message={addrErr?.neighborhood?.message} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="CEP"
                  maxLength={9}
                  {...register("address.zip")}
                  onChange={(e) => {
                    const fmt = formatZip(e.target.value);
                    setValue("address.zip", fmt, { shouldValidate: false });
                    e.target.value = fmt;
                  }}
                  className={inputCls(!!addrErr?.zip)}
                />
                <FieldError message={addrErr?.zip?.message} />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Cidade"
                  {...register("address.city")}
                  className={inputCls(!!addrErr?.city)}
                />
                <FieldError message={addrErr?.city?.message} />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="UF"
                  maxLength={2}
                  {...register("address.state")}
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                  }}
                  className={inputCls(!!addrErr?.state)}
                />
                <FieldError message={addrErr?.state?.message} />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <button
            type="submit"
            className="btn-primary flex flex-1 items-center justify-center gap-2"
          >
            Revisar
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </motion.div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function StepConfirm({
  personal,
  consent,
  church,
  onBack,
  onConfirm,
  onTurnstileSuccess,
  onTurnstileError,
  turnstileReady,
  isPending,
  serverError,
  existingChurch,
}: {
  personal: PersonalDataInput;
  consent: ConsentInput;
  church: ChurchDataInput;
  onBack: () => void;
  onConfirm: () => void;
  onTurnstileSuccess: (token: string) => void;
  onTurnstileError: () => void;
  isPending: boolean;
  serverError: string | null;
  turnstileReady: boolean;
  isDev: boolean;
  existingChurch: { id: string; name: string } | null;
}) {
  const consentedPurposes = Object.entries(consent.consents)
    .filter(([, v]) => v)
    .map(([k]) => LGPD_LABELS[k as keyof typeof LGPD_LABELS]?.title ?? k);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* Dados pessoais */}
      <motion.div
        variants={staggerItem}
        className="rounded-xl border border-gray-200 p-4 space-y-2"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Sua conta
        </p>
        <p className="text-sm text-gray-900 font-medium">{personal.name}</p>
        <p className="text-sm text-gray-600">{personal.email}</p>
      </motion.div>

      {/* Dados da igreja */}
      <motion.div
        variants={staggerItem}
        className="rounded-xl border border-gray-200 p-4 space-y-2"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Igreja
        </p>
        <div className="flex items-center gap-2">
          <Church className="h-4 w-4 text-gray-500" />
          <p className="text-sm text-gray-900 font-medium">
            {church.churchName}
          </p>
        </div>
        {church.denomination && (
          <p className="text-sm text-gray-600">{church.denomination}</p>
        )}
        {church.cnpj && (
          <p className="text-sm text-gray-600">CNPJ: {church.cnpj}</p>
        )}
        <p className="text-sm text-gray-600">
          {church.address.street}, {church.address.number}
          {church.address.complement
            ? ` — ${church.address.complement}`
            : ""} · {church.address.neighborhood} · {church.address.city}/
          {church.address.state}
        </p>
      </motion.div>

      {/* Consentimentos */}
      <motion.div
        variants={staggerItem}
        className="rounded-xl border border-gray-200 p-4 space-y-2"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Consentimentos LGPD
        </p>
        <div className="flex flex-wrap gap-1.5">
          {consentedPurposes.map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700"
            >
              <Check className="h-3 w-3 text-green-600" strokeWidth={3} />
              {p}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-400">
          Termos versão {consent.termsVersion}
        </p>
      </motion.div>

      {serverError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {existingChurch ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-900">
                    {existingChurch.name} já está cadastrada!
                  </p>
                  <p className="text-sm text-green-800">
                    Você foi adicionado como visitante. A liderança poderá
                    atualizar seu papel.
                  </p>
                </div>
              </div>
              <Link
                href="/auth/login"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-88"
              >
                Fazer login
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-sm text-amber-800">{serverError}</p>
            </div>
          )}
        </motion.div>
      )}

      {process.env.NODE_ENV !== "development" && (
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
            onSuccess={onTurnstileSuccess}
            onError={onTurnstileError}
            onExpire={onTurnstileError}
          />
        </motion.div>
      )}

      <motion.div variants={staggerItem} className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending || !turnstileReady}
          className="btn-primary flex flex-1 items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Criar minha igreja
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-8 flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors ${
                  done
                    ? "border-gray-900 bg-gray-900 text-white"
                    : active
                      ? "border-gray-900 bg-white text-gray-900"
                      : "border-gray-200 bg-white text-gray-400"
                }`}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`mt-1 hidden text-[10px] font-medium sm:block ${
                  active ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mb-4 h-px w-8 sm:w-12 transition-colors ${
                  i < current ? "bg-gray-900" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignupIgrejaPage() {
  const router = useRouter();
  const [preChecked, setPreChecked] = useState(false);
  const [cnpjPrefill, setCnpjPrefill] = useState<CnpjPrefill | undefined>(
    undefined
  );
  const [step, setStep] = useState(0);
  const [personal, setPersonal] = useState<PersonalDataInput | null>(null);
  const [consent, setConsent] = useState<ConsentInput | null>(null);
  const [church, setChurch] = useState<ChurchDataInput | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [existingChurch, setExistingChurch] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const isDev = process.env.NODE_ENV === "development";
  const turnstileToken = useRef<string>(isDev ? "dev-bypass" : "");
  const [turnstileReady, setTurnstileReady] = useState(isDev);

  function handlePersonal(data: PersonalDataInput) {
    setPersonal(data);
    setStep(1);
  }

  function handleConsent(data: ConsentInput) {
    setConsent(data);
    setStep(2);
  }

  function handleChurch(data: ChurchDataInput) {
    setChurch(data);
    setStep(3);
  }

  function handleConfirm() {
    if (!personal || !consent || !church) return;
    setServerError(null);
    setExistingChurch(null);

    const payload: CreateChurchInput = {
      personal,
      consents: consent,
      church,
      turnstileToken: turnstileToken.current,
    };

    startTransition(async () => {
      const result = await createChurch(payload);
      if (!result.success) {
        setServerError(result.error);
        if (result.existingChurch) setExistingChurch(result.existingChurch);
        return;
      }
      router.push(result.redirectTo ?? "/dashboard");
      router.refresh();
    });
  }

  const headings = [
    {
      title: "Crie sua conta",
      subtitle: "Você será o pastor fundador da sua igreja.",
    },
    {
      title: "Sua privacidade",
      subtitle: "Escolha como usamos seus dados. Você decide.",
    },
    {
      title: "Dados da igreja",
      subtitle: "Vamos encontrar ou criar sua comunidade.",
    },
    { title: "Tudo certo?", subtitle: "Revise antes de finalizar." },
  ];

  // Pre-check phase
  if (!preChecked) {
    return (
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Cadastrar minha Igreja
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Primeiro, vamos verificar se sua igreja já está no Koinos.
          </p>
        </div>
        <StepPreCheck
          onNotFound={(prefill) => {
            setCnpjPrefill(prefill);
            setPreChecked(true);
          }}
        />
        <style>{`
          .btn-primary {
            border-radius: 0.5rem;
            background: oklch(0.205 0 0);
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
            font-weight: 600;
            color: white;
            transition: opacity 0.15s;
          }
          .btn-primary:hover { opacity: 0.88; }
          .btn-primary:active { transform: scale(0.99); }
          .btn-secondary {
            border-radius: 0.5rem;
            border: 1px solid #e5e7eb;
            background: white;
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
            font-weight: 500;
            color: #374151;
            transition: border-color 0.15s, background 0.15s;
          }
          .btn-secondary:hover { border-color: #d1d5db; background: #f9fafb; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="w-full">
      <StepIndicator current={step} />

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          {headings[step].title}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{headings[step].subtitle}</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {step === 0 && (
            <StepPersonal
              onNext={handlePersonal}
              onBack={() => setPreChecked(false)}
            />
          )}
          {step === 1 && (
            <StepConsent onNext={handleConsent} onBack={() => setStep(0)} />
          )}
          {step === 2 && (
            <StepChurch
              onNext={handleChurch}
              onBack={() => setStep(1)}
              defaultValues={
                cnpjPrefill
                  ? ({
                      churchName: cnpjPrefill.churchName,
                      cnpj: formatCNPJ(cnpjPrefill.cnpj),
                      address: cnpjPrefill.address,
                    } as DefaultValues<ChurchDataInput>)
                  : undefined
              }
            />
          )}
          {step === 3 && personal && consent && church && (
            <StepConfirm
              personal={personal}
              consent={consent}
              church={church}
              onBack={() => setStep(2)}
              onConfirm={handleConfirm}
              onTurnstileSuccess={(token) => {
                turnstileToken.current = token;
                setTurnstileReady(true);
              }}
              onTurnstileError={() => setTurnstileReady(false)}
              isPending={isPending}
              serverError={serverError}
              existingChurch={existingChurch}
              turnstileReady={turnstileReady}
              isDev={isDev}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Styles inline para os botões usarem a paleta do design system */}
      <style>{`
        .btn-primary {
          border-radius: 0.5rem;
          background: oklch(0.205 0 0);
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          transition: opacity 0.15s;
        }
        .btn-primary:hover { opacity: 0.88; }
        .btn-primary:active { transform: scale(0.99); }
        .btn-secondary {
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          background: white;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          transition: border-color 0.15s, background 0.15s;
        }
        .btn-secondary:hover { border-color: #d1d5db; background: #f9fafb; }
      `}</style>
    </div>
  );
}
