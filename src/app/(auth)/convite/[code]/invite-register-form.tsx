"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Check, Eye, EyeOff, Loader2 } from "lucide-react";

import {
  registerMemberSchema,
  LGPD_PURPOSES,
  LGPD_LABELS,
  type RegisterMemberInput,
} from "@/lib/validators/onboarding";
import { registerMember } from "@/actions/onboarding";
import { formatCPF, formatPhone } from "@/lib/utils/cpf";
import { staggerContainer, staggerItem } from "@/lib/motion";

const TERMS_VERSION = "1.0.0";

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

export function InviteRegisterForm({ inviteCode, churchName: _ }: Props) {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [consents, setConsents] = useState<Record<string, boolean>>(
    Object.fromEntries(LGPD_PURPOSES.map((p) => [p, false]))
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerMemberSchema),
    defaultValues: {
      inviteCode,
      termsVersion: TERMS_VERSION,
      name: "",
      cpf: "",
      email: "",
      password: "",
      phone: "",
      consents: Object.fromEntries(LGPD_PURPOSES.map((p) => [p, false])) as Record<
        typeof LGPD_PURPOSES[number],
        boolean
      >,
    },
  });

  function toggleConsent(purpose: string) {
    const next = !consents[purpose];
    setConsents((prev) => ({ ...prev, [purpose]: next }));
    setValue(
      `consents.${purpose as typeof LGPD_PURPOSES[number]}`,
      next
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function onSubmit(data: any) {
    setServerError(null);
    startTransition(async () => {
      const result = await registerMember(data as RegisterMemberInput);
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

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
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

        {/* CPF */}
        <motion.div variants={staggerItem}>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">CPF</label>
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
          <label className="mb-1.5 block text-sm font-medium text-gray-700">E-mail</label>
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
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Senha</label>
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
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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

        {/* Consentimentos LGPD */}
        <motion.div variants={staggerItem} className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Consentimentos LGPD</p>
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
                      checked ? "border-gray-900 bg-gray-900" : "border-gray-300"
                    }`}
                  >
                    {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
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
          <FieldError message={errors.consents?.message} />
        </motion.div>

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

        <motion.div variants={staggerItem} className="pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-60 disabled:cursor-not-allowed"
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
    </form>
  );
}
