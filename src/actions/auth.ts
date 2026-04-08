"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  resetSchema,
  newPasswordSchema,
} from "@/lib/validators/auth";
import { rateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

export type ActionResult =
  | { success: true; message?: string; redirectTo?: string }
  | { success: false; error: string };

async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
}

export async function signIn(formData: FormData): Promise<ActionResult> {
  const ip = await getClientIp();

  // Rate limit: 5 tentativas / 15 min por IP
  const rl = await rateLimit({
    identifier: `signin:${ip}`,
    limit: 5,
    window: 15 * 60,
  });
  if (!rl.success) {
    const waitMin = Math.ceil((rl.reset - Math.floor(Date.now() / 1000)) / 60);
    return {
      success: false,
      error: `Muitas tentativas. Aguarde ${waitMin} minuto(s) e tente novamente.`,
    };
  }

  // Turnstile
  const turnstileToken = formData.get("cf-turnstile-response") as string;
  if (!(await verifyTurnstile(turnstileToken))) {
    return {
      success: false,
      error: "Verificação de segurança falhou. Tente novamente.",
    };
  }

  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { success: false, error: "E-mail ou senha incorretos." };
  }

  return { success: true, redirectTo: "/dashboard" };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resetPassword(formData: FormData): Promise<ActionResult> {
  const raw = { email: formData.get("email") };

  const parsed = resetSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/redefinir-senha`,
    }
  );

  if (error) {
    return { success: false, error: "Erro ao enviar e-mail. Tente novamente." };
  }

  return {
    success: true,
    message: "E-mail enviado! Verifique sua caixa de entrada.",
  };
}

export async function updatePassword(
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = newPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      success: false,
      error: "Erro ao atualizar senha. O link pode ter expirado.",
    };
  }

  return { success: true, redirectTo: "/dashboard" };
}
