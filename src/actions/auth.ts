"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  signupSchema,
  resetSchema,
  newPasswordSchema,
} from "@/lib/validators/auth";

export type ActionResult =
  | { success: true; message?: string }
  | { success: false; error: string };

export async function signIn(formData: FormData): Promise<ActionResult> {
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

  redirect("/dashboard");
}

export async function signUp(formData: FormData): Promise<ActionResult> {
  const raw = {
    name: formData.get("name"),
    cpf: formData.get("cpf"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.name,
        // CPF será armazenado criptografado via trigger/migration — por ora no metadata
        cpf_raw: parsed.data.cpf,
      },
    },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return { success: false, error: "Já existe uma conta com este e-mail." };
    }
    return { success: false, error: "Erro ao criar conta. Tente novamente." };
  }

  redirect("/dashboard");
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

  redirect("/dashboard");
}
