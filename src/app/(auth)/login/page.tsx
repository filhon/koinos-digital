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
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isDev = process.env.NODE_ENV === "development";
  const turnstileToken = useRef<string>(isDev ? "dev-bypass" : "");
  const [turnstileReady, setTurnstileReady] = useState(isDev);

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
      const raw = searchParams.get("next") ?? "/dashboard";
      // Prevent open redirect: only allow internal paths
      const next =
        raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Bem-vindo de volta
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entre na sua conta para continuar
        </p>
      </motion.div>

      {/* Server error */}
      {serverError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{serverError}</p>
        </motion.div>
      )}

      {/* eslint-disable-next-line */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-5">
          {/* Email */}
          <motion.div variants={fadeUp}>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              E-mail
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive">
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
                className="text-sm font-medium text-foreground"
              >
                Senha
              </label>
              <Link
                href="/esqueci-senha"
                className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                className="pr-11"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {errors.password.message}
              </p>
            )}
          </motion.div>

          {/* Turnstile */}
          {!isDev && (
            <motion.div
              variants={fadeUp}
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

          {/* Submit */}
          <motion.div variants={fadeUp} className="pt-1">
            <button
              type="submit"
              disabled={isPending || !turnstileReady}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold transition-all
                disabled:opacity-60 disabled:cursor-not-allowed
                hover:brightness-90 active:scale-[0.99]"
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
        className="mt-6 text-center text-sm text-muted-foreground"
      >
        Não tem uma conta?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground underline-offset-2 hover:underline transition-colors"
        >
          Criar conta
        </Link>
      </motion.p>
    </motion.div>
  );
}
