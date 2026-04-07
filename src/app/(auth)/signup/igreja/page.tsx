"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
} from "lucide-react";

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
import { createChurch } from "@/actions/onboarding";
import { formatCPF } from "@/lib/utils/cpf";
import { staggerContainer, staggerItem } from "@/lib/motion";

// ─── Constants ────────────────────────────────────────────────────────────────

const TERMS_VERSION = "1.0.0";

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

// ─── Step components ─────────────────────────────────────────────────────────

function StepPersonal({
  onNext,
}: {
  onNext: (data: PersonalDataInput) => void;
}) {
  const [showPw, setShowPw] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PersonalDataInput>({ resolver: zodResolver(personalDataSchema) });

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

        <motion.div variants={staggerItem} className="pt-1">
          <button
            type="submit"
            className="btn-primary flex w-full items-center justify-center gap-2"
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
}: {
  onNext: (data: ChurchDataInput) => void;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(churchDataSchema) });

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
  isPending,
  serverError,
}: {
  personal: PersonalDataInput;
  consent: ConsentInput;
  church: ChurchDataInput;
  onBack: () => void;
  onConfirm: () => void;
  isPending: boolean;
  serverError: string | null;
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
          className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-800">{serverError}</p>
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
          disabled={isPending}
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
  const [step, setStep] = useState(0);
  const [personal, setPersonal] = useState<PersonalDataInput | null>(null);
  const [consent, setConsent] = useState<ConsentInput | null>(null);
  const [church, setChurch] = useState<ChurchDataInput | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

    const payload: CreateChurchInput = { personal, consents: consent, church };

    startTransition(async () => {
      const result = await createChurch(payload);
      if (!result.success) {
        setServerError(result.error);
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
          {step === 0 && <StepPersonal onNext={handlePersonal} />}
          {step === 1 && (
            <StepConsent onNext={handleConsent} onBack={() => setStep(0)} />
          )}
          {step === 2 && (
            <StepChurch onNext={handleChurch} onBack={() => setStep(1)} />
          )}
          {step === 3 && personal && consent && church && (
            <StepConfirm
              personal={personal}
              consent={consent}
              church={church}
              onBack={() => setStep(2)}
              onConfirm={handleConfirm}
              isPending={isPending}
              serverError={serverError}
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
