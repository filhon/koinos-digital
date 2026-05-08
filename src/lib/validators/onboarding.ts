import { z } from "zod";
import { validateCPF } from "@/lib/utils/cpf";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripNonDigits(v: string) {
  return v.replace(/\D/g, "");
}

function isValidCNPJ(cnpj: string): boolean {
  const n = stripNonDigits(cnpj);
  if (n.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(n)) return false;

  const calc = (len: number): number => {
    let sum = 0;
    let pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += parseInt(n[len - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };

  return calc(12) === parseInt(n[12]) && calc(13) === parseInt(n[13]);
}

// ─── Step 1: Dados pessoais ───────────────────────────────────────────────────

export const personalDataSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Nome deve ter no mínimo 3 caracteres" })
    .max(100, { message: "Nome muito longo" }),
  cpf: z
    .string()
    .min(1, { message: "CPF é obrigatório" })
    .refine((v) => validateCPF(v), { message: "CPF inválido" }),
  email: z.email({ message: "E-mail inválido" }),
  password: z
    .string()
    .min(8, { message: "Senha deve ter no mínimo 8 caracteres" })
    .regex(/[A-Z]/, {
      message: "Senha deve conter ao menos uma letra maiúscula",
    })
    .regex(/[0-9]/, { message: "Senha deve conter ao menos um número" }),
});

// ─── Step 2: Consentimentos LGPD ─────────────────────────────────────────────

export const LGPD_PURPOSES = [
  "cadastro",
  "frequencia",
  "comunicacoes",
  "fotos_videos",
  "eventos",
] as const;

export type LgpdPurpose = (typeof LGPD_PURPOSES)[number];

export const LGPD_LABELS: Record<
  LgpdPurpose,
  { title: string; description: string }
> = {
  cadastro: {
    title: "Cadastro e identificação",
    description:
      "Armazenamento do seu nome, CPF, e-mail e telefone para identificação e acesso ao sistema.",
  },
  frequencia: {
    title: "Registro de frequência",
    description:
      "Controle de presença em cultos e eventos da igreja via check-in.",
  },
  comunicacoes: {
    title: "Comunicações e notificações",
    description:
      "Envio de avisos, lembretes e notificações sobre a vida da comunidade.",
  },
  fotos_videos: {
    title: "Fotos e vídeos",
    description:
      "Uso da sua imagem em registros fotográficos e audiovisuais de eventos.",
  },
  eventos: {
    title: "Participação em eventos",
    description:
      "Registro da sua participação em eventos, escalas e ministérios.",
  },
};

export const consentSchema = z.object({
  consents: z
    .record(z.enum(LGPD_PURPOSES), z.boolean())
    .refine((c) => c.cadastro === true, {
      message: "O consentimento de cadastro é obrigatório para usar o sistema.",
    }),
  termsVersion: z.string(),
});

// ─── Step 3: Dados da igreja ──────────────────────────────────────────────────

export const churchDataSchema = z.object({
  churchName: z
    .string()
    .min(3, { message: "Nome da igreja deve ter no mínimo 3 caracteres" })
    .max(150, { message: "Nome muito longo" }),
  cnpj: z
    .string()
    .optional()
    .transform((v) => (v ? stripNonDigits(v) : undefined))
    .refine((v) => !v || isValidCNPJ(v), { message: "CNPJ inválido" }),
  denomination: z
    .string()
    .max(100, { message: "Denominação muito longa" })
    .optional(),
  phone: z
    .string()
    .min(10, { message: "Telefone deve ter no mínimo 10 dígitos" })
    .max(15, { message: "Telefone muito longo" })
    .transform(stripNonDigits),
  address: z.object({
    street: z.string().min(3, { message: "Rua é obrigatória" }),
    number: z.string().min(1, { message: "Número é obrigatório" }),
    complement: z.string().optional(),
    neighborhood: z.string().min(2, { message: "Bairro é obrigatório" }),
    city: z.string().min(2, { message: "Cidade é obrigatória" }),
    state: z
      .string()
      .length(2, { message: "Use a sigla do estado (ex: SP)" })
      .transform((v) => v.toUpperCase()),
    zip: z
      .string()
      .transform(stripNonDigits)
      .refine((v) => v.length === 8, { message: "CEP inválido" }),
  }),
});

// ─── Payload completo (Server Action) ────────────────────────────────────────

export const createChurchSchema = z.object({
  personal: personalDataSchema,
  consents: consentSchema,
  church: churchDataSchema,
  turnstileToken: z.string(),
});

export type PersonalDataInput = z.infer<typeof personalDataSchema>;
export type ConsentInput = z.infer<typeof consentSchema>;
export type ChurchDataInput = z.infer<typeof churchDataSchema>;
export type CreateChurchInput = z.infer<typeof createChurchSchema>;

// ─── Register via invite ──────────────────────────────────────────────────────

export const registerMemberSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Nome deve ter no mínimo 3 caracteres" })
    .max(100, { message: "Nome muito longo" }),
  cpf: z
    .string()
    .min(1, { message: "CPF é obrigatório" })
    .refine((v) => validateCPF(v), { message: "CPF inválido" }),
  email: z.email({ message: "E-mail inválido" }),
  password: z
    .string()
    .min(8, { message: "Senha deve ter no mínimo 8 caracteres" })
    .regex(/[A-Z]/, {
      message: "Senha deve conter ao menos uma letra maiúscula",
    })
    .regex(/[0-9]/, { message: "Senha deve conter ao menos um número" }),
  phone: z.string().optional(),
  inviteCode: z.string().min(1),
  consents: z
    .record(z.enum(LGPD_PURPOSES), z.boolean())
    .refine((c) => c.cadastro === true, {
      message: "O consentimento de cadastro é obrigatório.",
    }),
  termsVersion: z.string(),
  turnstileToken: z.string(),
});

export type RegisterMemberInput = z.infer<typeof registerMemberSchema>;
