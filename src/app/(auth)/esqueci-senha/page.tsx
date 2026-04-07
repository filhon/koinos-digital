"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  MailCheck,
  ArrowLeft,
} from "lucide-react";
import { resetSchema, type ResetInput } from "@/lib/validators/auth";
import { resetPassword } from "@/actions/auth";
import { staggerContainer, fadeUp } from "@/lib/motion";

export default function EsqueciSenhaPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetInput>({
    resolver: zodResolver(resetSchema),
  });

  function onSubmit(data: ResetInput) {
    setServerError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", data.email);
      const result = await resetPassword(formData);
      if (result.success) {
        setSuccess(true);
      } else {
        setServerError(result.error);
      }
    });
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full"
      >
        <div className="flex flex-col items-center text-center py-4">
          <div
            className="mb-5 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "oklch(0.92 0.08 145)" }}
          >
            <MailCheck
              className="h-6 w-6"
              style={{ color: "oklch(0.40 0.15 145)" }}
            />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">
            E-mail enviado!
          </h2>
          <p className="mt-2 text-sm text-gray-500 max-w-xs leading-relaxed">
            Verifique sua caixa de entrada. Você receberá um link para redefinir
            sua senha em breve.
          </p>
          <Link
            href="/login"
            className="mt-8 flex items-center gap-2 text-sm font-medium text-gray-700 underline-offset-2 hover:underline transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o login
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="w-full"
    >
      {/* Heading */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Esqueceu sua senha?
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Informe seu e-mail e enviaremos um link de redefinição
        </p>
      </motion.div>

      {/* Server error */}
      {serverError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{serverError}</p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-5">
          {/* Email */}
          <motion.div variants={fadeUp}>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              {...register("email")}
              className={`w-full rounded-lg border px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all
                focus:ring-2 focus:ring-offset-0
                ${
                  errors.email
                    ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
                    : "border-gray-200 bg-white focus:border-gray-400 focus:ring-gray-100"
                }`}
            />
            {errors.email && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {errors.email.message}
              </p>
            )}
          </motion.div>

          {/* Submit */}
          <motion.div variants={fadeUp} className="pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all
                disabled:opacity-60 disabled:cursor-not-allowed
                hover:opacity-90 active:scale-[0.99]"
              style={{ background: "oklch(0.205 0 0)" }}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Enviar link
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </motion.div>
        </div>
      </form>

      <motion.div variants={fadeUp} className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 underline-offset-2 hover:text-gray-900 hover:underline transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para o login
        </Link>
      </motion.div>
    </motion.div>
  );
}
