"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerVisitorFromLandingSchema,
  type RegisterVisitorFromLandingInput,
} from "@/lib/validators/landing-page";
import { registerVisitorFromLanding } from "@/actions/landing-page";
import type { FullLandingData } from "@/lib/validators/landing-page";

interface Props {
  data: FullLandingData;
}

export default function CtaSection({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterVisitorFromLandingInput>({
    resolver: zodResolver(registerVisitorFromLandingSchema),
    defaultValues: { church_slug: data.slug },
  });

  async function onSubmit(values: RegisterVisitorFromLandingInput) {
    setServerError(null);
    const result = await registerVisitorFromLanding(values);
    if (result.error) {
      setServerError(result.error);
    } else {
      setSubmitted(true);
    }
  }

  return (
    <div ref={ref} className="relative py-32 px-6 overflow-hidden">
      {/* Bold amber/copper gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 110% 100% at 50% 50%, oklch(0.62 0.16 48) 0%, oklch(0.48 0.18 38) 55%, oklch(0.32 0.14 35) 100%)",
        }}
      />
      {/* Noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 max-w-xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2
            className="text-4xl sm:text-5xl md:text-6xl font-normal mb-4"
            style={{
              fontFamily: "var(--font-display)",
              color: "oklch(0.12 0.04 250)",
            }}
          >
            Faça parte da {data.name}
          </h2>
          <p
            className="text-base sm:text-lg mb-12"
            style={{ color: "oklch(0.25 0.04 250)" }}
          >
            Deixe seu contato e entraremos em breve.
          </p>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl p-8"
              style={{
                background: "oklch(0.12 0.04 250 / 0.15)",
                border: "1px solid oklch(0.12 0.04 250 / 0.2)",
              }}
            >
              <div className="text-4xl mb-4">✓</div>
              <p
                className="text-xl font-normal"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "oklch(0.12 0.04 250)",
                }}
              >
                Cadastro realizado!
              </p>
              <p
                className="mt-2 text-sm"
                style={{ color: "oklch(0.28 0.04 250)" }}
              >
                Em breve entraremos em contato.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <input type="hidden" {...register("church_slug")} />

              {/* Name */}
              <div className="text-left">
                <input
                  {...register("name")}
                  placeholder="Seu nome completo *"
                  className="w-full px-5 py-4 rounded-xl text-base outline-none transition-all focus:ring-2 focus:ring-[oklch(0.12_0.04_250/0.5)] placeholder:text-[oklch(0.35_0.04_250/0.7)]"
                  style={{
                    background: "oklch(0.12 0.04 250 / 0.12)",
                    border: errors.name
                      ? "1.5px solid oklch(0.55 0.2 25)"
                      : "1.5px solid oklch(0.12 0.04 250 / 0.25)",
                    color: "oklch(0.12 0.04 250)",
                    caretColor: "oklch(0.12 0.04 250)",
                  }}
                />
                {errors.name && (
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "oklch(0.45 0.2 25)" }}
                  >
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="text-left">
                <input
                  {...register("phone")}
                  placeholder="WhatsApp (opcional)"
                  type="tel"
                  className="w-full px-5 py-4 rounded-xl text-base outline-none transition-all focus:ring-2 focus:ring-[oklch(0.12_0.04_250/0.5)] placeholder:text-[oklch(0.35_0.04_250/0.7)]"
                  style={{
                    background: "oklch(0.12 0.04 250 / 0.12)",
                    border: errors.phone
                      ? "1.5px solid oklch(0.55 0.2 25)"
                      : "1.5px solid oklch(0.12 0.04 250 / 0.25)",
                    color: "oklch(0.12 0.04 250)",
                    caretColor: "oklch(0.12 0.04 250)",
                  }}
                />
                {errors.phone && (
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "oklch(0.45 0.2 25)" }}
                  >
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="text-left">
                <input
                  {...register("email")}
                  placeholder="E-mail (opcional)"
                  type="email"
                  className="w-full px-5 py-4 rounded-xl text-base outline-none transition-all focus:ring-2 focus:ring-[oklch(0.12_0.04_250/0.5)] placeholder:text-[oklch(0.35_0.04_250/0.7)]"
                  style={{
                    background: "oklch(0.12 0.04 250 / 0.12)",
                    border: errors.email
                      ? "1.5px solid oklch(0.55 0.2 25)"
                      : "1.5px solid oklch(0.12 0.04 250 / 0.25)",
                    color: "oklch(0.12 0.04 250)",
                    caretColor: "oklch(0.12 0.04 250)",
                  }}
                />
                {errors.email && (
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "oklch(0.45 0.2 25)" }}
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              {serverError && (
                <p
                  className="text-sm text-center"
                  style={{ color: "oklch(0.45 0.2 25)" }}
                >
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl text-base font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                style={{
                  background: "oklch(0.12 0.04 250)",
                  color: "oklch(0.88 0.1 55)",
                }}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  "Quero participar"
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
