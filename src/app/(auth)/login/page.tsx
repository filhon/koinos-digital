"use client";

import { useState, useRef, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";
import { signIn } from "@/actions/auth";
import { staggerContainer, fadeUp } from "@/lib/motion";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const turnstileToken = useRef<string>("");
  const [turnstileReady, setTurnstileReady] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  function onSubmit(data: LoginInput) {
    setServerError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", data.email);
      formData.set("password", data.password);
      formData.set("cf-turnstile-response", turnstileToken.current);
      const result = await signIn(formData);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      const next = searchParams.get("next") ?? "/dashboard";
      router.push(next);
      router.refresh();
    });
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
          Bem-vindo de volta
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Entre na sua conta para continuar
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

      {/* eslint-disable-next-line */}
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

          {/* Senha */}
          <motion.div variants={fadeUp}>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Senha
              </label>
              <Link
                href="/esqueci-senha"
                className="text-xs text-gray-500 underline-offset-2 hover:text-gray-900 hover:underline transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("password")}
                className={`w-full rounded-lg border px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all
                  focus:ring-2 focus:ring-offset-0
                  ${
                    errors.password
                      ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
                      : "border-gray-200 bg-white focus:border-gray-400 focus:ring-gray-100"
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {errors.password.message}
              </p>
            )}
          </motion.div>

          {/* Turnstile */}
          <motion.div variants={fadeUp}>
            <Turnstile
              siteKey={
                process.env.NODE_ENV === "development"
                  ? "1x00000000000000000000AA"
                  : (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ??
                    "1x00000000000000000000AA")
              }
              options={{ theme: "light", appearance: "interaction-only" }}
              onSuccess={(token) => {
                turnstileToken.current = token;
                setTurnstileReady(true);
              }}
              onError={() => setTurnstileReady(false)}
              onExpire={() => setTurnstileReady(false)}
            />
          </motion.div>

          {/* Submit */}
          <motion.div variants={fadeUp} className="pt-1">
            <button
              type="submit"
              disabled={isPending || !turnstileReady}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all
                disabled:opacity-60 disabled:cursor-not-allowed
                hover:opacity-90 active:scale-[0.99]"
              style={{ background: "oklch(0.205 0 0)" }}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Entrar
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </motion.div>
        </div>
      </form>

      {/* Sign up link */}
      <motion.p
        variants={fadeUp}
        className="mt-6 text-center text-sm text-gray-500"
      >
        Não tem uma conta?{" "}
        <Link
          href="/signup"
          className="font-medium text-gray-900 underline-offset-2 hover:underline transition-colors"
        >
          Criar conta
        </Link>
      </motion.p>
    </motion.div>
  );
}
