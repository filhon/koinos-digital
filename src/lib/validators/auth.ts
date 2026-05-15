import { z } from "zod";
import { validateCPF } from "@/lib/utils/cpf";

export const passwordSchema = z
  .string()
  .min(12, { message: "Senha deve ter no mínimo 12 caracteres" })
  .regex(/[A-Z]/, {
    message: "Senha deve conter ao menos uma letra maiúscula",
  })
  .regex(/[a-z]/, {
    message: "Senha deve conter ao menos uma letra minúscula",
  })
  .regex(/[0-9]/, { message: "Senha deve conter ao menos um número" })
  .regex(/[^A-Za-z0-9]/, {
    message: "Senha deve conter ao menos um caractere especial",
  });

export const loginSchema = z.object({
  email: z.email({ message: "E-mail inválido" }),
  password: z.string().min(1, { message: "Senha é obrigatória" }),
});

export const signupSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Nome deve ter no mínimo 3 caracteres" })
    .max(100, { message: "Nome muito longo" }),
  cpf: z
    .string()
    .min(1, { message: "CPF é obrigatório" })
    .refine((v) => validateCPF(v), { message: "CPF inválido" }),
  email: z.email({ message: "E-mail inválido" }),
  password: passwordSchema,
});

export const resetSchema = z.object({
  email: z.email({ message: "E-mail inválido" }),
});

export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ResetInput = z.infer<typeof resetSchema>;
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
